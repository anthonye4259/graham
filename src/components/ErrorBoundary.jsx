import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
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
          background: 'linear-gradient(180deg, #FAF7F2 0%, #EEF1F6 50%, #D6E2EF 100%)',
          textAlign: 'center',
          fontFamily: "'Inter', -apple-system, sans-serif"
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1A1815', marginBottom: '8px' }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: '15px', color: '#6B6560', marginBottom: '24px', maxWidth: '320px', lineHeight: '1.5' }}>
            Graham encountered an unexpected error. Please restart the app.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = '/app';
            }}
            style={{
              padding: '14px 32px',
              borderRadius: '14px',
              border: 'none',
              background: '#A67C52',
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
