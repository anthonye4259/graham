// LEARN — Daily personalized lesson card (replaces skill tree)
import { DAILY_LESSONS, GOAL_CATEGORIES } from './lessons.js';
import { getState, isLessonCompleted } from './state.js';

export function getTodaysLesson() {
  const s = getState();
  const goal = s.investingGoal || 'learn_basics';
  const priorities = GOAL_CATEGORIES[goal] || GOAL_CATEGORIES.learn_basics;

  // Find first uncompleted lesson, prioritized by user goal
  const sorted = [...DAILY_LESSONS].sort((a, b) => {
    const aIdx = priorities.indexOf(a.category);
    const bIdx = priorities.indexOf(b.category);
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
  });

  return sorted.find(l => !isLessonCompleted(l.id)) || sorted[0];
}

export function getCompletedLessons() {
  const s = getState();
  return DAILY_LESSONS.filter(l => isLessonCompleted(l.id));
}

export function getAllLessonsCount() {
  return DAILY_LESSONS.length;
}

export function getNextLesson() {
  const s = getState();
  const goal = s.investingGoal || 'learn_basics';
  const priorities = GOAL_CATEGORIES[goal] || GOAL_CATEGORIES.learn_basics;
  const sorted = [...DAILY_LESSONS].sort((a, b) => {
    const aIdx = priorities.indexOf(a.category);
    const bIdx = priorities.indexOf(b.category);
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
  });
  const current = sorted.find(l => !isLessonCompleted(l.id));
  if (!current) return null;
  const idx = sorted.indexOf(current);
  // Find next uncompleted after current
  return sorted.slice(idx + 1).find(l => !isLessonCompleted(l.id)) || null;
}
