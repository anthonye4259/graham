import { useState } from 'react';
import { useUser } from '../../context/UserContext';

import { loadStripe } from '@stripe/stripe-js';

export default function PaywallModal({ isOpen, onClose, source = 'upgrade' }) {
  const { startTrial } = useUser();
  const [billing, setBilling] = useState('annual'); // 'annual' | 'monthly'
  const [loadingStripe, setLoadingStripe] = useState(false);

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    setLoadingStripe(true);
    try {
      const paymentLink = import.meta.env.VITE_STRIPE_PAYMENT_LINK;
      if (!paymentLink) {
        // Fallback for local testing if no key is provided
        console.warn("No Stripe Payment Link provided. Simulating successful checkout.");
        startTrial();
        onClose();
        return;
      }
      
      // Redirect to the Stripe Payment Link
      window.location.href = paymentLink;
    } catch (e) {
      console.error("Stripe Checkout Error", e);
    } finally {
      setLoadingStripe(false);
    }
  };

  const isAnnual = billing === 'annual';
  const price = isAnnual ? '$89.99' : '$9.99';
  const billedText = isAnnual ? 'Billed annually' : 'Billed monthly';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="paywall-modal" onClick={e => e.stopPropagation()}>
        <div className="paywall-header">
          <button className="close-modal" onClick={onClose}>
            <ion-icon name="close-outline"></ion-icon>
          </button>
          <h2 className="paywall-title">Invest in Yourself</h2>
          <p className="paywall-subtitle">
            {source === 'scan'
              ? 'Unlock unlimited stock scans and full access.'
              : 'Master the markets with Graham Premium.'}
          </p>

          <div className="billing-toggle">
            <button
              className={`billing-btn ${isAnnual ? 'active' : ''}`}
              onClick={() => setBilling('annual')}
            >
              Yearly
              <span className="save-badge">Save 30%</span>
            </button>
            <button
              className={`billing-btn ${!isAnnual ? 'active' : ''}`}
              onClick={() => setBilling('monthly')}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="paywall-content">
          <div className="pricing-card">
            <div className="price-row">
              <span className="price-amount">{price}</span>
              <span className="price-period">/ {isAnnual ? 'yr' : 'mo'}</span>
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
              Early access to new features
            </li>
          </ul>

          <button className="paywall-cta" onClick={handleSubscribe}>
            Start 7-Day Free Trial
          </button>
        </div>
      </div>
    </div>
  );
}
