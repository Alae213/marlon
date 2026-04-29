"use client";

import { ChevronLeft } from "lucide-react";

type OnboardingBackButtonProps = {
  onClick: () => void;
};

export function OnboardingBackButton({ onClick }: OnboardingBackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Go back"
      className="onboarding-back-button"
    >
      <ChevronLeft
        className="h-[21px] w-[21px]"
        strokeWidth={3}
        aria-hidden="true"
      />
    </button>
  );
}
