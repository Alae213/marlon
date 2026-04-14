"use client"

import * as React from "react"

import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuPortal,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from "@/components/ui/menu"

import { cn } from "@/lib/utils"

// Re-export the canonical Radix-based menu primitive.
export {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuCheckboxItem,
  MenuRadioItem,
  MenuLabel,
  MenuSeparator,
  MenuGroup,
  MenuPortal,
  MenuSub,
  MenuSubTrigger,
  MenuSubContent,
  MenuRadioGroup,
  MenuShortcut,
}

// Legacy dropdown aliases.
export {
  Menu as Dropdown,
  MenuTrigger as DropdownTrigger,
  MenuContent as DropdownContent,
  MenuItem as DropdownItem,
  MenuLabel as DropdownLabel,
  MenuSeparator as DropdownSeparator,
}

// Legacy layout helpers used by older callsites.
function MenuPanel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "min-w-[160px] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        className
      )}
      {...props}
    />
  )
}

function MenuItems({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export { MenuPanel, MenuItems }
