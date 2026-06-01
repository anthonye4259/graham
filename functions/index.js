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

// === PLAID INTEGRATION ===
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const plaidClientId = defineSecret('PLAID_CLIENT_ID');
const plaidSecret = defineSecret('PLAID_SECRET');

function getPlaidClient() {
  const configuration = new Configuration({
    basePath: PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': plaidClientId.value(),
        'PLAID-SECRET': plaidSecret.value(),
      },
    },
  });
  return new PlaidApi(configuration);
}

exports.createPlaidLinkToken = onCall({ secrets: [plaidClientId, plaidSecret] }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'User must be logged in');

  const plaidClient = getPlaidClient();
  const plaidRequest = {
    user: { client_user_id: uid },
    client_name: 'Graham AI',
    products: ['auth', 'transactions', 'investments'],
    country_codes: ['US'],
    language: 'en',
  };

  try {
    const createTokenResponse = await plaidClient.linkTokenCreate(plaidRequest);
    return { link_token: createTokenResponse.data.link_token };
  } catch (error) {
    console.error("Plaid linkTokenCreate error:", error.response?.data || error);
    throw new HttpsError('internal', 'Unable to create Plaid link token');
  }
});

exports.exchangePlaidPublicToken = onCall({ secrets: [plaidClientId, plaidSecret] }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'User must be logged in');
  
  const publicToken = request.data.publicToken;
  if (!publicToken) throw new HttpsError('invalid-argument', 'Missing publicToken');

  const plaidClient = getPlaidClient();
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });
    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    await admin.firestore().collection('users').doc(uid).set({
      plaidAccessToken: accessToken,
      plaidItemId: itemId,
      plaidSyncedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error("Plaid itemPublicTokenExchange error:", error.response?.data || error);
    throw new HttpsError('internal', 'Unable to exchange public token');
  }
});

exports.syncPlaidHoldings = onCall({ secrets: [plaidClientId, plaidSecret] }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'User must be logged in');

  const doc = await admin.firestore().collection('users').doc(uid).get();
  const accessToken = doc.data()?.plaidAccessToken;
  if (!accessToken) throw new HttpsError('failed-precondition', 'User has not linked a Plaid account');

  const plaidClient = getPlaidClient();
  try {
    const response = await plaidClient.investmentsHoldingsGet({
      access_token: accessToken,
    });
    
    await admin.firestore().collection('users').doc(uid).set({
      plaidHoldings: response.data.holdings,
      plaidSecurities: response.data.securities,
      plaidAccounts: response.data.accounts,
      plaidLastSync: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    return { success: true, accounts: response.data.accounts, holdings: response.data.holdings, securities: response.data.securities };
  } catch (error) {
    console.error("Plaid investmentsHoldingsGet error:", error.response?.data || error);
    throw new HttpsError('internal', 'Unable to fetch holdings');
  }
});
