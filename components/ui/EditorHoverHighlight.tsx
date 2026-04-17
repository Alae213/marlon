"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface EditorHoverHighlightProps extends ComponentProps<"span"> {
  isDisabled?: boolean;
}

export function EditorHoverHighlight({
  className,
  isDisabled = false,
  style,
  ...props
}: EditorHoverHighlightProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 border border-[#B4CAF5] bg-[#EAF3FF]/50 opacity-0 transition-opacity duration-200",
        !isDisabled && "group-hover:opacity-100",
        className
      )}
      style={{ borderWidth: "1.2px", ...style }}
      {...props}
    />
  );
}
