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
const PRODUCT_ID_LIST = Object.values(PRODUCT_IDS);
const ENTITLEMENT_IDS = ['graham ai Pro', 'premium'];
const FALLBACK_PRICES = { weekly: '$2.99', monthly: '$7.99', annual: '$39.99' };

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

function getProductIdForBilling(billing) {
  return PRODUCT_IDS[billing] || PRODUCT_IDS.annual;
}

function getPackageForBilling(packages, billing) {
  const targetType = billing === 'annual' ? 'ANNUAL' : (billing === 'weekly' ? 'WEEKLY' : 'MONTHLY');
  return packages.find(p => p.packageType === targetType) || packages[0];
}

function getStoreProductForBilling(products, billing) {
  const targetId = getProductIdForBilling(billing);
  return products.find(p => p.identifier === targetId) || products[0];
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
  const purchasingRef = useRef(false);

  const recordIAPDiagnostic = useCallback((eventName, params = {}) => {
    const payload = {
      product_ids: PRODUCT_ID_LIST.join(','),
      billing,
      ...params
    };
    console.warn(`[Paywall] ${eventName}`, payload);
    try { trackEvent(eventName, payload); } catch(e) {}
  }, [billing]);

  const fetchPackages = useCallback(async (retries = 1, delay = 1000) => {
    setLoadingOfferings(true);
    setFetchError(false);
    setPurchaseError('');
    setRcPackages([]);
    setDirectProducts([]);
    hasLoadedProductsRef.current = false;
    
    const Purchases = await getPurchases();
    if (!Purchases) {
      setLoadingOfferings(false);
      setFetchError(true);
      setPurchaseError('Purchases are temporarily unavailable. Please try again.');
      recordIAPDiagnostic('iap_product_load_failed', { reason: 'purchases_plugin_unavailable' });
      return;
    }

    try {
      await ensurePurchasesConfigured(Purchases, user);
    } catch (e) {
      console.warn('RevenueCat setup failed:', e.message);
      setLoadingOfferings(false);
      setFetchError(true);
      setPurchaseError('Apple subscriptions could not be prepared. Please try again.');
      recordIAPDiagnostic('iap_product_load_failed', { reason: 'revenuecat_setup_failed', message: e.message });
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
          try { trackEvent('iap_products_loaded', { source: 'revenuecat_offering', count: currentOffering.availablePackages.length }); } catch(e) {}
          return; // Success with offerings!
        }
        recordIAPDiagnostic('iap_product_load_failed', {
          reason: 'empty_revenuecat_offering',
          offering: currentOffering?.identifier || 'none'
        });
      } catch (e) {
        console.warn(`RC offerings attempt ${attempt}/${retries} failed:`, e.message);
        recordIAPDiagnostic('iap_product_load_failed', { reason: 'offerings_error', attempt, message: e.message });
      }
      if (attempt < retries) await new Promise(resolve => setTimeout(resolve, delay));
    }

    // Fallback: fetch products directly by hardcoded App Store product IDs
    console.log('[Paywall] Offerings empty — falling back to direct product fetch');
    try {
      const productResult = await withTimeout(Purchases.getProducts({
        productIdentifiers: PRODUCT_ID_LIST
      }), 4000, 'Product loading');
      if (productResult && productResult.products && productResult.products.length > 0) {
        hasLoadedProductsRef.current = true;
        setDirectProducts(productResult.products);
        setLoadingOfferings(false);
        setFetchError(false);
        console.log('[Paywall] Direct products loaded:', productResult.products.map(p => p.identifier));
        try { trackEvent('iap_products_loaded', { source: 'direct_storekit_products', count: productResult.products.length }); } catch(e) {}
        return; // Success with direct products!
      }
      recordIAPDiagnostic('iap_product_load_failed', {
        reason: 'empty_direct_storekit_products',
        returned_count: productResult?.products?.length || 0
      });
    } catch (e) {
      console.warn('Direct product fetch failed:', e.message);
      recordIAPDiagnostic('iap_product_load_failed', { reason: 'direct_storekit_error', message: e.message });
    }
    
    // All methods exhausted
    setLoadingOfferings(false);
    setFetchError(true);
    setPurchaseError('Apple subscription options could not be loaded yet. You can retry or tap Subscribe to request checkout directly from Apple.');
    console.error("All RevenueCat fetch attempts exhausted (offerings + direct products)");
  }, [recordIAPDiagnostic, user?.uid]);

  useEffect(() => {
    if (Capacitor.isNativePlatform() && isOpen) {
      fetchPackages();
      // HARD TIMEOUT: Never leave the paywall in a loading-only state.
      const hardTimeout = setTimeout(() => {
        if (!hasLoadedProductsRef.current && !purchasingRef.current) {
          setLoadingOfferings(false);
          setFetchError(true);
          setPurchaseError(current => current || 'Apple subscription options are taking longer than expected. You can retry or tap Subscribe to request checkout directly from Apple.');
        }
      }, 12000);
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

  const finishPurchase = async (Purchases, result) => {
    if (hasActiveEntitlement(result)) {
      startTrial();
      onClose();
      return true;
    }

    try {
      const customerInfo = await withTimeout(Purchases.getCustomerInfo(), 10000, 'Purchase verification');
      if (hasActiveEntitlement(customerInfo)) {
        startTrial();
        onClose();
        return true;
      }
    } catch (e) {
      recordIAPDiagnostic('iap_purchase_verification_failed', { message: e.message });
    }

    setPurchaseError('Purchase completed, but premium access could not be verified. Please tap Restore Purchases.');
    return false;
  };

  const handleSubscribe = async () => {
    if (!user) {
      alert("Please create an account before subscribing.");
      onClose();
      navigate('/auth');
      return;
    }

    setLoadingStripe(true);
    purchasingRef.current = true;
    setPurchaseError('');
    setLoadingOfferings(false);
    
    // RevenueCat Native Flow
    if (Capacitor.isNativePlatform()) {
      try {
        const Purchases = await getPurchases();
        if (!Purchases) {
          setPurchaseError('Purchase system is not available. Please try again.');
          return;
        }
        await ensurePurchasesConfigured(Purchases, user);

        const targetId = getProductIdForBilling(billing);

        // METHOD 1: Use RC packages (offerings) if available
        if (rcPackages.length > 0) {
          const pkg = getPackageForBilling(rcPackages, billing);

          if (pkg) {
            console.log('[Paywall] Purchasing RevenueCat package:', pkg.identifier || pkg.packageType);
            const result = await withTimeout(Purchases.purchasePackage({ aPackage: pkg }), 45000, 'Purchase');
            await finishPurchase(Purchases, result);
            return;
          }
        }

        // METHOD 2: Use direct StoreKit products if available
        if (directProducts.length > 0) {
          const product = getStoreProductForBilling(directProducts, billing);
          
          if (product) {
            console.log('[Paywall] Purchasing direct product:', product.identifier);
            const result = await withTimeout(Purchases.purchaseStoreProduct({ product }), 45000, 'Purchase');
            await finishPurchase(Purchases, result);
            return;
          }
        }

        // METHOD 3: RevenueCat's native bridge only needs an identifier on iOS.
        // This still uses Apple's IAP sheet, but avoids blocking checkout on slow product preloading.
        console.log('[Paywall] No cached products — requesting direct checkout by product ID:', targetId);
        recordIAPDiagnostic('iap_direct_product_id_purchase_attempt', { product_id: targetId });
        try {
          const result = await withTimeout(
            Purchases.purchaseStoreProduct({ product: { identifier: targetId } }),
            60000,
            'Purchase'
          );
          await finishPurchase(Purchases, result);
          return;
        } catch (e) {
          console.error('Direct product ID purchase failed:', e.message);
          recordIAPDiagnostic('iap_purchase_failed', { product_id: targetId, message: e.message });
        }

        setPurchaseError('Apple checkout could not start for this subscription. Please try again, or contact support if this continues.');
      } catch (e) {
        const isCancelled = e.userCancelled || e.code === 1 || (e.message && e.message.includes('cancelled'));
        if (!isCancelled) {
          console.error("RC Purchase Error", e);
          recordIAPDiagnostic('iap_purchase_failed', { message: e.message || 'Unknown purchase error' });
          setPurchaseError(e.message || 'Purchase could not be completed. Please try again.');
        }
      } finally {
        setLoadingStripe(false);
        purchasingRef.current = false;
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
      purchasingRef.current = false;
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

  // Calculate dynamic price based on RevenueCat packages or direct products.
  // Fallback prices are display-only; checkout always goes through Apple's IAP APIs.
  const selectedPackage = rcPackages.length > 0 ? getPackageForBilling(rcPackages, billing) : null;
  const selectedDirectProduct = directProducts.length > 0 ? getStoreProductForBilling(directProducts, billing) : null;
  const dynamicPrice = selectedPackage?.product?.priceString || selectedDirectProduct?.priceString || null;
  const price = dynamicPrice || FALLBACK_PRICES[billing] || FALLBACK_PRICES.annual;
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
            {Capacitor.isNativePlatform() && loadingOfferings && !loadingStripe && (
              <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px', lineHeight: 1.4 }}>
                Loading latest Apple subscription details...
              </p>
            )}
            {Capacitor.isNativePlatform() && fetchError && rcPackages.length === 0 && directProducts.length === 0 && !loadingStripe && (
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
