import React from 'react';

export default function MacroTerminalCard({ data }) {
  if (!data) return null;

  return (
    <div style={{
      background: '#0d1117',
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid #30363d',
      color: '#c9d1d9',
      fontFamily: 'monospace',
      width: '100%',
      maxWidth: '400px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #30363d', paddingBottom: '8px' }}>
        <div style={{ color: '#d2a8ff', fontWeight: 'bold' }}>Macro//Daily</div>
        <div style={{ fontSize: '10px', color: '#8b949e' }}>TERMINAL v4.22</div>
      </div>

      {/* Quotes Grid */}
      <div>
        <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '8px', textTransform: 'uppercase' }}>Global Macro Daily — Live Indicators</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {data.quotes?.map((q) => {
            const isUp = q.status === 'up' || String(q.change).includes('+');
            const color = isUp ? '#3fb950' : '#f85149';
            return (
              <div key={q.id} style={{ border: `1px solid #30363d`, borderRadius: '6px', padding: '8px', background: '#161b22' }}>
                <div style={{ fontSize: '10px', color: '#8b949e' }}>{q.id}</div>
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
      <div style={{ border: '1px solid #30363d', borderRadius: '6px', background: '#161b22', overflow: 'hidden' }}>
        <div style={{ padding: '4px 8px', background: '#21262d', fontSize: '10px', color: '#8b949e', textTransform: 'uppercase', borderBottom: '1px solid #30363d' }}>
          News Parsing Engine
        </div>
        <div style={{ padding: '12px' }}>
          <div style={{ fontSize: '12px', color: '#58a6ff', marginBottom: '4px' }}>LIVE FED PARSE</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#c9d1d9', marginBottom: '8px' }}>
            "{data.newsSummary?.headline}"
          </div>
          <div style={{ fontSize: '12px', color: '#8b949e', lineHeight: 1.5 }}>
            {data.newsSummary?.body}
          </div>
        </div>
      </div>

      {/* Trade Ideas */}
      <div>
        <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '8px', textTransform: 'uppercase' }}>Auto-Generated Trade Ideas</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {data.tradeIdeas?.map((idea, i) => {
            const isLong = idea.type.includes('LONG') || idea.type.includes('BUY');
            const color = isLong ? '#3fb950' : '#f85149';
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', padding: '2px 6px', background: `${color}20`, color: color, borderRadius: '4px', fontWeight: 'bold' }}>{idea.type}</span>
                  <span style={{ fontSize: '12px', color: '#c9d1d9', fontWeight: 'bold' }}>{idea.target}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#8b949e' }}>{idea.rationale}</div>
                <div style={{ width: '100%', height: '2px', background: '#30363d', marginTop: '4px', position: 'relative' }}>
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
