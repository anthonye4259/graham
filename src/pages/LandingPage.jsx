import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Capacitor } from '@capacitor/core';
import Navbar from '../components/ui/Navbar';
import TutorialModal from '../components/ui/TutorialModal';
import PaywallModal from '../components/ui/PaywallModal';

const SUGGESTIONS = [
  'Stock Analysis',
  'Options Trading',
  'Portfolio Strategy',
  'Market Basics',
  'Retirement Planning',
];

const TYPING_PHRASES = [
  "Analyze TSLA earnings...",
  "Is BTC breaking out?",
  "What is the Fed doing?",
  "Scan AAPL for the long term...",
  "Should I buy NVDA today?"
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { state, setState } = useUser();
  const [query, setQuery] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [placeholderText, setPlaceholderText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [showTutorial, setShowTutorial] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  // Affiliate Tracking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const via = params.get('via') || params.get('utm_source');
    if (via) {
      localStorage.setItem('affiliate_id', via);
    }
  }, []);

  // Typing Animation Effect
  useEffect(() => {
    let typingSpeed = isDeleting ? 50 : 100;
    const currentPhrase = TYPING_PHRASES[phraseIndex];

    if (!isDeleting && placeholderText === currentPhrase) {
      typingSpeed = 2000; // Pause at end of phrase
      setTimeout(() => setIsDeleting(true), typingSpeed);
      return;
    } else if (isDeleting && placeholderText === '') {
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % TYPING_PHRASES.length);
      return;
    }

    const timeout = setTimeout(() => {
      setPlaceholderText(
        isDeleting
          ? currentPhrase.substring(0, placeholderText.length - 1)
          : currentPhrase.substring(0, placeholderText.length + 1)
      );
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [placeholderText, isDeleting, phraseIndex]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    setShowTutorial(true);
  };

  return (
    <div className="g-landing">
      {showTutorial && (
        <TutorialModal 
          query={query} 
          image={imagePreview} 
          onClose={() => setShowTutorial(false)} 
        />
      )}
      <PaywallModal isOpen={showPricing} onClose={() => setShowPricing(false)} source="landing" />
      {/* Animated Mesh Gradient Background */}
      <div className="landing-bg-mesh"></div>

      <Navbar onOpenPricing={() => setShowPricing(true)} />

      <main className="g-hero" style={{ zIndex: 1, position: 'relative' }}>
        <div className="g-announce" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <span className="g-announce-badge">NEW</span>
          <span>Your personal investing AI</span>
          <ion-icon name="arrow-forward-outline"></ion-icon>
        </div>

        <h1 className="g-hero-title" style={{ textShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
          Turn your curiosity into<br />investing knowledge
        </h1>

        <form onSubmit={handleSubmit} className="g-search-container" style={{ position: 'relative', width: '100%', maxWidth: '720px', margin: '0 auto', marginTop: '48px' }}>
          {imagePreview && (
            <div className="g-image-preview" style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '8px', display: 'inline-block', position: 'relative' }}>
              <img src={imagePreview} alt="Upload preview" style={{ maxWidth: '100px', borderRadius: '8px' }} />
              <button type="button" onClick={() => setImagePreview(null)} style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--accent-rose)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <ion-icon name="close-outline"></ion-icon>
              </button>
            </div>
          )}
          
          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', background: 'rgba(30,30,30,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '8px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', transition: 'all 0.3s ease' }}>
            <button 
              type="button" 
              onClick={() => setShowActionMenu(!showActionMenu)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '24px', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', transition: 'background 0.2s' }}
              className="hover-bg-light"
            >
              <ion-icon name="add-circle-outline"></ion-icon>
            </button>
            
            <input 
              type="text" 
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '18px', padding: '16px', outline: 'none', minWidth: 0 }}
              placeholder={placeholderText}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            
            <button type="submit" style={{ opacity: query ? 1 : 0.5, background: 'var(--accent-teal)', color: '#000', border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', cursor: 'pointer', transition: 'all 0.2s' }}>
              <ion-icon name="arrow-up-outline"></ion-icon>
            </button>
          </div>

          {showActionMenu && (
            <div className="glass-panel" style={{ position: 'absolute', bottom: '100%', left: '16px', marginBottom: '16px', background: 'rgba(30,30,30,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', borderRadius: '8px', color: 'var(--text-primary)', transition: 'background 0.2s' }} className="hover-bg-light">
                <ion-icon name="image-outline" style={{ fontSize: '20px' }}></ion-icon>
                <span>Upload Image</span>
                <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', borderRadius: '8px', color: 'var(--text-primary)', transition: 'background 0.2s' }} className="hover-bg-light">
                <ion-icon name="document-text-outline" style={{ fontSize: '20px' }}></ion-icon>
                <span>Analyze Document</span>
              </div>
            </div>
          )}
        </form>

        <div className="g-suggestions" style={{ marginTop: '32px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {SUGGESTIONS.map(s => (
            <button 
              key={s} 
              onClick={() => {
                setQuery(s);
                navigate('/app', { state: { query: s } });
              }}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', padding: '10px 20px', borderRadius: '24px', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
              className="hover-bg-light"
            >
              {s}
            </button>
          ))}
        </div>
      </main>

      <footer className="g-footer" style={{ zIndex: 1, position: 'relative' }}>
        <div>© 2026 Graham AI. All rights reserved.</div>
        <div className="g-footer-links">
          {!Capacitor.isNativePlatform() && <Link to="/about" style={{ color: 'inherit', textDecoration: 'none' }}>Our Story</Link>}
          <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</Link>
          <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</Link>
        </div>
      </footer>
    </div>
  );
}
