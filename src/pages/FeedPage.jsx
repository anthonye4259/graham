import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { PERSONAS } from '../lib/personas';

export default function FeedPage() {
  const { state, setState } = useUser();
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  const handleAnswer = (itemId, index) => {
    setSelectedAnswers(prev => ({ ...prev, [itemId]: index }));
  };

  // Generate dynamic content based on Persona and Risk/Goal
  const generateFeedContent = () => {
    const items = [];
    const p = state.persona;
    const r = state.riskTolerance; // Safe, Moderate, Aggressive
    const g = state.investingGoal; // Basics, Grow Wealth, Trade Options

    // 1. Fact of the Day
    items.push({
      id: 'daily-fact',
      type: 'flashcard',
      topic: 'Fact of the Day',
      title: 'Did you know?',
      content: state.dailyFact || "If you invested $1,000 in Amazon at IPO, it would be worth over $1.5 million today.",
      color: 'var(--accent-blue)'
    });

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

  return (
    <div style={{ position: 'relative', height: 'calc(100dvh - 80px - env(safe-area-inset-bottom))', width: '100vw', overflow: 'hidden' }}>
      
      {/* Top Header with Persona Switcher */}
      <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 16px)', left: 0, right: 0, zIndex: 50, display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '20px', color: '#FFF', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            <ion-icon name="color-wand" style={{ color: 'var(--accent-blue)' }}></ion-icon>
            {PERSONAS.find(p => p.id === state.persona)?.name.split(' ')[0] || 'Graham'}
            <ion-icon name="chevron-down"></ion-icon>
          </button>
          
          {showPersonaMenu && (
            <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px', width: '220px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
              {PERSONAS.map(p => (
                <button 
                  key={p.id}
                  onClick={() => { setState({ persona: p.id }); setShowPersonaMenu(false); }}
                  style={{ width: '100%', padding: '12px', textAlign: 'left', background: state.persona === p.id ? 'var(--bg-main)' : 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}
                >
                  <span style={{ fontSize: '14px', fontWeight: state.persona === p.id ? 'bold' : 'normal' }}>{p.name}</span>
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

              {item.type === 'flashcard' || item.type === 'visual' ? (
                <p style={{ fontSize: '20px', lineHeight: 1.5, opacity: 0.9, whiteSpace: 'pre-wrap' }}>
                  {item.content}
                </p>
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
                        onClick={() => !hasAnswered && handleAnswer(item.id, i)}
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
    </div>
  );
}
