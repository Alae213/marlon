"use client";

import { forwardRef } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/springs";
import { fontWeights } from "@/lib/font-weight";
import type React from "react";

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, side = "top", sideOffset = 8, children, ...props }, ref) => {
  const initial =
    side === "top"
      ? { opacity: 0, y: 4 }
      : side === "bottom"
        ? { opacity: 0, y: -4 }
        : side === "left"
          ? { opacity: 0, x: 4 }
          : { opacity: 0, x: -4 };

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content ref={ref} side={side} sideOffset={sideOffset} className="z-50" {...props}>
        <motion.div
          className={cn(
            "rounded-lg bg-[var(--system-700)] px-2 py-1 text-caption text-[var(--system-50)]",
            className,
          )}
          style={{ fontVariationSettings: fontWeights.medium }}
          initial={initial}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={springs.fast}
        >
          {children}
        </motion.div>
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
});
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
