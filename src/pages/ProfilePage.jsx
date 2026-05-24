import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { getAllLessonsCount } from '../lib/lessons';
import PaywallModal from '../components/ui/PaywallModal';

export default function ProfilePage() {
  const { state, setState, getLevelTitle, getXPProgress, isPremium, logout } = useUser();
  const [showPaywall, setShowPaywall] = useState(false);
  const xpPct = getXPProgress();

  return (
    <div className="screen active profile-tab" id="profile-tab">
      <div className="section-heading">Your Profile</div>

      <div className="profile-avatar"><ion-icon name="person-outline" class="avatar-icon"></ion-icon></div>
      <div className="profile-name">{state.name || 'Investor'}</div>
      <div className="profile-level">{getLevelTitle()} · Level {state.level}</div>
      <div className="profile-xp-bar"><div className="profile-xp-fill" style={{ width: `${xpPct}%` }} /></div>
      <div className="profile-xp-label">{state.xp} XP</div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value"><ion-icon name="flame-outline" class="stat-icon flame"></ion-icon>{state.streak}</div>
          <div className="stat-label">Day Streak</div>
          <div 
            className={`streak-freeze-badge ${isPremium() ? 'active' : 'inactive'}`}
            onClick={() => !isPremium() && setShowPaywall(true)}
          >
            <ion-icon name="snow-outline"></ion-icon>
            Freeze {isPremium() ? 'Active' : 'Locked'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-value"><ion-icon name="checkmark-circle-outline" class="stat-icon gold"></ion-icon>{state.totalLessonsCompleted}</div>
          <div className="stat-label">Lessons Done</div>
        </div>
        <div className="stat-card">
          <div className="stat-value"><ion-icon name="trophy-outline" class="stat-icon gold"></ion-icon>{state.bestStreak}</div>
          <div className="stat-label">Best Streak</div>
        </div>
        <div className="stat-card">
          <div className="stat-value"><ion-icon name="scan-outline" class="stat-icon"></ion-icon>{state.scanCount}</div>
          <div className="stat-label">Scans Used</div>
        </div>
      </div>

      <div className="section-heading" style={{ marginTop: '24px' }}>Subscription</div>
      <div className="stat-card" style={{ width: '100%', textAlign: 'left', marginBottom: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Status</span>
          <span style={{ color: isPremium() ? 'var(--accent-green)' : 'var(--text-muted)', fontWeight: 600 }}>{isPremium() ? 'Premium' : 'Free'}</span>
        </div>
      </div>
      {state.trialStartDate && (
        <div className="stat-card" style={{ width: '100%', textAlign: 'left', marginBottom: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Trial started</span>
            <span>{new Date(state.trialStartDate).toLocaleDateString()}</span>
          </div>
        </div>
      )}
      {!isPremium() && (
        <button 
          className="share-insight-btn" 
          style={{ marginTop: '0', background: 'var(--text-primary)', color: '#fff', borderColor: 'transparent' }}
          onClick={() => setShowPaywall(true)}
        >
          <ion-icon name="star"></ion-icon>
          Upgrade to Premium
        </button>
      )}

      <div className="section-heading" style={{ marginTop: '24px' }}>AI Persona</div>
      <div className="stat-card" style={{ width: '100%', textAlign: 'left', marginBottom: '6px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Who explains the market to you?</span>
          <select 
            className="scan-input" 
            style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            value={state.persona}
            onChange={(e) => {
              if (!isPremium() && e.target.value !== 'Graham') {
                setShowPaywall(true);
                return;
              }
              setState({ persona: e.target.value });
            }}
          >
            <option value="Graham">Benjamin Graham (Default)</option>
            <option value="Patrick Bateman">Patrick Bateman (Finance Bro)</option>
            <option value="David Tepper">David Tepper (Hedge Fund Elite)</option>
            <option value="Bill Ackman">Bill Ackman (Dramatic Activist)</option>
            <option value="Spongebob">Spongebob (Cartoon Chaos)</option>
          </select>
        </div>
      </div>

      <div className="section-heading" style={{ marginTop: '24px' }}>Learning</div>
      <div className="stat-card" style={{ width: '100%', textAlign: 'left' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Goal</span>
            <span style={{ textTransform: 'capitalize' }}>{state.investingGoal?.replace(/_/g, ' ') || 'Not set'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Experience</span>
            <span style={{ textTransform: 'capitalize' }}>{state.experience?.replace(/_/g, ' ') || 'Not set'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Accuracy</span>
            <span>{state.totalQuestionsAnswered > 0 ? Math.round((state.totalCorrectAnswers / state.totalQuestionsAnswered) * 100) + '%' : '—'}</span>
          </div>
        </div>
      </div>

      <button
        className="onboard-next"
        style={{ marginTop: '28px', background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' }}
        onClick={async () => {
          await logout();
        }}
      >
        Log Out
      </button>

      <PaywallModal 
        isOpen={showPaywall} 
        onClose={() => setShowPaywall(false)} 
        source="profile" 
      />
    </div>
  );
}
