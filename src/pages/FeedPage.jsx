import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import FundModal from '../components/ui/FundModal';
import DailyBrieferCard from '../components/Feed/DailyBrieferCard';
import StockOfTheDayCard from '../components/Feed/StockOfTheDayCard';

export default function FeedPage() {
  const { state } = useUser();
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

  const generateFeedContent = () => {
    const items = [];

    // 0. Macro Terminal / Daily Briefer
    const terminalData = macroData || {
      title: "Markets Hold Steady Amid Earnings",
      date: new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }),
      sections: [
        {
          heading: "Big Tech Reports",
          content: "Several major tech companies released their earnings reports today. While revenues were generally strong, some investors were looking for more aggressive growth in the AI sector."
        },
        {
          heading: "What it Means for You",
          content: "If you own broad market index funds, you don't need to do much. The market is absorbing this new information, and long-term investors should stick to their plan."
        }
      ]
    };

    items.push({
      id: 'daily-briefer',
      type: 'daily-briefer',
      data: terminalData
    });

    // 1. Stock of the Day
    items.push({
      id: 'sotd',
      type: 'stock_of_day',
      stock: {
        ticker: 'PLTR',
        name: 'Palantir Technologies',
        price: 24.50,
        change: 1.20,
        history: [18, 19, 21, 20, 22, 24.50]
      },
      insight: "Palantir just secured a major Department of Defense contract for its AIP platform. Commercial revenue is accelerating faster than expected."
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
    <div style={{ position: 'relative', height: '100%', width: '100vw', backgroundColor: 'var(--bg-main)' }}>
      
      {/* Top Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top) + 24px) 24px 16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'var(--text-primary)', fontSize: '24px', fontWeight: '800', margin: 0 }}>
          {greeting}
        </h1>
      </div>

      <div style={{
        padding: '0 24px calc(120px + env(safe-area-inset-bottom)) 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        overflowY: 'auto'
      }}>
        {feedItems.map((item) => {
          if (item.type === 'stock_of_day') {
            return (
              <div key={item.id} style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
                <StockOfTheDayCard stock={item.stock} insight={item.insight} />
              </div>
            );
          }
          
          if (item.type === 'daily-briefer') {
            return (
              <div key={item.id} style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
                <DailyBrieferCard data={item.data} />
              </div>
            );
          }
          
          return null;
        })}
      </div>

      {/* Sticky Chat Input */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        right: '20px',
        zIndex: 50,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: '32px',
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
      }}>
        <ion-icon name="mic" style={{ color: 'var(--accent-gold)', fontSize: '24px', marginRight: '12px' }}></ion-icon>
        <input 
          type="text" 
          placeholder="Ask Graham anything..." 
          style={{ flex: 1, background: 'transparent', border: 'none', color: '#1A1815', fontSize: '16px', outline: 'none', fontWeight: '500' }}
          disabled
        />
        <ion-icon name="link-outline" style={{ color: '#A09890', fontSize: '20px', marginRight: '12px' }}></ion-icon>
        <button style={{ background: 'var(--accent-teal)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ion-icon name="send" style={{ color: '#000', fontSize: '14px', marginLeft: '2px' }}></ion-icon>
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
