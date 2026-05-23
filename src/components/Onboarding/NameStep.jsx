import { useState, useRef, useEffect } from 'react';
import ProgressDots from '../ui/ProgressDots';

export default function NameStep({ step, totalSteps, onNext }) {
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = () => { if (name.trim()) onNext(name.trim()); };

  return (
    <div className="onboard-step">
      <ProgressDots current={step} total={totalSteps} />
      <div className="onboard-hero-icon"><ion-icon name="person-outline"></ion-icon></div>
      <div className="onboard-title">What should we call you?</div>
      <div className="onboard-subtitle">So we can personalize your experience</div>
      <input
        ref={inputRef}
        className="onboard-input"
        placeholder="Your first name"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
      />
      <button className="onboard-next" disabled={!name.trim()} onClick={handleSubmit}>Continue</button>
    </div>
  );
}
