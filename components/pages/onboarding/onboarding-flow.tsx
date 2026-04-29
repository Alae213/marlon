"use client";

import { SignUp } from "@clerk/nextjs";
import { NewStorePreview } from "./new-store-preview";
import { OnboardingQuestionScreen } from "./onboarding-question-screen";
import { SignUpOverlay } from "./sign-up-overlay";
import { useOnboardingFlow } from "./use-onboarding-flow";

export function OnboardingFlow() {
  const onboarding = useOnboardingFlow();

  if (onboarding.showPreview) {
    return (
      <>
        <NewStorePreview
          isSignUpOpen={onboarding.isSignUpOpen}
          onContinue={() => onboarding.setIsSignUpOpen(true)}
        />

        {onboarding.isSignUpOpen ? (
          <SignUpOverlay onClose={() => onboarding.setIsSignUpOpen(false)}>
            <SignUp routing="virtual" fallbackRedirectUrl="/" />
          </SignUpOverlay>
        ) : null}
      </>
    );
  }

  return (
    <OnboardingQuestionScreen
      canContinue={onboarding.canContinue}
      currentStep={onboarding.currentStep}
      question={onboarding.question}
      selectedValues={onboarding.selectedValues}
      totalSteps={onboarding.totalSteps}
      onBack={onboarding.handleBack}
      onNext={onboarding.handleNext}
      onSelect={onboarding.handleSelect}
    />
  );
}
