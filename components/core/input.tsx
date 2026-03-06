import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      style={{ boxShadow: "var(--shadow-inside-shadow)" }}
      className={cn(
        // Base styles
        "h-[32px] w-full min-w-0 rounded-[10px] bg-black/20 px-[8px] py-[6px] body-base",
        "transition-[color,box-shadow] outline-none text-[var(--system-100)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "placeholder:text-[var(--system-300)] text-base leading-[150%]",
        
        // Focus states
        "focus:outline-none focus:ring-0",
        "focus:text-[var(--system-100)]",
        
        // Custom class name
        className
      )}
      {...props}
    />
  )
}

export { Input }

Input.displayName = "Input"
