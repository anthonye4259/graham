import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { signInAnonymously, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const XP_LEVELS = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 20000];

const DEFAULT_STATE = {
  onboarded: false,
  name: '',
  investingGoal: '',
  experience: '',
  riskComfort: '',
  dailyTime: '',
  interests: [],
  xp: 0,
  level: 1,
  streak: 0,
  bestStreak: 0,
  lastActiveDate: null,
  hearts: 5,
  heartsResetDate: null,
  completedLessons: [],
  lessonScores: {},
  achievements: [],
  dailyGoalMet: false,
  totalLessonsCompleted: 0,
  totalCorrectAnswers: 0,
  totalQuestionsAnswered: 0,
  scanCount: 0,
  subscribed: false,
  trialStartDate: null,
  trialDays: 7,
  hasSeenPostLessonPaywall: false,
  hasSeenOnboardingPaywall: false,
  persona: 'Graham',
  fantasyPortfolio: [],
  dailyFactDate: null,
  dailyFact: null,
};

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [state, setStateRaw] = useState(DEFAULT_STATE);
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Load Firestore Data
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setStateRaw({ ...DEFAULT_STATE, ...docSnap.data() });
        } else {
          await setDoc(docRef, DEFAULT_STATE);
        }
      } else {
        setUser(null);
        setStateRaw(DEFAULT_STATE);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const setState = useCallback((patch) => {
    setStateRaw(prev => {
      const next = { ...prev, ...patch };
      if (user) {
        updateDoc(doc(db, 'users', user.uid), patch).catch(err => console.error("Firestore sync error:", err));
      }
      return next;
    });
  }, [user]);

  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  // Streak check on mount
  useEffect(() => {
    const today = new Date().toDateString();
    if (state.lastActiveDate && state.lastActiveDate !== today) {
      const last = new Date(state.lastActiveDate);
      const diff = Math.floor((new Date() - last) / 86400000);
      if (diff > 1) setState({ streak: 0, dailyGoalMet: false });
      else setState({ dailyGoalMet: false });
    }
  }, [state.lastActiveDate, setState]); 

  // Hearts reset
  useEffect(() => {
    const today = new Date().toDateString();
    if (state.heartsResetDate !== today && state.hearts < 5) {
      setState({ hearts: 5, heartsResetDate: today });
    }
  }, [state.heartsResetDate, state.hearts, setState]);

  const addXP = useCallback((amount) => {
    setStateRaw(prev => {
      let xp = prev.xp + amount;
      let level = prev.level;
      while (level < XP_LEVELS.length && xp >= XP_LEVELS[level]) level++;
      const next = { ...prev, xp, level };
      if (user) updateDoc(doc(db, 'users', user.uid), { xp, level });
      return next;
    });
  }, [user]);

  const completeLesson = useCallback((lessonId, correct, total) => {
    setStateRaw(prev => {
      if (prev.completedLessons.includes(lessonId)) return prev;
      const xpGain = correct === total ? 25 : 10;
      let xp = prev.xp + xpGain;
      let level = prev.level;
      while (level < XP_LEVELS.length && xp >= XP_LEVELS[level]) level++;
      
      const patch = {
        xp, level,
        completedLessons: [...prev.completedLessons, lessonId],
        lessonScores: { ...prev.lessonScores, [lessonId]: { correct, total, xp: xpGain } },
        totalLessonsCompleted: prev.totalLessonsCompleted + 1,
        totalCorrectAnswers: prev.totalCorrectAnswers + correct,
        totalQuestionsAnswered: prev.totalQuestionsAnswered + total,
      };
      
      if (user) updateDoc(doc(db, 'users', user.uid), patch);
      return { ...prev, ...patch };
    });
  }, [user]);

  const markDailyGoal = useCallback(() => {
    const today = new Date().toDateString();
    setStateRaw(prev => {
      const patch = {
        dailyGoalMet: true,
        lastActiveDate: today,
        streak: prev.lastActiveDate === today ? prev.streak : prev.streak + 1,
        bestStreak: Math.max(prev.bestStreak, (prev.lastActiveDate === today ? prev.streak : prev.streak + 1)),
      };
      if (user) updateDoc(doc(db, 'users', user.uid), patch);
      return { ...prev, ...patch };
    });
  }, [user]);

  const isTrialActive = useCallback(() => {
    if (!state.trialStartDate) return false;
    const diff = (new Date() - new Date(state.trialStartDate)) / 86400000;
    return diff <= state.trialDays;
  }, [state.trialStartDate, state.trialDays]);

  const isPremium = useCallback(() => {
    return state.subscribed || isTrialActive();
  }, [state.subscribed, isTrialActive]);

  const simulateBuy = useCallback((ticker, name, currentPrice) => {
    setStateRaw(prev => {
      // price might be a string like "$150.20", we need to parse it
      const numPrice = parseFloat(currentPrice.replace(/[^0-9.-]+/g,""));
      const newHolding = {
        ticker,
        name,
        purchasePrice: numPrice,
        shares: 1, // Just buying 1 share for simplicity in this prototype
        date: new Date().toISOString()
      };
      
      const patch = { fantasyPortfolio: [...prev.fantasyPortfolio, newHolding] };
      if (user) updateDoc(doc(db, 'users', user.uid), patch).catch(err => console.error(err));
      return { ...prev, ...patch };
    });
  }, [user]);

  const startTrial = useCallback(() => {
    setState({ 
      subscribed: true, 
      trialStartDate: new Date().toISOString(),
      hasSeenOnboardingPaywall: true,
      hasSeenPostLessonPaywall: true
    });
  }, [setState]);

  const getScansRemaining = useCallback(() => {
    if (isPremium()) return Infinity;
    return Math.max(0, 2 - state.scanCount);
  }, [isPremium, state.scanCount]);

  const incrementScan = useCallback(() => {
    setState({ scanCount: state.scanCount + 1 });
  }, [setState, state.scanCount]);

  const loseHeart = useCallback(() => {
    if (state.hearts > 0) setState({ hearts: state.hearts - 1 });
  }, [setState, state.hearts]);

  const getGreeting = useCallback(() => {
    const h = new Date().getHours();
    const name = state.name || 'Investor';
    if (h < 12) return `Good morning, ${name}`;
    if (h < 17) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  }, [state.name]);

  const getLevelTitle = useCallback(() => {
    const titles = ['Curious Mind', 'Market Student', 'Steady Learner', 'Pattern Spotter', 'Strategy Builder',
      'Risk Analyst', 'Market Navigator', 'Portfolio Thinker', 'Wealth Architect', 'Market Master', 'Investment Sage'];
    return titles[Math.min(state.level, titles.length) - 1] || 'Curious Mind';
  }, [state.level]);

  const getXPProgress = useCallback(() => {
    const curr = XP_LEVELS[state.level - 1] || 0;
    const next = XP_LEVELS[state.level] || XP_LEVELS[XP_LEVELS.length - 1];
    return ((state.xp - curr) / (next - curr)) * 100;
  }, [state.xp, state.level]);

  const value = {
    state, setState, addXP, completeLesson, markDailyGoal,
    isTrialActive, isPremium, startTrial, getScansRemaining,
    incrementScan, loseHeart, getGreeting, getLevelTitle, getXPProgress,
    user, loadingAuth, simulateBuy, login, signup, logout
  };

  if (loadingAuth) {
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
