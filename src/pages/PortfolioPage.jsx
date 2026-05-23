import { useUser } from '../context/UserContext';
import PaywallModal from '../components/ui/PaywallModal';
import { useState } from 'react';

export default function PortfolioPage() {
  const { state, isPremium } = useUser();
  const [showPaywall, setShowPaywall] = useState(false);
  const portfolio = state.fantasyPortfolio || [];

  // For this prototype, we'll just sum the purchase prices as the "Total Value"
  // since we don't have a live ticker stream running in the background.
  const totalValue = portfolio.reduce((sum, item) => sum + item.purchasePrice * item.shares, 0);

  return (
    <div className="screen active" id="portfolio-tab">
      <div className="section-heading">Fantasy Portfolio</div>
      <p className="scan-intro">Simulate investments risk-free based on Graham's advice.</p>

      <div className="stat-card" style={{ width: '100%', textAlign: 'center', marginBottom: '24px', padding: '24px' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>Total Simulated Value</div>
        <div style={{ fontSize: '32px', fontWeight: '600', color: 'var(--text-primary)' }}>
          ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      <div className="section-heading">Your Holdings</div>
      {portfolio.length === 0 ? (
        <div className="done-card">
          <div className="done-icon"><ion-icon name="wallet-outline"></ion-icon></div>
          <h3 className="done-title">No assets yet</h3>
          <p className="done-sub">Go to the Scan tab and simulate a buy to start building your fantasy portfolio.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {portfolio.map((item, idx) => (
            <div key={idx} className="stat-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.ticker}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.name}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
                <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                  ${(item.purchasePrice * item.shares).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {item.shares} share{item.shares > 1 ? 's' : ''} @ ${item.purchasePrice}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isPremium() && portfolio.length >= 3 && (
        <div className="paywall-overlay" style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Upgrade to Premium to track unlimited simulated stocks.</p>
          <button className="scan-btn" onClick={() => setShowPaywall(true)}>Upgrade Now</button>
        </div>
      )}

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} source="portfolio_limit" />
    </div>
  );
}
