"use client";

import Image from "next/image";
import { Plus } from "lucide-react";

type NewStorePreviewProps = {
  isSignUpOpen: boolean;
  onContinue: () => void;
};

export function NewStorePreview({ isSignUpOpen, onContinue }: NewStorePreviewProps) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-between bg-[var(--system-50)] px-4 py-10">
      <Image src="/logo.svg" alt="Marlon Logo" width={71} height={22} />

      <div
        aria-hidden={isSignUpOpen}
        className={`flex flex-col items-center gap-6 transition-opacity duration-200 ${
          isSignUpOpen ? "pointer-events-none select-none opacity-70" : ""
        }`}
      >
        <button
          type="button"
          onClick={onContinue}
          className="flex h-[200px] w-[200px] cursor-pointer flex-col items-start justify-between rounded-[32px] bg-[var(--system-100)] p-5 text-left transition-transform duration-150 active:scale-[0.96]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-[26px] bg-[var(--system-200)]">
            <Plus className="h-5 w-5 text-[var(--system-600)]" />
          </div>

          <p className="body-base text-[var(--system-600)]">new store </p>
        </button>
      </div>

      <p className="label-xs text-[var(--system-400)]">© 2026 Marlon. All rights reserved.</p>
    </div>
  );
}

