import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="g-navbar">
      <div className="g-navbar-inner">
        <div className="g-nav-logo" onClick={() => navigate('/')}>graham.</div>
        <div className="g-nav-links">
          <a href="#features" className="g-nav-link">Learn</a>
          <a href="#how" className="g-nav-link">How it Works</a>
          <a href="#pricing" className="g-nav-link">Pricing</a>
        </div>
        <div className="g-nav-actions">
          <button className="g-nav-login" onClick={() => navigate('/auth')}>Log in</button>
          <button className="g-nav-cta" onClick={() => navigate('/auth')}>Get Started</button>
        </div>
      </div>
    </nav>
  );
}
