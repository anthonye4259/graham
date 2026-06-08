import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { analytics, trackEvent } from '../lib/firebase';

import NameStep from '../components/Onboarding/NameStep';
import GoalStep from '../components/Onboarding/GoalStep';
import RiskStep from '../components/Onboarding/RiskStep';
import ArchetypeReveal from '../components/Onboarding/ArchetypeReveal';
import InteractiveTeaser from '../components/Onboarding/InteractiveTeaser';
import PersonaStep from '../components/Onboarding/PersonaStep';
import HowItWorksStep from '../components/Onboarding/HowItWorksStep';
import WhoIsGrahamStep from '../components/Onboarding/WhoIsGrahamStep';
import PortfolioUploadStep from '../components/Onboarding/PortfolioUploadStep';
import RatingStep from '../components/Onboarding/RatingStep';
import BuildingPlan from '../components/Onboarding/BuildingPlan';

const TOTAL_STEPS = 11;

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const { state, setState, startTrial, requestPushPermissions } = useUser();

  const advance = async () => {
    if (step + 1 >= TOTAL_STEPS) {
      try {
        trackEvent('onboarding_complete');
      } catch (e) { /* analytics failure is non-critical */ }
      setState({ onboarded: true, hasSeenOnboardingPaywall: true });
      try {
        if (state.pushEnabled === false) {
          await requestPushPermissions();
        }
      } catch (e) {
        console.warn('Push permissions failed during onboarding:', e);
      }
    } else {
      setStep(s => s + 1);
    }
  };

  const steps = [
    <NameStep key={0} step={1} totalSteps={TOTAL_STEPS} onNext={(name) => { setState({ name }); advance(); }} />,
    <GoalStep key={1} step={2} totalSteps={TOTAL_STEPS} onNext={(goal) => { setState({ investingGoal: goal }); advance(); }} />,
    <RiskStep key={2} step={3} totalSteps={TOTAL_STEPS} onNext={(risk) => { setState({ riskTolerance: risk }); advance(); }} />,
    <ArchetypeReveal key={3} step={4} totalSteps={TOTAL_STEPS} riskTolerance={state.riskTolerance} onNext={advance} />,
    <InteractiveTeaser key={4} step={5} totalSteps={TOTAL_STEPS} onNext={advance} />,
    <WhoIsGrahamStep key={5} onNext={advance} />,
    <HowItWorksStep key={6} onNext={advance} />,
    <PersonaStep key={7} step={8} totalSteps={TOTAL_STEPS} onNext={(persona) => { setState({ persona }); advance(); }} />,
    <PortfolioUploadStep key={8} step={9} totalSteps={TOTAL_STEPS} onNext={advance} />,
    <RatingStep key={9} step={10} totalSteps={TOTAL_STEPS} onNext={advance} />,
    <BuildingPlan key={10} onDone={advance} />
  ];

  return (
    <div className="screen onboarding active">
      <div key={step} className="fade-in-up" style={{ height: '100%', width: '100%' }}>
        {steps[step]}
      </div>
    </div>
  );
}
