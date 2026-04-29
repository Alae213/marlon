"use client";

import { cn } from "@/lib/utils";
import type { PreSignupOptionValue } from "./onboarding-data";

type OnboardingOptionRowProps = {
  label: string;
  value: PreSignupOptionValue;
  isSelected: boolean;
  onSelect: (value: PreSignupOptionValue) => void;
};

export function OnboardingOptionRow({
  label,
  value,
  isSelected,
  onSelect,
}: OnboardingOptionRowProps) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      title={label}
      onClick={() => onSelect(value)}
      className={cn(
        "flex min-h-16 w-full items-center rounded-[20px] border px-4 py-4 text-left transition-all duration-150 active:scale-[0.99]",
        isSelected
          ? "border-[#B4CAF5] bg-[#F0F5FB]"
          : "border-transparent bg-[#EFEFEF] hover:bg-[#E9E9E9]"
      )}
    >
      <span className="onboarding-option-text min-w-0 flex-1 truncate text-[#404040]">
        {label}
      </span>
    </button>
  );
}
