import { useState } from 'react';
import ProgressDots from '../ui/ProgressDots';

export default function InteractiveTeaser({ step, totalSteps, onNext }) {
  const [selected, setSelected] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const OPTIONS = [
    { id: 'a', label: 'A massive sell-off is starting.' },
    { id: 'b', label: 'It hit resistance and might reverse.' },
    { id: 'c', label: 'The company went bankrupt.' },
  ];

  const handleSelect = (id) => {
    if (selected) return;
    setSelected(id);
    setTimeout(() => {
      setShowExplanation(true);
    }, 600);
  };

  return (
    <div className="ob-container">
      <div className="ob-progress">
        <div className="ob-progress-bar" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
      </div>
      <div className="ob-content" style={{ maxWidth: '600px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Let's test your intuition.</h1>
        <p className="ob-subtitle" style={{ marginBottom: '24px' }}>Look at this chart pattern. What is happening here?</p>
        
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '16px', marginBottom: '24px', border: '1px solid var(--border-light)' }}>
          {/* Fake abstract chart using CSS */}
          <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', gap: '8px', justifyContent: 'center' }}>
            <div style={{ width: '20px', height: '40%', background: 'var(--accent-teal)', borderRadius: '4px' }}></div>
            <div style={{ width: '20px', height: '60%', background: 'var(--accent-teal)', borderRadius: '4px' }}></div>
            <div style={{ width: '20px', height: '80%', background: 'var(--accent-teal)', borderRadius: '4px' }}></div>
            <div style={{ width: '20px', height: '100%', background: 'var(--accent-teal)', borderRadius: '4px' }}></div>
            <div style={{ width: '20px', height: '70%', background: 'var(--accent-rose)', borderRadius: '4px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', width: '2px', height: '130%', background: 'var(--accent-rose)' }}></div>
            </div>
          </div>
        </div>

        {!showExplanation ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {OPTIONS.map(opt => (
              <button
                key={opt.id}
                className={`ob-option-btn ${selected === opt.id ? 'selected' : ''}`}
                onClick={() => handleSelect(opt.id)}
                style={{
                  display: 'flex', padding: '16px', borderRadius: '12px',
                  border: `1px solid ${selected === opt.id ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
                  background: selected === opt.id ? 'var(--accent-gold-glow)' : 'var(--bg-card)',
                  color: 'var(--text-primary)', cursor: 'pointer',
                  textAlign: 'left', transition: 'all 0.2s', alignItems: 'center'
                }}
              >
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', fontSize: '12px' }}>
                  {selected === opt.id ? <ion-icon name="checkmark"></ion-icon> : opt.id.toUpperCase()}
                </div>
                {opt.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="archetype-card" style={{ padding: '24px', textAlign: 'left', margin: 0, animation: 'fadeUp 0.4s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-gold)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                <ion-icon name="analytics"></ion-icon>
              </div>
              <strong style={{ fontSize: '18px', color: 'var(--accent-gold)' }}>Graham's Analysis</strong>
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0' }}>
              "Actually, this is a classic <strong>Bearish Engulfing</strong> pattern at resistance. The long red wick shows sellers aggressively stepping in. This is exactly what I will decode for you instantly when you upload real charts."
            </p>
          </div>
        )}

        {showExplanation && (
          <button 
            className="ob-next-btn onboard-next" 
            onClick={onNext}
            style={{ width: '100%', padding: '18px', borderRadius: 'var(--radius-pill)', fontSize: '18px', fontWeight: 'bold', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', cursor: 'pointer', marginTop: '24px', animation: 'fadeUp 0.3s ease' }}
          >
            I need this AI
          </button>
        )}
      </div>
    </div>
  );
}
