import { useState } from 'react';

export default function FundModal({ isOpen, onClose, fundData }) {
  const [activeTab, setActiveTab] = useState('holdings'); // 'holdings' | 'log'

  if (!isOpen || !fundData) return null;

  const totalValue = fundData.currentCash + (fundData.holdings || []).reduce((acc, h) => acc + (h.shares * h.avgPrice), 0);
  const returnPct = ((totalValue - 100000) / 100000) * 100;
  const isPositive = returnPct >= 0;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        background: 'var(--bg-main)',
        height: '85vh',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        borderTop: '1px solid var(--border-light)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.3s ease-out'
      }}>
        {/* Header & Drag Handle */}
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <div style={{ width: '40px', height: '4px', background: 'rgba(26,24,21,0.15)', borderRadius: '2px' }}></div>
          <button 
            onClick={onClose}
            style={{ position: 'absolute', right: '16px', top: '12px', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '24px', cursor: 'pointer' }}
          >
            <ion-icon name="close-circle"></ion-icon>
          </button>
        </div>

        {/* Scoreboard */}
        <div style={{ padding: '0 24px 24px', textAlign: 'center', borderBottom: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            The Graham Fund
          </h2>
          <div style={{ fontSize: '42px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1.1 }}>
            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '8px', padding: '6px 12px', borderRadius: '16px', background: isPositive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: isPositive ? 'var(--accent-green)' : 'var(--accent-rose)', fontWeight: 'bold' }}>
            <ion-icon name={isPositive ? "trending-up" : "trending-down"}></ion-icon>
            {isPositive ? '+' : ''}{returnPct.toFixed(2)}% All-Time
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '12px' }}>
            Buying Power: ${fundData.currentCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', padding: '16px 24px', gap: '16px', borderBottom: '1px solid var(--border-light)' }}>
          <button 
            onClick={() => setActiveTab('holdings')}
            style={{ flex: 1, padding: '12px', background: activeTab === 'holdings' ? 'var(--bg-tertiary)' : 'transparent', border: 'none', borderRadius: '12px', color: activeTab === 'holdings' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 'bold', transition: 'all 0.2s', cursor: 'pointer' }}
          >
            Current Holdings
          </button>
          <button 
            onClick={() => setActiveTab('log')}
            style={{ flex: 1, padding: '12px', background: activeTab === 'log' ? 'var(--bg-tertiary)' : 'transparent', border: 'none', borderRadius: '12px', color: activeTab === 'log' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 'bold', transition: 'all 0.2s', cursor: 'pointer' }}
          >
            Trade Log
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          
          {activeTab === 'holdings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(!fundData.holdings || fundData.holdings.length === 0) ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '40px' }}>
                  No active holdings. Cash position only.
                </div>
              ) : (
                fundData.holdings.map((h, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{h.ticker}</div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{h.shares} Shares</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        ${(h.shares * h.avgPrice).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Avg Cost: ${h.avgPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'log' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(!fundData.tradeHistory || fundData.tradeHistory.length === 0) ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '40px' }}>
                  No trades executed yet.
                </div>
              ) : (
                [...fundData.tradeHistory].reverse().map((trade, i) => (
                  <div key={i} style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          background: trade.type === 'BUY' ? 'rgba(34,197,94,0.15)' : trade.type === 'SELL' ? 'rgba(239,68,68,0.15)' : 'var(--bg-tertiary)',
                          color: trade.type === 'BUY' ? 'var(--accent-green)' : trade.type === 'SELL' ? 'var(--accent-rose)' : 'var(--text-secondary)',
                          padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' 
                        }}>
                          {trade.type}
                        </span>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                          {trade.ticker}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {new Date(trade.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                      {trade.shares} shares @ ${trade.price.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, fontStyle: 'italic', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
                      "{trade.rationale}"
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
