import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { analytics, trackEvent } from '../../lib/firebase';

import { Capacitor } from '@capacitor/core';

// SAFE: dynamic import to prevent crash on iPad
async function getPurchases() {
  try { const m = await import('@revenuecat/purchases-capacitor'); return m.Purchases; }
  catch (e) { console.warn('Purchases not available:', e.message); return null; }
}

export default function PaywallModal({ isOpen, onClose, source = 'upgrade' }) {
  const { user, startTrial } = useUser();
  const [billing, setBilling] = useState('annual'); // 'annual' | 'monthly'
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [rcPackages, setRcPackages] = useState([]);
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const fetchPackages = useCallback(async (retries = 5, delay = 2000) => {
    setLoadingOfferings(true);
    setFetchError(false);
    
    const Purchases = await getPurchases();
    if (!Purchases) {
      setLoadingOfferings(false);
      setFetchError(true);
      return;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Ensure RevenueCat is configured before fetching
        if (attempt > 1) {
          try {
            const apiKey = import.meta.env.VITE_REVENUECAT_PUBLIC_KEY;
            if (apiKey && user) {
              await Purchases.configure({ apiKey, appUserID: user.uid });
            }
          } catch (configErr) {
            // Already configured, that's fine
          }
        }
        
        const offerings = await Purchases.getOfferings();
        if (offerings.current && offerings.current.availablePackages.length !== 0) {
          setRcPackages(offerings.current.availablePackages);
          setLoadingOfferings(false);
          setFetchError(false);
          return; // Success!
        }
      } catch (e) {
        console.warn(`RC fetch attempt ${attempt}/${retries} failed:`, e.message);
      }
      
      // Wait before retrying (skip wait on last attempt)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // All retries exhausted
    setLoadingOfferings(false);
    setFetchError(true);
    console.error("All RevenueCat fetch attempts exhausted");
  }, [user]);

  useEffect(() => {
    if (Capacitor.isNativePlatform() && isOpen) {
      fetchPackages();
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
    setLoadingStripe(true);
    
    // RevenueCat Native Flow
    if (Capacitor.isNativePlatform()) {
      try {
        const Purchases = await getPurchases();
        if (!Purchases) { alert('Purchase system not available. Please try again.'); setLoadingStripe(false); return; }

        // If packages haven't loaded yet, try one more time
        if (rcPackages.length === 0) {
          await fetchPackages(3, 1500);
          setLoadingStripe(false);
          return; // Let the user try again after packages load
        }

        let pkg = rcPackages[0]; 
        if (billing === 'annual') pkg = rcPackages.find(p => p.packageType === "ANNUAL") || rcPackages[0];
        if (billing === 'monthly') pkg = rcPackages.find(p => p.packageType === "MONTHLY") || rcPackages[0];
        if (billing === 'weekly') pkg = rcPackages.find(p => p.packageType === "WEEKLY") || rcPackages[0];

        if (pkg) {
          const result = await Purchases.purchasePackage({ aPackage: pkg });
          const info = result.customerInfo || result;
          const activeEntitlements = info.entitlements?.active || {};
          if (activeEntitlements["graham ai Pro"] || activeEntitlements["premium"] || Object.keys(activeEntitlements).length > 0) {
            startTrial(); // persist subscribed=true to Firestore immediately
            onClose();
          } else {
            // Purchase went through but entitlement not found yet — still unlock
            startTrial();
            onClose();
          }
        } else {
          alert("Subscriptions are currently unavailable. Please check your internet connection and try again.");
        }
      } catch (e) {
        if (!e.userCancelled) {
          console.error("RC Purchase Error", e);
          alert('Purchase could not be completed. Please try again.');
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
        const Purchases = await getPurchases();
        if (!Purchases) { alert('Purchase system not available.'); setLoadingStripe(false); return; }
        const restoreResult = await Purchases.restorePurchases();
        const info = restoreResult.customerInfo || restoreResult;
        const activeEntitlements = info.entitlements?.active || {};
        if (activeEntitlements["graham ai Pro"] || activeEntitlements["premium"] || Object.keys(activeEntitlements).length > 0) {
          startTrial(); // persist subscribed=true to Firestore
          onClose();
        } else {
          alert("No active premium subscription found.");
        }
      } catch (e) {
        console.error("Restore failed", e);
        alert("Failed to restore purchases.");
      } finally {
        setLoadingStripe(false);
      }
    } else {
      alert("Please manage your web subscription in the billing settings.");
    }
  };

  // Calculate dynamic price based on RevenueCat packages if available
  let dynamicPrice = null;
  if (rcPackages.length > 0) {
    const targetType = billing === 'annual' ? 'ANNUAL' : (billing === 'weekly' ? 'WEEKLY' : 'MONTHLY');
    const pkg = rcPackages.find(p => p.packageType === targetType);
    if (pkg && pkg.product) {
      dynamicPrice = pkg.product.priceString;
    }
  }

  const price = dynamicPrice || (billing === 'annual' ? '$39.99' : (billing === 'weekly' ? '$2.99' : '$7.99'));
  const billedText = billing === 'annual' ? 'Billed annually (Includes 3-Day Free Trial)' : (billing === 'weekly' ? 'Billed weekly' : 'Billed monthly');
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
            {Capacitor.isNativePlatform() && loadingOfferings ? (
              <button className="paywall-cta" disabled style={{ opacity: 0.7 }}>
                Loading subscription options...
              </button>
            ) : Capacitor.isNativePlatform() && fetchError && rcPackages.length === 0 ? (
              <button className="paywall-cta" onClick={() => fetchPackages(3, 1500)}>
                Retry Loading Subscriptions
              </button>
            ) : (
              <button className="paywall-cta" onClick={handleSubscribe} disabled={loadingStripe}>
                {loadingStripe ? 'Loading securely...' : (billing === 'annual' ? 'Start 3-Day Free Trial' : 'Subscribe Now')}
              </button>
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
