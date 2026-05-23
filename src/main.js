import './index.css';
import { STOCK_CONTEXTS, LOADING_MESSAGES } from './data.js';
import { getState, setState, checkStreak, getGreeting, getMotivation, getHearts,
         getXPProgress, getXPForNextLevel, getLevelTitle, getAllAchievements,
         incrementScan, getScansRemaining, subscribe, checkHearts,
         addXP, completeLesson, isLessonCompleted, markDailyGoal, loseHeart,
         startTrial, isPremium, markOnboardingPaywallSeen, markPostLessonPaywallSeen } from './state.js';
import { getTodaysLesson, getCompletedLessons, getAllLessonsCount, getNextLesson } from './learn.js';

const I = (name, cls='') => `<ion-icon name="${name}" class="${cls}"></ion-icon>`;
checkStreak(); checkHearts();
const app = document.getElementById('app');

// ============================================================
// ONBOARDING (7-step Cal AI-inspired flow)
// ============================================================
const TOTAL_OB_STEPS = 7;

function progressDots(current, total) {
  return `<div class="ob-progress">${Array.from({length:total}, (_,i) =>
    `<div class="ob-dot ${i < current ? 'done' : ''} ${i === current ? 'active' : ''}"></div>`
  ).join('')}</div>`;
}

function showOnboarding() {
  let step = 0;
  function render() {
    if (step === 0) return renderValueProp();
    if (step === 1) return renderNameStep();
    if (step === 2) return renderGoalStep();
    if (step === 3) return renderExperienceStep();
    if (step === 4) return renderBuildingPlan();
    if (step === 5) return renderPlanReveal();
    if (step === 6) return renderTrialPaywall();
  }

  function advance() {
    step++;
    if (step >= TOTAL_OB_STEPS) { setState({ onboarded: true }); markOnboardingPaywallSeen(); bootApp(); }
    else render();
  }

  // — STEP 0: Value Proposition —
  function renderValueProp() {
    app.innerHTML = `<div class="screen onboarding active"><div class="onboard-step ob-value-prop">
      ${progressDots(0, TOTAL_OB_STEPS)}
      <div class="ob-logo">graham.</div>
      <div class="ob-headline">Invest smarter,<br/>starting today.</div>
      <div class="ob-value-cards">
        <div class="ob-value-card"><div class="ob-vc-icon">${I('bulb-outline')}</div><div class="ob-vc-title">Daily Lessons</div><div class="ob-vc-desc">Personalized to your goals, delivered in under 3 minutes</div></div>
        <div class="ob-value-card"><div class="ob-vc-icon">${I('scan-outline')}</div><div class="ob-vc-title">Instant Analysis</div><div class="ob-vc-desc">Scan any stock for plain-English explanations</div></div>
        <div class="ob-value-card"><div class="ob-vc-icon">${I('trending-up-outline')}</div><div class="ob-vc-title">Options Education</div><div class="ob-vc-desc">Learn to trade options from zero, without the jargon</div></div>
      </div>
      <button class="onboard-next" id="ob-next">Get Started</button>
    </div></div>`;
    document.getElementById('ob-next').addEventListener('click', advance);
  }

  // — STEP 1: Name —
  function renderNameStep() {
    app.innerHTML = `<div class="screen onboarding active"><div class="onboard-step">
      ${progressDots(1, TOTAL_OB_STEPS)}
      <div class="onboard-hero-icon">${I('person-outline')}</div>
      <div class="onboard-title">What should we call you?</div>
      <div class="onboard-subtitle">So we can personalize your experience</div>
      <input class="onboard-input" id="ob-input" placeholder="Your first name" autofocus />
      <button class="onboard-next" id="ob-next" disabled>Continue</button>
    </div></div>`;
    const input = document.getElementById('ob-input');
    const btn = document.getElementById('ob-next');
    input.addEventListener('input', () => btn.disabled = !input.value.trim());
    btn.addEventListener('click', () => { setState({ name: input.value.trim() }); advance(); });
    input.addEventListener('keydown', e => { if (e.key === 'Enter' && input.value.trim()) { setState({ name: input.value.trim() }); advance(); } });
  }

  // — STEP 2: Goal —
  function renderGoalStep() {
    const opts = [
      { icon:'trending-up-outline', label:'Grow my wealth over time', value:'grow_wealth' },
      { icon:'airplane-outline', label:'Save for retirement', value:'retirement' },
      { icon:'wallet-outline', label:'Build passive income', value:'passive_income' },
      { icon:'swap-vertical-outline', label:'Learn options trading', value:'learn_options' },
      { icon:'book-outline', label:'Just learn the basics', value:'learn_basics' },
    ];
    let selected = null;
    app.innerHTML = `<div class="screen onboarding active"><div class="onboard-step ob-question">
      <div class="ob-bar-wrap"><div class="ob-bar"><div class="ob-bar-fill" style="width:${((2)/TOTAL_OB_STEPS)*100}%"></div></div></div>
      <div class="ob-q-title">What is your main goal with Graham?</div>
      <div class="onboard-options">${opts.map(o =>
        `<button class="onboard-option" data-val="${o.value}"><span>${o.label}</span><span class="ob-check-mark">${I('checkmark-outline')}</span></button>`
      ).join('')}</div>
      <button class="ob-next-btn" id="ob-next" disabled>Next</button>
    </div></div>`;
    document.querySelectorAll('.onboard-option').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.onboard-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selected = btn.dataset.val;
        document.getElementById('ob-next').disabled = false;
      });
    });
    document.getElementById('ob-next').addEventListener('click', () => { if (selected) { setState({ investingGoal: selected }); advance(); } });
  }

  // — STEP 3: Experience (Dub-style) —
  function renderExperienceStep() {
    const opts = [
      { label:'I\'ve never invested on my own', value:'total_beginner' },
      { label:'Less than 1 year', value:'some_knowledge' },
      { label:'1-3 years', value:'intermediate' },
      { label:'3+ years', value:'advanced' },
    ];
    let selected = null;
    app.innerHTML = `<div class="screen onboarding active"><div class="onboard-step ob-question">
      <div class="ob-bar-wrap"><div class="ob-bar"><div class="ob-bar-fill" style="width:${((3)/TOTAL_OB_STEPS)*100}%"></div></div></div>
      <div class="ob-q-title">How much investing experience do you have?</div>
      <div class="onboard-options">${opts.map(o =>
        `<button class="onboard-option" data-val="${o.value}"><span>${o.label}</span><span class="ob-check-mark">${I('checkmark-outline')}</span></button>`
      ).join('')}</div>
      <button class="ob-next-btn" id="ob-next" disabled>Next</button>
    </div></div>`;
    document.querySelectorAll('.onboard-option').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.onboard-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selected = btn.dataset.val;
        document.getElementById('ob-next').disabled = false;
      });
    });
    document.getElementById('ob-next').addEventListener('click', () => { if (selected) { setState({ experience: selected }); advance(); } });
  }

  // — STEP 4: Building Your Plan (Cal AI-inspired animation) —
  function renderBuildingPlan() {
    app.innerHTML = `<div class="screen onboarding active"><div class="onboard-step ob-building">
      <div class="ob-build-ring"><svg viewBox="0 0 120 120"><circle class="ob-ring-bg" cx="60" cy="60" r="52"/><circle class="ob-ring-fill" cx="60" cy="60" r="52"/></svg>
        <div class="ob-ring-icon">${I('analytics-outline')}</div>
      </div>
      <div class="ob-build-title">Building your plan...</div>
      <div class="ob-build-status" id="ob-build-status">Analyzing your goals</div>
    </div></div>`;
    const msgs = ['Analyzing your goals', 'Selecting your curriculum', 'Personalizing your lessons', 'Calibrating difficulty', 'Your plan is ready'];
    const el = document.getElementById('ob-build-status');
    let i = 0;
    const iv = setInterval(() => { i++; if (i < msgs.length) { el.style.opacity = '0'; setTimeout(() => { el.textContent = msgs[i]; el.style.opacity = '1'; }, 200); } }, 700);
    setTimeout(() => { clearInterval(iv); advance(); }, 3500);
  }

  // — STEP 5: Your Plan Reveal —
  function renderPlanReveal() {
    const s = getState();
    const goalLabels = { grow_wealth:'Wealth Growth', retirement:'Retirement Planning', passive_income:'Passive Income', learn_options:'Options Trading', learn_basics:'Market Basics' };
    const lesson = getTodaysLesson();
    app.innerHTML = `<div class="screen onboarding active"><div class="onboard-step ob-plan-reveal">
      ${progressDots(5, TOTAL_OB_STEPS)}
      <div class="ob-plan-badge">${I('checkmark-circle','ob-plan-check')} PLAN READY</div>
      <div class="onboard-title">${s.name}, here's your plan</div>
      <div class="ob-plan-cards">
        <div class="ob-plan-item"><div class="ob-plan-icon">${I('ribbon-outline')}</div><div class="ob-plan-info"><div class="ob-plan-label">Your track</div><div class="ob-plan-val">${goalLabels[s.investingGoal] || 'Market Basics'}</div></div></div>
        <div class="ob-plan-item"><div class="ob-plan-icon">${I('book-outline')}</div><div class="ob-plan-info"><div class="ob-plan-label">First lesson</div><div class="ob-plan-val">${lesson.title}</div></div></div>
        <div class="ob-plan-item"><div class="ob-plan-icon">${I('time-outline')}</div><div class="ob-plan-info"><div class="ob-plan-label">Daily commitment</div><div class="ob-plan-val">~3 minutes per day</div></div></div>
        <div class="ob-plan-item"><div class="ob-plan-icon">${I('layers-outline')}</div><div class="ob-plan-info"><div class="ob-plan-label">Lessons available</div><div class="ob-plan-val">${getAllLessonsCount()} personalized lessons</div></div></div>
        <div class="ob-plan-item"><div class="ob-plan-icon">${I('scan-outline')}</div><div class="ob-plan-info"><div class="ob-plan-label">Stock scans</div><div class="ob-plan-val">2 free scans included</div></div></div>
      </div>
      <button class="onboard-next" id="ob-next">Continue</button>
    </div></div>`;
    document.getElementById('ob-next').addEventListener('click', advance);
  }

  // — STEP 6: Soft Paywall with Free Trial (Dub-style) —
  function renderTrialPaywall() {
    app.innerHTML = `<div class="screen onboarding active"><div class="onboard-step ob-trial-wall">
      <div class="ob-pw-glow"></div>
      <div class="ob-pw-logo">graham.</div>
      <div class="ob-pw-stars">${I('star','ob-star')}${I('star','ob-star')}${I('star','ob-star')}${I('star','ob-star')}${I('star','ob-star')} <span>4.9 · App Store</span></div>
      <div class="ob-pw-headline">Find your investing<br/>edge, <em>today.</em></div>
      <div class="ob-pw-sub">For less than a coffee a day...<br/>learn to invest with confidence. Cancel anytime.</div>

      <div class="ob-pw-timeline">
        <div class="ob-tl-track"><div class="ob-tl-fill"></div></div>
        <div class="ob-tl-point active"><div class="ob-tl-dot">${I('thumbs-up-outline')}</div><div class="ob-tl-label">Today</div><div class="ob-tl-sub">Unlock Graham</div></div>
        <div class="ob-tl-point"><div class="ob-tl-dot">${I('notifications-outline')}</div><div class="ob-tl-label">Day 5</div><div class="ob-tl-sub">Reminder</div></div>
        <div class="ob-tl-point locked"><div class="ob-tl-dot">${I('lock-closed-outline')}</div><div class="ob-tl-label">Day 7</div><div class="ob-tl-sub">Billed $89.99</div></div>
      </div>

      <ul class="ob-trial-features">
        <li><span class="ob-feat-icon">${I('flash-outline')}</span> Personalized daily investing lessons</li>
        <li><span class="ob-feat-icon">${I('scan-outline')}</span> Unlimited stock & options analysis</li>
        <li><span class="ob-feat-icon">${I('bulb-outline')}</span> AI-powered market explanations</li>
        <li><span class="ob-feat-icon">${I('diamond-outline')}</span> Exclusive access to Graham AI</li>
      </ul>

      <div class="ob-pw-price">Free for 7 days, then<br/><span class="ob-pw-amount">$89.99/year</span>  ($7.49/month)</div>
      <button class="ob-pw-cta" id="ob-trial-start">Start your FREE week—no payment now</button>
      <button class="ob-pw-alt" id="ob-trial-monthly">or $9.99/month</button>
      <button class="ob-trial-skip" id="ob-trial-skip">Maybe later</button>
      <div class="ob-pw-legal">Terms of Use · Privacy Policy</div>
    </div></div>`;
    document.getElementById('ob-trial-start').addEventListener('click', () => { startTrial(); advance(); });
    document.getElementById('ob-trial-monthly').addEventListener('click', () => { startTrial(); advance(); });
    document.getElementById('ob-trial-skip').addEventListener('click', advance);
  }

  render();
}

