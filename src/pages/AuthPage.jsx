import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { trackEvent } from '../lib/firebase';

const SLIDES = [
  {
    icon: 'flash',
    color: 'var(--accent-teal)',
    title: 'Instant Analysis',
    desc: 'Get plain-English breakdowns of company earnings, news, and market sentiment in seconds.'
  },
  {
    icon: 'scan',
    color: 'var(--accent-gold)',
    title: 'Scan Anything',
    desc: 'Upload a screenshot of any stock chart or portfolio and let Graham decode the Wall Street jargon.'
  },
  {
    icon: 'people',
    color: 'var(--accent-amber)',
    title: 'Multiple Personas',
    desc: 'Switch AI personalities — from The Financial Genius to The Wall Street Wolf — depending on your mood.'
  }
];

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, login, signup } = useUser();
  const [slideIndex, setSlideIndex] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (user) return <Navigate to="/app" replace />;

  const handleNextSlide = () => {
    if (slideIndex < SLIDES.length - 1) {
      setSlideIndex(s => s + 1);
    } else {
      setShowAuth(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
        trackEvent('sign_up');
      }
      navigate('/app');
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!showAuth) {
    const currentSlide = SLIDES[slideIndex];
    return (
      <div className="screen" style={{ justifyContent: 'center', alignItems: 'center', padding: '40px 24px', background: 'var(--bg-primary)' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: '400px' }}>
          
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '24px', 
            background: currentSlide.color, color: 'white', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontSize: '40px', marginBottom: '32px',
            boxShadow: `0 12px 24px ${currentSlide.color}40`
          }}>
            <ion-icon name={currentSlide.icon}></ion-icon>
          </div>
          
          <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '16px', letterSpacing: '-0.5px' }}>
            {currentSlide.title}
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1.5, padding: '0 16px' }}>
            {currentSlide.desc}
          </p>
        </div>

        <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '32px', marginTop: 'auto' }}>
          <div style={{ display: 'flex', gap: '8px', justifySelf: 'center', alignSelf: 'center' }}>
            {SLIDES.map((_, i) => (
              <div key={i} style={{ 
                height: '6px', width: i === slideIndex ? '24px' : '6px', 
                borderRadius: '3px', background: i === slideIndex ? 'var(--text-primary)' : 'var(--border-subtle)',
                transition: 'all 0.3s ease'
              }} />
            ))}
          </div>
          <button 
            onClick={handleNextSlide}
            style={{ 
              background: 'var(--text-primary)', color: 'var(--bg-primary)', 
              padding: '18px', borderRadius: 'var(--radius-pill)', 
              fontSize: '18px', fontWeight: 'bold', border: 'none', cursor: 'pointer',
              width: '100%'
            }}
          >
            {slideIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
          </button>
        </div>
      </div>
    );
  }

  // Native Auth Form View
  return (
    <div className="screen" style={{ padding: '40px 24px', background: 'var(--bg-primary)', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '400px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        <button 
          onClick={() => setShowAuth(false)} 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '28px', cursor: 'pointer', alignSelf: 'flex-start', marginBottom: '32px', padding: 0 }}
        >
          <ion-icon name="arrow-back-outline"></ion-icon>
        </button>

        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>
          {isLogin ? 'Welcome back' : 'Create account'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          {isLogin ? 'Log in to continue to Graham.' : 'Sign up to start scanning stocks.'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ background: 'var(--accent-rose-glow)', color: 'var(--accent-rose)', padding: '12px', borderRadius: '12px', fontSize: '14px', textAlign: 'center', fontWeight: '500' }}>
              {error}
            </div>
          )}
          
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ padding: '18px', borderRadius: '16px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', fontSize: '16px', outline: 'none', width: '100%' }}
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ padding: '18px', borderRadius: '16px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', fontSize: '16px', outline: 'none', width: '100%' }}
          />
          
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              background: 'var(--accent-gold)', color: '#FFF', 
              padding: '18px', borderRadius: 'var(--radius-pill)', 
              fontSize: '18px', fontWeight: 'bold', border: 'none', cursor: 'pointer',
              marginTop: '8px', opacity: loading ? 0.7 : 1, width: '100%'
            }}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        <div style={{ marginTop: 'auto', textAlign: 'center', paddingTop: '32px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(null); }}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 'bold', marginLeft: '6px', cursor: 'pointer', fontSize: '15px' }}
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
