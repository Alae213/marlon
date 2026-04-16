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
        "group inline-flex items-center justify-center border border-transparent transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function CheckboxIndicator({ className, ...props }: React.ComponentProps<typeof Check>) {
  return <Check className={cn("opacity-0 transition-opacity group-data-[state=checked]:opacity-100", className)} {...props} />;
}

export { Checkbox, CheckboxIndicator };
