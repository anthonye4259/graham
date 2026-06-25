import React, { useState } from 'react';
import Sparkline from '../ui/Sparkline';
import { hapticSelection } from '../../lib/haptics';
import BrokerageActionSheet from '../ui/BrokerageActionSheet';

export default function StockOfTheDayCard({ stock, insight, onTrade }) {
  const [showBrokerage, setShowBrokerage] = useState(false);
  const isUp = stock.change >= 0;
  const color = isUp ? 'var(--accent-teal)' : 'var(--accent-rose)';

  return (
    <div style={{
      width: '100%',
      height: '100%',
      padding: 'calc(env(safe-area-inset-top) + 60px) 24px calc(env(safe-area-inset-bottom) + 120px) 24px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      position: 'relative'
    }}>
      {/* Premium Badge */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <div style={{
          background: 'var(--accent-gold-glow)',
          border: '1px solid var(--accent-gold)',
          color: 'var(--accent-gold)',
          padding: '6px 16px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '800',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 4px 12px rgba(166,124,82,0.15)'
        }}>
          <ion-icon name="flame"></ion-icon> Stock of the Day
        </div>
      </div>

      {/* Main Content Card */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '24px',
        border: '1px solid var(--border-light)',
        padding: '32px 24px',
        boxShadow: '0 12px 48px rgba(26,24,21,0.06)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        <h1 style={{ fontSize: '48px', fontWeight: '900', color: 'var(--text-primary)', margin: '0 0 8px 0', letterSpacing: '-1px' }}>
          {stock.ticker}
        </h1>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-secondary)', margin: '0 0 24px 0' }}>
          {stock.name}
        </h2>

        {/* Live Data Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)' }}>
              ${Number(stock.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: color, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ion-icon name={isUp ? 'caret-up' : 'caret-down'}></ion-icon>
              {Math.abs(Number(stock.change) || 0).toFixed(2)}% Today
            </div>
          </div>
          
          <div style={{ width: '100px', height: '40px' }}>
            <Sparkline data={stock.history} color={color} width={100} height={40} />
          </div>
        </div>

        {/* AI Insight */}
        <div style={{
          background: 'var(--bg-main)',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          width: '100%'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-gold)' }}>
            <ion-icon name="sparkles"></ion-icon>
            <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px' }}>THE THESIS</span>
          </div>
          <p style={{ margin: 0, fontSize: '16px', lineHeight: '1.5', color: 'var(--text-primary)', fontWeight: '500' }}>
            {insight}
          </p>
        </div>

      </div>

      {/* Action Button */}
      <div style={{ marginTop: '32px' }}>
        <button
          onClick={() => { hapticSelection(); setShowBrokerage(true); }}
          className="hover-bg"
          style={{
            width: '100%',
            padding: '20px',
            background: 'linear-gradient(135deg, var(--text-primary), #3a3a3c)',
            border: 'none',
            borderRadius: '20px',
            color: '#FFF',
            fontSize: '18px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            boxShadow: '0 8px 24px rgba(26,24,21,0.2)'
          }}
        >
          <ion-icon name="analytics-outline" style={{ fontSize: '24px' }}></ion-icon>
          Trade Now
        </button>
      </div>

      <BrokerageActionSheet 
        isOpen={showBrokerage}
        onClose={() => setShowBrokerage(false)}
        assetId={stock.ticker}
        assetName={stock.name}
        assetPrice={stock.price}
      />
    </div>
  );
}
