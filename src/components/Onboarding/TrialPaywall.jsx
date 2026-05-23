export default function TrialPaywall({ step, totalSteps, onTrial, onSkip }) {
  return (
    <div className="onboard-step ob-trial-wall">
      <div className="ob-pw-glow" />
      <div className="ob-pw-logo">graham.</div>
      <div className="ob-pw-stars">
        {[1,2,3,4,5].map(i => <ion-icon key={i} name="star" class="ob-star"></ion-icon>)}
        <span>4.9 · App Store</span>
      </div>
      <div className="ob-pw-headline">Find your investing<br/>edge, <em>today.</em></div>
      <div className="ob-pw-sub">For less than a coffee a day...<br/>learn to invest with confidence. Cancel anytime.</div>

      <div className="ob-pw-timeline">
        <div className="ob-tl-track"><div className="ob-tl-fill" /></div>
        <div className="ob-tl-point active">
          <div className="ob-tl-dot"><ion-icon name="thumbs-up-outline"></ion-icon></div>
          <div className="ob-tl-label">Today</div><div className="ob-tl-sub">Unlock Graham</div>
        </div>
        <div className="ob-tl-point">
          <div className="ob-tl-dot"><ion-icon name="notifications-outline"></ion-icon></div>
          <div className="ob-tl-label">Day 5</div><div className="ob-tl-sub">Reminder</div>
        </div>
        <div className="ob-tl-point locked">
          <div className="ob-tl-dot"><ion-icon name="lock-closed-outline"></ion-icon></div>
          <div className="ob-tl-label">Day 7</div><div className="ob-tl-sub">Billed $89.99</div>
        </div>
      </div>

      <ul className="ob-trial-features">
        <li><span className="ob-feat-icon"><ion-icon name="flash-outline"></ion-icon></span> Personalized daily investing lessons</li>
        <li><span className="ob-feat-icon"><ion-icon name="scan-outline"></ion-icon></span> Unlimited stock & options analysis</li>
        <li><span className="ob-feat-icon"><ion-icon name="bulb-outline"></ion-icon></span> AI-powered market explanations</li>
        <li><span className="ob-feat-icon"><ion-icon name="diamond-outline"></ion-icon></span> Exclusive access to Graham AI</li>
      </ul>

      <div className="ob-pw-price">Free for 7 days, then<br/><span className="ob-pw-amount">$89.99/year</span>  ($7.49/month)</div>
      <button className="ob-pw-cta" onClick={onTrial}>Start your FREE week—no payment now</button>
      <button className="ob-pw-alt" onClick={onTrial}>or $9.99/month</button>
      <button className="ob-trial-skip" onClick={onSkip}>Maybe later</button>
      <div className="ob-pw-legal">Terms of Use · Privacy Policy</div>
    </div>
  );
}
