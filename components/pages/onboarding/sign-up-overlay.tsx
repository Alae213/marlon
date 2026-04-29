"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

type SignUpOverlayProps = {
  children: ReactNode;
  onClose: () => void;
};

export function SignUpOverlay({ children, onClose }: SignUpOverlayProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Create your account"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[440px]">
        <button
          type="button"
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-md bg-white/92 text-[--system-500] shadow-[var(--shadow-md)] hover:bg-white hover:text-[--system-700]"
          aria-label="Close"
          onClick={onClose}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>
  );
}

