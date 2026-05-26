import React from 'react';

const RISKS = [
  { id: 'buy_dip', label: 'Buy the dip aggressively', desc: 'Volatility is an opportunity. I double down.' },
  { id: 'hold', label: 'Hold steady and wait', desc: 'I trust my thesis and wait for recovery.' },
  { id: 'panic', label: 'Panic sell everything', desc: 'I prefer to cut losses quickly to preserve capital.' },
];

export default function RiskStep({ step, totalSteps, onNext }) {
  return (
    <div className="ob-container">
      <div className="ob-progress">
        <div className="ob-progress-bar" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
      </div>
      <div className="ob-content" style={{ maxWidth: '600px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>How do you handle a 20% market drop?</h1>
        <p className="ob-subtitle" style={{ marginBottom: '32px' }}>We use this to calibrate the AI's risk-assessment warnings.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {RISKS.map(r => (
            <button 
              key={r.id} 
              className="ob-option-btn hover-bg-light" 
              onClick={() => onNext(r.label)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease' }}
            >
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>{r.label}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{r.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
