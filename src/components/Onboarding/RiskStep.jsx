import { useState } from 'react';

const QUESTIONS = [
  {
    q: "The market drops 20% tomorrow. What do you do?",
    options: [
      { id: 'panic', label: 'Sell everything. Stop the bleeding.' },
      { id: 'hold', label: 'Close the app. Do nothing.' },
      { id: 'buy', label: 'Buy the dip aggressively.' }
    ]
  },
  {
    q: "You hear about a hot new crypto from a friend. Next move?",
    options: [
      { id: 'allin', label: 'Go all in immediately.' },
      { id: 'research', label: 'Ask Graham to analyze its fundamentals.' },
      { id: 'ignore', label: 'Ignore it. Stick to S&P 500.' }
    ]
  },
  {
    q: "What is your primary investment goal?",
    options: [
      { id: 'retire', label: 'Long-term wealth & retirement.' },
      { id: 'income', label: 'Passive income & dividends.' },
      { id: 'trading', label: 'Active trading & massive gains.' }
    ]
  }
];

export default function RiskStep({ step, totalSteps, onNext }) {
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastSelected, setLastSelected] = useState(null);

  const handleSelect = (id) => {
    if (showFeedback) return;
    setLastSelected(id);
    const newAnswers = [...answers, id];
    setAnswers(newAnswers);
    setShowFeedback(true);
    
    setTimeout(() => {
      setShowFeedback(false);
      setLastSelected(null);
      if (qIndex < QUESTIONS.length - 1) {
        setQIndex(qIndex + 1);
      } else {
        // Pass a combined string representing their risk profile to onNext
        const profile = newAnswers.join(',');
        onNext(profile);
      }
    }, 800);
  };

  const currentQ = QUESTIONS[qIndex];

  return (
    <div className="ob-container">
      <div className="ob-progress">
        <div className="ob-progress-bar" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
      </div>
      <div className="ob-content" style={{ maxWidth: '600px' }}>
        <div style={{ color: 'var(--accent-teal)', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Assessment {qIndex + 1} of {QUESTIONS.length}
        </div>
        <h1 style={{ fontSize: '28px', marginBottom: '32px', minHeight: '80px' }}>
          {currentQ.q}
        </h1>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {currentQ.options.map(opt => {
            const isSelected = lastSelected === opt.id;
            return (
              <button 
                key={opt.id} 
                className={`ob-option-btn hover-bg-light ${isSelected ? 'selected' : ''}`} 
                onClick={() => handleSelect(opt.id)}
                style={{ 
                  display: 'flex', alignItems: 'center', padding: '20px', 
                  borderRadius: '16px', border: `1px solid ${isSelected ? 'var(--accent-gold)' : 'var(--border-light)'}`, 
                  background: isSelected ? 'var(--accent-gold-glow)' : 'var(--bg-card)', 
                  color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                }}
              >
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px', fontSize: '12px' }}>
                  {isSelected ? <ion-icon name="checkmark"></ion-icon> : ''}
                </div>
                <div style={{ fontSize: '18px', fontWeight: '500' }}>{opt.label}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
}
