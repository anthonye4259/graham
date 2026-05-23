import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { getTodaysLesson, getCompletedLessons, getAllLessonsCount, getNextLesson } from '../lib/lessons';

export default function HomePage() {
  const { state, completeLesson, markDailyGoal, isPremium } = useUser();
  const lesson = getTodaysLesson(state);
  const completed = getCompletedLessons(state);
  const todayDone = state.completedLessons.includes(lesson.id);
  const [answered, setAnswered] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(null);

  const handleQuiz = (idx) => {
    if (answered) return;
    setSelectedIdx(idx);
    setAnswered(true);
    const isCorrect = idx === lesson.quiz.correct;
    completeLesson(lesson.id, isCorrect ? 1 : 0, 1);
    if (!state.dailyGoalMet) markDailyGoal();
  };

  const h = new Date().getHours();
  const greeting = h < 12 ? `Good morning, ${state.name}` : h < 17 ? `Good afternoon, ${state.name}` : `Good evening, ${state.name}`;
  const motivations = ["Every expert was once a beginner.", "Small steps, big returns.", "Knowledge compounds faster than interest."];
  const motivation = motivations[Math.floor(Math.random() * motivations.length)];
  const nextLesson = getNextLesson(state);

  return (
    <div className="screen active" id="today-tab">
      <div className="today-greeting">{greeting}</div>
      <div className="today-motivation">{motivation}</div>

      <div className="today-stats-row">
        <div className="stat-pill"><ion-icon name="flame-outline" class="pill-icon flame"></ion-icon> <span>{state.streak} day{state.streak !== 1 ? 's' : ''}</span></div>
        <div className="stat-pill"><ion-icon name="flash-outline" class="pill-icon bolt"></ion-icon> <span>{state.xp} XP</span></div>
        <div className="stat-pill"><ion-icon name="book-outline" class="pill-icon"></ion-icon> <span>{completed.length}/{getAllLessonsCount()}</span></div>
      </div>

      {!todayDone ? (
        <>
          <div className="notif-badge"><ion-icon name="bulb-outline" class="notif-icon"></ion-icon> <span>TODAY'S LESSON</span></div>
          <div className="daily-lesson-card">
            <div className="lesson-meta"><span className="lesson-read-time"><ion-icon name="time-outline"></ion-icon> ~2 min read</span></div>
            <div className="lesson-icon-wrap"><ion-icon name={lesson.icon} class="lesson-hero-icon"></ion-icon></div>
            <h2 className="lesson-title">{lesson.title}</h2>
            <p className="lesson-body">{lesson.body}</p>
            <div className="lesson-takeaway">
              <div className="takeaway-label"><ion-icon name="diamond-outline" class="takeaway-icon"></ion-icon> Key Takeaway</div>
              <p className="takeaway-text">{lesson.takeaway}</p>
            </div>
            <div className="lesson-quiz">
              <div className="quiz-label"><ion-icon name="help-circle-outline" class="quiz-label-icon"></ion-icon> Quick Check</div>
              <p className="quiz-q">{lesson.quiz.q}</p>
              <div className="quiz-opts">
                {lesson.quiz.opts.map((opt, i) => (
                  <button
                    key={i}
                    className={`quiz-opt ${answered ? 'disabled' : ''} ${answered && i === lesson.quiz.correct ? 'correct' : ''} ${answered && i === selectedIdx && i !== lesson.quiz.correct ? 'wrong' : ''}`}
                    onClick={() => handleQuiz(i)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {answered && (
                <div className={`quiz-fb ${selectedIdx === lesson.quiz.correct ? 'correct' : 'wrong'}`}>
                  <ion-icon name={selectedIdx === lesson.quiz.correct ? 'checkmark-circle' : 'close-circle'} class="fb-icon"></ion-icon>
                  <span>{lesson.quiz.explain}</span>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="done-card">
          <div className="done-icon"><ion-icon name="checkmark-circle-outline"></ion-icon></div>
          <h3 className="done-title">Today's lesson complete</h3>
          <p className="done-sub">Come back tomorrow for your next personalized lesson.</p>
          {nextLesson && (
            <div className="done-next-preview">
              <div className="done-next-label"><ion-icon name="arrow-forward-outline"></ion-icon> Up Next</div>
              <div className="done-next-title">{nextLesson.title}</div>
            </div>
          )}
        </div>
      )}

      {completed.length > 0 && (
        <>
          <div className="section-heading">Previous Lessons</div>
          {completed.slice().reverse().map(l => (
            <div className="past-lesson" key={l.id}>
              <div className="past-icon"><ion-icon name={l.icon}></ion-icon></div>
              <div className="past-info">
                <div className="past-title">{l.title}</div>
                <div className="past-score"><ion-icon name="checkmark-circle-outline" class="past-check"></ion-icon> Completed</div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
