import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { trackEvent } from '../../lib/firebase';

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
const PURCHASE_WATCHDOG_MS = 90000;

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

function getRevenueCatAppleKey() {
  const key = import.meta.env.VITE_REVENUECAT_APPLE_KEY || import.meta.env.VITE_REVENUECAT_PUBLIC_KEY;
  return key && key !== 'appl_REPLACE_ME_WHEN_READY' ? key : '';
}

async function ensurePurchasesConfigured(Purchases, user) {
  const apiKey = getRevenueCatAppleKey();
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

function getExactPackageForBilling(packages, billing) {
  const targetType = billing === 'annual' ? 'ANNUAL' : (billing === 'weekly' ? 'WEEKLY' : 'MONTHLY');
  return packages.find(p => p.packageType === targetType) || null;
}

function getOfferingPackageForBilling(offering, billing) {
  if (!offering) return null;
  const namedPackage = billing === 'annual'
    ? offering.annual
    : (billing === 'weekly' ? offering.weekly : offering.monthly);
  return namedPackage || getExactPackageForBilling(offering.availablePackages || [], billing);
}

function getExactStoreProductForBilling(products, billing) {
  const targetId = getProductIdForBilling(billing);
  return products.find(p => p.identifier === targetId) || null;
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
  const { user, startTrial } = useUser();
  const [billing, setBilling] = useState('annual'); // 'annual' | 'monthly'
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [rcPackages, setRcPackages] = useState([]);
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');
  const [checkoutNotice, setCheckoutNotice] = useState('');
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

  const fetchPackages = useCallback(async (retries = 2, delay = 1500) => {
    setLoadingOfferings(true);
    setFetchError(false);
    setPurchaseError('');
    setCheckoutNotice('');
    setRcPackages([]);
    setDirectProducts([]);
    hasLoadedProductsRef.current = false;
    
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

    // RevenueCat is the source of truth for checkout. App Store products must be
    // attached to a current offering in RevenueCat, with product IDs G1/G2/G3.
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const offerings = await withTimeout(Purchases.getOfferings(), 15000, 'Subscription loading');
        const currentOffering = offerings.current;

        if (currentOffering && currentOffering.availablePackages && currentOffering.availablePackages.length > 0) {
          const products = currentOffering.availablePackages
            .map(p => p.product)
            .filter(Boolean)
            .map(normalizeStoreProduct);
          hasLoadedProductsRef.current = true;
          setRcPackages(currentOffering.availablePackages);
          setDirectProducts(products);
          setLoadingOfferings(false);
          setFetchError(false);
          try {
            trackEvent('iap_products_loaded', {
              source: 'revenuecat_offering',
              offering: currentOffering.identifier,
              count: currentOffering.availablePackages.length,
              product_ids: products.map(p => p.identifier).join(',')
            });
          } catch(e) {}
          return;
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

    // RevenueCat direct product fetch keeps checkout in RevenueCat even if the
    // dashboard offering is temporarily misconfigured.
    console.log('[Paywall] RevenueCat offerings empty — falling back to direct product fetch');
    try {
      const productResult = await withTimeout(Purchases.getProducts({
        productIdentifiers: PRODUCT_ID_LIST
      }), 15000, 'Product loading');
      if (productResult && productResult.products && productResult.products.length > 0) {
        const products = productResult.products.map(normalizeStoreProduct);
        hasLoadedProductsRef.current = true;
        setDirectProducts(products);
        setLoadingOfferings(false);
        setFetchError(false);
        console.log('[Paywall] RevenueCat direct products loaded:', products.map(p => p.identifier));
        try {
          trackEvent('iap_products_loaded', {
            source: 'revenuecat_direct_products',
            count: products.length,
            product_ids: products.map(p => p.identifier).join(',')
          });
        } catch(e) {}
        return;
      }
      recordIAPDiagnostic('iap_product_load_failed', {
        reason: 'empty_revenuecat_direct_products',
        returned_count: productResult?.products?.length || 0
      });
    } catch (e) {
      console.warn('RevenueCat direct product fetch failed:', e.message);
      recordIAPDiagnostic('iap_product_load_failed', { reason: 'revenuecat_direct_products_error', message: e.message });
    }
    
    // All RevenueCat methods exhausted
    setLoadingOfferings(false);
    setFetchError(true);
    setCheckoutNotice('Apple subscription options are still loading. Please retry in a moment.');
    console.error("All RevenueCat product fetch attempts exhausted");
  }, [recordIAPDiagnostic, user?.uid]);

  useEffect(() => {
    if (Capacitor.isNativePlatform() && isOpen) {
      fetchPackages();
      // HARD TIMEOUT: Never leave the paywall in a loading-only state.
      const hardTimeout = setTimeout(() => {
        if (!hasLoadedProductsRef.current && !purchasingRef.current) {
          setLoadingOfferings(false);
          setFetchError(true);
          setCheckoutNotice(current => current || 'Apple subscription options are taking longer than expected. Please retry in a moment.');
        }
      }, 30000);
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

  const completeRevenueCatPurchase = (productId, source) => {
    recordIAPDiagnostic('iap_revenuecat_purchase_completed', { product_id: productId, source });
    startTrial();
    onClose();
  };

  const purchaseRevenueCatProduct = async (Purchases, targetId) => {
    let pkgToBuy = getExactPackageForBilling(rcPackages, billing);
    let productToBuy = getExactStoreProductForBilling(directProducts, billing);

    if (!pkgToBuy) {
      const offerings = await withTimeout(Purchases.getOfferings(), 15000, 'Loading offerings');
      const currentOffering = offerings.current;
      pkgToBuy = getOfferingPackageForBilling(currentOffering, billing);
      if (currentOffering?.availablePackages?.length > 0) {
        const offeringProducts = currentOffering.availablePackages
          .map(p => p.product)
          .filter(Boolean)
          .map(normalizeStoreProduct);
        setRcPackages(currentOffering.availablePackages);
        setDirectProducts(offeringProducts);
        productToBuy = getExactStoreProductForBilling(offeringProducts, billing) || productToBuy;
      }
    }

    if (pkgToBuy) {
      recordIAPDiagnostic('iap_revenuecat_package_purchase_attempt', {
        product_id: pkgToBuy.product?.identifier || targetId,
        package_type: pkgToBuy.packageType,
        package_id: pkgToBuy.identifier
      });
      return {
        source: 'package',
        result: await withTimeout(
          Purchases.purchasePackage({ aPackage: pkgToBuy }),
          PURCHASE_WATCHDOG_MS,
          'Apple checkout'
        )
      };
    }

    if (!productToBuy) {
      const productResult = await withTimeout(
        Purchases.getProducts({ productIdentifiers: [targetId] }),
        15000,
        'Loading Apple product'
      );
      const products = (productResult?.products || []).map(normalizeStoreProduct);
      setDirectProducts(products);
      productToBuy = products.find(p => p.identifier === targetId) || null;
    }

    if (!productToBuy) {
      throw new Error(`RevenueCat could not load App Store product ${targetId}. Confirm the RevenueCat app uses bundle com.graham.ai and product IDs G1, G2, G3.`);
    }

    recordIAPDiagnostic('iap_revenuecat_product_purchase_attempt', { product_id: targetId });
    return {
      source: 'direct_product',
      result: await withTimeout(
        Purchases.purchaseStoreProduct({ product: productToBuy }),
        PURCHASE_WATCHDOG_MS,
        'Apple checkout'
      )
    };
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
    setCheckoutNotice('');
    setLoadingOfferings(false);
    
    // Native iOS flow: RevenueCat owns product loading, Apple checkout, and
    // restore state. Keep one purchase stack for App Review.
    if (Capacitor.isNativePlatform()) {
      let watchdogFired = false;
      purchaseWatchdogRef.current = setTimeout(() => {
        watchdogFired = true;
        purchasingRef.current = false;
        setLoadingStripe(false);
        setCheckoutNotice('Apple checkout is still connecting. Please tap Continue again if the Apple sheet does not appear.');
        recordIAPDiagnostic('iap_purchase_watchdog_timeout', {
          product_id: getProductIdForBilling(billing),
          timeout_ms: PURCHASE_WATCHDOG_MS
        });
      }, PURCHASE_WATCHDOG_MS);

      try {
        const targetId = getProductIdForBilling(billing);
        const Purchases = await getPurchases();
        if (!Purchases) {
          throw new Error('RevenueCat purchase system is not available in this build.');
        }
        await ensurePurchasesConfigured(Purchases, user);

        const { source: purchaseSource, result } = await purchaseRevenueCatProduct(Purchases, targetId);
        const purchasedProductId = result?.productIdentifier || targetId;
        if (hasActiveEntitlement(result) || purchasedProductId) {
          if (!hasActiveEntitlement(result)) {
            recordIAPDiagnostic('iap_revenuecat_entitlement_missing_after_purchase', {
              product_id: purchasedProductId,
              active_entitlements: Object.keys(result?.customerInfo?.entitlements?.active || {}).join(',')
            });
          }
          completeRevenueCatPurchase(purchasedProductId, purchaseSource);
          return;
        }

        setPurchaseError('Purchase completed, but premium access was not found. Tap Restore Purchases or try again.');
        recordIAPDiagnostic('iap_revenuecat_purchase_missing_entitlement', { product_id: targetId });
      } catch (e) {
        if (!isUserCancelledPurchase(e)) {
          console.error("RevenueCat purchase error", e);
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
        setCheckoutNotice('');
        const Purchases = await getPurchases();
        if (!Purchases) {
          setPurchaseError('Purchase system is not available. Please try again.');
          return;
        }
        await ensurePurchasesConfigured(Purchases, user);
        const restoreResult = await withTimeout(Purchases.restorePurchases(), 30000, 'Restore purchases');
        if (hasActiveEntitlement(restoreResult)) {
          recordIAPDiagnostic('iap_revenuecat_restore_completed', {
            active_entitlements: Object.keys(restoreResult?.customerInfo?.entitlements?.active || {}).join(',')
          });
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
  const isNativePaywall = Capacitor.isNativePlatform();
  const selectedPackage = rcPackages.length > 0 ? getExactPackageForBilling(rcPackages, billing) : null;
  const selectedDirectProduct = directProducts.length > 0 ? getExactStoreProductForBilling(directProducts, billing) : null;
  const dynamicPrice = selectedPackage?.product?.priceString || selectedDirectProduct?.priceString || null;
  const price = dynamicPrice || FALLBACK_PRICES[billing] || FALLBACK_PRICES.annual;
  const billedText = billing === 'annual' ? 'Billed annually' : (billing === 'weekly' ? 'Billed weekly' : 'Billed monthly');
  const periodText = billing === 'annual' ? 'yr' : (billing === 'weekly' ? 'wk' : 'mo');
  const selectedPlanName = billing === 'annual' ? 'Yearly' : (billing === 'weekly' ? 'Weekly' : 'Monthly');
  const purchaseDisabled = loadingStripe;
  const ctaLabel = loadingStripe
    ? 'Waiting for Apple...'
    : (isNativePaywall
        ? `Continue with ${selectedPlanName}`
        : (billing === 'annual' ? 'Start 3-Day Free Trial' : 'Subscribe Now'));

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
            <button className="paywall-cta" onClick={handleSubscribe} disabled={purchaseDisabled}>
              {ctaLabel}
            </button>
            {isNativePaywall && loadingOfferings && !loadingStripe && (
              <p className="paywall-status-note">
                Checking Apple subscription availability...
              </p>
            )}
            {isNativePaywall && checkoutNotice && !purchaseError && (
              <p className="paywall-status-note">
                {checkoutNotice}
              </p>
            )}
            {isNativePaywall && fetchError && rcPackages.length === 0 && directProducts.length === 0 && !loadingStripe && (
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
