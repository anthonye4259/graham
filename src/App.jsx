import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { UserProvider, useUser } from './context/UserContext';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import ScanPage from './pages/ScanPage';
import SettingsPage from './pages/SettingsPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import SupportPage from './pages/SupportPage';
import AboutPage from './pages/AboutPage';
import FeedPage from './pages/FeedPage';
import MarketsPage from './pages/MarketsPage';
import DashboardLayout from './components/ui/DashboardLayout';
import PaywallModal from './components/ui/PaywallModal';

const isNative = Capacitor.isNativePlatform();

function AppShell() {
  const { user, loadingAuth, state, startTrial, isPremium } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('success') === 'true') {
      startTrial();
      navigate('/app', { replace: true });
    }
  }, [location, startTrial, navigate]);

  if (loadingAuth) {
    return (
      <div className="shimmer-overlay active">
        <div className="shimmer-icon">
          <ion-icon name="finger-print-outline"></ion-icon>
        </div>
        <div className="shimmer-text">Authenticating...</div>
        <div className="shimmer-bar"><div className="shimmer-bar-fill"></div></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!state.onboarded) {
    return <OnboardingPage />;
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route index element={<FeedPage />} />
          <Route path="markets" element={<MarketsPage />} />
          <Route path="scan" element={<ScanPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Route>
      </Routes>

      {/* Mandatory Hard Paywall Overlay if not premium */}
      {!isPremium() && (
        <PaywallModal isOpen={true} onClose={() => {}} source="hardwall" />
      )}
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <Routes>
          {/* On native mobile, skip landing page and go straight to app */}
          <Route path="/" element={isNative ? <Navigate to="/app" replace /> : <LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/app/*" element={<AppShell />} />
          <Route path="*" element={<Navigate to={isNative ? "/app" : "/"} replace />} />
        </Routes>
      </UserProvider>
    </ErrorBoundary>
  );
}

