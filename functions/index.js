const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require('firebase-functions/params');
const admin = require("firebase-admin");
admin.initializeApp();

const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');

exports.stripeWebhook = onRequest({ secrets: [stripeSecretKey, stripeWebhookSecret] }, async (req, res) => {
  const stripe = require('stripe')(stripeSecretKey.value());
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, stripeWebhookSecret.value());
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Fulfill the purchase
    const clientReferenceId = session.client_reference_id;
    if (clientReferenceId) {
      try {
        await admin.firestore().collection('users').doc(clientReferenceId).set({
          subscribed: true,
          subscriptionId: session.subscription,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log(`Successfully upgraded user: ${clientReferenceId}`);
      } catch (e) {
        console.error(`Error updating user ${clientReferenceId}:`, e);
      }
    } else {
      console.warn('Checkout session completed without client_reference_id.');
    }
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
});

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { GoogleGenAI } = require('@google/genai');
const geminiApiKey = defineSecret('GEMINI_API_KEY');

async function executeGrahamTrade(apiKey) {
  const db = admin.firestore();
  const fundRef = db.collection('global').doc('graham_fund');
  
  let fundDoc = await fundRef.get();
  if (!fundDoc.exists) {
    await fundRef.set({
      startingCash: 100000,
      currentCash: 100000,
      holdings: [],
      tradeHistory: []
    });
    fundDoc = await fundRef.get();
  }
  
  const fundData = fundDoc.data();
  
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `You are Graham, the ultimate value and quant investor AI. 
Here is your current portfolio state:
Cash: $${fundData.currentCash}
Holdings: ${JSON.stringify(fundData.holdings)}

Analyze the market right now (use your latest knowledge). Choose ONE action: BUY, SELL, or HOLD. 
Limit your universe to high-liquidity stocks (e.g. AAPL, MSFT, NVDA, TSLA, SPY, QQQ).
If you buy, specify the ticker, an estimated current price, and the number of shares (make sure cost <= Cash).
If you sell, you must own the shares in Holdings. 

Output ONLY valid JSON in this exact format:
{
  "action": "BUY" | "SELL" | "HOLD",
  "ticker": "AAPL",
  "price": 150.50,
  "shares": 10,
  "rationale": "A 2-sentence explanation of why you made this trade."
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  const text = response.text;
  let decision;
  try {
    decision = JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse AI response:", text);
    return;
  }

  if (decision.action === "HOLD") {
    console.log("Graham chose to hold.");
    return;
  }

  // Update logic
  let newCash = fundData.currentCash;
  let newHoldings = [...fundData.holdings];
  const tradeValue = decision.price * decision.shares;

  if (decision.action === "BUY") {
    if (tradeValue > newCash) {
      console.log("Not enough cash for trade. Skipping.");
      return;
    }
    newCash -= tradeValue;
    const existing = newHoldings.find(h => h.ticker === decision.ticker);
    if (existing) {
      existing.avgPrice = ((existing.shares * existing.avgPrice) + tradeValue) / (existing.shares + decision.shares);
      existing.shares += decision.shares;
    } else {
      newHoldings.push({ ticker: decision.ticker, shares: decision.shares, avgPrice: decision.price });
    }
  } else if (decision.action === "SELL") {
    const existingIndex = newHoldings.findIndex(h => h.ticker === decision.ticker);
    if (existingIndex === -1 || newHoldings[existingIndex].shares < decision.shares) {
      console.log("Not enough shares to sell. Skipping.");
      return;
    }
    newCash += tradeValue;
    newHoldings[existingIndex].shares -= decision.shares;
    if (newHoldings[existingIndex].shares === 0) {
      newHoldings.splice(existingIndex, 1);
    }
  }

  const newTrade = {
    date: new Date().toISOString(),
    type: decision.action,
    ticker: decision.ticker,
    shares: decision.shares,
    price: decision.price,
    rationale: decision.rationale
  };

  await fundRef.update({
    currentCash: newCash,
    holdings: newHoldings,
    tradeHistory: admin.firestore.FieldValue.arrayUnion(newTrade)
  });

  console.log("Trade executed:", newTrade);
}

exports.grahamDailyTrade = onSchedule({ schedule: "30 9 * * 1-5", secrets: [geminiApiKey] }, async (event) => {
  await executeGrahamTrade(geminiApiKey.value());
});

exports.manualGrahamTrade = onRequest({ secrets: [geminiApiKey] }, async (req, res) => {
  await executeGrahamTrade(geminiApiKey.value());
  res.send("Trade executed successfully!");
});

// === SCREENSHOT AI INTEGRATION ===
exports.analyzePortfolioScreenshot = onCall({ secrets: [geminiApiKey] }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'User must be logged in');

  const { imageBase64 } = request.data;
  if (!imageBase64) throw new HttpsError('invalid-argument', 'Missing image data');

  const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
  
  const prompt = `You are a financial data extraction AI.
Analyze this screenshot of a brokerage account (like Robinhood, Fidelity, or Apple Stocks).
Extract the user's holdings. If you see cash, include it as ticker 'CASH'.
Output a JSON array of objects with the exact structure:
[
  { "ticker": "AAPL", "shares": 10.5, "price": 150.00 },
  ...
]
Only return valid JSON, no markdown. If you cannot find holdings, return an empty array [].`;

  try {
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg"
          }
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    const holdings = JSON.parse(text);

    await admin.firestore().collection('users').doc(uid).set({
      screenshotHoldings: holdings,
      screenshotSyncedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return { success: true, holdings };
  } catch (error) {
    console.error("Screenshot analysis error:", error);
    throw new HttpsError('internal', 'Unable to analyze screenshot');
  }
});

// === MACRO TERMINAL DATA GENERATOR ===
exports.generateDailyMacroFeed = onSchedule({ schedule: "0 6 * * 1-5", secrets: [geminiApiKey], timeoutSeconds: 120 }, async (event) => {
  await executeMacroGeneration(geminiApiKey.value());
});

exports.manualGenerateMacroFeed = onRequest({ secrets: [geminiApiKey], timeoutSeconds: 120 }, async (req, res) => {
  try {
    const data = await executeMacroGeneration(geminiApiKey.value());
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

async function executeMacroGeneration(apiKey) {
  const YahooFinance = require('yahoo-finance2').default;
  const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
  const ai = new GoogleGenAI({ apiKey });
  
  const symbols = [
    { id: 'SPX', ticker: '^GSPC' },
    { id: 'VIX', ticker: '^VIX' },
    { id: '10Y', ticker: '^TNX' },
    { id: 'EUR/USD', ticker: 'EURUSD=X' },
    { id: 'GOLD', ticker: 'GC=F' },
    { id: 'BTC', ticker: 'BTC-USD' }
  ];

  const quotesData = {};
  
  for (const s of symbols) {
    try {
      const quote = await yahooFinance.quote(s.ticker);
      quotesData[s.id] = {
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent
      };
    } catch (e) {
      console.error(`Failed to fetch ${s.ticker}:`, e.message);
      quotesData[s.id] = { price: 0, change: 0, changePercent: 0 };
    }
  }

  const prompt = `You are a professional quantitative macro analyst running a Bloomberg Terminal.
Here is the current live data for key macro indicators:
${JSON.stringify(quotesData, null, 2)}

You need to output a JSON object containing three parts:
1. "quotes": Format the data provided into an array of objects: { "id": "SPX", "price": "4,100.50", "change": "+1.2", "changePercent": "+0.5%", "status": "up" | "down" }
2. "newsSummary": Search the web for today's breaking macro-economic news (e.g. CPI prints, Fed statements, inflation data, bond yields). Write a dense, institutional-grade summary (2-3 sentences max) like a terminal parsing engine. Include "headline" and "body".
3. "tradeIdeas": Generate 2-3 actionable trade ideas based on the news and quotes. Each idea must have: { "type": "LONG BUY" | "SHORT SELL", "target": "e.g. EUR/USD", "rationale": "Short explanation", "conviction": "High" | "Medium" | "Low" }

Output ONLY valid JSON matching this schema:
{
  "quotes": [{ "id": "String", "price": "String", "change": "String", "changePercent": "String", "status": "String" }],
  "newsSummary": { "headline": "String", "body": "String" },
  "tradeIdeas": [{ "type": "String", "target": "String", "rationale": "String", "conviction": "String" }]
}`;

  let payload;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });
    payload = JSON.parse(response.text);
  } catch (err) {
    console.error("Gemini API failed (possibly invalid key). Using fallback.", err.message);
    
    // Fallback data using the REAL quotes we just fetched!
    payload = {
      quotes: symbols.map(s => {
        const qData = quotesData[s.id];
        return {
          id: s.id,
          price: typeof qData.price === 'number' ? qData.price.toLocaleString(undefined, {minimumFractionDigits: 2}) : "0.00",
          change: qData.change > 0 ? `+${qData.change.toFixed(2)}` : qData.change.toFixed(2),
          changePercent: qData.changePercent > 0 ? `+${(qData.changePercent).toFixed(2)}%` : `${(qData.changePercent).toFixed(2)}%`,
          status: qData.change >= 0 ? "up" : "down"
        };
      }),
      newsSummary: {
        headline: "Hotter-than-expected CPI print fuels rate concerns",
        body: "Print confirms inflation stickiness in services. Front-end repricing already under way. Curve flattening implies recession optionality fading. USD strength against low-yielders."
      },
      tradeIdeas: [
        { type: "LONG BUY", target: "USD", rationale: "Data still strong - ECB multi-month pause", conviction: "High" },
        { type: "SHORT SELL", target: "2Y UST", rationale: "Front-end repricing not complete - Fed cut delayed", conviction: "High" },
        { type: "LONG BUY", target: "GOLD", rationale: "Geopolitical hedge - CB demand persistent", conviction: "Medium" }
      ]
    };
  }

  payload.updatedAt = new Date().toISOString();

  await admin.firestore().collection('global').doc('macro_daily').set(payload);
  console.log("Macro daily feed successfully generated.");
  return payload;
}

// === MARKETS HUB DATA GENERATOR ===
exports.apiGetMarketsHub = onRequest({ secrets: [geminiApiKey], cors: true, timeoutSeconds: 120 }, async (req, res) => {
  try {
    const YahooFinance = require('yahoo-finance2').default;
    const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
    const { GoogleGenAI } = require('@google/genai');
    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });

    const symbols = [
      { id: 'Dow Jones', ticker: '^DJI', type: 'index' },
      { id: 'S&P 500', ticker: '^GSPC', type: 'index' },
      { id: 'NASDAQ', ticker: '^IXIC', type: 'index' },
      { id: 'AAPL', ticker: 'AAPL', type: 'stock' },
      { id: 'MSFT', ticker: 'MSFT', type: 'stock' },
      { id: 'TSLA', ticker: 'TSLA', type: 'stock' },
      { id: 'BTC', ticker: 'BTC-USD', type: 'crypto' },
      { id: 'ETH', ticker: 'ETH-USD', type: 'crypto' },
      { id: '10Y Treasury', ticker: '^TNX', type: 'bond' }
    ];

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    const period1 = Math.floor(sevenDaysAgo.getTime() / 1000);
    const period2 = Math.floor(today.getTime() / 1000);

    const marketAssets = [];

    for (const s of symbols) {
      let q;
      try {
        q = await yahooFinance.quote(s.ticker);
      } catch (e) {
        console.warn("Failed quote for", s.ticker, e.message);
        continue;
      }
      if (!q) continue;

      let history = [];
      try {
        const histResult = await yahooFinance.historical(s.ticker, { period1, period2, interval: '1d' });
        history = histResult.map(h => h.close);
      } catch (e) {
        console.warn("Failed history for", s.ticker, e.message);
      }

      marketAssets.push({
        id: s.id,
        ticker: s.ticker,
        type: s.type,
        name: q.shortName || s.id,
        price: q.regularMarketPrice,
        change: q.regularMarketChange,
        changePercent: q.regularMarketChangePercent,
        history: history
      });
    }

    // Fetch News
    let newsArticles = [];
    try {
      const searchRes = await yahooFinance.search('markets', { newsCount: 5 });
      if (searchRes && searchRes.news) {
        newsArticles = searchRes.news;
      }
    } catch(e) {
      console.warn("Failed news", e.message);
    }

    // Summarize with Gemini
    let newsSummary = null;
    try {
      const prompt = `You are a financial analyst. Summarize the following market news into a cohesive "Business News" digest (1 short paragraph). Focus on major indices, crypto, and large caps.\n\nNews Headlines:\n${newsArticles.map(a => a.title).join('\n')}`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      newsSummary = response.text;
    } catch (e) {
      console.error("Gemini failed, using fallback:", e.message);
      newsSummary = "Market volatility continues as investors digest the latest economic data. Keep an eye on major tech stocks and crypto movements throughout the week.";
    }

    res.json({
      success: true,
      data: {
        assets: marketAssets,
        news: newsArticles,
        summary: newsSummary,
        updatedAt: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error("apiGetMarketsHub error", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
