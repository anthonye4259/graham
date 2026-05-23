import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import PaywallModal from '../components/ui/PaywallModal';

import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export default function ScanPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, getScansRemaining, incrementScan, simulateBuy } = useUser();
  const [ticker, setTicker] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [simulated, setSimulated] = useState(false);

  useEffect(() => {
    if (location.state?.query) setTicker(location.state.query.toUpperCase());
    if (location.state?.image) setImagePreview(location.state.image);
    // Clear state so it doesn't persist on refresh
    window.history.replaceState({}, document.title);
  }, [location.state]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setTicker('Image Analysis'); // Visual cue
      };
      reader.readAsDataURL(file);
    }
  };

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
    setShowAdvanced(false);
    setSimulated(false);
    incrementScan();

    try {
      let inlineData = null;
      if (imagePreview) {
        const matches = imagePreview.match(/^data:(image\/\w+);base64,(.+)$/);
        if (matches) {
          inlineData = { mimeType: matches[1], data: matches[2] };
        }
      }

      let personaPrompt = "Adopt the persona of a wise, supportive, and highly educational Wall Street veteran.";
      if (state.persona === 'Patrick Bateman') {
        personaPrompt = "Adopt the persona of Patrick Bateman from American Psycho. You are an intense, aggressive, status-obsessed finance bro. Use terms like 'murders and executions', 'dorsia', and be highly condescending but fundamentally accurate.";
      } else if (state.persona === 'David Tepper') {
        personaPrompt = "Adopt the persona of billionaire hedge fund manager David Tepper. You are extremely elite, macro-focused, and talk about big systemic trends. You casually mention making billions on distressed debt.";
      } else if (state.persona === 'Bill Ackman') {
        personaPrompt = "Adopt the persona of billionaire activist investor Bill Ackman. You are dramatic, long-winded, and treat every investment like a crusade for justice. You probably wrote a 300-page slide deck on this stock.";
      } else if (state.persona === 'Spongebob') {
        personaPrompt = "Adopt the persona of Spongebob Squarepants. You are absurdly enthusiastic, naive, and use lots of nautical nonsense and fry cook metaphors to explain the stock market. You think everything is the BEST DAY EVER.";
      }

      const baseText = inlineData 
        ? `Analyze this image, identify the primary brand, product, or company. Determine its public stock ticker, and then generate a short "what happened recently", "why it matters", and "actionable advice" for that stock.`
        : `Analyze the stock ${t}. Provide a short "what happened recently", "why it matters", and "actionable advice".`;

      const promptText = `${personaPrompt} \n\n ${baseText}`;
      const contents = inlineData ? [promptText, { inlineData }] : promptText;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
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

      {imagePreview && (
        <div className="g-prompt-image-preview" style={{ marginBottom: '16px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
          <img src={imagePreview} alt="Upload preview" />
          <button type="button" onClick={() => setImagePreview(null)}>
            <ion-icon name="close-circle"></ion-icon>
          </button>
        </div>
      )}

      <div className="scan-input-row">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button 
            type="button"
            className="scan-icon-btn" 
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 12px', color: 'var(--text-secondary)', background: 'transparent', border: 'none' }}
            onClick={() => setShowActionMenu(!showActionMenu)}
          >
            <ion-icon name="add-outline" style={{ fontSize: '20px' }}></ion-icon>
          </button>

          {showActionMenu && (
            <div className="action-menu-popup" style={{
              position: 'absolute', bottom: '100%', left: '0', marginBottom: '8px',
              background: 'var(--bg-secondary)', border: '1px solid var(--border-light)',
              borderRadius: '12px', padding: '8px', width: '200px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 10
            }}>
              <label className="action-menu-item" style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '8px',
                cursor: 'pointer', fontSize: '14px', color: 'var(--text-primary)'
              }}>
                <input type="file" accept="image/*" style={{display: 'none'}} onChange={(e) => { handleImageUpload(e); setShowActionMenu(false); }} />
                <ion-icon name="image-outline"></ion-icon> Upload Image
              </label>
              <button type="button" className="action-menu-item" style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '8px',
                cursor: 'pointer', fontSize: '14px', color: 'var(--text-primary)', border: 'none', background: 'transparent', textAlign: 'left'
              }} onClick={() => { navigate('/app/profile'); setShowActionMenu(false); }}>
                <ion-icon name="people-outline"></ion-icon> Change Persona
              </button>
            </div>
          )}
        </div>
        <input
          className="scan-input"
          style={{ borderLeft: '1px solid var(--border-light)', borderRadius: '0' }}
          placeholder="e.g. AAPL, TSLA, NVDA or upload image"
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <div className="card-price">{result.price}</div>
              <button 
                className="scan-btn" 
                style={{ width: 'auto', padding: '8px 16px', fontSize: '14px' }}
                disabled={simulated}
                onClick={() => {
                  simulateBuy(result.ticker, result.name, result.price);
                  setSimulated(true);
                }}
              >
                <ion-icon name="cash-outline"></ion-icon>
                {simulated ? 'Bought!' : 'Simulate Buy'}
              </button>
            </div>
          </div>
          <div className="card-section" style={{ opacity: 1, transform: 'none' }}>
            <div className="card-section-inner">
              <div className="section-label"><ion-icon name="bulb-outline" class="sl-icon teal"></ion-icon> What Actually Happened</div>
              <div className="section-text">{result.what}</div>
            </div>
          </div>
          
          <button 
            className="share-insight-btn" 
            style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px dashed var(--border-light)', marginTop: '8px', marginBottom: '8px' }}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <ion-icon name={showAdvanced ? "chevron-up-outline" : "chevron-down-outline"}></ion-icon>
            {showAdvanced ? 'Hide Advanced Insights' : 'Show Advanced Insights'}
          </button>

          {showAdvanced && (
            <>
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
            </>
          )}
          
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
            <div className="scan-opt-name">Tap to analyze</div>
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
