// ============================================================
// STATE ENGINE — Centralized Gamification + Personalization
// ============================================================

const STORAGE_KEY = 'graham_state';
const XP_LEVELS = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 20000];

const DEFAULT_STATE = {
  // Personalization (set during onboarding)
  onboarded: false,
  name: '',
  investingGoal: '',       // 'grow_wealth' | 'retirement' | 'passive_income' | 'learn_basics'
  experience: '',          // 'total_beginner' | 'some_knowledge' | 'intermediate'
  riskComfort: '',         // 'conservative' | 'moderate' | 'aggressive'
  dailyTime: '',           // '2min' | '5min' | '10min'
  interests: [],           // ['tech', 'healthcare', 'energy', 'crypto', 'real_estate']

  // Gamification
  xp: 0,
  level: 1,
  streak: 0,
  bestStreak: 0,
  lastActiveDate: null,
  hearts: 5,
  heartsResetDate: null,
  completedLessons: [],
  lessonScores: {},        // { lessonId: { correct: 4, total: 5, xp: 50 } }
  achievements: [],
  dailyGoalMet: false,
  totalLessonsCompleted: 0,
  totalCorrectAnswers: 0,
  totalQuestionsAnswered: 0,

  // Scan (migrated)
  scanCount: 0,
  subscribed: false,

  // Trial & Paywall
  trialStartDate: null,     // ISO date string when trial began
  trialDays: 7,
  hasSeenPostLessonPaywall: false,
  hasSeenOnboardingPaywall: false,
};

// Load or create state
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      // Migrate old scan data if present
      if (!saved.scanCount && localStorage.getItem('normal_scan_count')) {
        saved.scanCount = parseInt(localStorage.getItem('normal_scan_count') || '0');
        saved.subscribed = localStorage.getItem('normal_subscribed') === 'true';
      }
      // Also try migrating from old normal_state
      return { ...DEFAULT_STATE, ...saved };
    }
  } catch (e) { /* ignore */ }
  return { ...DEFAULT_STATE };
}

let _state = loadState();

export function getState() { return _state; }

