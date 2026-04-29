"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends Omit<React.ComponentProps<"button">, "onChange"> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

function Checkbox({ checked = false, onChange, className, children, ...props }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      data-checked={checked ? "true" : "false"}
      onClick={() => onChange?.(!checked)}
      className={cn(
        // Base styles
        "relative inline-flex items-center justify-center cursor-pointer",
        // Size
        "w-4 h-4",
        // Border and background
        "rounded border-[1.8px] border-[var(--system-300)] bg-white/0",
        // Transitions
        "transition-all duration-150 ease-out",
        // Hover states
        "hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/10",
        // Focus states
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40 focus-visible:ring-offset-1",
        // Checked states
        "data-[state=checked]:bg-[var(--color-primary)] data-[state=checked]:border-[var(--color-primary)]",
        // Disabled states
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:border-[var(--system-200)]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function CheckboxIndicator({ className, ...props }: React.ComponentProps<typeof Check>) {
  return (
    <Check 
      className={cn(
        // Base styles
        "absolute text-white",
        // Size
        "w-3 h-3",
        // Transitions
        "transition-all duration-150 ease-out",
        // States
        "opacity-0 scale-75 group-data-[state=checked]:opacity-100 group-data-[state=checked]:scale-100",
        className
      )} 
      {...props} 
    />
  );
}

export { Checkbox, CheckboxIndicator };
