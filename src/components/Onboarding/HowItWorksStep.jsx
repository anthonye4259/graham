export default function HowItWorksStep({ onNext }) {
  return (
    <div className="ob-container">
      <div className="ob-content" style={{ maxWidth: '600px', textAlign: 'center', padding: '0 24px' }}>
        
        <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'var(--accent-teal)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', margin: '0 auto 24px auto', boxShadow: '0 12px 24px rgba(45, 212, 191, 0.3)' }}>
          <ion-icon name="school-outline"></ion-icon>
        </div>

        <h1 style={{ fontSize: '32px', marginBottom: '16px', fontWeight: '800', letterSpacing: '-0.5px' }}>
          How Graham Teaches You
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '18px', marginBottom: '40px', lineHeight: 1.5 }}>
          Graham isn't just a toy. It's a structured learning engine designed to build your financial literacy.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'left', marginBottom: '48px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
              <ion-icon name="scan-outline"></ion-icon>
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>Snap & Scan</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.4 }}>Take a photo of any confusing stock chart. Graham decodes it instantly.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--accent-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
              <ion-icon name="flame-outline"></ion-icon>
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>Build Daily Habits</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.4 }}>Complete 3-minute interactive lessons. Keep your streak alive to level up.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
              <ion-icon name="chatbubbles-outline"></ion-icon>
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>No Bullshit</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.4 }}>Ask your AI Persona any question without feeling stupid. They give it to you straight.</p>
            </div>
          </div>
        </div>

        <button 
          className="ob-next-btn onboard-next" 
          onClick={onNext}
          style={{ width: '100%', padding: '18px', borderRadius: 'var(--radius-pill)', fontSize: '18px', fontWeight: 'bold', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', cursor: 'pointer' }}
        >
          I'm Ready
        </button>

      </div>
    </div>
  );
}
