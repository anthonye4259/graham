import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/ui/Navbar';

const SUGGESTIONS = [
  'Stock Analysis',
  'Options Trading',
  'Portfolio Strategy',
  'Market Basics',
  'Retirement Planning',
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e?.preventDefault();
    navigate('/app');
  };

  return (
    <div className="g-landing">
      <Navbar />

      <main className="g-hero">
        <div className="g-announce">
          <span className="g-announce-badge">NEW</span>
          <span>Your personal investing AI</span>
          <ion-icon name="arrow-forward-outline"></ion-icon>
        </div>

        <h1 className="g-hero-title">
          Turn your curiosity into<br />investing knowledge
        </h1>

        <p className="g-hero-sub">
          Graham teaches you to invest in minutes a day — personalized lessons,
          stock analysis, and options education. No jargon necessary.
        </p>

        <form className="g-prompt-card" onSubmit={handleSubmit}>
          <textarea
            className="g-prompt-input"
            placeholder="Ask about any stock or investing topic..."
            rows={1}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e); }}
          />
          <div className="g-prompt-bar">
            <div className="g-prompt-left">
              <button type="button" className="g-prompt-icon-btn"><ion-icon name="add-outline"></ion-icon></button>
              <div className="g-prompt-toggle">
                <span className="g-toggle-label">Plan</span>
                <ion-icon name="information-circle-outline" class="g-toggle-info"></ion-icon>
              </div>
            </div>
            <div className="g-prompt-right">
              <button type="button" className="g-prompt-icon-btn"><ion-icon name="mic-outline"></ion-icon></button>
              <button type="submit" className="g-prompt-submit"><ion-icon name="arrow-up-outline"></ion-icon></button>
            </div>
          </div>
        </form>

        <div className="g-suggestions">
          <p className="g-suggestions-label">NOT SURE WHERE TO START? TRY ONE OF THESE:</p>
          <div className="g-suggestion-pills">
            {SUGGESTIONS.map(s => (
              <button key={s} className="g-suggestion-pill" onClick={() => { setQuery(s); }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </main>

      <section id="features" className="g-section">
        <h2 className="g-section-title">Learn from the best</h2>
        <p className="g-section-desc">Graham uses AI to break down complex financial concepts into bite-sized, understandable lessons.</p>
      </section>

      <section id="how" className="g-section">
        <h2 className="g-section-title">How it Works</h2>
        <p className="g-section-desc">Search any ticker. Graham instantly fetches live data and explains exactly what's happening and why it matters.</p>
      </section>

      <section id="pricing" className="g-section">
        <h2 className="g-section-title">Pricing</h2>
        <p className="g-section-desc">Start for free. Upgrade to Graham Premium for $9.99/mo to unlock unlimited AI stock scans and options training.</p>
      </section>
    </div>
  );
}
