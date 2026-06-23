import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Log crash to Firestore for remote debugging
    try {
      import('../lib/firebase').then(({ db }) => {
        import('firebase/firestore').then(({ doc, setDoc }) => {
          const errorId = `crash_${Date.now()}`;
          setDoc(doc(db, 'crash_logs', errorId), {
            message: error?.message || 'Unknown error',
            stack: error?.stack?.substring(0, 1000) || '',
            componentStack: errorInfo?.componentStack?.substring(0, 500) || '',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          }).catch(() => {});
        });
      });
    } catch (e) { /* don't let logging crash the error boundary */ }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          background: 'linear-gradient(180deg, var(--bg-main, #FAF7F2) 0%, #EEF1F6 50%, #D6E2EF 100%)',
          textAlign: 'center',
          fontFamily: "var(--font-sans, 'Inter'), -apple-system, sans-serif"
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary, #1A1815)', marginBottom: '8px' }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary, #6B6560)', marginBottom: '24px', maxWidth: '320px', lineHeight: '1.5' }}>
            Graham encountered an unexpected error. Please restart the app.
          </p>
          
          {/* Show error details for debugging */}
          <div style={{ 
            background: 'var(--bg-secondary, rgba(0,0,0,0.05))', 
            borderRadius: '12px', 
            padding: '12px 16px', 
            maxWidth: '320px', 
            width: '100%', 
            marginBottom: '24px',
            textAlign: 'left',
            fontSize: '11px',
            color: 'var(--text-secondary, #6B6560)',
            fontFamily: 'monospace',
            wordBreak: 'break-word',
            maxHeight: '120px',
            overflowY: 'auto'
          }}>
            {this.state.error?.message || 'No error details available'}
          </div>

          <button
            onClick={() => {
              this.setState({ hasError: false, error: null, errorInfo: null });
              window.location.href = '/app';
            }}
            style={{
              padding: '14px 32px',
              borderRadius: '14px',
              border: 'none',
              background: 'var(--accent-warm, #A67C52)',
              color: '#FFF',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              minHeight: '48px'
            }}
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
