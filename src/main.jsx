import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { initializeLiveUpdates } from './lib/liveUpdates';
import './index.css';

initializeLiveUpdates('Graham AI');

// Global error handlers — catch anything that slips through ErrorBoundary
// (e.g., unhandled promise rejections from Firestore, RevenueCat, etc.)
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled promise rejection:', event.reason);
  event.preventDefault(); // Prevent WKWebView from crashing
});

window.addEventListener('error', (event) => {
  console.warn('Unhandled error:', event.message);
});

// Wrap in try-catch so if any module fails to load, user sees an error instead of white screen
try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <HashRouter>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </HashRouter>
    </React.StrictMode>
  );
} catch (e) {
  console.error('Fatal render error:', e);
  document.getElementById('root').innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Inter,sans-serif;text-align:center;padding:24px"><div><h2>Something went wrong</h2><p style="color:#666">Please close and reopen the app.</p><p style="font-size:12px;color:#999">' + (e.message || '') + '</p></div></div>';
}