// ============================================================
// MAIN APP
// ============================================================
function bootApp() {
  app.innerHTML = `
    <div id="splash" class="screen splash active">
      <div class="splash-orb splash-orb-1"></div><div class="splash-orb splash-orb-2"></div>
      <div class="splash-logo">graham.</div>
      <div class="splash-tagline">Your AI investing companion.</div>
    </div>

    <div id="today-tab" class="screen tab-screen hidden" style="padding-top:20px;"></div>
    <div id="scan-tab" class="screen search-screen tab-screen hidden">
      <div class="search-header">
        <div class="search-brand">graham.</div>
        <div class="search-subtitle">Scan a brokerage screenshot or search any ticker for instant clarity.</div>
        <div id="scan-badge" class="scan-badge"></div>
      </div>
      <div class="scan-options">
        <div class="scan-option" id="scan-option-camera"><div class="scan-option-icon">${I('scan-outline')}</div><div class="scan-option-label">Scan Screenshot</div><div class="scan-option-desc">Upload from your brokerage</div></div>
        <div class="scan-option" id="scan-option-search"><div class="scan-option-icon">${I('search-outline')}</div><div class="scan-option-label">Search Ticker</div><div class="scan-option-desc">Type a stock symbol</div></div>
      </div>
      <div id="search-input-section" style="display:none;">
        <div class="search-input-wrap"><span class="search-icon">${I('search-outline')}</span>
          <input type="text" class="search-input" id="ticker-input" placeholder="Enter a ticker (AAPL, TSLA...)" autocomplete="off" autocapitalize="characters" />
        </div>
        <div class="ticker-pills" id="ticker-pills"></div>
        <button class="search-btn" id="search-btn" disabled>Ask Graham About This Stock</button>
      </div>
    </div>
    <div id="profile-tab" class="screen profile-tab tab-screen hidden"></div>
    <div id="card-screen" class="screen card-screen hidden">
      <button class="card-back-btn" id="card-back-btn">${I('arrow-back-outline')} Back</button>
      <div id="context-card-container"></div>
    </div>

    <div class="tab-bar" id="tab-bar" style="display:none;">
      <button class="tab-item active" data-tab="today-tab"><span class="tab-item-icon">${I('bulb-outline')}</span>Today</button>
      <button class="tab-item" data-tab="scan-tab"><span class="tab-item-icon">${I('scan-outline')}</span>Scan</button>
      <button class="tab-item" data-tab="profile-tab"><span class="tab-item-icon">${I('person-outline')}</span>Profile</button>
    </div>

    <div id="ocr-overlay" class="ocr-overlay">
      <button class="ocr-close" id="ocr-close">${I('close-outline')}</button>
      <div class="ocr-preview-area" id="ocr-drop-area"><div class="scan-line"></div>
        <div class="ocr-preview-icon" id="ocr-icon">${I('phone-portrait-outline')}</div>
        <div class="ocr-preview-text" id="ocr-text">Tap to upload a screenshot<br/>from your brokerage app</div>
        <input type="file" id="ocr-file-input" accept="image/*" style="display:none;" />
      </div>
      <div class="ocr-hint">Supports Robinhood, Coinbase, Schwab, Fidelity & more</div>
      <button class="ocr-scan-btn" id="ocr-scan-btn">Analyze Screenshot</button>
    </div>
    <div id="shimmer-overlay" class="shimmer-overlay">
      <div class="shimmer-icon">${I('analytics-outline')}</div>
      <div class="shimmer-text" id="shimmer-text">Analyzing...</div>
      <div class="shimmer-bar"><div class="shimmer-bar-fill" id="shimmer-fill"></div></div>
    </div>
    <div id="paywall-overlay" class="paywall-overlay">
      <div class="paywall-backdrop"></div>
      <div class="paywall-content">
        <div class="paywall-handle"></div>
        <div class="paywall-hero-icon">${I('diamond-outline')}</div>
        <div class="paywall-title">Invest smarter<br/>with Graham.</div>
        <div class="paywall-subtitle">Your AI-powered investing companion, unlimited.</div>
        <ul class="paywall-features">
          <li class="paywall-feature"><span class="paywall-check">${I('checkmark-outline')}</span>Unlimited stock & options analysis</li>
          <li class="paywall-feature"><span class="paywall-check">${I('checkmark-outline')}</span>Daily personalized lessons</li>
          <li class="paywall-feature"><span class="paywall-check">${I('checkmark-outline')}</span>Options trading education</li>
          <li class="paywall-feature"><span class="paywall-check">${I('checkmark-outline')}</span>AI-powered action plans</li>
        </ul>
        <div class="paywall-pricing">
          <div class="pricing-option" data-plan="monthly"><div class="pricing-period">Monthly</div><div class="pricing-amount">$14.99</div><div class="pricing-sub">/month</div></div>
          <div class="pricing-option selected" data-plan="annual"><span class="save-badge">Save 44%</span><div class="pricing-period">Annual</div><div class="pricing-amount">$99.99</div><div class="pricing-sub">$8.33/month</div></div>
        </div>
        <button class="paywall-cta" id="paywall-cta">Get Unlimited Access</button>
        <button class="paywall-dismiss" id="paywall-dismiss">Not now</button>
        <div class="paywall-social">Join 47,000+ smarter investors</div>
      </div>
    </div>`;

  setTimeout(() => {
    document.getElementById('splash').classList.remove('active');
    document.getElementById('splash').classList.add('slide-up');
    document.getElementById('tab-bar').style.display = 'flex';
    setTimeout(() => switchTab('today-tab'), 300);
  }, 2200);

  initTabs(); initScan(); initPaywall();
}

