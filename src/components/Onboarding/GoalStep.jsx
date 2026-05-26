import React from 'react';

const GOALS = [
  { id: 'growth', label: 'Aggressive Growth', desc: 'High risk, high reward. Beat the market.' },
  { id: 'dividends', label: 'Passive Income', desc: 'Dividend yield and steady cash flow.' },
  { id: 'trading', label: 'Active Trading', desc: 'Options, swings, and short-term trends.' },
  { id: 'preservation', label: 'Wealth Preservation', desc: 'Low risk, stable ETFs and blue chips.' },
];

export default function GoalStep({ step, totalSteps, onNext }) {
  return (
    <div className="ob-container">
      <div className="ob-progress">
        <div className="ob-progress-bar" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
      </div>
      <div className="ob-content" style={{ maxWidth: '600px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>What is your primary financial objective?</h1>
        <p className="ob-subtitle" style={{ marginBottom: '32px' }}>This helps the AI tune its fundamental analysis to your timeline.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {GOALS.map(g => (
            <button 
              key={g.id} 
              className="ob-option-btn hover-bg-light" 
              onClick={() => onNext(g.label)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease' }}
            >
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>{g.label}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{g.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
