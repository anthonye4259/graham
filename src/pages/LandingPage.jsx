import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import Navbar from '../components/ui/Navbar';
import TutorialModal from '../components/ui/TutorialModal';
import PaywallModal from '../components/ui/PaywallModal';

const SUGGESTIONS = [
  'Explain NVDA earnings',
  'Compare two stocks',
  'Review my portfolio',
  'Teach me options basics',
];

const CAPABILITIES = [
  {
    icon: 'bulb-outline',
    title: 'Plain-English research',
    copy: 'Turn earnings, headlines, and market signals into explanations you can actually use.',
  },
  {
    icon: 'image-outline',
    title: 'Analyze what you see',
    copy: 'Upload a chart or portfolio screenshot and get a structured walkthrough in seconds.',
  },
  {
    icon: 'school-outline',
    title: 'Learn as you invest',
    copy: 'Build market fluency with personalized lessons, definitions, and practical examples.',
  },
];

const TYPING_PHRASES = [
  "Analyze TSLA earnings...",
  "Is BTC breaking out?",
  "What is the Fed doing?",
  "Scan AAPL for the long term...",
  "Should I buy NVDA today?"
];

export default function LandingPage() {
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
      <Navbar onOpenPricing={() => setShowPricing(true)} />

      <main className="g-hero">
        <div className="g-announce">
          <span className="g-announce-dot" aria-hidden="true"></span>
          <span>AI market research, made understandable</span>
        </div>

        <h1 className="g-hero-title">
          Understand the market<br />before you act.
        </h1>
        <p className="g-hero-sub">
          Ask a question, upload a chart, or explore a company. Graham turns complex market information into a clear next step for your research.
        </p>

        <form onSubmit={handleSubmit} className="g-search-container">
          {imagePreview && (
            <div className="g-image-preview" style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '8px', display: 'inline-block', position: 'relative' }}>
              <img src={imagePreview} alt="Upload preview" style={{ maxWidth: '100px', borderRadius: '8px' }} />
              <button type="button" onClick={() => setImagePreview(null)} style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--accent-rose)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <ion-icon name="close-outline"></ion-icon>
              </button>
            </div>
          )}
          
          <div className="g-search-panel">
            <button 
              type="button" 
              onClick={() => setShowActionMenu(!showActionMenu)}
              className="g-search-action"
              aria-label="Add an image or document"
            >
              <ion-icon name="add-circle-outline"></ion-icon>
            </button>
            
            <input 
              type="text" 
              className="g-search-input"
              placeholder={placeholderText}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Ask Graham an investing question"
            />
            
            <button type="submit" className="g-search-submit" disabled={!query.trim()} aria-label="Ask Graham">
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

        <div className="g-suggestions" aria-label="Example questions">
          {SUGGESTIONS.map(s => (
            <button 
              key={s} 
              onClick={() => setQuery(s)}
              className="g-suggestion-pill"
            >
              {s}
            </button>
          ))}
        </div>
      </main>

      <section id="capabilities" className="g-capabilities" aria-label="What Graham helps with">
        {CAPABILITIES.map((capability) => (
          <article className="g-capability" key={capability.title}>
            <div className="g-capability-icon" aria-hidden="true">
              <ion-icon name={capability.icon}></ion-icon>
            </div>
            <h2>{capability.title}</h2>
            <p>{capability.copy}</p>
          </article>
        ))}
      </section>

      <footer className="g-footer">
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
