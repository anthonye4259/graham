import React from 'react';
import JargonText from './JargonText';

export default function DailyBrieferCard({ data }) {
  if (!data) return null;

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: '20px',
      padding: '24px',
      border: '1px solid var(--border-subtle)',
      color: 'var(--text-primary)',
      width: '100%',
      maxWidth: '500px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
        <div style={{ fontSize: '13px', color: 'var(--accent-gold)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
          The Daily Briefer
        </div>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', lineHeight: 1.2, color: 'var(--text-primary)' }}>
          {data.title || "Your Daily Financial Update"}
        </h2>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px', fontWeight: '500' }}>
          {data.date || new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {data.sections?.map((section, index) => (
          <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {section.heading}
            </h3>
            <div style={{ fontSize: '16px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              <JargonText text={section.content} />
            </div>
          </div>
        ))}

        {(!data.sections || data.sections.length === 0) && (
          <div style={{ fontSize: '16px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            No updates for today. Check back tomorrow!
          </div>
        )}
      </div>

    </div>
  );
}
