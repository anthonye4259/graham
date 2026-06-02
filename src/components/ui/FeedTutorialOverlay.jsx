import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { hapticSelection, hapticSuccess } from '../../lib/haptics';

export default function FeedTutorialOverlay() {
  const { state, setState } = useUser();
  const [step, setStep] = useState(1);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (state.hasSeenFeedTutorial === false) {
      setIsVisible(true);
    }
  }, [state.hasSeenFeedTutorial]);

  if (!isVisible) return null;

  const handleNext = () => {
    hapticSelection();
    if (step === 1) {
      setStep(2);
    } else {
      hapticSuccess();
      setIsVisible(false);
      setState({ hasSeenFeedTutorial: true });
    }
  };

  return (
    <div 
      onClick={handleNext}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(26, 24, 21, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFF',
        cursor: 'pointer',
        animation: 'fadeIn 0.3s ease-out',
        padding: '24px'
      }}
    >
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
          <div className="animate-swipe-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ion-icon name="hand-right-outline" style={{ fontSize: '64px', color: '#FFF' }}></ion-icon>
            <div style={{ width: '2px', height: '60px', background: 'linear-gradient(to top, rgba(255,255,255,0), rgba(255,255,255,0.8))', marginTop: '16px', borderRadius: '2px' }} />
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', textAlign: 'center', margin: 0, textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>Swipe Up</h2>
          <p style={{ fontSize: '18px', textAlign: 'center', color: 'rgba(255,255,255,0.9)', maxWidth: '280px', margin: 0 }}>
            Scroll through your personalized daily feed of bite-sized financial insights.
          </p>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
          <div className="animate-pulse-tap">
            <ion-icon name="scan-circle-outline" style={{ fontSize: '80px', color: 'var(--accent-gold)' }}></ion-icon>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', textAlign: 'center', margin: 0, textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>Tap the Jargon</h2>
          <p style={{ fontSize: '18px', textAlign: 'center', color: 'rgba(255,255,255,0.9)', maxWidth: '280px', margin: 0 }}>
            See a <span style={{ textDecoration: 'underline', textDecorationStyle: 'dashed', textUnderlineOffset: '4px', color: 'var(--accent-gold)' }}>highlighted word</span>? Tap it to instantly reveal a simple "Explain It Like I'm 5" definition.
          </p>
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom) + 40px)' }}>
        <button 
          style={{ 
            background: 'transparent', 
            border: '1px solid rgba(255,255,255,0.3)', 
            padding: '12px 32px', 
            borderRadius: '24px', 
            color: '#FFF', 
            fontSize: '16px', 
            fontWeight: '600',
            backdropFilter: 'blur(10px)',
            cursor: 'pointer'
          }}
        >
          {step === 1 ? 'Next' : 'Got it'}
        </button>
      </div>

    </div>
  );
}
