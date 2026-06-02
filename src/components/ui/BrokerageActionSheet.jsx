import React, { useEffect, useState } from 'react';
import { hapticSelection, hapticSuccess } from '../../lib/haptics';
import { useUser } from '../../context/UserContext';

export default function BrokerageActionSheet({ isOpen, onClose, assetId, assetName, assetPrice }) {
  const [isVisible, setIsVisible] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const { state, setState } = useUser();

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  const isCrypto = ['BTC', 'ETH', 'SOL'].includes(assetId);

  const handlePaperTrade = () => {
    hapticSuccess();
    const priceToUse = assetPrice || '100.00'; // fallback
    state.simulateBuy(assetId, assetName || assetId, priceToUse.toString());
    
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      onClose();
    }, 2000);
  };

  const handleRoute = (brokerage) => {
    hapticSuccess();
    
    if (!state.milestones?.includes('first_brokerage')) {
      setState({ milestones: [...(state.milestones || []), 'first_brokerage'] });
    }
    
    // Fallbacks or real deep-links depending on the asset
    // These are web URLs that typically intercept into native apps if installed
    let url = '';
    
    if (brokerage === 'Robinhood') {
      url = `https://robinhood.com/stocks/${assetId}`;
    } else if (brokerage === 'Coinbase') {
      url = `https://www.coinbase.com/price/${assetName?.toLowerCase().replace(/\s+/g, '-') || assetId.toLowerCase()}`;
    } else if (brokerage === 'Fidelity') {
      url = `https://digital.fidelity.com/prgw/digital/research/quote/dashboard/summary?symbol=${assetId}`;
    } else if (brokerage === 'Public') {
      url = `https://public.com/stocks/${assetId.toLowerCase()}`;
    }

    if (url) {
      window.open(url, '_blank');
    }
    
    onClose();
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        pointerEvents: isOpen ? 'auto' : 'none'
      }}
    >
      {/* Backdrop */}
      <div 
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s ease',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)'
        }}
        onClick={() => { hapticSelection(); onClose(); }}
      />

      {/* Sheet */}
      <div 
        style={{
          position: 'relative',
          backgroundColor: 'var(--bg-glass)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          padding: '24px 20px calc(24px + env(safe-area-inset-bottom)) 20px',
          boxShadow: '0 -12px 48px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,1)',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '40px', height: '5px', backgroundColor: 'var(--border-subtle)', borderRadius: '4px', margin: '0 auto 16px auto' }} />
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>Execute Trade</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
            Where would you like to buy <strong style={{ color: 'var(--text-primary)' }}>{assetName || assetId}</strong>?
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Practice Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--accent-gold)' }}>
              <ion-icon name="school-outline"></ion-icon>
              <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Practice First</span>
            </div>
            <button 
              onClick={handlePaperTrade}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                background: 'linear-gradient(135deg, rgba(166,124,82,0.1), rgba(166,124,82,0.05))',
                border: '1px solid var(--accent-gold)',
                borderRadius: '16px',
                color: 'var(--accent-gold)',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(166,124,82,0.1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--accent-gold)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                  <ion-icon name="cash-outline" style={{ fontSize: '18px' }}></ion-icon>
                </div>
                Paper Trade on Graham
              </div>
              <ion-icon name="checkmark-circle-outline" style={{ fontSize: '20px' }}></ion-icon>
            </button>
          </div>

          {/* Real Execution Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-secondary)' }}>
              <ion-icon name="wallet-outline"></ion-icon>
              <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Execute Real Trade</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Robinhood - Primary for Stocks */}
          {!isCrypto && (
            <button 
              onClick={() => handleRoute('Robinhood')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                color: 'var(--text-primary)',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', backgroundColor: '#00C805', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                  <ion-icon name="leaf" style={{ fontSize: '18px' }}></ion-icon>
                </div>
                Robinhood
              </div>
              <ion-icon name="open-outline" style={{ color: 'var(--text-tertiary)' }}></ion-icon>
            </button>
          )}

          {/* Coinbase - Primary for Crypto */}
          {isCrypto && (
            <button 
              onClick={() => handleRoute('Coinbase')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                color: 'var(--text-primary)',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', backgroundColor: '#0052FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                  <ion-icon name="logo-bitcoin" style={{ fontSize: '18px' }}></ion-icon>
                </div>
                Coinbase
              </div>
              <ion-icon name="open-outline" style={{ color: 'var(--text-tertiary)' }}></ion-icon>
            </button>
          )}

          {/* Alternatives */}
          {!isCrypto && (
            <button 
              onClick={() => handleRoute('Fidelity')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                backgroundColor: 'transparent',
                border: '1px solid transparent',
                borderRadius: '16px',
                color: 'var(--text-secondary)',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', backgroundColor: '#429A46', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                  <ion-icon name="trending-up" style={{ fontSize: '18px' }}></ion-icon>
                </div>
                Fidelity
              </div>
              <ion-icon name="open-outline" style={{ color: 'var(--text-tertiary)' }}></ion-icon>
            </button>
          )}
            </div>
          </div>
        </div>
        
        <button  
          onClick={() => { hapticSelection(); onClose(); }}
          style={{ width: '100%', padding: '16px', marginTop: '16px', background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>

      {/* Toast Notification */}
      <div style={{
        position: 'absolute',
        bottom: showToast ? 'calc(100% + 16px)' : 'calc(100% - 20px)',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'var(--accent-gold)',
        color: '#FFF',
        padding: '12px 24px',
        borderRadius: '24px',
        fontSize: '14px',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        opacity: showToast ? 1 : 0,
        pointerEvents: 'none',
        transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
        boxShadow: '0 8px 32px rgba(166,124,82,0.3)',
        zIndex: 1001,
        whiteSpace: 'nowrap'
      }}>
        <ion-icon name="checkmark-circle"></ion-icon>
        Added to Fantasy Portfolio!
      </div>
    </div>
  );
}
