import { useNavigate } from 'react-router-dom';

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto', width: '100%', color: 'var(--text-primary)' }}>
      <button 
        onClick={() => navigate(-1)}
        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <ion-icon name="arrow-back-outline"></ion-icon> Back
      </button>
      
      <h1 style={{ fontSize: '32px', marginBottom: '24px' }}>Privacy Policy</h1>
      
      <div style={{ lineHeight: '1.6', color: 'var(--text-secondary)' }}>
        <p style={{ marginBottom: '16px' }}><strong>Last Updated: [Date]</strong></p>
        <p style={{ marginBottom: '16px' }}>This Privacy Policy describes how we collect, use, and handle your information when you use our website, products, and services.</p>
        
        <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginTop: '24px', marginBottom: '12px' }}>1. Information We Collect</h2>
        <p style={{ marginBottom: '16px' }}>We collect information you provide directly to us, such as when you create an account, make a purchase, or communicate with us.</p>
        
        <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginTop: '24px', marginBottom: '12px' }}>2. How We Use Your Information</h2>
        <p style={{ marginBottom: '16px' }}>We use the information we collect to provide, maintain, and improve our services, to process transactions, and to send you related information.</p>
        
        <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginTop: '24px', marginBottom: '12px' }}>3. Contact Us</h2>
        <p style={{ marginBottom: '16px' }}>If you have any questions about this Privacy Policy, please contact us at support@yourdomain.com.</p>
      </div>
    </div>
  );
}
