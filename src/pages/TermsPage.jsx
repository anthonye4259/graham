import { useNavigate } from 'react-router-dom';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto', width: '100%', color: 'var(--text-primary)' }}>
      <button 
        onClick={() => navigate(-1)}
        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <ion-icon name="arrow-back-outline"></ion-icon> Back
      </button>
      
      <h1 style={{ fontSize: '32px', marginBottom: '24px' }}>Terms of Service</h1>
      
      <div style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
        <p style={{ marginBottom: '16px' }}><strong>Last Updated: [Date]</strong></p>
        <p style={{ marginBottom: '16px' }}>Please read these Terms of Service carefully before using our website and services.</p>
        
        <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginTop: '24px', marginBottom: '12px' }}>1. Acceptance of Terms</h2>
        <p style={{ marginBottom: '16px' }}>By accessing or using our services, you agree to be bound by these Terms.</p>
        
        <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginTop: '24px', marginBottom: '12px' }}>2. Subscriptions and Payments</h2>
        <p style={{ marginBottom: '16px' }}>Certain features require a paid subscription. Payments are processed securely via our payment providers. You may cancel your subscription at any time.</p>
        
        <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginTop: '24px', marginBottom: '12px' }}>3. Disclaimer</h2>
        <p style={{ marginBottom: '16px' }}>The content provided by our AI is for informational and educational purposes only and does not constitute professional financial advice. Always do your own research before making investment decisions.</p>
      </div>
    </div>
  );
}