// ============================================================
// TABS
// ============================================================
let activeTab = 'today-tab';
function initTabs() { document.querySelectorAll('.tab-item').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab))); }
function switchTab(tabId) {
  activeTab = tabId;
  document.querySelectorAll('.tab-item').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
  document.querySelectorAll('.screen').forEach(s => { s.classList.remove('active'); s.classList.add('hidden'); });
  const el = document.getElementById(tabId);
  el.classList.remove('hidden'); el.classList.add('active'); el.scrollTop = 0;
  if (tabId === 'today-tab') refreshToday();
  else if (tabId === 'profile-tab') refreshProfile();
  else if (tabId === 'scan-tab') refreshScanBadge();
}

// ============================================================
// TODAY TAB
// ============================================================
function refreshToday() {
  const s = getState();
  const lesson = getTodaysLesson();
  const completed = getCompletedLessons();
  const todayDone = isLessonCompleted(lesson.id);
  const motives = getMotivation();

  let pastHTML = '';
  if (completed.length > 0) {
    pastHTML = `<div class="section-heading">Previous Lessons</div>` +
      completed.slice().reverse().map(l => `
        <div class="past-lesson-card">
          <div class="past-icon">${I(l.icon)}</div>
          <div class="past-lesson-info">
            <div class="past-lesson-title">${l.title}</div>
            <div class="past-lesson-takeaway">${l.takeaway}</div>
          </div>
          <div class="past-check">${I('checkmark-circle','text-green')}</div>
        </div>`).join('');
  }

  document.getElementById('today-tab').innerHTML = `
    <div class="today-greeting">${getGreeting()}</div>
    <div class="today-motivation">${motives[0] || ''}</div>

    <div class="today-stats-row">
      <div class="stat-pill">${I('flame-outline','pill-icon flame')} <span>${s.streak} day${s.streak!==1?'s':''}</span></div>
      <div class="stat-pill">${I('flash-outline','pill-icon bolt')} <span>${s.xp} XP</span></div>
      <div class="stat-pill">${I('book-outline','pill-icon')} <span>${completed.length}/${getAllLessonsCount()}</span></div>
    </div>

    ${!todayDone ? `
    <div class="notif-badge">${I('bulb-outline','notif-icon')} <span>TODAY'S LESSON</span></div>
    <div class="daily-lesson-card" id="daily-lesson-card">
      <div class="lesson-meta"><span class="lesson-read-time">${I('time-outline')} ~2 min read</span></div>
      <div class="lesson-icon-wrap"><ion-icon name="${lesson.icon}" class="lesson-hero-icon"></ion-icon></div>
      <h2 class="lesson-title">${lesson.title}</h2>
      <p class="lesson-body">${lesson.body}</p>
      <div class="lesson-takeaway">
        <div class="takeaway-label">${I('diamond-outline','takeaway-icon')} Key Takeaway</div>
        <p class="takeaway-text">${lesson.takeaway}</p>
      </div>
      <div class="lesson-quiz" id="daily-quiz">
        <div class="quiz-label">${I('help-circle-outline','quiz-label-icon')} Quick Check</div>
        <p class="quiz-q">${lesson.quiz.q}</p>
        <div class="quiz-opts" id="quiz-opts">
          ${lesson.quiz.opts.map((o,i) => `<button class="quiz-opt" data-idx="${i}">${o}</button>`).join('')}
        </div>
        <div class="quiz-fb hidden" id="quiz-fb"></div>
      </div>
    </div>` : `
    <div class="done-card">
      <div class="done-icon">${I('checkmark-circle-outline')}</div>
      <h3 class="done-title">Today's lesson complete</h3>
      <p class="done-sub">Come back tomorrow for your next personalized lesson.</p>
      ${(() => {
        const nextLesson = getNextLesson();
        return nextLesson ? `<div class="done-next-preview">
          <div class="done-next-label">${I('arrow-forward-outline')} Up Next</div>
          <div class="done-next-title">${nextLesson.title}</div>
        </div>` : '';
      })()}
    </div>
    ${!isPremium() && !getState().hasSeenPostLessonPaywall && completed.length === 1 ? `
    <div class="post-lesson-nudge" id="post-lesson-nudge">
      <div class="nudge-icon">${I('diamond-outline')}</div>
      <div class="nudge-text">
        <div class="nudge-title">Enjoying Graham?</div>
        <div class="nudge-desc">Start your free trial for unlimited lessons and scans.</div>
      </div>
      <button class="nudge-cta" id="nudge-cta">Try Free</button>
    </div>` : ''}`}
    ${pastHTML}`;

  if (!todayDone) {
    document.querySelectorAll('.quiz-opt').forEach(btn => btn.addEventListener('click', () => handleQuiz(btn, lesson)));
  }
  const nudgeCta = document.getElementById('nudge-cta');
  if (nudgeCta) {
    nudgeCta.addEventListener('click', () => { markPostLessonPaywallSeen(); showPaywall(); });
  }
}



