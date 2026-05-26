import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { analytics, trackEvent } from '../lib/firebase';

import NameStep from '../components/Onboarding/NameStep';
import GoalStep from '../components/Onboarding/GoalStep';
import RiskStep from '../components/Onboarding/RiskStep';
import PersonaStep from '../components/Onboarding/PersonaStep';
import HowItWorksStep from '../components/Onboarding/HowItWorksStep';
import WhoIsGrahamStep from '../components/Onboarding/WhoIsGrahamStep';

const TOTAL_STEPS = 7;

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const { setState, startTrial } = useUser();

  const advance = () => {
    if (step + 1 >= TOTAL_STEPS) {
      trackEvent('onboarding_complete');
      setState({ onboarded: true, hasSeenOnboardingPaywall: true });
    } else {
      setStep(s => s + 1);
    }
  };

  const steps = [
    <NameStep key={0} step={1} totalSteps={TOTAL_STEPS} onNext={(name) => { setState({ name }); advance(); }} />,
    <GoalStep key={1} step={2} totalSteps={TOTAL_STEPS} onNext={(goal) => { setState({ investingGoal: goal }); advance(); }} />,
    <RiskStep key={2} step={3} totalSteps={TOTAL_STEPS} onNext={(risk) => { setState({ riskTolerance: risk }); advance(); }} />,
    <WhoIsGrahamStep key={3} onNext={advance} />,
    <HowItWorksStep key={4} onNext={advance} />,
    <PersonaStep key={5} step={6} totalSteps={TOTAL_STEPS} onNext={(persona) => { setState({ persona }); advance(); }} />,
    <BuildingPlan key={6} onDone={advance} />
  ];

  return (
    <div className="screen onboarding active">
      {steps[step]}
    </div>
  );
}
