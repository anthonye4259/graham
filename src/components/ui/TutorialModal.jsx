import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analytics, trackEvent } from '../../lib/firebase';

const SLIDES = [
  {
    title: "Graham is analyzing...",
    subtitle: "Scan any stock, crypto, or upload your portfolio.",
    icon: "scan-outline",
    color: "var(--accent-teal)"
  },
  {
    title: "Institutional Deep Dives",
    subtitle: "Stop reading generic news. Get premium, multi-part research reports instantly.",
    icon: "document-text-outline",
    color: "var(--accent-blue)"
  },
  {
    title: "Track Your Alpha",
    subtitle: "Simulate buys and let AI proactively monitor your fantasy portfolio.",
    icon: "trending-up-outline",
    color: "var(--accent-rose)"
  }
];

export default function TutorialModal({ query, image, onClose }) {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    trackEvent('tutorial_started');
  }, []);

  const nextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(s => s + 1);
    } else {
      navigate('/auth', { state: { query, image } });
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(s => s - 1);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      
      <button 
        onClick={onClose}
        style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '28px', cursor: 'pointer' }}
      >
        <ion-icon name="close-circle-outline"></ion-icon>
      </button>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '24px', width: '100%', maxWidth: '400px', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
        
        {/* Progress Indicators */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '40px' }}>
          {SLIDES.map((_, idx) => (
            <div key={idx} style={{ width: '32px', height: '4px', borderRadius: '2px', background: idx === currentSlide ? 'var(--text-primary)' : 'var(--border-light)', transition: 'background 0.3s ease' }} />
          ))}
        </div>

        {/* Slide Content */}
        <div style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `linear-gradient(135deg, ${SLIDES[currentSlide].color}, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', color: '#fff', marginBottom: '24px', boxShadow: `0 8px 32px ${SLIDES[currentSlide].color}40` }}>
            <ion-icon name={SLIDES[currentSlide].icon}></ion-icon>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '16px' }}>{SLIDES[currentSlide].title}</h2>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{SLIDES[currentSlide].subtitle}</p>
        </div>

        {/* Navigation Controls */}
        <div style={{ display: 'flex', width: '100%', gap: '12px', marginTop: '48px' }}>
          {currentSlide > 0 && (
            <button 
              onClick={prevSlide}
              style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ion-icon name="arrow-back-outline"></ion-icon>
            </button>
          )}
          <button 
            onClick={nextSlide}
            style={{ flex: 1, padding: '16px', borderRadius: '12px', border: 'none', background: 'var(--text-primary)', color: 'var(--bg-main)', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {currentSlide === SLIDES.length - 1 ? 'Create Free Account' : 'Continue'}
          </button>
        </div>

      </div>
    </div>
  );
}
