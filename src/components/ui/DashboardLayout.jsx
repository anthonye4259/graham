import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useState } from 'react';


export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{ height: '100dvh', width: '100vw', backgroundColor: 'var(--bg-main)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      
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
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav">
        <button onClick={() => navigate('/app')} className={`nav-item ${location.pathname === '/app' ? 'active' : ''}`}>
          <ion-icon name="home"></ion-icon>
          <span>Home</span>
        </button>
        <button onClick={() => navigate('/app/markets')} className={`nav-item ${location.pathname === '/app/markets' ? 'active' : ''}`}>
          <ion-icon name="bar-chart-outline"></ion-icon>
          <span>Markets</span>
        </button>
        <button onClick={() => navigate('/app/scan')} className="nav-item">
          <ion-icon name="chatbubbles" class="nav-scan-icon"></ion-icon>
          <span>Advisor</span>
        </button>
        <button onClick={() => navigate('/app/settings')} className={`nav-item ${location.pathname === '/app/settings' ? 'active' : ''}`}>
          <ion-icon name="person"></ion-icon>
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
          height: calc(80px + env(safe-area-inset-bottom));
          background: rgba(250,247,242,0.75);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          z-index: 1000;
          border-top: 0.5px solid rgba(26,24,21,0.08);
          box-shadow: 0 -4px 24px rgba(26,24,21,0.02);
          justify-content: space-around;
          padding-bottom: env(safe-area-inset-bottom);
          align-items: center;
        }
        .nav-item {
          background: none;
          border: none;
          color: #A09890;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 600;
          padding: 8px 16px;
          cursor: pointer;
          transition: var(--transition-spring);
        }
        .nav-item.active {
          color: #1A1815;
          transform: scale(1.05);
        }
        .nav-item ion-icon { font-size: 24px; }
        .nav-scan-icon { font-size: 50px !important; color: var(--accent-gold); transform: translateY(-8px); filter: drop-shadow(0 4px 12px rgba(166,124,82,0.3)); }
      `}</style>
    </div>
  );
}
