import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import PaywallModal from '../components/ui/PaywallModal';
import PriceChart from '../components/ui/PriceChart';
import MarketPulse from '../components/ui/MarketPulse';
import DeepDiveModal from '../components/ui/DeepDiveModal';
import ReactMarkdown from 'react-markdown';
import { analytics, trackEvent } from '../lib/firebase';

import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

import { getPersonaPrompt } from '../lib/personas';

export default function ScanPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, setState, getScansRemaining, incrementScan, simulateBuy, isPremium } = useUser();
  const [ticker, setTicker] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const messages = state.chatHistory || [];
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState({}); // track by message index
  const [simulated, setSimulated] = useState({}); // track by message index
  
  const [showPaywall, setShowPaywall] = useState(false);
  const [showDeepDiveModal, setShowDeepDiveModal] = useState(false);
  const [deepDiveTicker, setDeepDiveTicker] = useState('');
  const chatContainerRef = useRef(null);
  const chatEndRef = useRef(null);

  const scansLeft = getScansRemaining();

  // Initial load from Landing Page
  useEffect(() => {
    if (location.state?.query && messages.length === 0) {
      handleScan(location.state.query, location.state.image);
      navigate(location.pathname, { replace: true, state: {} }); // Clear state so refresh doesn't trigger again
    }
  }, [location.state, messages.length]);

  // Auto-scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

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

  const handleScan = async (queryOverride, imageOverride) => {
    const queryToUse = queryOverride || ticker;
    const imageToUse = imageOverride || imagePreview;

    if (!queryToUse.trim() && !imageToUse) return;
    
    trackEvent('scan_asset');

    if (scansLeft <= 0) {
      setShowPaywall(true);
      return;
    }
    
    if (state.subscribed || isPremium()) {
      if (state.premiumScansToday >= 50 && state.lastPremiumScanDate === new Date().toDateString()) {
        alert("You've reached the fair-use limit for today (50 scans). Please try again tomorrow.");
        return;
      }
    }

    const newUserMsg = { role: 'user', content: queryToUse, image: imagePreview };
    const newMessages = [...messages, newUserMsg];
    setState({ chatHistory: newMessages });
    setTicker('');
    setImagePreview(null);
    setLoading(true);
    incrementScan();

    try {
      let inlineData = null;
      if (newUserMsg.image) {
        const matches = newUserMsg.image.match(/^data:(image\/\w+);base64,(.+)$/);
        if (matches) {
          inlineData = { mimeType: matches[1], data: matches[2] };
        }
      }

      const personaPrompt = getPersonaPrompt(state.persona);

      // If it's the first message, do a rich scan.
      if (newMessages.length === 1) {
        const baseText = inlineData 
          ? `Analyze this image. Identify the primary brand, product, company, or financial chart. Determine the relevant public asset (Stock Ticker or Crypto Symbol). Generate a short "what happened recently", "why it matters", and "actionable advice".`
          : `Analyze the user's input: "${queryToUse}". The input might be a Stock Ticker, a Crypto Asset, or a general news query/URL.
             Determine what it is. Provide the primary asset symbol (or a short topic name if it's general news), the current approximate price (if applicable, else "N/A"), and a short "what happened recently", "why it matters", and "actionable advice".`;

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
                name: { type: Type.STRING },
                ticker: { type: Type.STRING },
                price: { type: Type.STRING },
                change: { type: Type.STRING },
                direction: { type: Type.STRING },
                what: { type: Type.STRING },
                why: { type: Type.STRING },
                action: { type: Type.STRING },
              },
              required: ["name", "ticker", "price", "change", "direction", "what", "why", "action"],
            },
          }
        });
        
        const data = JSON.parse(response.text());
        setState({ chatHistory: [...newMessages, { role: 'model', type: 'rich', data }] });
      } else {
        // Follow up chat
        const history = newMessages.map(m => {
          if (m.role === 'user') return `User: ${m.content}`;
          if (m.type === 'rich') return `Graham: Analyzed ${m.data.ticker} - ${m.data.what}`;
          return `Graham: ${m.content}`;
        }).join('\n\n');

        const followUpPrompt = `${personaPrompt}\n\nHere is the chat history:\n${history}\n\nProvide a conversational, helpful, and insightful response to the user's latest message. Keep it formatted nicely with markdown.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: followUpPrompt,
        });

        setState({ chatHistory: [...newMessages, { role: 'model', type: 'text', content: response.text() }] });
      }

    } catch (error) {
      console.error("Gemini Scan Error:", error);
      if (newMessages.length === 1) {
        setState({ chatHistory: [...newMessages, { 
          role: 'model', type: 'rich', 
          data: { name: queryToUse, ticker: queryToUse, price: '—', change: '0.0%', direction: 'neutral', what: 'Unable to fetch recent data right now.', why: 'The AI service might be temporarily unavailable.', action: 'Please try again later or verify your API key.' }
        }] });
      } else {
        setState({ chatHistory: [...newMessages, { role: 'model', type: 'text', content: "I'm having trouble connecting to my data sources right now. Please try again." }] });
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleAdvanced = (index) => {
    setShowAdvanced(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleBuy = (index, ticker, name, price) => {
    simulateBuy(ticker, name, price);
    setSimulated(prev => ({ ...prev, [index]: true }));
  };

  const triggerDeepDive = (ticker) => {
    setDeepDiveTicker(ticker);
    setShowDeepDiveModal(true);
  };

  return (
    <div className="screen active" id="scan-tab" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', backgroundColor: 'var(--bg-main)' }}>
      
      {showDeepDiveModal && (
        <DeepDiveModal ticker={deepDiveTicker} onClose={() => setShowDeepDiveModal(false)} />
      )}

      {/* Scrollable Chat Area */}
      <div ref={chatContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 24px calc(180px + env(safe-area-inset-bottom)) 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {messages.length === 0 && !loading && !imagePreview && (
          <MarketPulse onScanClick={(t) => {
            setTicker(t);
            handleScan(t);
          }} />
        )}

        {messages.map((msg, idx) => {
          if (msg.role === 'user') {
            return (
              <div key={idx} style={{ alignSelf: 'flex-end', background: 'var(--accent-teal)', color: '#000', padding: '12px 16px', borderRadius: '16px', borderBottomRightRadius: '4px', maxWidth: '80%', fontSize: '15px', fontWeight: '500' }}>
                {msg.image && <img src={msg.image} alt="Upload" style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '8px' }} />}
                {msg.content}
              </div>
            );
          }

          if (msg.type === 'rich') {
            const result = msg.data;
            return (
              <div key={idx} className="context-card" style={{ margin: 0, alignSelf: 'center', maxWidth: '800px', width: '100%' }}>
                <div className="card-header">
                  <div className="card-ticker-row">
                    <span className="card-ticker">{result.ticker}</span>
                    <span className={`card-change ${result.direction}`}>{result.change}</span>
                  </div>
                  <div className="card-company">{result.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', marginBottom: '16px' }}>
                    <div className="card-price">{result.price}</div>
                  </div>
                  <PriceChart direction={result.direction} symbol={result.ticker} />
                </div>
                <div className="card-section" style={{ opacity: 1, transform: 'none' }}>
                  <div className="card-section-inner">
                    <div className="section-label"><ion-icon name="bulb-outline" class="sl-icon teal"></ion-icon> What Actually Happened</div>
                    <div className="section-text">{result.what}</div>
                  </div>
                </div>
                
                <button 
                  className="share-insight-btn hover-bg" 
                  style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px dashed var(--border-light)', marginTop: '8px', marginBottom: '8px' }}
                  onClick={() => toggleAdvanced(idx)}
                >
                  <ion-icon name={showAdvanced[idx] ? "chevron-up-outline" : "chevron-down-outline"}></ion-icon>
                  {showAdvanced[idx] ? 'Hide Advanced Insights' : 'Show Advanced Insights'}
                </button>

                {showAdvanced[idx] && (
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
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <a 
                      href={`https://robinhood.com/stocks/${result.ticker}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="scan-btn" 
                      style={{ flex: 1, background: '#00c805', color: '#000', border: 'none', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <ion-icon name="trending-up-outline"></ion-icon>
                      Trade on Robinhood
                    </a>
                    <a 
                      href={`https://www.coinbase.com/price/${result.ticker}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="scan-btn" 
                      style={{ flex: 1, background: '#0052ff', color: '#fff', border: 'none', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <ion-icon name="logo-bitcoin"></ion-icon>
                      Trade on Coinbase
                    </a>
                  </div>
                  <button 
                    className="scan-btn" 
                    style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                    onClick={() => triggerDeepDive(result.ticker)}
                  >
                    <ion-icon name="document-text-outline"></ion-icon>
                    Generate Deep Dive
                  </button>
                </div>
                <div className="viral-watermark">Analyzed by Graham — Personal Investing AI</div>
              </div>
            );
          }

          if (msg.type === 'text') {
            return (
              <div key={idx} style={{ alignSelf: 'flex-start', background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', padding: '16px', borderRadius: '16px', borderBottomLeftRadius: '4px', maxWidth: '80%', fontSize: '15px', lineHeight: '1.6' }} className="markdown-body">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            );
          }
          return null;
        })}

        {loading && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '8px', padding: '16px', background: 'var(--bg-card)', borderRadius: '16px', borderBottomLeftRadius: '4px', border: '1px solid var(--border-light)' }}>
            <div className="scan-shimmer" style={{ width: '8px', height: '8px', borderRadius: '50%', margin: 0, animationDelay: '0s' }} />
            <div className="scan-shimmer" style={{ width: '8px', height: '8px', borderRadius: '50%', margin: 0, animationDelay: '0.2s' }} />
            <div className="scan-shimmer" style={{ width: '8px', height: '8px', borderRadius: '50%', margin: 0, animationDelay: '0.4s' }} />
          </div>
        )}

        {imagePreview && messages.length === 0 && (
          <div className="g-prompt-image-preview" style={{ marginBottom: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', alignSelf: 'flex-start' }}>
            <img src={imagePreview} alt="Upload preview" style={{ maxWidth: '200px' }} />
            <button type="button" onClick={() => setImagePreview(null)}>
              <ion-icon name="close-circle"></ion-icon>
            </button>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Fixed Input Area at Bottom */}
      <div style={{ position: 'absolute', bottom: 'calc(80px + env(safe-area-inset-bottom))', left: 0, right: 0, paddingBottom: '16px', paddingTop: '8px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-main)', zIndex: 10 }}>
        
        {messages.length === 0 && (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '0 24px 12px 24px', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }} className="hide-scrollbar">
            <button onClick={() => { setTicker("Analyze AAPL"); handleScan("Analyze AAPL"); }} style={{ whiteSpace: 'nowrap', padding: '6px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: '16px', color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer' }}>Analyze AAPL</button>
            <button onClick={() => { setTicker("Should I buy Bitcoin?"); handleScan("Should I buy Bitcoin?"); }} style={{ whiteSpace: 'nowrap', padding: '6px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: '16px', color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer' }}>Should I buy Bitcoin?</button>
            <button onClick={() => { setTicker("What are options?"); handleScan("What are options?"); }} style={{ whiteSpace: 'nowrap', padding: '6px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: '16px', color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer' }}>What are options?</button>
          </div>
        )}

        <div className="scan-input-row" style={{ maxWidth: '800px', margin: '0 auto', background: 'var(--bg-secondary)', borderRadius: '24px', padding: '4px', border: '1px solid var(--border-light)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button 
              type="button"
              className="scan-icon-btn" 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 12px', color: 'var(--text-secondary)', background: 'transparent', border: 'none' }}
              onClick={() => setShowActionMenu(!showActionMenu)}
            >
              <ion-icon name="add-circle-outline" style={{ fontSize: '24px' }}></ion-icon>
            </button>

            {showActionMenu && (
              <div className="action-menu-popup" style={{
                position: 'absolute', bottom: '100%', left: '0', marginBottom: '16px',
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
              </div>
            )}
          </div>
          <input
            type="text"
            className="scan-input"
            style={{ borderLeft: '1px solid var(--border-light)', borderRadius: '0', border: 'none', background: 'transparent', fontSize: '16px' }}
            placeholder={messages.length > 0 ? "Ask a follow-up question..." : "Ask about any stock, or upload a picture..."}
            value={ticker}
            onChange={e => setTicker(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleScan(); }}
          />
          <button 
            className="scan-btn" 
            style={{ borderRadius: '50%', padding: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px' }}
            onClick={() => handleScan()} 
            disabled={!ticker.trim()}
          >
            <ion-icon name={scansLeft <= 0 ? 'lock-closed-outline' : 'arrow-up-outline'} style={{ margin: 0, fontSize: '20px' }}></ion-icon> 
          </button>
        </div>
      </div>

      <PaywallModal 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)} 
        source="scan" 
      />
    </div>
  );
}
