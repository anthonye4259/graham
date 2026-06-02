import React, { useState, useRef, useEffect } from 'react';
import { jargonDictionary } from '../../lib/jargonDictionary';
import { hapticSelection } from '../../lib/haptics';

export default function JargonText({ text, style }) {
  const [activeWord, setActiveWord] = useState(null);
  const tooltipRef = useRef(null);

  // Close tooltip if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setActiveWord(null);
      }
    };
    if (activeWord) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [activeWord]);

  if (!text || typeof text !== 'string') return <span style={style}>{text}</span>;

  // Build a regex to match any of the dictionary keys
  // Sort by length descending so longer phrases match first ("S&P 500 Index Fund" before "S&P 500")
  const keys = Object.keys(jargonDictionary).sort((a, b) => b.length - a.length);
  // Escape regex specials
  const escapedKeys = keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  
  if (escapedKeys.length === 0) return <span style={style}>{text}</span>;

  const regex = new RegExp(`(${escapedKeys.join('|')})`, 'gi');
  const parts = text.split(regex);

  const handleWordClick = (word, e) => {
    e.stopPropagation();
    hapticSelection();
    
    // Find the original key to get the correct definition regardless of case
    const originalKey = Object.keys(jargonDictionary).find(k => k.toLowerCase() === word.toLowerCase());
    
    if (activeWord === originalKey) {
      setActiveWord(null); // toggle off
    } else {
      setActiveWord(originalKey);
    }
  };

  return (
    <span style={{ ...style, position: 'relative' }}>
      {parts.map((part, i) => {
        const lowerPart = part.toLowerCase();
        const matchedKey = Object.keys(jargonDictionary).find(k => k.toLowerCase() === lowerPart);

        if (matchedKey) {
          return (
            <span key={i} style={{ position: 'relative', display: 'inline-block' }}>
              <button
                className="jargon-word"
                onClick={(e) => handleWordClick(part, e)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: '1.5px dashed rgba(255,255,255,0.6)',
                  color: 'inherit',
                  font: 'inherit',
                  padding: 0,
                  margin: 0,
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'color 0.2s, border-bottom-color 0.2s',
                  color: activeWord === matchedKey ? '#FFF' : 'inherit',
                  borderBottomColor: activeWord === matchedKey ? '#FFF' : 'rgba(255,255,255,0.6)',
                }}
              >
                {part}
              </button>
              
              {/* Tooltip Bubble */}
              {activeWord === matchedKey && (
                <div 
                  ref={tooltipRef}
                  className="jargon-tooltip fade-in-up"
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 12px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 'max-content',
                    maxWidth: '240px',
                    backgroundColor: 'rgba(250, 247, 242, 0.95)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    color: '#1A1815',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.8)',
                    zIndex: 100,
                    textAlign: 'left',
                    fontSize: '14px',
                    lineHeight: '1.4',
                    fontWeight: '500',
                    pointerEvents: 'auto',
                    border: '0.5px solid rgba(26,24,21,0.08)'
                  }}
                >
                  {/* Little Arrow pointing down */}
                  <div style={{
                    position: 'absolute',
                    bottom: '-6px',
                    left: '50%',
                    transform: 'translateX(-50%) rotate(45deg)',
                    width: '12px',
                    height: '12px',
                    backgroundColor: 'rgba(250, 247, 242, 0.95)',
                    borderRight: '0.5px solid rgba(26,24,21,0.08)',
                    borderBottom: '0.5px solid rgba(26,24,21,0.08)',
                    zIndex: -1
                  }} />
                  {jargonDictionary[matchedKey]}
                </div>
              )}
            </span>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </span>
  );
}
