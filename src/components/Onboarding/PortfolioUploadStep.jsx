import { useState, useRef } from 'react';
import { functions } from '../../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import ProgressDots from '../ui/ProgressDots';

export default function PortfolioUploadStep({ step, totalSteps, onNext }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [synced, setSynced] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const analyzePortfolioScreenshot = httpsCallable(functions, 'analyzePortfolioScreenshot');
          await analyzePortfolioScreenshot({ imageBase64: reader.result });
          
          setSynced(true);
          setLoading(false);
          setTimeout(() => onNext(), 1500); // Auto-advance after success animation
        } catch (err) {
          console.error("Analysis error:", err);
          setError("Failed to analyze screenshot. Please try another image or skip.");
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="onboard-step">
      <ProgressDots current={step} total={totalSteps} />
      <div className="onboard-hero-icon" style={{ color: 'var(--accent-teal)' }}>
        <ion-icon name={synced ? "checkmark-circle" : "image-outline"}></ion-icon>
      </div>
      <div className="onboard-title">
        {synced ? "Portfolio Analyzed!" : "Sync Your Portfolio"}
      </div>
      <div className="onboard-subtitle">
        {synced 
          ? "Graham has successfully mapped your holdings." 
          : "Take a screenshot of your Robinhood or Fidelity app. Graham's AI will instantly read your holdings—no passwords required."}
      </div>
      
      {error && <div style={{ color: 'var(--accent-rose)', marginTop: '8px', fontSize: '14px' }}>{error}</div>}
      
      <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {!synced && (
          <>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImageUpload}
            />
            <button 
              className="onboard-next" 
              onClick={() => fileInputRef.current?.click()} 
              disabled={loading}
            >
              {loading ? "Graham AI is Scanning..." : "Upload Screenshot"}
            </button>
          </>
        )}
        
        {!synced && !loading && (
          <button 
            className="onboard-next" 
            style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' }} 
            onClick={onNext}
          >
            Skip for now
          </button>
        )}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
        <ion-icon name="shield-checkmark"></ion-icon> 100% Private & Secure
      </div>
    </div>
  );
}
