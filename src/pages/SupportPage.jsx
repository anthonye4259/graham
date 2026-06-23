export default function SupportPage() {
  return (
    <div style={{ padding: '40px 24px', maxWidth: '600px', margin: '0 auto', color: 'var(--text-primary)' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '24px' }}>Graham AI Support</h1>
      
      <div style={{ marginBottom: '32px', background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--accent-teal)' }}>Contact Us</h2>
        <p style={{ marginBottom: '16px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
          Need help with your account, billing, or the app? Our team is here to assist you.
        </p>
        <p style={{ fontWeight: 'bold' }}>
          Email: <a href="mailto:support@grahamai.com" style={{ color: 'var(--accent-blue)' }}>support@grahamai.com</a>
        </p>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Frequently Asked Questions</h2>
        
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>How do I manage my subscription?</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            If you subscribed via the iOS App Store, you can manage or cancel your subscription by going to your iPhone Settings &gt; Apple ID &gt; Subscriptions. If you subscribed on the web, visit the Profile tab in the app to access the billing portal.
          </p>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>How do I restore my purchases?</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            If you reinstalled the app or got a new phone, go to the Profile tab and tap the settings gear icon to access the "Restore Purchases" button.
          </p>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>How do I delete my account?</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            You can delete your account permanently by going to the Profile tab, selecting Settings, and tapping "Delete Account" at the bottom of the screen.
          </p>
        </div>
      </div>
    </div>
  );
}