export function setState(updates) {
  _state = { ..._state, ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
  return _state;
}

// ============================================================
// XP & LEVELING
// ============================================================

export function addXP(amount) {
  const newXP = _state.xp + amount;
  let newLevel = _state.level;
  for (let i = 0; i < XP_LEVELS.length; i++) {
    if (newXP >= XP_LEVELS[i]) newLevel = i + 1;
  }
  const leveledUp = newLevel > _state.level;
  setState({ xp: newXP, level: newLevel });
  return { newXP, newLevel, leveledUp, amount };
}

export function getXPForLevel(level) {
  return XP_LEVELS[level - 1] || 0;
}

export function getXPForNextLevel() {
  return XP_LEVELS[_state.level] || XP_LEVELS[XP_LEVELS.length - 1];
}

export function getXPProgress() {
  const current = getXPForLevel(_state.level);
  const next = getXPForNextLevel();
  const range = next - current;
  const progress = _state.xp - current;
  return range > 0 ? Math.min(1, progress / range) : 1;
}

export function getLevelTitle() {
  const titles = [
    'Curious Observer', 'Market Explorer', 'Stock Student',
    'Chart Reader', 'Pattern Spotter', 'Risk Manager',
    'Portfolio Builder', 'Market Analyst', 'Strategy Architect',
    'Confident Investor', 'Market Master'
  ];
  return titles[_state.level - 1] || titles[titles.length - 1];
}

// ============================================================
// STREAKS
// ============================================================

export function checkStreak() {
  const today = new Date().toDateString();
  const last = _state.lastActiveDate;

  if (last === today) return; // Already active today

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (last === yesterday.toDateString()) {
    // Consecutive day — extend streak
    setState({
      streak: _state.streak + 1,
      bestStreak: Math.max(_state.bestStreak, _state.streak + 1),
      lastActiveDate: today,
      dailyGoalMet: false
    });
  } else if (last !== today) {
    // Streak broken
    setState({
      streak: last ? 1 : 1, // Start fresh
      lastActiveDate: today,
      dailyGoalMet: false
    });
  }
}

export function markDailyGoal() {
  setState({ dailyGoalMet: true });
}

// ============================================================
// HEARTS
// ============================================================

export function checkHearts() {
  const today = new Date().toDateString();
  if (_state.heartsResetDate !== today) {
    setState({ hearts: 5, heartsResetDate: today });
  }
}

export function loseHeart() {
  if (_state.subscribed) return 5; // Unlimited
  const h = Math.max(0, _state.hearts - 1);
  setState({ hearts: h });
  return h;
}

export function getHearts() {
  checkHearts();
  return _state.subscribed ? Infinity : _state.hearts;
}

// ============================================================
// LESSONS
// ============================================================

export function completeLesson(lessonId, correct, total) {
  const xpBase = correct * 10;
  const bonus = correct === total ? 20 : 0;
  const streakBonus = _state.streak >= 3 ? 15 : 0;
  const totalXP = xpBase + bonus + streakBonus;

  const completedLessons = [...new Set([..._state.completedLessons, lessonId])];
  const lessonScores = {
    ..._state.lessonScores,
    [lessonId]: { correct, total, xp: totalXP }
  };

  setState({
    completedLessons,
    lessonScores,
    totalLessonsCompleted: completedLessons.length,
    totalCorrectAnswers: _state.totalCorrectAnswers + correct,
    totalQuestionsAnswered: _state.totalQuestionsAnswered + total,
  });

  const xpResult = addXP(totalXP);
  checkAchievements();
  if (!_state.dailyGoalMet) markDailyGoal();

  return { ...xpResult, bonus, streakBonus, correct, total };
}

export function isLessonCompleted(lessonId) {
  return _state.completedLessons.includes(lessonId);
}

export function isLessonUnlocked(lessonId, allLessons) {
  if (_state.subscribed) return true;
  const idx = allLessons.findIndex(l => l.id === lessonId);
  if (idx === 0) return true;
  // Unlock if previous lesson is completed
  return _state.completedLessons.includes(allLessons[idx - 1]?.id);
}

export function isUnitLocked(unitNum) {
  if (_state.subscribed) return false;
  return unitNum > 2; // Units 3-5 are premium
}

// ============================================================
// ACHIEVEMENTS
// ============================================================

const ACHIEVEMENT_DEFS = [
  { id: 'first_lesson', title: 'First Steps', desc: 'Complete your first lesson', check: s => s.totalLessonsCompleted >= 1 },
  { id: 'streak_3', title: 'On Fire', desc: '3-day learning streak', check: s => s.streak >= 3 },
  { id: 'streak_7', title: 'Week Warrior', desc: '7-day learning streak', check: s => s.streak >= 7 },
  { id: 'perfect', title: 'Perfect Score', desc: 'Get a perfect quiz score', check: s => Object.values(s.lessonScores).some(sc => sc.correct === sc.total) },
  { id: 'unit_1', title: 'Market Basics', desc: 'Complete all basics lessons', check: s => s.completedLessons.filter(id => id.startsWith('basics')).length >= 4 },
  { id: 'unit_2', title: 'Options Pro', desc: 'Complete all options lessons', check: s => s.completedLessons.filter(id => id.startsWith('options')).length >= 5 },
  { id: 'xp_100', title: 'Centurion', desc: 'Earn 100 XP', check: s => s.xp >= 100 },
  { id: 'xp_500', title: 'Power Learner', desc: 'Earn 500 XP', check: s => s.xp >= 500 },
  { id: 'xp_1000', title: 'Market Scholar', desc: 'Earn 1,000 XP', check: s => s.xp >= 1000 },
  { id: 'lessons_10', title: 'Bookworm', desc: 'Complete 10 lessons', check: s => s.totalLessonsCompleted >= 10 },
  { id: 'accuracy_90', title: 'Sharpshooter', desc: '90%+ overall accuracy', check: s => s.totalQuestionsAnswered >= 10 && (s.totalCorrectAnswers / s.totalQuestionsAnswered) >= 0.9 },
  { id: 'scan_first', title: 'First Scan', desc: 'Scan your first stock', check: s => s.scanCount >= 1 },
];

export function checkAchievements() {
  const newAchievements = [];
  ACHIEVEMENT_DEFS.forEach(a => {
    if (!_state.achievements.includes(a.id) && a.check(_state)) {
      newAchievements.push(a);
    }
  });
  if (newAchievements.length > 0) {
    setState({ achievements: [..._state.achievements, ...newAchievements.map(a => a.id)] });
  }
  return newAchievements;
}

export function getAllAchievements() {
  return ACHIEVEMENT_DEFS.map(a => ({
    ...a,
    unlocked: _state.achievements.includes(a.id)
  }));
}

// ============================================================
// PERSONALIZATION HELPERS
// ============================================================

export function getGreeting() {
  const hour = new Date().getHours();
  const name = _state.name || 'investor';
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

export function getMotivation() {
  const s = _state;
  const msgs = [];
  if (s.streak >= 7) msgs.push(`${s.streak}-day streak! You're building a powerful habit.`);
  else if (s.streak >= 3) msgs.push(`${s.streak} days strong. Keep the momentum.`);
  else if (s.streak === 1) msgs.push(`Day 1 starts now. Let's build your streak.`);

  if (s.totalLessonsCompleted === 0) msgs.push(`Ready for your first investing lesson?`);
  else if (s.totalLessonsCompleted < 5) msgs.push(`${5 - s.totalLessonsCompleted} more lessons to unlock your first badge.`);

  if (!s.dailyGoalMet) msgs.push(`Complete 1 lesson to hit today's goal.`);
  else msgs.push(`Daily goal complete. Keep going for bonus XP.`);

  return msgs;
}

export function getPersonalizedLessonOrder() {
  // Prioritize lessons based on user interests and goals
  const s = _state;
  if (s.investingGoal === 'learn_basics' || s.experience === 'total_beginner') {
    return 'standard'; // Linear path
  }
  return 'standard'; // For now, always linear. AI would reorder in production.
}

// ============================================================
// SCAN (MIGRATED)
// ============================================================

export function incrementScan() {
  setState({ scanCount: _state.scanCount + 1 });
  checkAchievements();
}

export function getScansRemaining() {
  if (_state.subscribed || isTrialActive()) return Infinity;
  return Math.max(0, 2 - _state.scanCount);
}

export function subscribe() {
  setState({ subscribed: true });
}

// ============================================================
// FREE TRIAL
// ============================================================

export function startTrial() {
  setState({ trialStartDate: new Date().toISOString(), subscribed: true });
}

export function isTrialActive() {
  if (!_state.trialStartDate) return false;
  const start = new Date(_state.trialStartDate);
  const now = new Date();
  const diffDays = (now - start) / (1000 * 60 * 60 * 24);
  return diffDays <= _state.trialDays;
}

export function getTrialDaysRemaining() {
  if (!_state.trialStartDate) return 0;
  const start = new Date(_state.trialStartDate);
  const now = new Date();
  const diffDays = (now - start) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(_state.trialDays - diffDays));
}

export function isPremium() {
  return _state.subscribed || isTrialActive();
}

export function markPostLessonPaywallSeen() {
  setState({ hasSeenPostLessonPaywall: true });
}

export function markOnboardingPaywallSeen() {
  setState({ hasSeenOnboardingPaywall: true });
}
