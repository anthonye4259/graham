import React from 'react';

export default function MacroTerminalCard({ data }) {
  if (!data) return null;

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid var(--border-subtle)',
      color: 'var(--text-primary)',
      fontFamily: 'monospace',
      width: '100%',
      maxWidth: '400px',
      boxShadow: '0 10px 30px rgba(26,24,21,0.06)',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
        <div style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>Macro//Daily</div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>TERMINAL v4.22</div>
      </div>

      {/* Quotes Grid */}
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Global Macro Daily — Live Indicators</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {data.quotes?.map((q) => {
            const isUp = q.status === 'up' || String(q.change).includes('+');
            const color = isUp ? 'var(--accent-green)' : 'var(--accent-rose)';
            return (
              <div key={q.id} style={{ border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '8px', background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{q.id}</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: color }}>
                  {typeof q.price === 'number' ? q.price.toLocaleString(undefined, {minimumFractionDigits: 2}) : q.price}
                </div>
                <div style={{ fontSize: '10px', color: color }}>
                  {q.change} ({q.changePercent})
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* News Parsing Engine */}
      <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '6px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
        <div style={{ padding: '4px 8px', background: 'var(--bg-tertiary)', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)' }}>
          News Parsing Engine
        </div>
        <div style={{ padding: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--accent-teal)', marginBottom: '4px' }}>LIVE FED PARSE</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
            "{data.newsSummary?.headline}"
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {data.newsSummary?.body}
          </div>
        </div>
      </div>

      {/* Trade Ideas */}
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Auto-Generated Trade Ideas</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {data.tradeIdeas?.map((idea, i) => {
            const isLong = (idea.type || '').includes('LONG') || (idea.type || '').includes('BUY');
            const color = isLong ? 'var(--accent-green)' : 'var(--accent-rose)';
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', padding: '2px 6px', background: isLong ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: color, borderRadius: '4px', fontWeight: 'bold' }}>{idea.type}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 'bold' }}>{idea.target}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{idea.rationale}</div>
                <div style={{ width: '100%', height: '2px', background: 'var(--border-subtle)', marginTop: '4px', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: idea.conviction === 'High' ? '80%' : idea.conviction === 'Medium' ? '50%' : '20%', background: color }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
