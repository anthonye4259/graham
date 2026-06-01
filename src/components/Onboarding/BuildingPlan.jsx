import { useEffect, useState } from 'react';
import { useUser } from '../../context/UserContext';

export default function BuildingPlan({ onDone }) {
  const { state } = useUser();
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState(['Initializing AI Core...']);

  useEffect(() => {
    const phases = [
      { p: 10, text: `> Connecting to secure data stream...` },
      { p: 25, text: `> Tuning neural pathways to ${state.name || 'user'} profile...` },
      { p: 40, text: `> Setting objective: ${state.investingGoal || 'Wealth Generation'}` },
      { p: 55, text: `> Compiling risk parameters: ${state.riskTolerance?.split(',')[0] || 'Dynamic'}` },
      { p: 70, text: `> Loading ${state.persona || 'Graham'} persona matrices...` },
      { p: 85, text: `> Establishing direct bridge to exchanges...` },
      { p: 95, text: `> Finalizing encryption...` },
      { p: 100, text: '> AI AGENT READY.' }
    ];

    let currentPhase = 0;
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + (Math.random() * 3);
        
        if (currentPhase < phases.length && next >= phases[currentPhase].p) {
          setLogs(l => [...l, phases[currentPhase].text].slice(-5));
          currentPhase++;
        }

        if (next >= 100) {
          clearInterval(interval);
          setTimeout(onDone, 1200);
          return 100;
        }
        return next;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [onDone, state]);

  return (
    <div className="ob-container" style={{ justifyContent: 'center', alignItems: 'center', background: '#0a0a0a' }}>
      <div style={{ maxWidth: '500px', width: '100%', padding: '32px', borderRadius: '16px', border: '1px solid #333', background: '#111', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'var(--accent-teal)', animation: 'pulse 1s infinite' }}></div>
        
        <h2 style={{ fontSize: '24px', marginBottom: '24px', color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ion-icon name="terminal-outline" style={{ color: 'var(--accent-teal)' }}></ion-icon>
          {progress === 100 ? 'SYSTEM ONLINE' : 'COMPILING AGENT'}
        </h2>
        
        <div style={{ height: '120px', display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden', marginBottom: '32px' }}>
          {logs.map((log, i) => (
            <div key={i} style={{ color: i === logs.length - 1 ? 'var(--accent-teal)' : '#666', fontFamily: 'monospace', fontSize: '14px', animation: 'fadeUp 0.2s ease' }}>
              {log}
            </div>
          ))}
        </div>

        <div style={{ width: '100%', height: '6px', background: '#222', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent-teal)', transition: 'width 0.1s linear', boxShadow: '0 0 10px var(--accent-teal)' }}></div>
        </div>
        <div style={{ textAlign: 'right', color: 'var(--accent-teal)', fontFamily: 'monospace', fontSize: '12px', marginTop: '8px' }}>
          {Math.min(100, Math.floor(progress))}%
        </div>
      </div>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}
