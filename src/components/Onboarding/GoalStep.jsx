import { useState } from 'react';

const GOALS = [
  { label: 'Grow my wealth over time', value: 'grow_wealth' },
  { label: 'Save for retirement', value: 'retirement' },
  { label: 'Build passive income', value: 'passive_income' },
  { label: 'Learn options trading', value: 'learn_options' },
  { label: 'Just learn the basics', value: 'learn_basics' },
];

export default function GoalStep({ step, totalSteps, onNext }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="onboard-step ob-question">
      <div className="ob-bar-wrap">
        <div className="ob-bar"><div className="ob-bar-fill" style={{ width: `${(step / totalSteps) * 100}%` }} /></div>
      </div>
      <div className="ob-q-title">What is your main goal with Graham?</div>
      <div className="onboard-options">
        {GOALS.map(g => (
          <button
            key={g.value}
            className={`onboard-option ${selected === g.value ? 'selected' : ''}`}
            onClick={() => setSelected(g.value)}
          >
            <span>{g.label}</span>
            <span className="ob-check-mark"><ion-icon name="checkmark-outline"></ion-icon></span>
          </button>
        ))}
      </div>
      <button className="ob-next-btn" disabled={!selected} onClick={() => onNext(selected)}>Next</button>
    </div>
  );
}
