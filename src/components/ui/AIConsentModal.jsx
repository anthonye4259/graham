import { Link } from 'react-router-dom';

export default function AIConsentModal({ isOpen, onAccept, onDecline }) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onDecline}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          borderRadius: '24px 24px 0 0',
          padding: '24px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '85vh',
          overflowY: 'auto',
          animation: 'slideUp 0.3s ease-out',
        }}
      >
        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(0, 255, 170, 0.1)',
            }}
          >
            <ion-icon
              name="shield-checkmark-outline"
              style={{ fontSize: '28px', color: 'var(--accent-teal)' }}
            ></ion-icon>
          </div>
        </div>

        {/* Title */}
        <h2
          style={{
            textAlign: 'center',
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 16px 0',
          }}
        >
          AI Data Disclosure
        </h2>

        {/* Body */}
        <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
          <p style={{ margin: '0 0 12px 0' }}>
            Graham uses Google Gemini AI to analyze stocks and generate investment insights.
          </p>
          <p style={{ margin: '0 0 8px 0' }}>
            When you use AI features, the following data may be sent to Google for processing:
          </p>

          <ul style={{ margin: '0 0 12px 0', paddingLeft: '0', listStyle: 'none' }}>
            <li
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
              }}
            >
              <ion-icon
                name="checkmark-circle"
                style={{ fontSize: '16px', color: 'var(--accent-teal)', flexShrink: 0 }}
              ></ion-icon>
              <span>Your questions and stock queries</span>
            </li>
            <li
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
              }}
            >
              <ion-icon
                name="checkmark-circle"
                style={{ fontSize: '16px', color: 'var(--accent-teal)', flexShrink: 0 }}
              ></ion-icon>
              <span>Uploaded images (screenshots, charts)</span>
            </li>
            <li
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '0',
              }}
            >
              <ion-icon
                name="checkmark-circle"
                style={{ fontSize: '16px', color: 'var(--accent-teal)', flexShrink: 0 }}
              ></ion-icon>
              <span>Conversation history within this session</span>
            </li>
          </ul>

          <p style={{ margin: '0 0 12px 0' }}>
            This data is processed according to Google's Privacy Policy. Graham does not sell your
            personal data.
          </p>

          <Link
            to="/privacy"
            style={{
              color: 'var(--accent-teal)',
              fontSize: '13px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            View our Privacy Policy →
          </Link>
        </div>

        {/* Buttons */}
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={onAccept}
            style={{
              width: '100%',
              padding: '16px',
              background: 'var(--accent-teal)',
              color: '#000',
              border: 'none',
              borderRadius: '14px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              minHeight: '52px',
            }}
          >
            I Agree &amp; Continue
          </button>
          <button
            onClick={onDecline}
            style={{
              width: '100%',
              padding: '14px',
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: 'none',
              borderRadius: '14px',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              minHeight: '44px',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
