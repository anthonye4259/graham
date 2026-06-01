import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { UserProvider, useUser } from './context/UserContext';
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
import DashboardLayout from './components/ui/DashboardLayout';
import PaywallModal from './components/ui/PaywallModal';

function AppShell() {
  const { user, loadingAuth, state, startTrial, isPremium } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('success') === 'true') {
      startTrial();
      // Remove query param
      navigate('/app', { replace: true });
    }
  }, [location, startTrial, navigate]);

  if (loadingAuth) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!state.onboarded) {
    return <OnboardingPage />;
  }

  return (
    <>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route index element={<FeedPage />} />
          <Route path="scan" element={<ScanPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Route>
      </Routes>

      {/* Mandatory Hard Paywall Overlay if not premium */}
      {!isPremium() && (
        <PaywallModal isOpen={true} onClose={() => {}} source="hardwall" />
      )}
    </>
  );
}

export default function App() {
  return (
    <UserProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/app/*" element={<AppShell />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </UserProvider>
  );
}
