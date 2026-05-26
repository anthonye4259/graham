const { onRequest } = require("firebase-functions/v2/https");
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
