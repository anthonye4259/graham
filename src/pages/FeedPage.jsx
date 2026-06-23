import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { doc, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import FundModal from '../components/ui/FundModal';
import DailyBrieferCard from '../components/Feed/DailyBrieferCard';
import StockOfTheDayCard from '../components/Feed/StockOfTheDayCard';
import { freeAI } from '../lib/freeAI';

// ── Personalized tips based on onboarding data ──
const TIPS_BY_GOAL = {
  'Aggressive Growth': [
    "Growth stocks tend to outperform during bull markets but drop harder in corrections. Keep a 6-month cash reserve so you never have to sell at the bottom.",
    "Look for companies with revenue growing 20%+ year-over-year. Revenue growth is harder to fake than earnings growth.",
    "Consider dollar-cost averaging into volatile positions — buying weekly reduces your risk of buying at the top.",
    "The best growth companies reinvest profits instead of paying dividends. A high reinvestment rate signals management believes in future growth.",
    "Don't ignore valuation entirely. Even great companies can be bad investments at the wrong price.",
  ],
  'Passive Income': [
    "A dividend yield above 6% is often a warning sign — the company may be paying out more than it can sustain. Look for 2-4% yields with consistent growth.",
    "REITs are required by law to distribute 90% of taxable income as dividends. They're one of the most reliable income sources.",
    "Track the payout ratio — if a company pays out more than 75% of earnings as dividends, there's less room for growth or safety margin.",
    "Dividend aristocrats have increased their dividend for 25+ consecutive years. They've survived recessions, rate hikes, and market crashes.",
    "Consider the tax implications — qualified dividends are taxed at capital gains rates, while ordinary dividends are taxed as regular income.",
  ],
  'Active Trading': [
    "The best traders risk no more than 1-2% of their portfolio on any single trade. Position sizing matters more than your win rate.",
    "Volume confirms price moves. A breakout on low volume is suspicious. A breakout on 3x average volume is worth paying attention to.",
    "Set your stop-loss BEFORE entering a trade, not after. Emotional decision-making during a trade is your biggest enemy.",
    "Learn to read the order book — large bid walls can act as support, and large ask walls can act as resistance.",
    "Keep a trading journal. Review your wins AND losses weekly. Most traders improve 30%+ just by tracking their decisions.",
  ],
  'Wealth Preservation': [
    "Treasury bonds (T-bills) are backed by the full faith and credit of the U.S. government — they're the closest thing to a risk-free investment.",
    "Diversification across asset classes (stocks, bonds, real estate, commodities) reduces portfolio volatility more than diversifying within a single class.",
    "Consider inflation-protected securities (TIPS) — they adjust their principal based on CPI, protecting your purchasing power.",
    "Blue-chip stocks with moats (strong brand, patents, network effects) tend to recover from downturns faster than speculative names.",
    "Rebalance your portfolio quarterly. When stocks rally, sell some to buy bonds. When stocks drop, sell bonds to buy stocks. This forces 'buy low, sell high.'",
  ],
};

const TIPS_BY_RISK = {
  'Conservative': [
    "Warren Buffett's rule #1: Never lose money. Rule #2: Never forget rule #1. Capital preservation is the foundation.",
    "A 60/40 stock-to-bond portfolio has historically provided ~7% annual returns with significantly lower volatility than 100% stocks.",
  ],
  'Moderate': [
    "A balanced approach means you'll never have the best returns in a bull market, but you'll sleep well during bear markets.",
    "Consider target-date funds if you want automatic rebalancing. They shift from stocks to bonds as your target date approaches.",
  ],
  'Aggressive': [
    "High risk tolerance is an advantage IF you can actually stomach the drops. A 30% drawdown on paper hits differently than in your real portfolio.",
    "Leveraged ETFs reset daily — they're for day trading, not long-term holding. A 2x S&P 500 ETF can lose money even when the S&P goes up over a month.",
  ],
};

// ── Daily lessons library ──
const LESSONS = [
  { title: 'What is a P/E Ratio?', emoji: '📊', content: "Price-to-Earnings ratio = stock price ÷ earnings per share. A P/E of 20 means you're paying $20 for every $1 of earnings. Lower P/E can mean undervalued — or that growth is slowing.", category: 'Fundamentals' },
  { title: 'Dollar-Cost Averaging', emoji: '📅', content: "Investing a fixed amount on a regular schedule regardless of price. When prices drop, you buy more shares. When they rise, you buy fewer. Over time, this lowers your average cost.", category: 'Strategy' },
  { title: 'What is a Moat?', emoji: '🏰', content: "A competitive advantage that protects a company from rivals. Types: brand (Apple), network effects (Visa), switching costs (Microsoft), patents (Pfizer), cost advantage (Walmart).", category: 'Fundamentals' },
  { title: 'Reading a Balance Sheet', emoji: '📋', content: "Assets = Liabilities + Equity. A company with more assets than liabilities is financially healthy. Look for growing equity over time — it means the company is building real value.", category: 'Fundamentals' },
  { title: 'Index Fund Basics', emoji: '📈', content: "An index fund tracks a market index (like S&P 500) by holding all its stocks. 90% of actively managed funds underperform index funds over 15 years. Low fees, broad diversification, no stock picking.", category: 'Products' },
  { title: 'What Are Options?', emoji: '🎯', content: "Calls = right to BUY a stock at a set price. Puts = right to SELL. You pay a premium for this right. Options expire — unlike stocks, time works against you.", category: 'Advanced' },
  { title: 'The Power of Compounding', emoji: '🚀', content: "$10,000 invested at 10% annual return becomes $67,275 in 20 years. That's 6.7x your money without adding a dollar. Starting 10 years earlier? $174,494. Time is the most powerful force in investing.", category: 'Basics' },
  { title: 'What is Market Cap?', emoji: '⚖️', content: "Market cap = share price × total shares outstanding. It tells you a company's total value. Large-cap ($10B+) = stable. Mid-cap ($2-10B) = growth potential. Small-cap (<$2B) = higher risk/reward.", category: 'Basics' },
  { title: 'Understanding Dividends', emoji: '💰', content: "Companies share profits with shareholders through dividends. Yield = annual dividend ÷ stock price. A $100 stock paying $3/year = 3% yield. Reinvested dividends have generated 84% of the S&P 500's total return since 1960.", category: 'Income' },
  { title: 'What is RSI?', emoji: '📉', content: "Relative Strength Index measures momentum on a 0-100 scale. Above 70 = overbought (might drop). Below 30 = oversold (might bounce). Not a crystal ball, but a useful signal combined with other indicators.", category: 'Technical' },
  { title: 'Bear vs. Bull Markets', emoji: '🐻', content: "Bull market: prices rising 20%+ from recent low. Bear market: prices falling 20%+ from recent high. Since 1957, the average bull market lasts 5.9 years. Average bear market: 14.5 months. Bears are intense but short.", category: 'Basics' },
  { title: 'ETFs vs. Mutual Funds', emoji: '🔄', content: "ETFs trade like stocks throughout the day. Mutual funds price once at market close. ETFs typically have lower fees, better tax efficiency, and no minimums. Both provide diversification.", category: 'Products' },
  { title: 'What is Free Cash Flow?', emoji: '💵', content: "FCF = operating cash flow − capital expenditures. It's the cash a company actually generates after running the business. Warren Buffett calls it 'owner earnings.' Companies with strong FCF can pay dividends, buy back stock, or invest in growth.", category: 'Fundamentals' },
  { title: 'Risk vs. Volatility', emoji: '🎲', content: "Volatility is how much prices swing day-to-day. Risk is the chance of permanent capital loss. Amazon dropped 93% in the dot-com crash but came back 100x. Volatility isn't risk if you don't sell.", category: 'Psychology' },
];

// ── AI-generated Stock of the Day ──
const STOCK_PICKS = [
  { ticker: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
  { ticker: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer' },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', sector: 'Semiconductors' },
  { ticker: 'JPM', name: 'JPMorgan Chase', sector: 'Financials' },
  { ticker: 'V', name: 'Visa Inc.', sector: 'Fintech' },
  { ticker: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
  { ticker: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare' },
  { ticker: 'HD', name: 'Home Depot', sector: 'Retail' },
  { ticker: 'PG', name: 'Procter & Gamble', sector: 'Consumer Staples' },
  { ticker: 'MA', name: 'Mastercard', sector: 'Fintech' },
  { ticker: 'KO', name: 'Coca-Cola', sector: 'Consumer Staples' },
  { ticker: 'DIS', name: 'Walt Disney', sector: 'Entertainment' },
  { ticker: 'CRM', name: 'Salesforce', sector: 'Cloud Software' },
  { ticker: 'COST', name: 'Costco Wholesale', sector: 'Retail' },
  { ticker: 'AMD', name: 'Advanced Micro Devices', sector: 'Semiconductors' },
  { ticker: 'NFLX', name: 'Netflix', sector: 'Entertainment' },
  { ticker: 'LLY', name: 'Eli Lilly', sector: 'Pharma' },
  { ticker: 'TSLA', name: 'Tesla', sector: 'EV/Energy' },
];

function getDailyIndex(seed) {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  return (dayOfYear + seed) % STOCK_PICKS.length;
}

function getDailyLesson() {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  return LESSONS[dayOfYear % LESSONS.length];
}

function getDailyTip(goal, risk) {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  const goalTips = TIPS_BY_GOAL[goal] || TIPS_BY_GOAL['Aggressive Growth'];
  const riskTips = TIPS_BY_RISK[risk] || [];
  const allTips = [...goalTips, ...riskTips];
  return allTips[dayOfYear % allTips.length];
}

export default function FeedPage() {
  const { state, isPremium, getScansRemaining } = useUser();
  const navigate = useNavigate();
  const [grahamFund, setGrahamFund] = useState(null);
  const [showFundModal, setShowFundModal] = useState(false);
  const [macroData, setMacroData] = useState(null);
  const [stockInsight, setStockInsight] = useState(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [lessonExpanded, setLessonExpanded] = useState(false);

  const scansLeft = getScansRemaining();
  const dailyStock = STOCK_PICKS[getDailyIndex(7)];
  const dailyLesson = getDailyLesson();
  const dailyTip = getDailyTip(state.investingGoal, state.riskTolerance);

  // Firestore listeners
  useEffect(() => {
    const unsubFund = onSnapshot(doc(db, 'global', 'graham_fund'), (snap) => {
      if (snap.exists()) setGrahamFund(snap.data());
    }, (e) => console.warn('Fund error:', e.message));
    
    const unsubMacro = onSnapshot(doc(db, 'global', 'macro_daily'), (snap) => {
      if (snap.exists()) setMacroData(snap.data());
    }, (e) => console.warn('Macro error:', e.message));

    return () => { unsubFund(); unsubMacro(); };
  }, []);

  // Generate AI insight for stock of the day (cached per day)
  useEffect(() => {
    const cacheKey = `sotd_insight_${dailyStock.ticker}_${new Date().toDateString()}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try { setStockInsight(JSON.parse(cached)); return; } catch(e) {}
    }

    setLoadingInsight(true);
    freeAI(
      `You are a concise financial analyst. Give a 2-sentence investment thesis for ${dailyStock.name} (${dailyStock.ticker}) as of today. Include one bullish point and one risk. Keep it factual and educational. Do not give buy/sell advice. Return JSON: {"thesis": "...", "sentiment": "bullish|bearish|neutral", "priceEstimate": number}`,
      { json: true }
    ).then(result => {
      const data = typeof result === 'string' ? JSON.parse(result) : result;
      setStockInsight(data);
      localStorage.setItem(cacheKey, JSON.stringify(data));
    }).catch(e => {
      console.warn('AI insight failed:', e.message);
      setStockInsight({ 
        thesis: `${dailyStock.name} is a leading ${dailyStock.sector} company worth analyzing. Research the fundamentals, check recent earnings, and consider how it fits your investment strategy.`,
        sentiment: 'neutral' 
      });
    }).finally(() => setLoadingInsight(false));
  }, [dailyStock.ticker]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  const greeting = `${getGreeting()}, ${state.name?.split(' ')[0] || 'Investor'}`;

  // Macro data with smart fallback
  const terminalData = macroData || {
    title: "Markets Update",
    date: new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }),
    sections: [
      { heading: "Today's Overview", content: "Markets are in session. Open the Advisor tab to scan any stock, ETF, or crypto for an AI-powered analysis." },
      { heading: "Your Strategy", content: state.investingGoal ? `Based on your ${state.investingGoal.toLowerCase()} strategy, focus on fundamentals over headlines. Consistency beats timing.` : "Stick to your plan. Consistency beats market timing." }
    ]
  };

  return (
    <div style={{ position: 'relative', minHeight: '100dvh', width: '100%', backgroundColor: 'var(--bg-main)' }}>
      
      {/* Top Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top) + 24px) 24px 8px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '24px', fontWeight: '800', margin: 0 }}>
            {greeting}
          </h1>
          {!isPremium() && (
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-tertiary)' }}>
              {scansLeft > 0 ? `${scansLeft} free scan${scansLeft !== 1 ? 's' : ''} remaining today` : 'No scans left today'}
            </p>
          )}
        </div>
        {state.streak > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700, color: 'var(--accent-gold)' }}>
            🔥 {state.streak}
          </div>
        )}
      </div>

      <div style={{
        padding: '0 24px calc(120px + env(safe-area-inset-bottom)) 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        alignItems: 'center'
      }}>

        {/* ── Personalized Tip ── */}
        <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(166,124,82,0.08) 0%, rgba(166,124,82,0.03) 100%)',
            border: '1px solid rgba(166,124,82,0.15)',
            borderRadius: 16,
            padding: '16px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <ion-icon name="bulb" style={{ color: 'var(--accent-gold)', fontSize: 18 }}></ion-icon>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-gold)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Tip for {state.investingGoal || 'You'}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)', fontWeight: 500 }}>
              {dailyTip}
            </p>
          </div>
        </div>

        {/* ── Daily Lesson ── */}
        <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
          <div 
            onClick={() => setLessonExpanded(!lessonExpanded)}
            style={{
              background: 'var(--bg-card)',
              borderRadius: 16,
              border: '1px solid var(--border-light)',
              padding: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 28 }}>{dailyLesson.emoji}</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-teal)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>
                    Daily Lesson · {dailyLesson.category}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {dailyLesson.title}
                  </div>
                </div>
              </div>
              <ion-icon 
                name={lessonExpanded ? "chevron-up" : "chevron-down"} 
                style={{ color: 'var(--text-tertiary)', fontSize: 20 }}
              ></ion-icon>
            </div>
            {lessonExpanded && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: 'var(--text-primary)', fontWeight: 500 }}>
                  {dailyLesson.content}
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate('/app/scan', { state: { query: `Explain more about ${dailyLesson.title.toLowerCase()} with examples` } }); }}
                  style={{ 
                    marginTop: 16, background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 12, 
                    padding: '10px 16px', fontSize: 13, fontWeight: 600, color: 'var(--accent-gold)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6 
                  }}
                >
                  <ion-icon name="chatbubbles-outline" style={{ fontSize: 16 }}></ion-icon>
                  Ask Graham to explain more
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Daily Briefer ── */}
        <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
          <DailyBrieferCard data={terminalData} />
        </div>

        {/* ── Stock of the Day ── */}
        <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
          <StockOfTheDayCard 
            stock={{
              ticker: dailyStock.ticker,
              name: dailyStock.name,
              price: stockInsight?.priceEstimate || 0,
              change: 0,
              history: []
            }} 
            insight={loadingInsight ? 'Generating AI analysis...' : (stockInsight?.thesis || `Analyzing ${dailyStock.name}...`)} 
          />
        </div>

      </div>

      {/* Sticky Chat Input */}
      <div 
        onClick={() => navigate('/app/scan')}
        style={{
          position: 'fixed',
          bottom: 'calc(90px + env(safe-area-inset-bottom))',
          left: '20px',
          right: '20px',
          zIndex: 50,
          maxWidth: '600px',
          margin: '0 auto',
          background: 'var(--bg-glass, rgba(250,247,242,0.9))',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid var(--border-subtle, rgba(0,0,0,0.1))',
          borderRadius: '32px',
          display: 'flex',
          alignItems: 'center',
          padding: '8px 16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          cursor: 'pointer'
        }}
      >
        <ion-icon name="chatbubbles" style={{ color: 'var(--accent-gold)', fontSize: '24px', marginRight: '12px' }}></ion-icon>
        <span style={{ flex: 1, color: 'var(--text-secondary)', fontSize: '16px', fontWeight: '500' }}>Ask Graham anything...</span>
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