function handleQuiz(btn, lesson) {
  if (btn.classList.contains('disabled')) return;
  const idx = parseInt(btn.dataset.idx);
  const isCorrect = idx === lesson.quiz.correct;
  document.querySelectorAll('.quiz-opt').forEach((b,i) => { b.classList.add('disabled'); if (i===lesson.quiz.correct) b.classList.add('correct'); });
  if (!isCorrect) btn.classList.add('wrong');
  const fb = document.getElementById('quiz-fb');
  fb.classList.remove('hidden');
  fb.className = `quiz-fb ${isCorrect ? 'correct' : 'wrong'}`;
  fb.innerHTML = `${I(isCorrect?'checkmark-circle':'close-circle','fb-icon')} <span>${lesson.quiz.explain}</span>`;
  completeLesson(lesson.id, isCorrect?1:0, 1);
  if (!getState().dailyGoalMet) markDailyGoal();
  // Celebration animation
  const card = document.getElementById('daily-lesson-card');
  const pop = document.createElement('div'); pop.className = 'xp-pop'; pop.textContent = `+${isCorrect?25:10} XP`;
  card.appendChild(pop);
  if (isCorrect) { const conf = document.createElement('div'); conf.className = 'quiz-confetti'; card.appendChild(conf); setTimeout(() => conf.remove(), 2000); }
  setTimeout(() => pop.remove(), 1500);
  setTimeout(() => refreshToday(), 2500);
}

