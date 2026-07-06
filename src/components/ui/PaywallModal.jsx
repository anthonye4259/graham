import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { analytics, trackEvent } from '../../lib/firebase';

import { Capacitor } from '@capacitor/core';

// SAFE: dynamic import to prevent crash on iPad
async function getPurchases() {
  try { const m = await import('@revenuecat/purchases-capacitor'); return m.Purchases; }
  catch (e) { console.warn('Purchases not available:', e.message); return null; }
}

const PRODUCT_IDS = { weekly: 'G1', monthly: 'G2', annual: 'G3' };
const ENTITLEMENT_IDS = ['graham ai Pro', 'premium'];

function withTimeout(promise, ms, label) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out. Please try again.`)), ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function hasActiveEntitlement(result) {
  const info = result?.customerInfo || result;
  const activeEntitlements = info?.entitlements?.active || {};
  return ENTITLEMENT_IDS.some(id => activeEntitlements[id]) || Object.keys(activeEntitlements).length > 0;
}

async function ensurePurchasesConfigured(Purchases, user) {
  const apiKey = import.meta.env.VITE_REVENUECAT_PUBLIC_KEY;
  if (!apiKey) throw new Error('RevenueCat API key is missing.');

  const configured = await withTimeout(Purchases.isConfigured(), 3000, 'Purchase setup');
  if (!configured?.isConfigured) {
    await withTimeout(
      Purchases.configure({ apiKey, appUserID: user?.uid }),
      5000,
      'Purchase setup'
    );
    return;
  }

  if (user?.uid) {
    try {
      const current = await withTimeout(Purchases.getAppUserID(), 3000, 'Purchase account check');
      if (current?.appUserID !== user.uid) {
        await withTimeout(Purchases.logIn({ appUserID: user.uid }), 5000, 'Purchase account setup');
      }
    } catch (e) {
      console.warn('RevenueCat app user check skipped:', e.message);
    }
  }
}

export default function PaywallModal({ isOpen, onClose, source = 'upgrade' }) {
  const navigate = useNavigate();
  const { user, startTrial, hasUsedTrial } = useUser();
  const [billing, setBilling] = useState('annual'); // 'annual' | 'monthly'
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [rcPackages, setRcPackages] = useState([]);
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');
  const [directProducts, setDirectProducts] = useState([]);
  const hasLoadedProductsRef = useRef(false);

  const fetchPackages = useCallback(async (retries = 1, delay = 1000) => {
    setLoadingOfferings(true);
    setFetchError(false);
    setPurchaseError('');
    hasLoadedProductsRef.current = false;
    
    const Purchases = await getPurchases();
    if (!Purchases) {
      setLoadingOfferings(false);
      setFetchError(true);
      setPurchaseError('Purchases are temporarily unavailable. Please try again.');
      return;
    }

    try {
      await ensurePurchasesConfigured(Purchases, user);
    } catch (e) {
      console.warn('RevenueCat setup failed:', e.message);
      setLoadingOfferings(false);
      setFetchError(true);
      setPurchaseError('Apple subscriptions could not be prepared. Please try again.');
      return;
    }

    // Try offerings first
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const offerings = await withTimeout(Purchases.getOfferings(), 4000, 'Subscription loading');
        const currentOffering = offerings.current;

        if (currentOffering && currentOffering.availablePackages && currentOffering.availablePackages.length > 0) {
          hasLoadedProductsRef.current = true;
          setRcPackages(currentOffering.availablePackages);
          setLoadingOfferings(false);
          setFetchError(false);
          return; // Success with offerings!
        }
      } catch (e) {
        console.warn(`RC offerings attempt ${attempt}/${retries} failed:`, e.message);
      }
      if (attempt < retries) await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Fallback: fetch products directly by hardcoded App Store product IDs
    console.log('[Paywall] Offerings empty — falling back to direct product fetch');
    try {
      const productResult = await withTimeout(Purchases.getProducts({
        productIdentifiers: [PRODUCT_IDS.weekly, PRODUCT_IDS.monthly, PRODUCT_IDS.annual] 
      }), 4000, 'Product loading');
      if (productResult && productResult.products && productResult.products.length > 0) {
        hasLoadedProductsRef.current = true;
        setDirectProducts(productResult.products);
        setLoadingOfferings(false);
        setFetchError(false);
        console.log('[Paywall] Direct products loaded:', productResult.products.map(p => p.identifier));
        return; // Success with direct products!
      }
    } catch (e) {
      console.warn('Direct product fetch failed:', e.message);
    }
    
    // All methods exhausted
    setLoadingOfferings(false);
    setFetchError(true);
    setPurchaseError('Apple subscription options could not be loaded. You can retry or continue later.');
    console.error("All RevenueCat fetch attempts exhausted (offerings + direct products)");
  }, [user?.uid]);

  useEffect(() => {
    if (Capacitor.isNativePlatform() && isOpen) {
      fetchPackages();
      // HARD TIMEOUT: Never leave the paywall in a loading-only state.
      const hardTimeout = setTimeout(() => {
        if (!hasLoadedProductsRef.current) {
          setLoadingOfferings(false);
          setFetchError(true);
          setPurchaseError(current => current || 'Apple subscription options are taking too long to load. You can retry or continue later.');
        }
      }, 5000);
      return () => clearTimeout(hardTimeout);
    } else {
      setLoadingOfferings(false);
    }
  }, [isOpen, fetchPackages]);

  useEffect(() => {
    if (isOpen) {
      try { trackEvent('begin_checkout'); } catch(e) {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    if (!user) {
      alert("Please create an account before subscribing.");
      onClose();
      navigate('/auth');
      return;
    }

    setLoadingStripe(true);
    setPurchaseError('');
    
    // RevenueCat Native Flow
    if (Capacitor.isNativePlatform()) {
      try {
        const Purchases = await getPurchases();
        if (!Purchases) {
          setPurchaseError('Purchase system is not available. Please try again.');
          return;
        }
        await ensurePurchasesConfigured(Purchases, user);

        // METHOD 1: Use RC packages (offerings) if available
        if (rcPackages.length > 0) {
          let pkg = rcPackages[0]; 
          if (billing === 'annual') pkg = rcPackages.find(p => p.packageType === "ANNUAL") || rcPackages[0];
          if (billing === 'monthly') pkg = rcPackages.find(p => p.packageType === "MONTHLY") || rcPackages[0];
          if (billing === 'weekly') pkg = rcPackages.find(p => p.packageType === "WEEKLY") || rcPackages[0];

          if (pkg) {
            const result = await withTimeout(Purchases.purchasePackage({ aPackage: pkg }), 45000, 'Purchase');
            startTrial();
            onClose();
            return;
          }
        }

        // METHOD 2: Use direct StoreKit products if available
        if (directProducts.length > 0) {
          const targetId = PRODUCT_IDS[billing] || PRODUCT_IDS.annual;
          const product = directProducts.find(p => p.identifier === targetId) || directProducts[0];
          
          if (product) {
            console.log('[Paywall] Purchasing direct product:', product.identifier);
            const result = await withTimeout(Purchases.purchaseStoreProduct({ product }), 45000, 'Purchase');
            startTrial();
            onClose();
            return;
          }
        }

        // METHOD 3: Last resort — try to fetch products on the fly and purchase
        console.log('[Paywall] No cached products — fetching on the fly');
        try {
          const targetId = PRODUCT_IDS[billing] || PRODUCT_IDS.annual;
          const productResult = await withTimeout(Purchases.getProducts({ productIdentifiers: [targetId] }), 7000, 'Product fetch');
          if (productResult && productResult.products && productResult.products.length > 0) {
            const product = productResult.products[0];
            const result = await withTimeout(Purchases.purchaseStoreProduct({ product }), 45000, 'Purchase');
            startTrial();
            onClose();
            return;
          }
        } catch (e) {
          console.error('On-the-fly product fetch failed:', e.message);
        }

        setPurchaseError('Apple subscriptions are currently unavailable. Please check your connection and try again.');
      } catch (e) {
        const isCancelled = e.userCancelled || e.code === 1 || (e.message && e.message.includes('cancelled'));
        if (!isCancelled) {
          console.error("RC Purchase Error", e);
          setPurchaseError(e.message || 'Purchase could not be completed. Please try again.');
        }
      } finally {
        setLoadingStripe(false);
      }
      return;
    }

    // Stripe Web Flow
    try {
      const linkMonthly = import.meta.env.VITE_STRIPE_PAYMENT_LINK;
      const linkYearly = import.meta.env.VITE_STRIPE_PAYMENT_LINK_YEARLY;
      const linkWeekly = import.meta.env.VITE_STRIPE_PAYMENT_LINK_WEEKLY;
      
      let paymentLink = linkMonthly; // default
      if (billing === 'annual') paymentLink = linkYearly || linkMonthly;
      if (billing === 'weekly') paymentLink = linkWeekly || linkMonthly;
      
      if (!paymentLink) {
        // Fallback for local testing if no key is provided
        console.warn("No Stripe Payment Link provided. Simulating successful checkout.");
        startTrial();
        onClose();
        return;
      }
      
      // Append client_reference_id so the webhook knows which user paid
      if (user && user.uid) {
        const separator = paymentLink.includes('?') ? '&' : '?';
        paymentLink = `${paymentLink}${separator}client_reference_id=${user.uid}`;
      }
      
      // Redirect to the Stripe Payment Link
      window.location.href = paymentLink;
    } catch (e) {
      console.error("Stripe Checkout Error", e);
    } finally {
      setLoadingStripe(false);
    }
  };

  const handleRestore = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        setLoadingStripe(true);
        setPurchaseError('');
        const Purchases = await getPurchases();
        if (!Purchases) {
          setPurchaseError('Purchase system is not available. Please try again.');
          return;
        }
        await ensurePurchasesConfigured(Purchases, user);
        const restoreResult = await withTimeout(Purchases.restorePurchases(), 30000, 'Restore purchases');
        if (hasActiveEntitlement(restoreResult)) {
          startTrial(); // persist subscribed=true to Firestore
          onClose();
        } else {
          setPurchaseError('No active premium subscription was found for this Apple ID.');
        }
      } catch (e) {
        console.error("Restore failed", e);
        setPurchaseError(e.message || 'Failed to restore purchases. Please try again.');
      } finally {
        setLoadingStripe(false);
      }
    } else {
      alert("Please manage your web subscription in the billing settings.");
    }
  };

  // Calculate dynamic price based on RevenueCat packages or direct products
  let dynamicPrice = null;
  if (rcPackages.length > 0) {
    const targetType = billing === 'annual' ? 'ANNUAL' : (billing === 'weekly' ? 'WEEKLY' : 'MONTHLY');
    const pkg = rcPackages.find(p => p.packageType === targetType);
    if (pkg && pkg.product) {
      dynamicPrice = pkg.product.priceString;
    }
  } else if (directProducts.length > 0) {
    const targetId = PRODUCT_IDS[billing] || PRODUCT_IDS.annual;
    const product = directProducts.find(p => p.identifier === targetId);
    if (product) {
      dynamicPrice = product.priceString;
    }
  }

  const price = dynamicPrice || (billing === 'annual' ? '$39.99' : (billing === 'weekly' ? '$2.99' : '$7.99'));
  const billedText = billing === 'annual' ? 'Billed annually' : (billing === 'weekly' ? 'Billed weekly' : 'Billed monthly');
  const periodText = billing === 'annual' ? 'yr' : (billing === 'weekly' ? 'wk' : 'mo');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="paywall-modal" onClick={e => e.stopPropagation()}>
        <div className="paywall-header">
          {/* ALWAYS show close button — user must never be trapped */}
          <button className="close-modal" onClick={onClose}>
            <ion-icon name="close-outline"></ion-icon>
          </button>
          <h2 className="paywall-title">Invest in Yourself</h2>
          <p className="paywall-subtitle">
            {source === 'scan' ? 'Unlock unlimited stock scans and full access.' : 'Master the markets with Graham Premium.'}
          </p>

          <div className="billing-toggle" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '12px' }}>
            <button
              className={`billing-btn ${billing === 'weekly' ? 'active' : ''}`}
              onClick={() => setBilling('weekly')}
              style={{ padding: '12px 8px', fontSize: '14px', minHeight: '44px' }}
            >
              Weekly
            </button>
            <button
              className={`billing-btn ${billing === 'monthly' ? 'active' : ''}`}
              onClick={() => setBilling('monthly')}
              style={{ padding: '12px 8px', fontSize: '14px', minHeight: '44px' }}
            >
              Monthly
            </button>
            <button
              className={`billing-btn ${billing === 'annual' ? 'active' : ''}`}
              onClick={() => setBilling('annual')}
              style={{ padding: '12px 8px', fontSize: '14px', minHeight: '44px', position: 'relative' }}
            >
              Yearly
              <span className="save-badge" style={{ position: 'absolute', top: '-10px', right: '-5px', fontSize: '10px' }}>Save 30%</span>
            </button>
          </div>
        </div>

        <div className="paywall-content">
          <div className="pricing-card">
            <div className="price-row">
              <span className="price-amount">{price}</span>
              <span className="price-period">/ {periodText}</span>
            </div>
            <div className="price-billed">{billedText}</div>
          </div>

          <ul className="perks-list">
            <li className="perk-item">
              <ion-icon name="checkmark-circle" class="perk-icon"></ion-icon>
              Unlimited AI Stock Scans
            </li>
            <li className="perk-item">
              <ion-icon name="checkmark-circle" class="perk-icon"></ion-icon>
              Full Options Trading Course
            </li>
            <li className="perk-item">
              <ion-icon name="checkmark-circle" class="perk-icon"></ion-icon>
              Streak Freeze Protection
            </li>
            <li className="perk-item">
              <ion-icon name="checkmark-circle" class="perk-icon"></ion-icon>
              Premium Wall Street Personas
            </li>
          </ul>

          <div style={{ marginTop: '24px' }}>
            <button className="paywall-cta" onClick={handleSubscribe} disabled={loadingStripe}>
              {loadingStripe ? 'Processing...' : (billing === 'annual' ? 'Start 3-Day Free Trial' : 'Subscribe Now')}
            </button>
            {Capacitor.isNativePlatform() && loadingOfferings && (
              <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px', lineHeight: 1.4 }}>
                Loading latest Apple subscription details...
              </p>
            )}
            {Capacitor.isNativePlatform() && fetchError && rcPackages.length === 0 && directProducts.length === 0 && (
              <button
                onClick={() => fetchPackages()}
                disabled={loadingStripe || loadingOfferings}
                style={{ background: 'none', border: 'none', color: 'var(--accent-gold, #A67C52)', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline', display: 'block', margin: '10px auto 0', padding: '8px 12px' }}
              >
                Retry loading Apple subscriptions
              </button>
            )}
            {purchaseError && (
              <p style={{ textAlign: 'center', fontSize: '12px', color: '#B45309', marginTop: '10px', lineHeight: 1.4 }}>
                {purchaseError}
              </p>
            )}
            <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <ion-icon name="lock-closed-outline"></ion-icon> {Capacitor.isNativePlatform() ? 'Secure checkout via Apple' : 'Secure checkout'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', marginTop: '16px' }}>
              <button onClick={handleRestore} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline', padding: '12px 16px', minHeight: '44px' }}>
                Restore Purchases
              </button>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: '14px', cursor: 'pointer', padding: '12px 16px', minHeight: '44px' }}>
                Skip for now
              </button>
              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-tertiary)' }}>
                <a href="https://grahamapp.web.app/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-gold, #A67C52)', textDecoration: 'underline', padding: '4px 0', minHeight: '44px', display: 'flex', alignItems: 'center' }}>Terms of Use (EULA)</a>
                <a href="https://grahamapp.web.app/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-gold, #A67C52)', textDecoration: 'underline', padding: '4px 0', minHeight: '44px', display: 'flex', alignItems: 'center' }}>Privacy Policy</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
