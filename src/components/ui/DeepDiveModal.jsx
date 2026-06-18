import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from '@google/genai';
import { useUser } from '../../context/UserContext';
import AppleIntelligence from '../../plugins/AppleIntelligence';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export default function DeepDiveModal({ ticker, onClose }) {
  const { state } = useUser();
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function generateReport() {
      try {
        let personaPrompt = "Adopt the persona of an elite, extremely thorough Wall Street analyst.";
        if (state.persona === 'Patrick Bateman') {
          personaPrompt = "Adopt the persona of Patrick Bateman. You are intensely status-obsessed, highly aggressive, but fundamentally accurate in your deep dive.";
        } else if (state.persona === 'David Tepper') {
          personaPrompt = "Adopt the persona of billionaire hedge fund manager David Tepper. You are elite, macro-focused, and casual about billions of dollars.";
        } else if (state.persona === 'Bill Ackman') {
          personaPrompt = "Adopt the persona of billionaire activist investor Bill Ackman. Write this like a dramatic 300-page slide deck summary on a crusade for truth.";
        } else if (state.persona === 'Spongebob') {
          personaPrompt = "Adopt the persona of Spongebob Squarepants. Use lots of nautical nonsense to explain this deep dive.";
        }

        const promptText = `${personaPrompt}

Write a comprehensive "Institutional Grade" Deep Dive Research Report for the asset: "${ticker}".

Structure the report using markdown with the following exactly 4 headers:
## 1. Financial Health & Valuation
## 2. Competitive Moat & Industry Position
## 3. Key Risks & Bear Case
## 4. Five-Year Outlook

Write dense, highly informative paragraphs for each section. Format it beautifully with bullet points where necessary. Make it feel incredibly premium and insightful.`;

        let resultText = "";
        
        // Apple Intelligence first ($0), Gemini fallback
        try {
          const { available } = await AppleIntelligence.checkAvailability();
          if (!available) throw new Error("Apple Intelligence unavailable");
          const response = await AppleIntelligence.generateText({ prompt: promptText });
          resultText = response.text;
        } catch (appleErr) {
          console.log("Deep Dive using Gemini:", appleErr.message);
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: promptText,
          });
          resultText = response.text();
        }

        if (isMounted) {
          setReport(resultText);
          setLoading(false);
        }
      } catch (err) {
        console.error("Deep Dive Error:", err);
        if (isMounted) {
          setReport("## Error\n\nFailed to generate Deep Dive. Please try again later.");
          setLoading(false);
        }
      }
    }

    generateReport();

    return () => { isMounted = false; };
  }, [ticker, state.persona]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '16px', width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ion-icon name="document-text" style={{ color: 'var(--accent-teal)' }}></ion-icon>
              Deep Dive Report: {ticker}
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>AI Generated Research</div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '24px', cursor: 'pointer', padding: '4px' }}
            className="hover-bg-light"
          >
            <ion-icon name="close-circle-outline"></ion-icon>
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px', position: 'relative' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.7, padding: '40px 0' }}>
              <div className="scan-shimmer" style={{ width: '80%', height: '32px', marginBottom: '24px' }}></div>
              <div className="scan-shimmer" style={{ width: '100%', height: '16px' }}></div>
              <div className="scan-shimmer" style={{ width: '100%', height: '16px' }}></div>
              <div className="scan-shimmer short" style={{ width: '90%', height: '16px', marginBottom: '32px' }}></div>
              
              <div className="scan-shimmer" style={{ width: '60%', height: '32px', marginBottom: '24px' }}></div>
              <div className="scan-shimmer" style={{ width: '100%', height: '16px' }}></div>
              <div className="scan-shimmer short" style={{ width: '85%', height: '16px' }}></div>
              <div style={{ marginTop: '24px', color: 'var(--accent-teal)', fontWeight: 'bold', fontSize: '14px', animation: 'pulse 1.5s infinite' }}>
                Synthesizing thousands of data points...
              </div>
            </div>
          ) : (
            <div className="markdown-body" style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '15px' }}>
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .markdown-body h2 { color: var(--text-primary); font-size: 20px; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid var(--border-light); padding-bottom: 8px; }
        .markdown-body h2:first-child { margin-top: 0; }
        .markdown-body p { margin-bottom: 16px; }
        .markdown-body ul { padding-left: 20px; margin-bottom: 16px; }
        .markdown-body li { margin-bottom: 8px; }
        .markdown-body strong { color: var(--text-primary); }
      `}</style>
    </div>
  );
}