// ============================================================
// PROFILE
// ============================================================
function refreshProfile() {
  const s = getState();
  const achievements = getAllAchievements();
  const xpProg = getXPProgress();
  const completed = getCompletedLessons();

  document.getElementById('profile-tab').innerHTML = `
    <div class="profile-avatar"><ion-icon name="person" class="avatar-icon"></ion-icon></div>
    <div class="profile-name">${s.name || 'Investor'}</div>
    <div class="profile-level">Level ${s.level} · ${getLevelTitle()}</div>
    <div class="profile-xp-bar"><div class="profile-xp-fill" style="width:${(xpProg*100).toFixed(0)}%"></div></div>
    <div class="profile-xp-label">${s.xp} / ${getXPForNextLevel()} XP to next level</div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-value">${I('flame-outline','stat-icon flame')} ${s.streak}</div><div class="stat-label">Day Streak</div></div>
      <div class="stat-card"><div class="stat-value">${I('book-outline','stat-icon')} ${completed.length}</div><div class="stat-label">Lessons</div></div>
      <div class="stat-card"><div class="stat-value">${I('flash-outline','stat-icon bolt')} ${s.xp}</div><div class="stat-label">Total XP</div></div>
      <div class="stat-card"><div class="stat-value">${I('trophy-outline','stat-icon gold')} ${s.bestStreak}</div><div class="stat-label">Best Streak</div></div>
    </div>

    <div class="section-heading" style="margin-top:28px;">Achievements</div>
    <div class="achievements-grid">
      ${achievements.map(a => `
        <div class="achievement-item ${a.unlocked ? '' : 'locked'}">
          <div class="achievement-icon">${I(getAchievementIcon(a.id))}</div>
          <div class="achievement-name">${a.title}</div>
        </div>`).join('')}
    </div>`;
}

