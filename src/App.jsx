import { Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import LandingPage from './pages/LandingPage';
import OnboardingPage from './pages/OnboardingPage';
import HomePage from './pages/HomePage';
import ScanPage from './pages/ScanPage';
import ProfilePage from './pages/ProfilePage';
import TabNav from './components/ui/TabNav';

function AppShell() {
  const { state } = useUser();

  if (!state.onboarded) {
    return <OnboardingPage />;
  }

  return (
    <div className="app-shell">
      <div className="app-content">
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="scan" element={<ScanPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </div>
      <TabNav />
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app/*" element={<AppShell />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </UserProvider>
  );
}
