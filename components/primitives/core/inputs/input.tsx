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
        "h-8 w-full min-w-0 rounded-xl bg-black/20 px-3 py-1.5 body-base",
        "transition-[color,box-shadow] outline-none text-foreground",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "placeholder:text-muted-foreground text-base leading-[150%]",
        
        // Focus states
        "focus:outline-none focus:ring-0",
        
        // Custom class name
        className
      )}
      {...props}
    />
  )
}

export { Input }

Input.displayName = "Input"
