import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { signInAnonymously, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';

// SAFE: dynamic imports to prevent crash on iPad when plugins aren't registered
async function getPurchases() {
  try { const m = await import('@revenuecat/purchases-capacitor'); return { plugin: m.Purchases }; }
  catch (e) { console.warn('Purchases not available:', e.message); return null; }
}
async function getPushNotifications() {
  try { const m = await import('@capacitor/push-notifications'); return { plugin: m.PushNotifications }; }
  catch (e) { console.warn('PushNotifications not available:', e.message); return null; }
}

function getRevenueCatAppleKey() {
  const key = import.meta.env.VITE_REVENUECAT_APPLE_KEY || import.meta.env.VITE_REVENUECAT_PUBLIC_KEY;
  return key && key !== 'appl_REPLACE_ME_WHEN_READY' ? key : '';
}

const XP_LEVELS = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 20000];

const DEFAULT_STATE = {
  onboarded: false,
  name: '',
  investingGoal: '',
  experience: '',
  riskTolerance: '',
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
  trialDays: 3,
  hasSeenOnboardingPaywall: false,
  hasSeenPostLessonPaywall: false,
  persona: 'Graham',
  fantasyPortfolio: [],
  dailyFactDate: null,
  dailyFact: null,
  premiumScansToday: 0,
  lastPremiumScanDate: null,
  chatHistory: [],
  pushEnabled: false,
  pushToken: null,
  milestones: [],
  hasSeenFeedTutorial: false,
};

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [state, setStateRaw] = useState(DEFAULT_STATE);
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    // Safety fallback: ensure loading screen clears after 5 seconds if Firestore hangs
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setLoadingAuth(false);
        console.warn("Auth initialization timed out. Forcing app to load.");
      }
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          setUser(currentUser);
          
           // Configure RevenueCat if Native — with timeout
          let isNativeSubscribed = false;
          
          // App Store Review account bypass — define early so listener can check
          const REVIEW_EMAIL = 'review@grahamai.com';
          const isReviewAccount = currentUser.email === REVIEW_EMAIL;
          
          const EXPIRED_REVIEW_EMAIL = 'expired@grahamai.com';
          const isExpiredReviewAccount = currentUser.email === EXPIRED_REVIEW_EMAIL;
          
          if (Capacitor.isNativePlatform()) {
            try {
              const Purchases = (await getPurchases())?.plugin;
              const revenueCatKey = getRevenueCatAppleKey();
              if (revenueCatKey && Purchases) {
                await Promise.race([
                  (async () => {
                    await Purchases.configure({ apiKey: revenueCatKey, appUserID: currentUser.uid });
                    
                    // Listen for dynamic updates (crucial for Sandbox/delayed purchases)
                    Purchases.addCustomerInfoUpdateListener((info) => {
                      // Review accounts: never auto-enable from listener
                      if (isReviewAccount || isExpiredReviewAccount) return;
                      const active = info.entitlements?.active || {};
                      if (active["graham ai Pro"] || active["premium"] || Object.keys(active).length > 0) {
                        setStateRaw(s => ({ ...s, subscribed: true }));
                      }
                    });

                    const result = await Purchases.getCustomerInfo();
                    const info = result.customerInfo || result;
                    const activeEntitlements = info.entitlements?.active || {};
                    if (activeEntitlements["graham ai Pro"] || activeEntitlements["premium"] || Object.keys(activeEntitlements).length > 0) {
                      isNativeSubscribed = true;
                    }
                  })(),
                  new Promise((_, reject) => setTimeout(() => reject(new Error('RC timeout')), 5000))
                ]);
              }
            } catch (err) {
              console.warn("RevenueCat skipped:", err.message);
            }
          }

          // Load Firestore Data
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          const expiredTrialDate = new Date();
          expiredTrialDate.setDate(expiredTrialDate.getDate() - 10); // 10 days ago
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (isNativeSubscribed && !isReviewAccount && !isExpiredReviewAccount) data.subscribed = true;
            if (isReviewAccount) {
              data.onboarded = true; data.name = data.name || 'App Reviewer'; data.investingGoal = data.investingGoal || 'learn_basics'; data.persona = data.persona || 'Graham'; data.hasSeenFeedTutorial = true;
              // ALWAYS force paywall for Apple Review — ignore RevenueCat existing entitlements
              data.subscribed = false; data.trialStartDate = null;
              // Persist to Firestore so DB doesn't have stale subscribed:true
              try { await updateDoc(docRef, { subscribed: false, trialStartDate: null, onboarded: true }); } catch(e) { console.warn('Review account Firestore update failed:', e); }
            }
            if (isExpiredReviewAccount) {
              data.onboarded = true; data.name = data.name || 'App Reviewer (Expired)'; data.investingGoal = data.investingGoal || 'learn_basics'; data.persona = data.persona || 'Graham'; data.hasSeenFeedTutorial = true;
              data.subscribed = false; data.trialStartDate = expiredTrialDate.toISOString();
              try { await updateDoc(docRef, { subscribed: false, trialStartDate: expiredTrialDate.toISOString(), onboarded: true }); } catch(e) { console.warn('Review account Firestore update failed:', e); }
            }
            if (isMounted) setStateRaw({ ...DEFAULT_STATE, ...data });
          } else {
            const defaultWithSub = { ...DEFAULT_STATE };
            if (isNativeSubscribed && !isReviewAccount && !isExpiredReviewAccount) defaultWithSub.subscribed = true;
            if (isReviewAccount) {
              defaultWithSub.onboarded = true; defaultWithSub.name = 'App Reviewer'; defaultWithSub.investingGoal = 'learn_basics'; defaultWithSub.persona = 'Graham'; defaultWithSub.hasSeenFeedTutorial = true;
              defaultWithSub.subscribed = false; defaultWithSub.trialStartDate = null;
            }
            if (isExpiredReviewAccount) {
              defaultWithSub.onboarded = true; defaultWithSub.name = 'App Reviewer (Expired)'; defaultWithSub.investingGoal = 'learn_basics'; defaultWithSub.persona = 'Graham'; defaultWithSub.hasSeenFeedTutorial = true;
              defaultWithSub.subscribed = false; defaultWithSub.trialStartDate = expiredTrialDate.toISOString();
            }
            await setDoc(docRef, defaultWithSub);
            if (isMounted) setStateRaw(defaultWithSub);
          }
        } else {
          if (isMounted) {
            setUser(null);
            setStateRaw(DEFAULT_STATE);
          }
        }
      } catch (err) {
        console.error("Auth state error:", err);
      } finally {
        if (isMounted) setLoadingAuth(false);
        clearTimeout(safetyTimer);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
      clearTimeout(safetyTimer);
    };
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

  const deleteAccount = async () => {
    try {
      if (user) {
        // Delete Firestore user document
        await deleteDoc(doc(db, 'users', user.uid));
        // Delete Firebase Auth account
        await user.delete();
      }
    } catch (err) {
      console.error("Account deletion error:", err);
      // If re-authentication is needed, sign them out so they can sign back in and try again
      if (err.code === 'auth/requires-recent-login') {
        await signOut(auth);
        throw new Error('Please sign in again and retry account deletion.');
      }
      throw err;
    }
  };

  const requestPushPermissions = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const PN = (await getPushNotifications())?.plugin;
        if (!PN) return;
        let permStatus = await PN.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PN.requestPermissions();
        }

        if (permStatus.receive === 'granted') {
          await PN.register();
        }
      }
    } catch (e) {
      console.warn('Push notification setup failed:', e);
    }
  };

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      let listeners = [];
      (async () => {
        const PN = (await getPushNotifications())?.plugin;
        if (!PN) return;
        listeners.push(
          PN.addListener('registration', (token) => {
            if (user) {
              updateDoc(doc(db, 'users', user.uid), { pushToken: token.value, pushEnabled: true });
              setStateRaw(s => ({ ...s, pushToken: token.value, pushEnabled: true }));
            }
          })
        );
        listeners.push(
          PN.addListener('registrationError', (error) => {
            console.error('Error on registration: ' + JSON.stringify(error));
          })
        );
      })();
      return () => {
        listeners.forEach(async (listenerPromise) => {
          try {
            const handle = await listenerPromise;
            if (handle && handle.remove) handle.remove();
          } catch (e) { /* listener already cleaned up */ }
        });
      };
    }
  }, [user]);

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
      // price might be a string like "$150.20" or a number
      const numPrice = typeof currentPrice === 'number' ? currentPrice : parseFloat(String(currentPrice).replace(/[^0-9.-]+/g,""));
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
    // Free users get 3 scans per day
    const today = new Date().toDateString();
    const todayScans = state.lastFreeScansDate === today ? (state.freeScansToday || 0) : 0;
    return Math.max(0, 3 - todayScans);
  }, [isPremium, state.lastFreeScansDate, state.freeScansToday]);

  const incrementScan = useCallback(() => {
    setStateRaw(prev => {
      let patch = {};
      const today = new Date().toDateString();
      if (isPremium()) {
        if (prev.lastPremiumScanDate !== today) {
          patch = { lastPremiumScanDate: today, premiumScansToday: 1 };
        } else {
          patch = { premiumScansToday: (prev.premiumScansToday || 0) + 1 };
        }
      } else {
        // Track free user scans
        if (prev.lastFreeScansDate !== today) {
          patch = { lastFreeScansDate: today, freeScansToday: 1 };
        } else {
          patch = { freeScansToday: (prev.freeScansToday || 0) + 1 };
        }
      }
      if (user && Object.keys(patch).length > 0) {
        updateDoc(doc(db, 'users', user.uid), patch).catch(err => console.error(err));
      }
      return { ...prev, ...patch };
    });
  }, [isPremium, user]);

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
    if (next === curr) return 100;
    return ((state.xp - curr) / (next - curr)) * 100;
  }, [state.xp, state.level]);

  const hasUsedTrial = useCallback(() => {
    return !!state.trialStartDate;
  }, [state.trialStartDate]);

  const value = {
    state, setState, addXP, completeLesson, markDailyGoal,
    isTrialActive, isPremium, startTrial, getScansRemaining, hasUsedTrial,
    incrementScan, loseHeart, getGreeting, getLevelTitle, getXPProgress,
    user, loadingAuth, simulateBuy, login, signup, logout, deleteAccount, requestPushPermissions
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
