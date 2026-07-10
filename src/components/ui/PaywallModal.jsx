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

async function getNativeStoreKit() {
  if (!Capacitor.isNativePlatform()) return null;
  try { const m = await import('../../plugins/GrahamStoreKit'); return m.default; }
  catch (e) { console.warn('GrahamStoreKit not available:', e.message); return null; }
}

const PRODUCT_IDS = { weekly: 'G1', monthly: 'G2', annual: 'G3' };
const PRODUCT_ID_LIST = Object.values(PRODUCT_IDS);
const ENTITLEMENT_IDS = ['graham ai Pro', 'premium'];
const FALLBACK_PRICES = { weekly: '$2.99', monthly: '$7.99', annual: '$39.99' };
const PURCHASE_WATCHDOG_MS = 15000;

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

function normalizeStoreProduct(product) {
  return {
    ...product,
    identifier: product.identifier || product.id,
    priceString: product.priceString || product.displayPrice
  };
}

function isUserCancelledPurchase(error) {
  const message = String(error?.message || '').toLowerCase();
  return error?.userCancelled || error?.code === 1 || error?.code === 'USER_CANCELLED' || message.includes('cancelled');
}

function applePurchaseUnavailableMessage(error) {
  const code = error?.code || '';
  if (code === 'PRODUCT_NOT_AVAILABLE' || code === 'PRODUCT_NOT_FOUND') {
    return 'Apple says this subscription is not available for this build. Please try again later.';
  }
  if (code === 'PAYMENTS_DISABLED') {
    return 'In-app purchases are disabled on this device.';
  }
  return error?.message || 'Apple checkout could not be started. Please try again.';
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
  const purchaseWatchdogRef = useRef(null);

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

    const StoreKit = await getNativeStoreKit();
    if (StoreKit) {
      try {
        const productResult = await withTimeout(
          StoreKit.products({ productIdentifiers: PRODUCT_ID_LIST }),
          8000,
          'Apple subscription loading'
        );
        const products = (productResult?.products || []).map(normalizeStoreProduct);
        if (products.length > 0) {
          hasLoadedProductsRef.current = true;
          setDirectProducts(products);
          setLoadingOfferings(false);
          setFetchError(false);
          try { trackEvent('iap_products_loaded', { source: 'native_storekit2', count: products.length }); } catch(e) {}
          return;
        }
        recordIAPDiagnostic('iap_product_load_failed', { reason: 'empty_native_storekit2_products' });
      } catch (e) {
        console.warn('Native StoreKit product fetch failed:', e.message);
        recordIAPDiagnostic('iap_product_load_failed', { reason: 'native_storekit2_error', message: e.message });
      }
    } else {
      recordIAPDiagnostic('iap_product_load_failed', { reason: 'native_storekit_plugin_unavailable' });
    }
    
    const Purchases = await getPurchases();
    if (!Purchases) {
      setLoadingOfferings(false);
      setFetchError(true);
      setPurchaseError('Apple subscriptions are temporarily unavailable. Please try again.');
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
        setDirectProducts(productResult.products.map(normalizeStoreProduct));
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
    console.error("All StoreKit and RevenueCat fetch attempts exhausted");
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

  useEffect(() => {
    return () => {
      if (purchaseWatchdogRef.current) clearTimeout(purchaseWatchdogRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const syncRevenueCatAfterStoreKitPurchase = async (productId) => {
    try {
      const Purchases = await getPurchases();
      if (!Purchases) return;
      await ensurePurchasesConfigured(Purchases, user);
      if (typeof Purchases.syncPurchases === 'function') {
        await withTimeout(Purchases.syncPurchases(), 8000, 'Purchase sync');
      }
      try {
        await withTimeout(Purchases.getCustomerInfo(), 8000, 'Purchase sync verification');
      } catch (e) {
        recordIAPDiagnostic('iap_revenuecat_sync_verification_skipped', { product_id: productId, message: e.message });
      }
    } catch (e) {
      recordIAPDiagnostic('iap_revenuecat_sync_failed', { product_id: productId, message: e.message });
    }
  };

  const completeStoreKitPurchase = (productId) => {
    recordIAPDiagnostic('iap_storekit_purchase_completed', { product_id: productId });
    startTrial();
    onClose();
    syncRevenueCatAfterStoreKitPurchase(productId);
  };

  const handleStoreKitPurchaseResult = (result, targetId) => {
    if (result?.purchased) {
      completeStoreKitPurchase(result.productIdentifier || targetId);
      return true;
    }

    if (result?.pending) {
      setPurchaseError('Your purchase is pending Apple approval. Premium access will unlock when Apple completes it.');
      recordIAPDiagnostic('iap_storekit_purchase_pending', { product_id: targetId });
      return true;
    }

    setPurchaseError('Apple checkout did not complete. Please try again.');
    recordIAPDiagnostic('iap_storekit_purchase_incomplete', { product_id: targetId });
    return true;
  };

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
    
    // Native iOS flow. Use StoreKit 2 directly so Apple checkout is not blocked
    // by RevenueCat offering/package state in App Review sandbox.
    if (Capacitor.isNativePlatform()) {
      let watchdogFired = false;
      purchaseWatchdogRef.current = setTimeout(() => {
        watchdogFired = true;
        purchasingRef.current = false;
        setLoadingStripe(false);
        setPurchaseError('Apple checkout is taking longer than expected. Please try again.');
        recordIAPDiagnostic('iap_purchase_watchdog_timeout', {
          product_id: getProductIdForBilling(billing),
          timeout_ms: PURCHASE_WATCHDOG_MS
        });
      }, PURCHASE_WATCHDOG_MS);

      try {
        const targetId = getProductIdForBilling(billing);
        const StoreKit = await getNativeStoreKit();

        if (!StoreKit) {
          setPurchaseError('Apple checkout is not available in this build. Please try again later.');
          recordIAPDiagnostic('iap_storekit_purchase_unavailable', { product_id: targetId });
          return;
        }

        try {
          console.log('[Paywall] Purchasing with native StoreKit payment queue:', targetId);
          recordIAPDiagnostic('iap_storekit1_purchase_attempt', { product_id: targetId });
          const result = await StoreKit.purchaseLegacy({ productIdentifier: targetId });
          if (handleStoreKitPurchaseResult(result, targetId)) {
            return;
          }
        } catch (legacyError) {
          if (isUserCancelledPurchase(legacyError)) return;

          console.warn('StoreKit payment queue purchase failed:', legacyError);
          recordIAPDiagnostic('iap_storekit1_purchase_failed', {
            product_id: targetId,
            code: legacyError.code || 'unknown',
            message: legacyError.message || 'Unknown purchase error'
          });

          // StoreKit 2 remains as a native Apple fallback. RevenueCat is no longer
          // used to present checkout because that path repeatedly hung in review.
          try {
            console.log('[Paywall] Falling back to native StoreKit 2:', targetId);
            recordIAPDiagnostic('iap_storekit2_purchase_attempt', { product_id: targetId });
            const result = await StoreKit.purchase({ productIdentifier: targetId });
            if (handleStoreKitPurchaseResult(result, targetId)) {
              return;
            }
          } catch (storeKit2Error) {
            if (isUserCancelledPurchase(storeKit2Error)) return;
            console.error('StoreKit 2 purchase failed:', storeKit2Error);
            recordIAPDiagnostic('iap_storekit2_purchase_failed', {
              product_id: targetId,
              code: storeKit2Error.code || 'unknown',
              message: storeKit2Error.message || 'Unknown purchase error'
            });
            setPurchaseError(applePurchaseUnavailableMessage(storeKit2Error.code ? storeKit2Error : legacyError));
            return;
          }
        }
      } catch (e) {
        if (!isUserCancelledPurchase(e)) {
          console.error("Native purchase error", e);
          recordIAPDiagnostic('iap_purchase_failed', {
            product_id: getProductIdForBilling(billing),
            code: e.code || 'unknown',
            message: e.message || 'Unknown purchase error'
          });
          setPurchaseError(applePurchaseUnavailableMessage(e));
        }
      } finally {
        if (purchaseWatchdogRef.current) {
          clearTimeout(purchaseWatchdogRef.current);
          purchaseWatchdogRef.current = null;
        }
        if (!watchdogFired) setLoadingStripe(false);
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
        const StoreKit = await getNativeStoreKit();
        if (StoreKit) {
          try {
            const restoreResult = await withTimeout(
              StoreKit.restore({ productIdentifiers: PRODUCT_ID_LIST }),
              30000,
              'Restore Apple purchases'
            );
            if (restoreResult?.restored) {
              const restoredProductId = restoreResult.productIdentifiers?.[0] || getProductIdForBilling(billing);
              recordIAPDiagnostic('iap_storekit_restore_completed', {
                product_ids: (restoreResult.productIdentifiers || []).join(',')
              });
              startTrial();
              onClose();
              syncRevenueCatAfterStoreKitPurchase(restoredProductId);
              return;
            }
          } catch (e) {
            console.warn('Native StoreKit restore failed:', e.message);
            recordIAPDiagnostic('iap_storekit_restore_failed', { message: e.message });
          }
        }

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
  const selectedPlanName = billing === 'annual' ? 'Yearly' : (billing === 'weekly' ? 'Weekly' : 'Monthly');
  const ctaLabel = loadingStripe
    ? 'Connecting to Apple...'
    : (Capacitor.isNativePlatform() ? `Continue with ${selectedPlanName}` : (billing === 'annual' ? 'Start 3-Day Free Trial' : 'Subscribe Now'));

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

          <div className="billing-toggle" aria-label="Choose a subscription plan">
            <button
              className={`billing-btn ${billing === 'weekly' ? 'active' : ''}`}
              onClick={() => setBilling('weekly')}
              aria-pressed={billing === 'weekly'}
            >
              Weekly
            </button>
            <button
              className={`billing-btn ${billing === 'monthly' ? 'active' : ''}`}
              onClick={() => setBilling('monthly')}
              aria-pressed={billing === 'monthly'}
            >
              Monthly
            </button>
            <button
              className={`billing-btn ${billing === 'annual' ? 'active' : ''}`}
              onClick={() => setBilling('annual')}
              aria-pressed={billing === 'annual'}
            >
              Yearly
              <span className="save-badge">Save 30%</span>
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

          <div className="paywall-cta-zone">
            <button className="paywall-cta" onClick={handleSubscribe} disabled={loadingStripe}>
              {ctaLabel}
            </button>
            {Capacitor.isNativePlatform() && loadingOfferings && !loadingStripe && (
              <p className="paywall-status-note">
                Checking Apple subscription availability...
              </p>
            )}
            {Capacitor.isNativePlatform() && fetchError && rcPackages.length === 0 && directProducts.length === 0 && !loadingStripe && (
              <button
                onClick={() => fetchPackages()}
                disabled={loadingStripe || loadingOfferings}
                className="paywall-retry-button"
              >
                Retry loading Apple subscriptions
              </button>
            )}
            {purchaseError && (
              <p className="paywall-error-card" role="alert">
                {purchaseError}
              </p>
            )}
            <p className="paywall-trust-note">
              <ion-icon name="lock-closed-outline"></ion-icon> {Capacitor.isNativePlatform() ? 'Secure checkout via Apple' : 'Secure checkout'}
            </p>
            <div className="paywall-secondary-actions">
              <button onClick={handleRestore} className="paywall-link-button">
                Restore Purchases
              </button>
              <button onClick={onClose} className="paywall-link-button">
                Skip for now
              </button>
              <div className="paywall-legal-links">
                <a href="https://grahamapp.web.app/terms" target="_blank" rel="noopener noreferrer">Terms of Use (EULA)</a>
                <a href="https://grahamapp.web.app/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
