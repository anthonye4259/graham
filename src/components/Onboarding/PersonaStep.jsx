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
              style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-light)', background: 'var(--bg-card)', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--accent-gold-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px', flexShrink: 0, border: '2px solid var(--accent-gold)', overflow: 'hidden' }}>
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }} />
                ) : null}
                <ion-icon name="person" style={{ fontSize: '28px', color: 'var(--accent-gold)', display: p.imageUrl ? 'none' : 'block' }}></ion-icon>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-primary)' }}>{p.name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.4 }}>{p.desc}</div>
              </div>
              <div style={{ padding: '8px 16px', background: 'var(--accent-teal)', color: '#000', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', marginLeft: '12px' }}>
                SELECT
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