function getAchievementIcon(id) {
  const map = { first_lesson:'ribbon-outline', streak_3:'flame-outline', streak_7:'flame-outline',
    perfect:'star-outline', unit_1:'bar-chart-outline', unit_2:'options-outline',
    xp_100:'flash-outline', xp_500:'flash-outline', xp_1000:'diamond-outline',
    lessons_10:'library-outline', accuracy_90:'locate-outline', scan_first:'scan-outline' };
  return map[id] || 'medal-outline';
}

// ============================================================
// SCAN
// ============================================================
function initScan() {
  refreshScanBadge();
  document.getElementById('scan-option-camera').addEventListener('click', () => {
    if (!getState().subscribed && getScansRemaining() <= 0) { showPaywall(); return; }
    document.getElementById('ocr-overlay').classList.add('active');
  });
  document.getElementById('scan-option-search').addEventListener('click', () => {
    if (!getState().subscribed && getScansRemaining() <= 0) { showPaywall(); return; }
    const sec = document.getElementById('search-input-section');
    sec.style.display = sec.style.display === 'none' ? 'block' : 'none';
    if (sec.style.display === 'block') document.getElementById('ticker-input').focus();
  });
  const pc = document.getElementById('ticker-pills');
  Object.keys(STOCK_CONTEXTS).forEach(t => { const p = document.createElement('button'); p.className='ticker-pill'; p.textContent=`$${t}`; p.addEventListener('click',()=>{document.getElementById('ticker-input').value=t;performScan(t);}); pc.appendChild(p); });
  const ti = document.getElementById('ticker-input'), sb = document.getElementById('search-btn');
  ti.addEventListener('input',()=>sb.disabled=!STOCK_CONTEXTS[ti.value.trim().toUpperCase()]);
  ti.addEventListener('keydown',e=>{if(e.key==='Enter'&&!sb.disabled)performScan(ti.value.trim().toUpperCase());});
  sb.addEventListener('click',()=>{const t=ti.value.trim().toUpperCase();if(STOCK_CONTEXTS[t])performScan(t);});
  const oo=document.getElementById('ocr-overlay'),od=document.getElementById('ocr-drop-area'),of=document.getElementById('ocr-file-input'),ob=document.getElementById('ocr-scan-btn');let sf=null;
  document.getElementById('ocr-close').addEventListener('click',()=>{oo.classList.remove('active');resetOCR();});
  od.addEventListener('click',()=>of.click());
  of.addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;sf=f;const r=new FileReader();r.onload=ev=>{const img=document.createElement('img');img.src=ev.target.result;document.getElementById('ocr-icon').style.display='none';document.getElementById('ocr-text').style.display='none';const p=od.querySelector('img');if(p)p.remove();od.appendChild(img);ob.classList.add('visible');};r.readAsDataURL(f);});
  ob.addEventListener('click',()=>{if(!sf)return;od.classList.add('scanning');const ts=Object.keys(STOCK_CONTEXTS);setTimeout(()=>{oo.classList.remove('active');od.classList.remove('scanning');resetOCR();performScan(ts[Math.floor(Math.random()*ts.length)]);},2000);});
  function resetOCR(){sf=null;of.value='';const img=od.querySelector('img');if(img)img.remove();document.getElementById('ocr-icon').style.display='';document.getElementById('ocr-text').style.display='';ob.classList.remove('visible');}
  document.getElementById('card-back-btn').addEventListener('click',()=>switchTab('scan-tab'));
}
function refreshScanBadge(){const b=document.getElementById('scan-badge');if(!b)return;const s=getState(),r=getScansRemaining();if(s.subscribed){b.className='scan-badge';b.innerHTML=`${I('infinite-outline')} Unlimited scans`;}else if(r>0){b.className='scan-badge'+(r===1?' warning':'');b.textContent=`${r} free scan${r>1?'s':''} remaining`;}else{b.className='scan-badge depleted';b.innerHTML=`${I('lock-closed-outline')} Free scans used`;}}
function performScan(t){if(!getState().subscribed&&getScansRemaining()<=0){showPaywall();return;}const d=STOCK_CONTEXTS[t];if(!d)return;incrementScan();refreshScanBadge();const o=document.getElementById('shimmer-overlay'),tx=document.getElementById('shimmer-text'),f=document.getElementById('shimmer-fill');o.classList.add('active');f.style.animation='none';f.offsetHeight;f.style.animation='shimmerFill 2.5s ease forwards';let i=0;const iv=setInterval(()=>{if(i<LOADING_MESSAGES.length)tx.textContent=LOADING_MESSAGES[i++];},420);setTimeout(()=>{clearInterval(iv);o.classList.remove('active');showCard(d);},2600);}

