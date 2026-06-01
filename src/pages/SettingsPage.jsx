import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const { state, setState, logout, isPremium, requestPushPermissions } = useUser();
  const navigate = useNavigate();

  const handleManageBilling = () => {
    const portalUrl = import.meta.env.VITE_STRIPE_CUSTOMER_PORTAL;
    if (portalUrl) {
      window.open(portalUrl, '_blank');
    } else {
      alert("Stripe Portal link not configured yet.");
    }
  };

  return (
    <div style={{ padding: '32px', paddingBottom: 'calc(120px + env(safe-area-inset-bottom))', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', cursor: 'pointer' }}
          className="hover-bg"
        >
          <ion-icon name="arrow-back-outline" style={{ fontSize: '20px' }}></ion-icon>
        </button>
        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>Settings</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Profile Card */}
        <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ion-icon name="person-circle-outline" style={{ color: 'var(--accent-blue)' }}></ion-icon> Profile
          </h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '32px', fontWeight: 'bold' }}>
              {state.name ? state.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>{state.name || 'Anonymous User'}</div>
              <div style={{ color: 'var(--text-secondary)' }}>Level {state.level} Investor</div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '13px', marginTop: '4px' }}>{state.xp} total XP earned</div>
            </div>
          </div>
        </section>

        {/* Subscription Card */}
        <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ion-icon name="card-outline" style={{ color: 'var(--accent-teal)' }}></ion-icon> Subscription & Billing
          </h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '24px', borderBottom: '1px solid var(--border-light)', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>
                {state.subscribed || isPremium() ? 'Graham Premium' : 'Free Tier'}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                {state.subscribed || isPremium() ? 'You have access to unlimited scans and advanced AI analysis.' : 'You are currently on the free trial tier.'}
              </div>
            </div>
            {state.subscribed || isPremium() ? (
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-teal)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>ACTIVE</div>
            ) : null}
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              onClick={handleManageBilling}
              style={{ background: 'var(--text-primary)', color: 'var(--bg-main)', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            >
              <ion-icon name="wallet-outline"></ion-icon> Manage Subscription
            </button>
          </div>
        </section>

        {/* Preferences */}
        <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ion-icon name="options-outline" style={{ color: 'var(--accent-gold)' }}></ion-icon> Preferences
          </h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Daily AI Briefings
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Receive a daily market breakdown from your AI persona every morning.
              </div>
            </div>
            
            <button 
              onClick={async () => {
                if (!state.pushEnabled) {
                  await requestPushPermissions();
                } else {
                  // If they want to disable, they must do it in OS settings, but we can set the flag to false to stop sending them on backend
                  setState({ pushEnabled: false });
                }
              }}
              style={{
                width: '50px', height: '28px', borderRadius: '14px',
                background: state.pushEnabled ? 'var(--accent-teal)' : 'var(--border-light)',
                position: 'relative', cursor: 'pointer', border: 'none', transition: 'all 0.3s'
              }}
            >
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%', background: '#fff',
                position: 'absolute', top: '2px', left: state.pushEnabled ? '24px' : '2px',
                transition: 'all 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }} />
            </button>
          </div>
        </section>

        {/* Danger Zone */}
        <section style={{ background: 'var(--bg-card)', border: '1px solid var(--accent-rose)', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--accent-rose)' }}>Danger Zone</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>Logging out will clear your session. You can sign back in at any time.</p>
          <button 
            onClick={logout}
            style={{ background: 'transparent', color: 'var(--accent-rose)', border: '1px solid var(--accent-rose)', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Log Out
          </button>
        </section>

      </div>
    </div>
  );
}
