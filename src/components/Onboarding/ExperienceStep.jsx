import { useState } from 'react';

const LEVELS = [
  { label: "I've never invested on my own", value: 'total_beginner' },
  { label: 'Less than 1 year', value: 'some_knowledge' },
  { label: '1-3 years', value: 'intermediate' },
  { label: '3+ years', value: 'advanced' },
];

export default function ExperienceStep({ step, totalSteps, onNext }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="onboard-step ob-question">
      <div className="ob-bar-wrap">
        <div className="ob-bar"><div className="ob-bar-fill" style={{ width: `${(step / totalSteps) * 100}%` }} /></div>
      </div>
      <div className="ob-q-title">How much investing experience do you have?</div>
      <div className="onboard-options">
        {LEVELS.map(l => (
          <button
            key={l.value}
            className={`onboard-option ${selected === l.value ? 'selected' : ''}`}
            onClick={() => setSelected(l.value)}
          >
            <span>{l.label}</span>
            <span className="ob-check-mark"><ion-icon name="checkmark-outline"></ion-icon></span>
          </button>
        ))}
      </div>
      <button className="ob-next-btn" disabled={!selected} onClick={() => onNext(selected)}>Next</button>
    </div>
  );
}
