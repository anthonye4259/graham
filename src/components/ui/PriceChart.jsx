import { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, Tooltip, YAxis } from 'recharts';

export default function PriceChart({ direction, symbol }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingSimulated, setUsingSimulated] = useState(false);

  // Fallback simulator if API fails, rate limits, or is missing
  const generateSimulatedData = () => {
    let currentPrice = 100;
    const points = [];
    const isUp = direction === 'up';
    for (let i = 0; i < 30; i++) {
      const noise = (Math.random() - 0.5) * 5;
      const trend = isUp ? (Math.random() * 2) : (Math.random() * -2);
      currentPrice = currentPrice + noise + trend;
      points.push({ day: i, price: currentPrice, date: `Day ${i + 1}` });
    }
    return points;
  };

  useEffect(() => {
    let isMounted = true;
    const fetchRealData = async () => {
      const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_KEY;
      if (!apiKey || !symbol) {
        if (isMounted) {
          setChartData(generateSimulatedData());
          setUsingSimulated(true);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`);
        const data = await res.json();

        // Check for rate limit or invalid symbol
        if (data.Information || data['Error Message'] || !data['Time Series (Daily)']) {
          throw new Error('API Rate Limit or Invalid Symbol');
        }

        const timeSeries = data['Time Series (Daily)'];
        const dates = Object.keys(timeSeries).slice(0, 30).reverse(); // Last 30 days
        
        const realPoints = dates.map((date) => ({
          date,
          price: parseFloat(timeSeries[date]['4. close'])
        }));

        if (isMounted) {
          setChartData(realPoints);
          setUsingSimulated(false);
          setLoading(false);
        }
      } catch (err) {
        console.warn("Falling back to simulated data:", err.message);
        if (isMounted) {
          setChartData(generateSimulatedData());
          setUsingSimulated(true);
          setLoading(false);
        }
      }
    };

    fetchRealData();
    return () => { isMounted = false; };
  }, [symbol, direction]);

  const color = direction === 'up' ? '#10B981' : '#F43F5E';

  if (loading) {
    return <div style={{ width: '100%', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading chart...</div>;
  }

  return (
    <div style={{ width: '100%', height: '200px', position: 'relative', marginTop: '16px', marginBottom: '24px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <YAxis domain={['auto', 'auto']} hide />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-primary)' }}
            itemStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
            formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
            labelFormatter={(label, payload) => payload?.[0]?.payload?.date || symbol}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke={color} 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorPrice)" 
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
      {usingSimulated && (
        <div style={{ position: 'absolute', bottom: -20, left: 0, right: 0, textAlign: 'center', fontSize: '11px', color: 'var(--text-tertiary)', letterSpacing: '1px' }}>
          SIMULATED 30-DAY TREND
        </div>
      )}
    </div>
  );
}
