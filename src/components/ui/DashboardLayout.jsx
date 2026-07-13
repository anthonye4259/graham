import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { hapticSelection } from '../../lib/haptics';


export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{ minHeight: '100dvh', width: '100%', backgroundColor: 'var(--bg-main)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      
      {/* Global Logo Header */}
      <div style={{
        position: 'absolute',
        top: 'calc(env(safe-area-inset-top) + 12px)',
        left: 0,
        right: 0,
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        pointerEvents: 'none'
      }}>
        <img src="/graham_lowercase_g_logo.png" alt="Graham Logo" style={{ height: '32px', width: '32px', objectFit: 'contain' }} />
      </div>

      {/* Main Content Area */}
      <main style={{ flex: 1, position: 'relative', overflowY: 'auto' }}>
        <div key={location.pathname} className="fade-in" style={{ minHeight: '100%' }}>
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav" aria-label="Primary navigation">
        <button aria-label="Home" onClick={() => { hapticSelection(); navigate('/app'); }} className={`nav-item ${location.pathname === '/app' ? 'active' : ''}`}>
          <ion-icon name={location.pathname === '/app' ? 'home' : 'home-outline'}></ion-icon>
          <span>Home</span>
        </button>
        <button aria-label="Markets" onClick={() => { hapticSelection(); navigate('/app/markets'); }} className={`nav-item ${location.pathname === '/app/markets' ? 'active' : ''}`}>
          <ion-icon name={location.pathname === '/app/markets' ? 'bar-chart' : 'bar-chart-outline'}></ion-icon>
          <span>Markets</span>
        </button>
        <button aria-label="Advisor" onClick={() => { hapticSelection(); navigate('/app/scan'); }} className={`nav-item ${location.pathname === '/app/scan' ? 'active' : ''}`}>
          <ion-icon name={location.pathname === '/app/scan' ? 'chatbubbles' : 'chatbubbles-outline'}></ion-icon>
          <span>Advisor</span>
        </button>
        <button aria-label="Profile" onClick={() => { hapticSelection(); navigate('/app/settings'); }} className={`nav-item ${location.pathname === '/app/settings' ? 'active' : ''}`}>
          <ion-icon name={location.pathname === '/app/settings' ? 'person' : 'person-outline'}></ion-icon>
          <span>Profile</span>
        </button>
      </nav>

      <style>{`
        .bottom-nav {
          display: flex;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: calc(72px + env(safe-area-inset-bottom));
          background: rgba(250,247,242,0.94);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          z-index: 1000;
          border-top: 0.5px solid rgba(26,24,21,0.08);
          box-shadow: 0 -8px 28px rgba(26,24,21,0.04);
          justify-content: center;
          padding-bottom: env(safe-area-inset-bottom);
          align-items: center;
        }
        .bottom-nav > button {
          max-width: 120px;
          flex: 1;
        }
        @media (min-width: 768px) {
          .bottom-nav {
            justify-content: center;
            gap: 28px;
          }
          .bottom-nav > button {
            max-width: 100px;
          }
        }
        .nav-item {
          background: none;
          border: none;
          color: var(--text-muted);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
          padding: 8px 16px;
          min-height: 52px;
          cursor: pointer;
          transition: color 0.2s ease, transform 0.2s ease;
        }
        .nav-item.active {
          color: var(--text-primary);
          transform: translateY(-1px);
        }
        .nav-item ion-icon { font-size: 23px; }
        .nav-item.active ion-icon { color: var(--accent-gold); }
      `}</style>
    </div>
  );
}