function showCard(data) {
  const dn=data.change<0, spark=sparkSVG(data.sparkData,dn);
  document.getElementById('context-card-container').innerHTML = `
    <div class="context-card">
      <div class="card-header">
        <div class="card-ticker-row"><span class="card-ticker">$${data.ticker}</span><span class="card-change ${dn?'down':'up'}">${dn?'▼':'▲'} ${Math.abs(data.change)}%</span></div>
        <div class="card-company">${data.name}</div><div class="card-price">$${data.price.toFixed(2)}</div>
        <div class="card-sparkline">${spark}</div>
      </div>
      <div class="card-section"><div class="card-section-inner"><div class="section-label">${I('bulb-outline','sl-icon teal')} WHAT ACTUALLY HAPPENED</div><div class="section-text">${data.happened}</div></div></div>
      <div class="card-section"><div class="bears-bulls-grid"><div class="card-section-inner bears"><div class="section-label">${I('trending-down-outline','sl-icon rose')} BEARS SAY</div><div class="section-text">${data.bears}</div></div><div class="card-section-inner bulls"><div class="section-label">${I('trending-up-outline','sl-icon green')} BULLS SAY</div><div class="section-text">${data.bulls}</div></div></div></div>
      <div class="card-section"><div class="card-section-inner think"><div class="section-label">${I('school-outline','sl-icon amber')} HOW TO THINK ABOUT THIS</div><div class="section-text large">${data.think}</div></div></div>
      <div class="card-section"><div class="card-section-inner action"><div class="section-label">${I('hand-right-outline','sl-icon teal')} ACTION TO TAKE</div><div class="section-text large">${data.action}</div></div></div>
    </div>`;
  document.querySelectorAll('.screen').forEach(s=>{s.classList.remove('active');s.classList.add('hidden');});
  const cs=document.getElementById('card-screen');cs.classList.remove('hidden');cs.classList.add('active');cs.scrollTop=0;
}

