"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/animate-ui/components/animate/tooltip";

interface FloatingStyleToolbarProps {
  isHovered: boolean;
  navbarBg: "light" | "dark" | "glass";
  navbarText: "dark" | "light";
  onSetBackground: (bg: "light" | "dark" | "glass") => void;
  onSetTextColor: (color: "dark" | "light") => void;
}

export function FloatingStyleToolbar({
  isHovered,
  navbarBg,
  navbarText,
  onSetBackground,
  onSetTextColor,
}: FloatingStyleToolbarProps) {
  return (
    <AnimatePresence>
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="absolute top-full mt-2 left-1/2 -translate-x-1/2 flex items-center z-40"
        >
          <div className="flex items-center gap-2 bg-[image:var(--gradient-popup)] rounded-[12px] px-3 py-2" style={{ boxShadow: "var(--bottom-nav-shadow)" }}>
        {/* Light Mode */}
        <Tooltip side="bottom">
          <TooltipTrigger>
            <button
              onClick={() => onSetBackground("light")}
              className="relative w-[12px] h-[12px] rounded-full bg-white border border-[#171717] hover:scale-125 transition-transform"
            >
              {navbarBg === "light" && (
                <motion.div
                  layoutId="navbar-bg-indicator"
                  className="absolute -inset-1.5 rounded-full border-2 border-white/60"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>Light</TooltipContent>
        </Tooltip>

        {/* Dark Mode */}
        <Tooltip side="bottom">
          <TooltipTrigger>
            <button
              onClick={() => onSetBackground("dark")}
              className="relative w-[12px] h-[12px] rounded-full bg-[#171717] border border-white/20 hover:scale-125 transition-transform"
            >
              {navbarBg === "dark" && (
                <motion.div
                  layoutId="navbar-bg-indicator"
                  className="absolute -inset-1.5 rounded-full border-2 border-white/60"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>Dark</TooltipContent>
        </Tooltip>

        {/* Glass Mode */}
        <Tooltip side="bottom">
          <TooltipTrigger>
            <button
              onClick={() => onSetBackground("glass")}
              className="relative w-[12px] h-[12px] rounded-full hover:scale-125 transition-transform"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(0,0,0,0.2) 100%)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {navbarBg === "glass" && (
                <motion.div
                  layoutId="navbar-bg-indicator"
                  className="absolute -inset-1.5 rounded-full border-2 border-white/60"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>Glass</TooltipContent>
        </Tooltip>

        {/* Text Color Toggle (Glass mode only) */}
        {navbarBg === "glass" && (
          <>
            <div className="w-px h-[20px] bg-white/15 mx-2" />
            <Tooltip side="bottom">
              <TooltipTrigger>
                <button
                  onClick={() => onSetTextColor("dark")}
                  className="relative w-[12px] h-[12px] rounded-full bg-[#171717] border border-white/20 hover:scale-125 transition-transform"
                >
                  {navbarText === "dark" && (
                    <motion.div
                      layoutId="navbar-text-indicator"
                      className="absolute -inset-1.5 rounded-full border-2 border-white/60"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>Dark text</TooltipContent>
            </Tooltip>
            <Tooltip side="bottom">
              <TooltipTrigger>
                <button
                  onClick={() => onSetTextColor("light")}
                  className="relative w-[12px] h-[12px] rounded-full bg-white border border-[#171717] hover:scale-125 transition-transform"
                >
                  {navbarText === "light" && (
                    <motion.div
                      layoutId="navbar-text-indicator"
                      className="absolute -inset-1.5 rounded-full border-2 border-white/60"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>Light text</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
