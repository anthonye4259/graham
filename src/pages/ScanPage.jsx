import { useState } from 'react';
import { useUser } from '../context/UserContext';
import PaywallModal from '../components/ui/PaywallModal';

import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export default function ScanPage() {
  const { getScansRemaining, incrementScan } = useUser();
  const [ticker, setTicker] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showPaywall, setShowPaywall] = useState(false);

  const scansLeft = getScansRemaining();

  const handleScan = async () => {
    const t = ticker.toUpperCase().trim();
    if (!t) return;
    if (scansLeft <= 0) {
      setShowPaywall(true);
      return;
    }

    setLoading(true);
    setResult(null);
    incrementScan();

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the stock ${t}. Provide a short "what happened recently", "why it matters", and "actionable advice".`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Full company name" },
              ticker: { type: Type.STRING, description: "Stock ticker symbol" },
              price: { type: Type.STRING, description: "Current approximate price (e.g. '$150.20')" },
              change: { type: Type.STRING, description: "Recent percentage change (e.g. '+1.5%')" },
              direction: { type: Type.STRING, description: "'up' or 'down'" },
              what: { type: Type.STRING, description: "1-2 sentences on what actually happened recently" },
              why: { type: Type.STRING, description: "1-2 sentences on why it matters to investors" },
              action: { type: Type.STRING, description: "1-2 sentences of actionable advice (e.g. buy, hold, watch)" },
            },
            required: ["name", "ticker", "price", "change", "direction", "what", "why", "action"],
          },
        }
      });
      
      const data = JSON.parse(response.text());
      setResult(data);
    } catch (error) {
      console.error("Gemini Scan Error:", error);
      setResult({
        name: t, ticker: t, price: '—', change: '0.0%', direction: 'up',
        what: 'Unable to fetch recent data for this ticker right now.',
        why: 'The AI service might be temporarily unavailable or the ticker is invalid.',
        action: 'Please try again later or check your API key configuration.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen active" id="scan-tab">
      <div className="section-heading">Stock Scanner</div>
      <p className="scan-intro">Enter a ticker symbol to get an instant, plain-English analysis.</p>

      <div className="scan-input-row">
        <input
          className="scan-input"
          placeholder="e.g. AAPL, TSLA, NVDA"
          value={ticker}
          onChange={e => setTicker(e.target.value.toUpperCase())}
          onKeyDown={e => { if (e.key === 'Enter') handleScan(); }}
        />
        <button 
          className="scan-btn" 
          onClick={handleScan} 
          disabled={!ticker.trim()}
        >
          <ion-icon name={scansLeft <= 0 ? 'lock-closed-outline' : 'scan-outline'}></ion-icon> 
          {scansLeft <= 0 ? 'Upgrade' : 'Scan'}
        </button>
      </div>

      {scansLeft !== Infinity && (
        <div className="scan-limit">{scansLeft} free scan{scansLeft !== 1 ? 's' : ''} remaining</div>
      )}

      {loading && (
        <div className="scan-loading">
          <div className="scan-shimmer" />
          <div className="scan-shimmer short" />
          <div className="scan-shimmer" />
        </div>
      )}

      {result && !loading && (
        <div className="context-card">
          <div className="card-header">
            <div className="card-ticker-row">
              <span className="card-ticker">{result.ticker}</span>
              <span className={`card-change ${result.direction}`}>{result.change}</span>
            </div>
            <div className="card-company">{result.name}</div>
            <div className="card-price">{result.price}</div>
          </div>
          <div className="card-section" style={{ opacity: 1, transform: 'none' }}>
            <div className="card-section-inner">
              <div className="section-label"><ion-icon name="bulb-outline" class="sl-icon teal"></ion-icon> What Actually Happened</div>
              <div className="section-text">{result.what}</div>
            </div>
          </div>
          <div className="card-section" style={{ opacity: 1, transform: 'none' }}>
            <div className="card-section-inner bears">
              <div className="section-label"><ion-icon name="help-circle-outline" class="sl-icon rose"></ion-icon> Why It Matters</div>
              <div className="section-text">{result.why}</div>
            </div>
          </div>
          <div className="card-section" style={{ opacity: 1, transform: 'none' }}>
            <div className="card-section-inner action">
              <div className="section-label"><ion-icon name="compass-outline" class="sl-icon amber"></ion-icon> What You Should Do</div>
              <div className="section-text">{result.action}</div>
            </div>
          </div>
          
          <button className="share-insight-btn" onClick={() => alert('Insight shared!')}>
            <ion-icon name="share-outline"></ion-icon>
            Share Insight
          </button>
          <div className="viral-watermark">Analyzed by Graham — Personal Investing AI</div>
        </div>
      )}

      <div className="scan-quick-picks">
        <div className="section-heading">Quick Picks</div>
        {['AAPL', 'TSLA', 'NVDA'].map(t => (
          <button key={t} className="scan-option" onClick={() => setTicker(t)}>
            <div className="scan-opt-ticker">{t}</div>
            <div className="scan-opt-name">{STOCK_CONTEXTS[t].name}</div>
          </button>
        ))}
      </div>

      <PaywallModal 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)} 
        source="scan" 
      />
    </div>
  );
}
