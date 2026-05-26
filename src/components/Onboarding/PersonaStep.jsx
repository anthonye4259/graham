import React from 'react';

import { PERSONAS } from '../../lib/personas';

export default function PersonaStep({ step, totalSteps, onNext }) {
  return (
    <div className="ob-container">
      <div className="ob-progress">
        <div className="ob-progress-bar" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
      </div>
      <div className="ob-content" style={{ maxWidth: '600px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>Choose your AI Analyst.</h1>
        <p className="ob-subtitle" style={{ marginBottom: '32px' }}>This defines the personality and tone of your financial reports.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {PERSONAS.map(p => (
            <button 
              key={p.id} 
              className="ob-option-btn hover-bg-light" 
              onClick={() => onNext(p.id)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease' }}
            >
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--accent-teal)' }}>{p.name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{p.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
