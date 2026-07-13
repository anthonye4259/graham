import { useNavigate } from 'react-router-dom';

export default function Navbar({ onOpenPricing }) {
  const navigate = useNavigate();

  return (
    <nav className="g-navbar">
      <div className="g-navbar-inner">
        <div className="g-nav-logo" onClick={() => navigate('/')}>graham.</div>
        <div className="g-nav-links">
          <a href="#capabilities" className="g-nav-link">Capabilities</a>
          <button className="g-nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }} onClick={onOpenPricing}>Pricing</button>
        </div>
        <div className="g-nav-actions">
          <button className="g-nav-login" onClick={() => navigate('/auth')}>Log in</button>
          <button className="g-nav-cta" onClick={() => navigate('/auth')}>Get Started</button>
        </div>
      </div>
    </nav>
  );
}
