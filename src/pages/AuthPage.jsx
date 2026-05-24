import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import Navbar from '../components/ui/Navbar';

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, login, signup } = useUser();
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
      navigate('/app');
    } catch (err) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  if (user) return <Navigate to="/app" replace />;

  return (
    <div className="g-landing">
      <Navbar />
      <main className="g-hero" style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h1 className="g-hero-title" style={{ fontSize: '2rem', marginBottom: '8px' }}>
          {isLogin ? 'Welcome back' : 'Create an account'}
        </h1>
        <p className="g-hero-sub" style={{ marginBottom: '32px' }}>
          {isLogin ? 'Log in to continue your financial journey.' : 'Join Graham and start investing risk-free.'}
        </p>

        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '400px', margin: '0 auto', background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
          {error && (
            <div style={{ background: 'var(--accent-rose)', color: 'white', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
              <label style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '16px' }}
                placeholder="you@example.com"
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
              <label style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '16px' }}
                placeholder="At least 6 characters"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="share-insight-btn" 
            style={{ width: '100%', background: 'var(--text-primary)', color: 'var(--bg-primary)', justifyContent: 'center' }}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        <p style={{ marginTop: '24px', color: 'var(--text-secondary)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button" 
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            style={{ background: 'none', border: 'none', color: 'var(--accent-amber)', cursor: 'pointer', fontWeight: 600, padding: 0 }}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </main>
    </div>
  );
}
