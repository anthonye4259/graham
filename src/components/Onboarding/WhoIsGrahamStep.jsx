export default function WhoIsGrahamStep({ onNext }) {
  return (
    <div className="ob-container">
      <div className="ob-content" style={{ maxWidth: '600px', textAlign: 'center', padding: '0 24px' }}>
        
        <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--accent-gold)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px', margin: '0 auto 32px auto', boxShadow: '0 12px 24px rgba(212, 175, 55, 0.3)' }}>
          <ion-icon name="book-outline"></ion-icon>
        </div>

        <h1 style={{ fontSize: '32px', marginBottom: '16px', fontWeight: '800', letterSpacing: '-0.5px' }}>
          Who is Graham?
        </h1>
        
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)', marginBottom: '32px', textAlign: 'left' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.6, marginBottom: '16px' }}>
            <strong>Benjamin Graham</strong> is known as the "father of value investing." He literally wrote the book on the stock market (<em>The Intelligent Investor</em>) in 1949.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.6 }}>
            More importantly, he was the mentor and professor to <strong>Warren Buffett</strong>. Buffett still credits Graham with teaching him everything he knows about building generational wealth.
          </p>
        </div>

        <p style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600', marginBottom: '40px', lineHeight: 1.4 }}>
          We built Graham AI to be <em>your</em> personal mentor.
        </p>

        <button 
          className="ob-next-btn onboard-next" 
          onClick={onNext}
          style={{ width: '100%', padding: '18px', borderRadius: 'var(--radius-pill)', fontSize: '18px', fontWeight: 'bold', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', cursor: 'pointer' }}
        >
          Meet Your AI
        </button>

      </div>
    </div>
  );
}