function sparkSVG(pts,dn){const w=400,h=50,p=4,mn=Math.min(...pts),mx=Math.max(...pts),r=mx-mn||1,st=(w-p*2)/(pts.length-1),c=dn?'#E76F6F':'#6BCB77';const co=pts.map((v,i)=>({x:p+i*st,y:p+(1-(v-mn)/r)*(h-p*2)}));let d='';co.forEach((pt,i)=>{if(!i)d+=`M ${pt.x} ${pt.y}`;else{const pv=co[i-1],cx=(pv.x+pt.x)/2;d+=` C ${cx} ${pv.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;}});const l=co[co.length-1],a=d+` L ${l.x} ${h} L ${co[0].x} ${h} Z`;return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c}" stop-opacity="0.25"/><stop offset="100%" stop-color="${c}" stop-opacity="0"/></linearGradient></defs><path d="${a}" fill="url(#sg)"/><path d="${d}" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/><circle cx="${l.x}" cy="${l.y}" r="3.5" fill="${c}"/></svg>`;}

// ============================================================
// PAYWALL
// ============================================================
function initPaywall(){
  document.getElementById('paywall-dismiss').addEventListener('click',()=>document.getElementById('paywall-overlay').classList.remove('active'));
  document.querySelectorAll('.pricing-option').forEach(o=>o.addEventListener('click',()=>{document.querySelectorAll('.pricing-option').forEach(x=>x.classList.remove('selected'));o.classList.add('selected');}));
  document.getElementById('paywall-cta').addEventListener('click',()=>{subscribe();document.getElementById('paywall-overlay').classList.remove('active');refreshScanBadge();if(activeTab==='today-tab')refreshToday();});
}
function showPaywall(){document.getElementById('paywall-overlay').classList.add('active');}

getState().onboarded ? bootApp() : showOnboarding();
