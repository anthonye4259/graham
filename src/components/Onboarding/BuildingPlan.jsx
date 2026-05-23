import { useEffect, useState } from 'react';

const MESSAGES = ['Analyzing your goals', 'Selecting your curriculum', 'Personalizing your lessons', 'Calibrating difficulty', 'Your plan is ready'];

export default function BuildingPlan({ onDone }) {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setMsgIdx(i => Math.min(i + 1, MESSAGES.length - 1)), 700);
    const timeout = setTimeout(onDone, 3500);
    return () => { clearInterval(iv); clearTimeout(timeout); };
  }, [onDone]);

  return (
    <div className="onboard-step ob-building">
      <div className="ob-build-ring">
        <svg viewBox="0 0 120 120">
          <circle className="ob-ring-bg" cx="60" cy="60" r="52" />
          <circle className="ob-ring-fill" cx="60" cy="60" r="52" />
        </svg>
        <div className="ob-ring-icon"><ion-icon name="analytics-outline"></ion-icon></div>
      </div>
      <div className="ob-build-title">Building your plan...</div>
      <div className="ob-build-status">{MESSAGES[msgIdx]}</div>
    </div>
  );
}
