import { useEffect, useState } from 'react';
import ProgressDots from '../ui/ProgressDots';

export default function ArchetypeReveal({ step, totalSteps, riskTolerance, onNext }) {
  const [analyzing, setAnalyzing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnalyzing(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  let archetype = { name: "The Calculated Tactician", icon: "chess-outline", desc: "You don't panic. You wait for the math to make sense before striking." };
  if (riskTolerance?.toLowerCase().includes('panic') || riskTolerance?.toLowerCase().includes('cut losses')) {
    archetype = { name: "The Capital Preserver", icon: "shield-checkmark-outline", desc: "You prioritize survival over ego. A crucial trait for long-term wealth." };
  } else if (riskTolerance?.toLowerCase().includes('buy') || riskTolerance?.toLowerCase().includes('dip')) {
    archetype = { name: "The Aggressive Accumulator", icon: "flame-outline", desc: "You see blood in the streets as a buffet. Graham loves this." };
  }

  if (analyzing) {
    return (
      <div className="ob-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--border-light)', borderTopColor: 'var(--accent-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 24px' }}></div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: '18px', color: 'var(--text-secondary)', animation: 'pulse 1.5s infinite' }}>
            Graham is analyzing your profile...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ob-container">
      <div className="ob-progress">
        <div className="ob-progress-bar" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
      </div>
      <div className="ob-content" style={{ maxWidth: '600px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '32px', color: 'var(--text-secondary)' }}>Based on your answers, your archetype is:</h1>
        
        <div className="archetype-card">
          <div className="archetype-icon">
            <ion-icon name={archetype.icon}></ion-icon>
          </div>
          <h2 style={{ fontSize: '28px', marginBottom: '12px', color: 'var(--accent-gold)' }}>{archetype.name}</h2>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {archetype.desc}
          </p>
        </div>

        <button 
          className="ob-next-btn onboard-next" 
          onClick={onNext}
          style={{ width: '100%', padding: '18px', borderRadius: 'var(--radius-pill)', fontSize: '18px', fontWeight: 'bold', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', cursor: 'pointer', animation: 'fadeUp 0.3s ease' }}
        >
          Build my strategy
        </button>
      </div>
    </div>
  );
}
