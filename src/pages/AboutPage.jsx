import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', color: 'var(--text-primary)', fontFamily: 'var(--font-family)', display: 'flex', flexDirection: 'column' }}>
      <nav className="g-navbar">
        <Link to="/" className="g-logo">
          <ion-icon name="trending-up" class="g-logo-icon"></ion-icon>
          <span>Graham</span>
        </Link>
        <div className="g-nav-links">
          <button className="g-btn-primary" onClick={() => navigate('/auth')}>Sign In</button>
        </div>
      </nav>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 24px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', fontWeight: '800', marginBottom: '24px', background: 'linear-gradient(90deg, #fff, var(--accent-teal))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Our Story
        </h1>
        
        <div style={{ 
          width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-blue))', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '48px', fontWeight: 'bold', marginBottom: '32px',
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.2)'
        }}>
          AE
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '24px', padding: '40px', textAlign: 'left', lineHeight: '1.8', fontSize: '18px', color: 'var(--text-secondary)' }}>
          <p style={{ marginBottom: '24px' }}>
            I've always had a passion for investing.
          </p>
          <p style={{ marginBottom: '24px' }}>
            At 15 years old, I picked up a copy of <em>The Intelligent Investor</em> by Benjamin Graham. That book completely rewired how I looked at the world. I immediately started my own portfolio, waking up daily at 5:00 AM just to turn on CNBC and catch the pre-market action before school.
          </p>
          <p style={{ marginBottom: '24px' }}>
            That obsession eventually led me to work in asset management and investment banking. I immersed myself in the technicals, eventually studying at a university renowned as a top school for quant trading and algorithm investing. 
          </p>
          <p style={{ marginBottom: '24px' }}>
            Throughout my journey from a 15-year-old retail investor to the institutional side of finance, I realized something: the tools available to everyday investors were fundamentally broken. They were either too basic, or so overly complex that they required a Bloomberg terminal to understand.
          </p>
          <p style={{ marginBottom: '24px' }}>
            That's why I built <strong>Graham AI</strong>.
          </p>
          <p>
            Named in honor of Benjamin Graham, this platform is a distillation of everything I've learned. It is designed to bridge the gap between retail passion and institutional intelligence. I wanted to build the financial mentor that I wish I had when I was waking up at 5 AM.
          </p>
          <p style={{ marginTop: '32px', fontStyle: 'italic', color: 'var(--text-primary)', textAlign: 'center' }}>
            — Anthony Edwards, Founder
          </p>
        </div>
      </main>

      <footer className="g-footer">
        <div>© 2026 Graham AI. All rights reserved.</div>
        <div className="g-footer-links">
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
          <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</Link>
          <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</Link>
        </div>
      </footer>
    </div>
  );
}
