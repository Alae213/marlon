"use client";

import { Button } from "@/components/ui/button";
import {
  type PreSignupOptionValue,
  type PreSignupQuestion,
} from "./onboarding-data";
import { OnboardingOptionRow } from "./onboarding-option-row";
import { OnboardingProgressHeader } from "./onboarding-progress-header";

type OnboardingQuestionScreenProps = {
  canContinue: boolean;
  currentStep: number;
  question: PreSignupQuestion;
  selectedValues: PreSignupOptionValue[];
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onSelect: (question: PreSignupQuestion, value: PreSignupOptionValue) => void;
};

export function OnboardingQuestionScreen({
  canContinue,
  currentStep,
  question,
  selectedValues,
  totalSteps,
  onBack,
  onNext,
  onSelect,
}: OnboardingQuestionScreenProps) {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[var(--system-50)] px-4 py-6">
      <section className="flex h-[535px] w-full max-w-[358px] flex-col justify-between pt-2.5 md:max-w-[420px]">
        <div className="flex flex-col gap-[22px]">
          <div className="flex flex-col gap-2">
            <OnboardingProgressHeader
              currentStep={currentStep}
              totalSteps={totalSteps}
              onBack={onBack}
            />
            <h1 className="onboarding-title max-w-[334px] text-[#404040] md:max-w-[396px]">
              {question.title}
            </h1>
          </div>

          <div className="grid gap-2">
            {question.options.map((option) => (
              <OnboardingOptionRow
                key={option.value}
                label={option.label}
                value={option.value}
                isSelected={selectedValues.includes(option.value)}
                onSelect={(value) => onSelect(question, value)}
              />
            ))}
          </div>
        </div>

        <div className="flex h-[72px] items-start rounded-[34px] bg-black/[0.03] p-3">
          <Button
            type="button"
            size="xl"
            onClick={onNext}
            disabled={!canContinue}
            aria-hidden={!canContinue}
            className={`w-full ${canContinue ? "" : "invisible"}`}
          >
            Continue
          </Button>
        </div>
      </section>
    </main>
  );
}
