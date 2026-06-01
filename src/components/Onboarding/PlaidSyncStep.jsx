import { useState, useEffect, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { functions } from '../../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import ProgressDots from '../ui/ProgressDots';

export default function PlaidSyncStep({ step, totalSteps, onNext }) {
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchToken = async () => {
      try {
        const createPlaidLinkToken = httpsCallable(functions, 'createPlaidLinkToken');
        const result = await createPlaidLinkToken();
        if (isMounted) {
          setLinkToken(result.data.link_token);
          setLoading(false);
        }
      } catch (e) {
        console.error('Error fetching Plaid link token:', e);
        if (isMounted) {
          setError('Could not connect to secure sync service.');
          setLoading(false);
        }
      }
    };
    fetchToken();
    return () => { isMounted = false; };
  }, []);

  const onSuccess = useCallback(async (public_token, metadata) => {
    setLoading(true);
    try {
      const exchangePlaidPublicToken = httpsCallable(functions, 'exchangePlaidPublicToken');
      await exchangePlaidPublicToken({ publicToken: public_token });
      
      // Optionally trigger initial sync right now
      const syncPlaidHoldings = httpsCallable(functions, 'syncPlaidHoldings');
      await syncPlaidHoldings();
      
      setSynced(true);
      setLoading(false);
      setTimeout(() => onNext(), 1500); // Auto-advance after success animation
    } catch (e) {
      console.error('Error exchanging public token:', e);
      setError('Sync failed. Please try again or skip.');
      setLoading(false);
    }
  }, [onNext]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  return (
    <div className="onboard-step">
      <ProgressDots current={step} total={totalSteps} />
      <div className="onboard-hero-icon" style={{ color: 'var(--accent-teal)' }}>
        <ion-icon name={synced ? "checkmark-circle" : "shield-checkmark-outline"}></ion-icon>
      </div>
      <div className="onboard-title">
        {synced ? "Securely Linked!" : "Sync Your Brokerage"}
      </div>
      <div className="onboard-subtitle">
        {synced 
          ? "Graham has successfully analyzed your portfolio." 
          : "Connect Robinhood, Fidelity, or Vanguard so Graham can analyze your actual portfolio."}
      </div>
      
      {error && <div style={{ color: 'var(--accent-rose)', marginTop: '8px', fontSize: '14px' }}>{error}</div>}
      
      <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {!synced && (
          <button 
            className="onboard-next" 
            onClick={() => open()} 
            disabled={!ready || loading}
          >
            {loading ? "Preparing Secure Link..." : "Securely Link Account"}
          </button>
        )}
        
        {!synced && !loading && (
          <button 
            className="onboard-next" 
            style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' }} 
            onClick={onNext}
          >
            Skip for now
          </button>
        )}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
        <ion-icon name="lock-closed"></ion-icon> Secured by Plaid
      </div>
    </div>
  );
}
