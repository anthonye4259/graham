import { useEffect, useState } from 'react';
import { useUser } from '../../context/UserContext';

export default function BuildingPlan({ onDone }) {
  const { state } = useUser();
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing AI Core...');

  useEffect(() => {
    const phases = [
      { p: 15, text: `Tuning AI to ${state.name || 'your'} profile...` },
      { p: 40, text: `Setting financial objective to ${state.investingGoal || 'Growth'}...` },
      { p: 65, text: `Calibrating risk tolerance metrics...` },
      { p: 85, text: `Loading the ${state.persona || 'Default'} persona...` },
      { p: 100, text: 'Personalized AI Agent Ready.' }
    ];

    let currentPhase = 0;
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + (Math.random() * 5);
        
        if (currentPhase < phases.length && next >= phases[currentPhase].p) {
          setLoadingText(phases[currentPhase].text);
          currentPhase++;
        }

        if (next >= 100) {
          clearInterval(interval);
          setTimeout(onDone, 800);
          return 100;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [onDone, state]);

  return (
    <div className="ob-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        <div style={{ width: '64px', height: '64px', margin: '0 auto 32px', border: '3px solid var(--border-light)', borderTopColor: 'var(--accent-teal)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <h2 style={{ fontSize: '24px', marginBottom: '16px', color: 'var(--text-primary)' }}>{progress === 100 ? 'Ready' : 'Building Your Agent'}</h2>
        <p style={{ color: 'var(--accent-teal)', fontSize: '16px', fontWeight: '500', height: '24px', transition: 'all 0.3s' }}>
          {loadingText}
        </p>
        <div style={{ width: '100%', height: '4px', background: 'var(--border-light)', borderRadius: '2px', marginTop: '32px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent-teal)', transition: 'width 0.1s linear' }}></div>
        </div>
      </div>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
