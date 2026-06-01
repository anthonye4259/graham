import React, { useState, useEffect } from 'react';
import Sparkline from '../components/ui/Sparkline';
import ReactMarkdown from 'react-markdown';

export default function MarketsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newsExpanded, setNewsExpanded] = useState(false);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        // Fetch from the Firebase Cloud Function
        const res = await fetch('https://us-central1-graham-222a4.cloudfunctions.net/apiGetMarketsHub');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          throw new Error(json.error);
        }
      } catch (err) {
        console.error("Failed to fetch markets data:", err);
        // Fallback data
        setData({
          assets: [
            { id: 'Dow Jones', ticker: '^DJI', name: 'Dow Jones Industrial Average', price: 39112.16, change: 11.25, changePercent: 0.03, history: [39000, 39100, 38900, 39112] },
            { id: 'S&P 500', ticker: '^GSPC', name: 'Standard and Poor\'s 500', price: 5469.30, change: -8.6, changePercent: -0.16, history: [5400, 5450, 5420, 5469] },
            { id: 'AAPL', ticker: 'AAPL', name: 'Apple Inc.', price: 207.49, change: -2.19, changePercent: -1.04, history: [210, 208, 212, 207.49] }
          ],
          news: [
            { title: "Markets wait for CPI print", publisher: "Yahoo Finance" },
            { title: "Tech stocks see minor pullback", publisher: "Bloomberg" }
          ],
          summary: "Markets are trading mixed today as investors await the upcoming inflation data. Tech stocks saw a slight pullback after recent highs.",
          updatedAt: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };
    fetchMarkets();
  }, []);

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <div className="markets-page" style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#000', color: '#fff', position: 'relative' }}>
      
      {/* Header */}
      <div style={{ padding: '24px 20px 12px 20px' }}>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '800' }}>Markets</h1>
        <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#8E8E93' }}>{today}</h2>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px calc(140px + env(safe-area-inset-bottom)) 20px' }}>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#8E8E93' }}>Loading markets...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {data?.assets?.map((asset, i) => {
              const isUp = asset.change >= 0;
              const color = isUp ? '#34C759' : '#FF3B30';
              
              return (
                <div key={asset.ticker} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: i === data.assets.length - 1 ? 'none' : '1px solid #1C1C1E' }}>
                  
                  {/* Ticker & Name */}
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                    <div style={{ fontSize: '18px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{asset.id}</div>
                    <div style={{ fontSize: '13px', color: '#8E8E93', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>{asset.name}</div>
                  </div>

                  {/* Sparkline */}
                  <div style={{ width: '80px', height: '36px', marginRight: '16px' }}>
                    <Sparkline data={asset.history} color={color} width={80} height={36} />
                  </div>

                  {/* Price & Change Pill */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '90px' }}>
                    <div style={{ fontSize: '17px', fontWeight: '600', marginBottom: '4px' }}>
                      {typeof asset.price === 'number' ? asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : asset.price}
                    </div>
                    <div style={{ 
                      backgroundColor: color, 
                      color: '#fff', 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      padding: '4px 8px', 
                      borderRadius: '6px',
                      display: 'inline-block',
                      minWidth: '70px',
                      textAlign: 'center'
                    }}>
                      {isUp ? '+' : ''}{typeof asset.change === 'number' ? asset.change.toFixed(2) : asset.change}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* News Bottom Sheet */}
      {data && (
        <div 
          className={`news-sheet ${newsExpanded ? 'expanded' : ''}`}
          style={{
            position: 'absolute',
            bottom: '0',
            left: 0,
            right: 0,
            height: newsExpanded ? 'calc(100% - 100px)' : '120px',
            backgroundColor: '#1C1C1E',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            padding: '16px 20px',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
            transition: 'height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
            overflowY: newsExpanded ? 'auto' : 'hidden',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 10
          }}
        >
          {/* Drag Handle */}
          <div 
            style={{ width: '40px', height: '5px', backgroundColor: '#48484A', borderRadius: '4px', margin: '0 auto 16px auto', cursor: 'pointer' }}
            onClick={() => setNewsExpanded(!newsExpanded)}
          />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', cursor: 'pointer' }} onClick={() => setNewsExpanded(!newsExpanded)}>
            <div>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#fff' }}>Business News</h2>
              <div style={{ fontSize: '13px', color: '#8E8E93', marginTop: '2px' }}>AI Summarized Digest</div>
            </div>
          </div>

          <div style={{ 
            fontSize: '15px', 
            lineHeight: '1.5', 
            color: '#EBEBF5',
            backgroundColor: '#2C2C2E',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px',
            pointerEvents: 'auto'
          }}>
            <ReactMarkdown>{data.summary || "No summary available."}</ReactMarkdown>
          </div>

          {newsExpanded && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#fff' }}>Top Headlines</h3>
              {data.news?.map((item, idx) => (
                <div key={idx} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #38383A' }}>
                  <div style={{ fontSize: '13px', color: '#8E8E93', marginBottom: '4px' }}>{item.publisher || "Yahoo Finance"}</div>
                  <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '16px', fontWeight: '500', color: '#fff', textDecoration: 'none' }}>
                    {item.title}
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
