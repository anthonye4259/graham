import { initializeApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { getFunctions } from 'firebase/functions';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD2w0Tvtxr24TVlrT_QZUiSH1u9LOlGo1M",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "graham-222a4.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "graham-222a4",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "graham-222a4.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "750305876759",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:750305876759:web:86f5502c7f89251e633552",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// CRITICAL: Use browserLocalPersistence (localStorage) instead of default
// indexedDBLocalPersistence. IndexedDB deadlocks in WKWebView on iOS/iPadOS.
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
});

export const db = getFirestore(app);
export const functions = getFunctions(app);

// Analytics - wrap in try-catch for WKWebView compatibility
let analyticsInstance = null;
try {
  analyticsInstance = getAnalytics(app);
} catch (e) {
  console.warn('Analytics init skipped:', e.message);
}
export const analytics = analyticsInstance;

export const trackEvent = (eventName, params = {}) => {
  const affiliateId = localStorage.getItem('affiliate_id');
  if (affiliateId) {
    params.affiliate_id = affiliateId;
  }
  if (analytics) {
    logEvent(analytics, eventName, params);
  }
};

