import { useState, useEffect } from 'react';
import { getTrendingStocks, getMarketNews } from '../../lib/api';

export default function MarketPulse({ onScanClick }) {
  const [trending, setTrending] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      try {
        const [trendingData, newsData] = await Promise.all([
          getTrendingStocks(),
          getMarketNews()
        ]);
        if (isMounted) {
          setTrending(trendingData.slice(0, 5));
          setNews(newsData.slice(0, 4));
        }
      } catch (err) {
        console.error("MarketPulse fetch error", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchData();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px', maxWidth: '400px', width: '100%', margin: '0 auto', opacity: 0.5 }}>
        <div className="scan-shimmer short" style={{ width: '50%' }}></div>
        <div className="scan-shimmer"></div>
        <div className="scan-shimmer"></div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%', maxWidth: '800px', margin: '0 auto', padding: '16px' }}>
      
      {/* Trending Stocks Ticker Section */}
      <div>
        <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ion-icon name="trending-up-outline" style={{ color: 'var(--accent-teal)' }}></ion-icon> 
          Market Movers
        </h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {trending.map((stock, i) => {
            const isUp = stock.direction === 'up';
            return (
              <button 
                key={i} 
                onClick={() => onScanClick && onScanClick(stock.ticker)}
                style={{ 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-light)', 
                  borderRadius: '12px', 
                  padding: '12px 16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  cursor: 'pointer',
                  flex: '1 1 calc(33% - 12px)',
                  minWidth: '140px'
                }}
                className="hover-bg"
              >
                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '16px' }}>{stock.ticker}</div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500 }}>{stock.price}</div>
                  <div style={{ color: isUp ? 'var(--accent-teal)' : 'var(--accent-rose)', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end' }}>
                    {isUp ? <ion-icon name="arrow-up-outline"></ion-icon> : <ion-icon name="arrow-down-outline"></ion-icon>}
                    {stock.change}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Market News Section */}
      <div>
        <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ion-icon name="newspaper-outline" style={{ color: 'var(--accent-blue)' }}></ion-icon> 
          Breaking News
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {news.map((item, i) => (
            <a 
              key={i} 
              href={item.url} 
              target="_blank" 
              rel="noreferrer"
              style={{ 
                display: 'block',
                background: 'var(--bg-secondary)', 
                border: '1px solid var(--border-light)', 
                borderRadius: '12px', 
                padding: '16px',
                textDecoration: 'none',
                transition: 'border-color 0.2s ease, transform 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--text-primary)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.4 }}>{item.title}</h4>
                <div style={{ 
                  padding: '4px 8px', 
                  borderRadius: '6px', 
                  fontSize: '11px', 
                  fontWeight: 'bold', 
                  textTransform: 'uppercase',
                  background: item.sentiment === 'Bullish' ? 'rgba(16, 185, 129, 0.1)' : (item.sentiment === 'Bearish' ? 'rgba(244, 63, 94, 0.1)' : 'var(--bg-main)'),
                  color: item.sentiment === 'Bullish' ? 'var(--accent-teal)' : (item.sentiment === 'Bearish' ? 'var(--accent-rose)' : 'var(--text-secondary)'),
                  whiteSpace: 'nowrap'
                }}>
                  {item.sentiment}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                <span>{item.source}</span>
                <span>{item.time}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
      
    </div>
  );
}
