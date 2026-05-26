const CACHE_KEY_TRENDING = 'graham_trending_cache';
const CACHE_KEY_NEWS = 'graham_news_cache';
const CACHE_DURATION_MS = 1000 * 60 * 60 * 2; // 2 hours

export async function getTrendingStocks() {
  const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_KEY;
  if (!apiKey) return getSimulatedTrending();

  try {
    const cached = localStorage.getItem(CACHE_KEY_TRENDING);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION_MS) {
        return data;
      }
    }

    const res = await fetch(`https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${apiKey}`);
    const data = await res.json();

    if (data.Information || data['Error Message'] || !data.top_gainers) {
      throw new Error("Rate limit or API error");
    }

    const gainers = data.top_gainers.slice(0, 5).map(g => ({
      ticker: g.ticker,
      price: `$${parseFloat(g.price).toFixed(2)}`,
      change: g.change_percentage,
      direction: 'up'
    }));

    const losers = data.top_losers.slice(0, 5).map(l => ({
      ticker: l.ticker,
      price: `$${parseFloat(l.price).toFixed(2)}`,
      change: l.change_percentage,
      direction: 'down'
    }));

    const result = [...gainers, ...losers].sort(() => 0.5 - Math.random());
    localStorage.setItem(CACHE_KEY_TRENDING, JSON.stringify({ data: result, timestamp: Date.now() }));
    
    return result;
  } catch (error) {
    console.warn("Alpha Vantage Trending API failed, using simulated data.", error);
    return getSimulatedTrending();
  }
}

export async function getMarketNews() {
  const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_KEY;
  if (!apiKey) return getSimulatedNews();

  try {
    const cached = localStorage.getItem(CACHE_KEY_NEWS);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION_MS) {
        return data;
      }
    }

    const res = await fetch(`https://www.alphavantage.co/query?function=NEWS_SENTIMENT&sort=LATEST&limit=5&apikey=${apiKey}`);
    const data = await res.json();

    if (data.Information || data['Error Message'] || !data.feed) {
      throw new Error("Rate limit or API error");
    }

    const news = data.feed.map(item => ({
      title: item.title,
      url: item.url,
      source: item.source,
      time: formatTime(item.time_published),
      sentiment: determineSentiment(item.overall_sentiment_score)
    }));

    localStorage.setItem(CACHE_KEY_NEWS, JSON.stringify({ data: news, timestamp: Date.now() }));
    
    return news;
  } catch (error) {
    console.warn("Alpha Vantage News API failed, using simulated data.", error);
    return getSimulatedNews();
  }
}

function formatTime(timeStr) {
  if (!timeStr) return "Recently";
  // timeStr is usually like "20231025T113000"
  try {
    const year = timeStr.substring(0,4);
    const month = timeStr.substring(4,6);
    const day = timeStr.substring(6,8);
    return `${month}/${day}/${year}`;
  } catch (e) {
    return "Recently";
  }
}

function determineSentiment(score) {
  const num = parseFloat(score);
  if (num > 0.15) return 'Bullish';
  if (num < -0.15) return 'Bearish';
  return 'Neutral';
}

function getSimulatedTrending() {
  return [
    { ticker: 'NVDA', price: '$852.12', change: '+4.2%', direction: 'up' },
    { ticker: 'TSLA', price: '$178.44', change: '-2.1%', direction: 'down' },
    { ticker: 'AAPL', price: '$172.50', change: '+1.1%', direction: 'up' },
    { ticker: 'META', price: '$498.11', change: '+3.5%', direction: 'up' },
    { ticker: 'NFLX', price: '$612.33', change: '-0.8%', direction: 'down' }
  ];
}

function getSimulatedNews() {
  return [
    { title: "Fed Hints at Rate Cuts Coming Later This Year", source: "Wall Street Journal", time: "Today", sentiment: "Bullish" },
    { title: "Tech Stocks Rally After Blowout Earnings", source: "Bloomberg", time: "Today", sentiment: "Bullish" },
    { title: "Oil Prices Spike Amid Middle East Tensions", source: "Reuters", time: "Yesterday", sentiment: "Bearish" },
    { title: "Consumer Spending Slows Down in Q1", source: "CNBC", time: "Yesterday", sentiment: "Neutral" }
  ];
}
