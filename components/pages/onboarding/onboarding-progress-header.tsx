"use client";

import { OnboardingBackButton } from "./onboarding-back-button";

type OnboardingProgressHeaderProps = {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
};

export function OnboardingProgressHeader({
  currentStep,
  totalSteps,
  onBack,
}: OnboardingProgressHeaderProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="flex h-11 w-full items-center gap-2">
      <OnboardingBackButton onClick={onBack} />
      <div className="flex h-11 flex-1 items-center rounded-full bg-white px-4">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-[#E1E1E1]"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-valuenow={currentStep + 1}
        >
          <div
            className="h-full rounded-full bg-[#404040] transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

