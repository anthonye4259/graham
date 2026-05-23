import { useUser } from '../../context/UserContext';
import { getTodaysLesson, getAllLessonsCount } from '../../lib/lessons';
import ProgressDots from '../ui/ProgressDots';

const GOAL_LABELS = {
  grow_wealth: 'Wealth Growth', retirement: 'Retirement Planning',
  passive_income: 'Passive Income', learn_options: 'Options Trading', learn_basics: 'Market Basics',
};

export default function PlanReveal({ step, totalSteps, onNext }) {
  const { state } = useUser();
  const lesson = getTodaysLesson(state);

  const items = [
    { icon: 'ribbon-outline', label: 'Your track', val: GOAL_LABELS[state.investingGoal] || 'Market Basics' },
    { icon: 'book-outline', label: 'First lesson', val: lesson.title },
    { icon: 'time-outline', label: 'Daily commitment', val: '~3 minutes per day' },
    { icon: 'layers-outline', label: 'Lessons available', val: `${getAllLessonsCount()} personalized lessons` },
    { icon: 'scan-outline', label: 'Stock scans', val: '2 free scans included' },
  ];

  return (
    <div className="onboard-step ob-plan-reveal">
      <ProgressDots current={step} total={totalSteps} />
      <div className="ob-plan-badge"><ion-icon name="checkmark-circle" className="ob-plan-check"></ion-icon> PLAN READY</div>
      <div className="onboard-title">{state.name}, here's your plan</div>
      <div className="ob-plan-cards">
        {items.map((item, i) => (
          <div className="ob-plan-item" key={i}>
            <div className="ob-plan-icon"><ion-icon name={item.icon}></ion-icon></div>
            <div className="ob-plan-info">
              <div className="ob-plan-label">{item.label}</div>
              <div className="ob-plan-val">{item.val}</div>
            </div>
          </div>
        ))}
      </div>
      <button className="onboard-next" onClick={onNext}>Continue</button>
    </div>
  );
}
