import ProgressDots from '../ui/ProgressDots';

export default function ValueProp({ onNext, totalSteps }) {
  return (
    <div className="onboard-step ob-value-prop">
      <ProgressDots current={0} total={totalSteps} />
      <div className="ob-logo">graham.</div>
      <div className="ob-headline">Invest smarter,<br/>starting today.</div>
      <div className="ob-value-cards">
        <div className="ob-value-card">
          <div className="ob-vc-icon"><ion-icon name="bulb-outline"></ion-icon></div>
          <div><div className="ob-vc-title">Daily Lessons</div><div className="ob-vc-desc">Personalized to your goals, delivered in under 3 minutes</div></div>
        </div>
        <div className="ob-value-card">
          <div className="ob-vc-icon"><ion-icon name="scan-outline"></ion-icon></div>
          <div><div className="ob-vc-title">Instant Analysis</div><div className="ob-vc-desc">Scan any stock for plain-English explanations</div></div>
        </div>
        <div className="ob-value-card">
          <div className="ob-vc-icon"><ion-icon name="trending-up-outline"></ion-icon></div>
          <div><div className="ob-vc-title">Options Education</div><div className="ob-vc-desc">Learn to trade options from zero, without the jargon</div></div>
        </div>
      </div>
      <button className="onboard-next" onClick={onNext}>Get Started</button>
    </div>
  );
}
