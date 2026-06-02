import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { PERSONAS } from '../lib/personas';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { hapticSuccess, hapticError, hapticSelection } from '../lib/haptics';
import FundModal from '../components/ui/FundModal';
import MacroTerminalCard from '../components/Feed/MacroTerminalCard';

export default function FeedPage() {
  const { state, setState } = useUser();
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [grahamFund, setGrahamFund] = useState(null);
  const [showFundModal, setShowFundModal] = useState(false);
  const [macroData, setMacroData] = useState(null);

  useEffect(() => {
    const unsubFund = onSnapshot(doc(db, 'global', 'graham_fund'), (docSnap) => {
      if (docSnap.exists()) {
        setGrahamFund(docSnap.data());
      }
    });
    const unsubMacro = onSnapshot(doc(db, 'global', 'macro_daily'), (docSnap) => {
      if (docSnap.exists()) {
        setMacroData(docSnap.data());
      }
    });
    return () => {
      unsubFund();
      unsubMacro();
    };
  }, []);

  const handleAnswer = (itemId, index, isCorrect) => {
    setSelectedAnswers(prev => ({ ...prev, [itemId]: index }));
    if (isCorrect) {
      hapticSuccess();
    } else {
      hapticError();
    }
  };

  // Generate dynamic content based on Persona and Risk/Goal
  const generateFeedContent = () => {
    const items = [];
    const p = state.persona;
    const r = state.riskTolerance; // Safe, Moderate, Aggressive
    const g = state.investingGoal; // Basics, Grow Wealth, Trade Options

    // 0. Macro Terminal
    const terminalData = macroData || {
      quotes: [
        { id: "SPX", price: "4,100.50", change: "+12.4", changePercent: "+0.3%", status: "up" },
        { id: "VIX", price: "14.20", change: "-0.5", changePercent: "-3.4%", status: "down" },
        { id: "10Y", price: "4.25%", change: "+0.02", changePercent: "+0.5%", status: "up" },
        { id: "EUR/USD", price: "1.0850", change: "-0.002", changePercent: "-0.2%", status: "down" },
        { id: "GOLD", price: "2,050.00", change: "+5.0", changePercent: "+0.2%", status: "up" },
        { id: "BTC", price: "64,200", change: "+1200", changePercent: "+1.9%", status: "up" }
      ],
      newsSummary: {
        headline: "Hotter-than-expected CPI print fuels rate concerns",
        body: "Print confirms inflation stickiness in services. Front-end repricing already under way. Curve flattening implies recession optionality fading."
      },
      tradeIdeas: [
        { type: "LONG BUY", target: "USD", rationale: "Data still strong - ECB multi-month pause", conviction: "High" },
        { type: "SHORT SELL", target: "2Y UST", rationale: "Front-end repricing not complete", conviction: "High" }
      ]
    };

    items.push({
      id: 'macro-terminal',
      type: 'macro-terminal',
      topic: 'Live Markets',
      title: '',
      color: '#0d1117',
      data: terminalData
    });

    // 1. Fact of the Day
    items.push({
      id: 'daily-fact',
      type: 'flashcard',
      topic: 'Fact of the Day',
      title: 'Did you know?',
      content: state.dailyFact || "If you invested $1,000 in Amazon at IPO, it would be worth over $1.5 million today.",
      color: 'var(--accent-blue)'
    });

    // 1.5 Graham Fund Status
    if (grahamFund) {
      const totalValue = grahamFund.currentCash + (grahamFund.holdings || []).reduce((acc, h) => acc + (h.shares * h.avgPrice), 0);
      const returnPct = ((totalValue - 100000) / 100000) * 100;
      const lastTrade = grahamFund.tradeHistory && grahamFund.tradeHistory.length > 0 
        ? grahamFund.tradeHistory[grahamFund.tradeHistory.length - 1] 
        : null;

      let contentStr = `Current Value: $${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} (${returnPct > 0 ? '+' : ''}${returnPct.toFixed(2)}%)\n\n`;
      if (lastTrade) {
        contentStr += `Latest Move:\nGraham ${lastTrade.type === 'BUY' ? 'bought' : 'sold'} ${lastTrade.shares} shares of ${lastTrade.ticker} at $${lastTrade.price.toFixed(2)}.\n\nRationale:\n"${lastTrade.rationale}"`;
      } else {
        contentStr += `Holding $100k cash. Waiting for market conditions to shift.`;
      }

      items.push({
        id: 'graham-fund',
        type: 'flashcard',
        topic: 'The Graham Fund',
        title: 'AI Portfolio',
        content: contentStr,
        color: 'var(--accent-purple)'
      });
    }

    // 2. Persona Specific Content
    if (p === 'Homelander') {
      items.push({
        id: 'homelander-1',
        type: 'flashcard',
        topic: 'Portfolio Advice',
        title: 'Perfection.',
        content: "I don't make mistakes. And neither should your portfolio. Stop buying garbage penny stocks.",
        color: '#dc2626' // red
      });
    } else if (p === 'Tywin Lannister') {
      items.push({
        id: 'tywin-1',
        type: 'flashcard',
        topic: 'Legacy Building',
        title: 'Generational Wealth',
        content: "A lion does not concern himself with the opinions of retail investors. Focus on dividends and compound interest.",
        color: 'var(--accent-gold)'
      });
    } else if (p === 'Michael Scott') {
      items.push({
        id: 'michael-1',
        type: 'flashcard',
        topic: 'Finance 101',
        title: 'Bankruptcy',
        content: "Just remember, if your portfolio goes to zero, you can just yell 'I DECLARE BANKRUPTCY' and start over.",
        color: 'var(--accent-warm)'
      });
    } else if (p === 'Ron Swanson') {
      items.push({
        id: 'ron-1',
        type: 'flashcard',
        topic: 'Real Assets',
        title: 'The Gold Standard',
        content: "The stock market is a computer simulation. Buy physical gold and bury it beneath a tree.",
        color: '#78350f' // brown
      });
    }

    // 3. Goal/Risk Specific Content
    if (g === 'Learn Basics' || r === 'Safe') {
      items.push({
        id: 'basic-quiz',
        type: 'quiz',
        topic: 'Pop Quiz',
        title: 'Which is generally safer?',
        options: ['An S&P 500 Index Fund', 'Buying 1 share of Tesla', 'Crypto'],
        correct: 0,
        color: 'var(--accent-teal)'
      });
    } else {
      items.push({
        id: 'adv-quiz',
        type: 'quiz',
        topic: 'Pop Quiz',
        title: 'What does a Call Option give you?',
        options: ['The obligation to buy', 'The right to buy', 'The right to sell'],
        correct: 1,
        color: 'var(--accent-purple)'
      });
    }

    // 4. General Educational Visual
    items.push({
      id: 'visual-1',
      type: 'visual',
      topic: 'Compound Interest',
      title: 'The 8th Wonder',
      content: "If you invest $100/mo at 8% return starting at age 20, you'll have $525,000 by age 65. Start early.",
      color: 'var(--accent-orange)'
    });

    return items;
  };

  const feedItems = generateFeedContent();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  const greeting = `${getGreeting()}, ${state.name?.split(' ')[0] || 'Investor'}`;

  return (
    <div style={{ position: 'relative', height: 'calc(100dvh - 80px - env(safe-area-inset-bottom))', width: '100vw', overflow: 'hidden' }}>
      
      {/* Top Header with Greeting & Persona Switcher */}
      <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 16px)', left: 0, right: 0, zIndex: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
        <div style={{ color: '#FFF', fontSize: '18px', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          {greeting}
        </div>
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', border: '0.5px solid rgba(255,255,255,0.5)', padding: '8px 16px', borderRadius: '24px', color: '#1A1815', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1)', transition: 'var(--transition-spring)' }}
          >
            <ion-icon name="color-wand" style={{ color: 'var(--accent-gold)' }}></ion-icon>
            {PERSONAS.find(p => p.id === state.persona)?.name.split(' ')[0] || 'Graham'}
            <ion-icon name="chevron-down"></ion-icon>
          </button>
          
          {showPersonaMenu && (
            <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px', width: '220px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
              {PERSONAS.map(p => (
                <button 
                  key={p.id}
                  onClick={() => { setState({ persona: p.id }); setShowPersonaMenu(false); }}
                  style={{ width: '100%', padding: '12px', textAlign: 'left', background: state.persona === p.id ? 'var(--accent-gold-glow)' : 'transparent', border: 'none', color: state.persona === p.id ? 'var(--accent-gold)' : 'var(--text-primary)', cursor: 'pointer', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '2px', transition: 'var(--transition-base)' }}
                >
                  <span style={{ fontSize: '14px', fontWeight: state.persona === p.id ? '600' : '500' }}>{p.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{
        height: '100%',
        width: '100vw',
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        scrollBehavior: 'smooth',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }} className="hide-scrollbar">
        {feedItems.map((item) => (
          <div key={item.id} style={{
            height: 'calc(100dvh - 80px - env(safe-area-inset-bottom))',
            width: '100vw',
            scrollSnapAlign: 'start',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px',
            background: item.color,
            color: '#FFF',
            position: 'relative'
          }}>
            
            <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 80px)', left: '24px', opacity: 0.8, fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>
              {item.topic}
            </div>

            <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
              <h2 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '24px', lineHeight: 1.1, letterSpacing: '-1px' }}>
                {item.title}
              </h2>

              {item.type === 'macro-terminal' && (
                <MacroTerminalCard data={item.data} />
              )}

              {item.type === 'flashcard' || item.type === 'visual' ? (
                <div 
                  onClick={() => item.id === 'graham-fund' && setShowFundModal(true)}
                  style={{ cursor: item.id === 'graham-fund' ? 'pointer' : 'default' }}
                >
                  <p style={{ fontSize: '20px', lineHeight: 1.5, opacity: 0.9, whiteSpace: 'pre-wrap' }}>
                    {item.content}
                  </p>
                  {item.id === 'graham-fund' && (
                    <div style={{ marginTop: '24px', padding: '12px 24px', background: 'rgba(255,255,255,0.2)', borderRadius: '24px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                      Tap to view holdings <ion-icon name="arrow-forward-outline"></ion-icon>
                    </div>
                  )}
                </div>
              ) : null}

              {item.type === 'quiz' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '32px' }}>
                  {item.options.map((opt, i) => {
                    const isSelected = selectedAnswers[item.id] === i;
                    const hasAnswered = selectedAnswers[item.id] !== undefined;
                    const isCorrect = i === item.correct;
                    
                    let bg = 'rgba(255,255,255,0.15)';
                    let border = '1px solid rgba(255,255,255,0.3)';
                    if (hasAnswered) {
                      if (isCorrect) {
                        bg = 'rgba(34, 197, 94, 0.8)';
                        border = '1px solid rgba(34, 197, 94, 1)';
                      } else if (isSelected && !isCorrect) {
                        bg = 'rgba(239, 68, 68, 0.8)';
                        border = '1px solid rgba(239, 68, 68, 1)';
                      }
                    }

                    return (
                      <button 
                        key={i} 
                        onClick={() => {
                          if (!hasAnswered) handleAnswer(item.id, i, isCorrect);
                        }}
                        style={{
                          padding: '20px',
                          borderRadius: '16px',
                          background: bg,
                          border: border,
                          color: '#FFF',
                          fontSize: '18px',
                          fontWeight: '600',
                          cursor: hasAnswered ? 'default' : 'pointer',
                          transition: 'all 0.2s',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        {opt}
                        {hasAnswered && isCorrect && <ion-icon name="checkmark-circle"></ion-icon>}
                        {hasAnswered && isSelected && !isCorrect && <ion-icon name="close-circle"></ion-icon>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ position: 'absolute', right: '16px', bottom: 'calc(env(safe-area-inset-bottom) + 100px)', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
              <button style={{ background: 'none', border: 'none', color: '#FFF', fontSize: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <ion-icon name="heart-outline"></ion-icon>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>12k</span>
              </button>
              <button style={{ background: 'none', border: 'none', color: '#FFF', fontSize: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <ion-icon name="chatbubble-outline"></ion-icon>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>402</span>
              </button>
              <button style={{ background: 'none', border: 'none', color: '#FFF', fontSize: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <ion-icon name="bookmark-outline"></ion-icon>
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Sticky Chat Input */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        right: '20px',
        zIndex: 50,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '0.5px solid rgba(0,0,0,0.05)',
        borderRadius: '32px',
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,1)'
      }}>
        <ion-icon name="mic" style={{ color: 'var(--accent-gold)', fontSize: '24px', marginRight: '12px' }}></ion-icon>
        <input 
          type="text" 
          placeholder="Ask Graham anything..." 
          style={{ flex: 1, background: 'transparent', border: 'none', color: '#1A1815', fontSize: '16px', outline: 'none', fontWeight: '500' }}
          disabled
        />
        <ion-icon name="link-outline" style={{ color: '#A09890', fontSize: '20px', marginRight: '12px' }}></ion-icon>
        <button style={{ background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-warm))', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(166,124,82,0.3)' }}>
          <ion-icon name="send" style={{ color: '#FFF', fontSize: '14px', marginLeft: '2px' }}></ion-icon>
        </button>
      </div>

      <FundModal 
        isOpen={showFundModal} 
        onClose={() => setShowFundModal(false)} 
        fundData={grahamFund} 
      />
    </div>
  );
}
