import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { getTodaysLesson, getAllLessonsCount } from '../lib/lessons';
import ValueProp from '../components/Onboarding/ValueProp';
import NameStep from '../components/Onboarding/NameStep';
import GoalStep from '../components/Onboarding/GoalStep';
import ExperienceStep from '../components/Onboarding/ExperienceStep';
import BuildingPlan from '../components/Onboarding/BuildingPlan';
import PlanReveal from '../components/Onboarding/PlanReveal';
import TrialPaywall from '../components/Onboarding/TrialPaywall';

const TOTAL_STEPS = 7;

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const { setState, startTrial } = useUser();

  const advance = () => {
    if (step + 1 >= TOTAL_STEPS) {
      setState({ onboarded: true, hasSeenOnboardingPaywall: true });
    } else {
      setStep(s => s + 1);
    }
  };

  const steps = [
    <ValueProp key={0} onNext={advance} totalSteps={TOTAL_STEPS} />,
    <NameStep key={1} step={1} totalSteps={TOTAL_STEPS} onNext={(name) => { setState({ name }); advance(); }} />,
    <GoalStep key={2} step={2} totalSteps={TOTAL_STEPS} onNext={(goal) => { setState({ investingGoal: goal }); advance(); }} />,
    <ExperienceStep key={3} step={3} totalSteps={TOTAL_STEPS} onNext={(exp) => { setState({ experience: exp }); advance(); }} />,
    <BuildingPlan key={4} onDone={advance} />,
    <PlanReveal key={5} step={5} totalSteps={TOTAL_STEPS} onNext={advance} />,
    <TrialPaywall key={6} step={6} totalSteps={TOTAL_STEPS} onTrial={() => { startTrial(); advance(); }} onSkip={advance} />,
  ];

  return (
    <div className="screen onboarding active">
      {steps[step]}
    </div>
  );
}
