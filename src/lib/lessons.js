import { DAILY_LESSONS, GOAL_CATEGORIES } from '../data/lessons';

export function getTodaysLesson(state) {
  const goal = state?.investingGoal || 'learn_basics';
  const priorities = GOAL_CATEGORIES[goal] || GOAL_CATEGORIES.learn_basics;
  const completed = state?.completedLessons || [];

  const sorted = [...DAILY_LESSONS].sort((a, b) => {
    const aIdx = priorities.indexOf(a.category);
    const bIdx = priorities.indexOf(b.category);
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
  });

  return sorted.find(l => !completed.includes(l.id)) || sorted[0];
}

export function getCompletedLessons(state) {
  const completed = state?.completedLessons || [];
  return DAILY_LESSONS.filter(l => completed.includes(l.id));
}

export function getAllLessonsCount() {
  return DAILY_LESSONS.length;
}

export function getNextLesson(state) {
  const goal = state?.investingGoal || 'learn_basics';
  const priorities = GOAL_CATEGORIES[goal] || GOAL_CATEGORIES.learn_basics;
  const completed = state?.completedLessons || [];

  const sorted = [...DAILY_LESSONS].sort((a, b) => {
    const aIdx = priorities.indexOf(a.category);
    const bIdx = priorities.indexOf(b.category);
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
  });

  const uncompleted = sorted.filter(l => !completed.includes(l.id));
  return uncompleted.length > 1 ? uncompleted[1] : null;
}
