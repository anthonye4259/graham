import { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { analytics, trackEvent } from '../../lib/firebase';

import { loadStripe } from '@stripe/stripe-js';
import { Capacitor } from '@capacitor/core';
import { Purchases } from '@revenuecat/purchases-capacitor';
export default function PaywallModal({ isOpen, onClose, source = 'upgrade' }) {
  const { user, startTrial } = useUser();
  const [billing, setBilling] = useState('annual'); // 'annual' | 'monthly'
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [rcPackages, setRcPackages] = useState([]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const fetchPackages = async () => {
        try {
          const offerings = await Purchases.getOfferings();
          if (offerings.current && offerings.current.availablePackages.length !== 0) {
            setRcPackages(offerings.current.availablePackages);
          }
        } catch (e) {
          console.error("RC fetch error", e);
        }
      };
      fetchPackages();
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      trackEvent('begin_checkout');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    setLoadingStripe(true);
    
    // RevenueCat Native Flow
    if (Capacitor.isNativePlatform()) {
      try {
        let pkg = rcPackages[0]; 
        if (billing === 'annual') pkg = rcPackages.find(p => p.packageType === "ANNUAL") || rcPackages[0];
        if (billing === 'monthly') pkg = rcPackages.find(p => p.packageType === "MONTHLY") || rcPackages[0];
        if (billing === 'weekly') pkg = rcPackages.find(p => p.packageType === "WEEKLY") || rcPackages[0];

        if (pkg) {
          const result = await Purchases.purchasePackage({ aPackage: pkg });
          if (typeof result.customerInfo.entitlements.active["premium"] !== "undefined") {
            window.location.reload();
          }
        } else {
          alert("Subscriptions are currently unavailable.");
        }
      } catch (e) {
        if (!e.userCancelled) console.error("RC Purchase Error", e);
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
        const restore = await Purchases.restorePurchases();
        if (typeof restore.entitlements.active["premium"] !== "undefined") {
          window.location.reload();
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

  const price = billing === 'annual' ? '$99.00' : (billing === 'weekly' ? '$2.99' : '$9.99');
  const billedText = billing === 'annual' ? 'Billed annually (Includes 7-Day Free Trial)' : (billing === 'weekly' ? 'Billed weekly' : 'Billed monthly');
  const periodText = billing === 'annual' ? 'yr' : (billing === 'weekly' ? 'wk' : 'mo');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="paywall-modal" onClick={e => e.stopPropagation()}>
        <div className="paywall-header">
          {source !== 'hardwall' && (
            <button className="close-modal" onClick={onClose}>
              <ion-icon name="close-outline"></ion-icon>
            </button>
          )}
          <h2 className="paywall-title">Invest in Yourself</h2>
          <p className="paywall-subtitle">
            {source === 'hardwall'
              ? 'Start your 3-Day Free Trial to unlock Graham.'
              : (source === 'scan' ? 'Unlock unlimited stock scans and full access.' : 'Master the markets with Graham Premium.')}
          </p>

          <div className="billing-toggle" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '12px' }}>
            <button
              className={`billing-btn ${billing === 'weekly' ? 'active' : ''}`}
              onClick={() => setBilling('weekly')}
              style={{ padding: '8px 4px', fontSize: '13px' }}
            >
              Weekly
            </button>
            <button
              className={`billing-btn ${billing === 'monthly' ? 'active' : ''}`}
              onClick={() => setBilling('monthly')}
              style={{ padding: '8px 4px', fontSize: '13px' }}
            >
              Monthly
            </button>
            <button
              className={`billing-btn ${billing === 'annual' ? 'active' : ''}`}
              onClick={() => setBilling('annual')}
              style={{ padding: '8px 4px', fontSize: '13px', position: 'relative' }}
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

          <div className="paywall-footer">
            <button className="paywall-upgrade-btn" onClick={handleSubscribe} disabled={loadingStripe}>
              {loadingStripe ? 'Loading securely...' : (billing === 'annual' ? 'Start 7-Day Free Trial' : 'Subscribe Now')}
            </button>
            <p className="secure-checkout">
              <ion-icon name="lock-closed-outline"></ion-icon> Secure Stripe Checkout
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', marginTop: '16px' }}>
              <button onClick={handleRestore} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>
                Restore Purchases
              </button>
              <div style={{ display: 'flex', gap: '16px', fontSize: '10px', color: 'var(--text-tertiary)' }}>
                <a href="/terms" target="_blank" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Use</a>
                <a href="/privacy" target="_blank" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
