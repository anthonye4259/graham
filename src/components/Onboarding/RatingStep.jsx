import { useEffect, useState } from 'react';
import { AppReview } from '@capawesome/capacitor-app-review';
import { Capacitor } from '@capacitor/core';
import ProgressDots from '../ui/ProgressDots';

export default function RatingStep({ step, totalSteps, onNext }) {
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const requestReview = async () => {
      // Small delay so the screen renders first before the native modal pops up over it
      setTimeout(async () => {
        if (!isMounted) return;
        try {
          if (Capacitor.isNativePlatform()) {
            await AppReview.requestReview();
          } else {
            console.log("AppReview.requestReview() triggered (Web simulation)");
          }
          setRequested(true);
        } catch (e) {
          console.warn("Failed to request app review:", e);
          setRequested(true);
        }
      }, 1000);
    };

    requestReview();

    return () => { isMounted = false; };
  }, []);

  return (
    <div className="onboard-step">
      <ProgressDots current={step} total={totalSteps} />
      
      <div style={{ marginTop: '20px', marginBottom: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 className="onboard-title" style={{ fontSize: '32px', marginBottom: '16px' }}>Give us a rating</h1>
        <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
          {/* Glowing Stars */}
          {[...Array(5)].map((_, i) => (
            <ion-icon 
              key={i} 
              name="star" 
              style={{ 
                color: '#FBBF24', // Amber/Gold
                fontSize: '36px',
                filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))' 
              }}
            ></ion-icon>
          ))}
        </div>
      </div>

      <div className="onboard-subtitle" style={{ textAlign: 'center', marginBottom: '40px' }}>
        This app was designed for people like you to take control of their financial future. 
        <br/><br/>
        If Graham's AI analysis impressed you, please consider taking a second to leave a 5-star review!
      </div>
      
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
        <button 
          className="onboard-next" 
          onClick={onNext}
          style={{
            background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-blue))',
            color: 'white'
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
