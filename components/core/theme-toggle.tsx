"use client";

import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme/provider";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, setTheme, isLoading } = useTheme();

  if (isLoading) {
    return (
      <div className={`w-14 h-7 bg-gray-200 rounded-full relative ${className}`}>
        <div className="w-5 h-5 bg-white rounded-full absolute top-1 start-1 shadow-sm" />
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <motion.button
      className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        isDark 
          ? "bg-gradient-to-r from-gray-700 to-gray-900" 
          : "bg-gradient-to-r from-yellow-300 to-orange-400"
      } ${className}`}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      whileTap={{ scale: 0.95 }}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {/* Sliding thumb */}
      <motion.div
        className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg flex items-center justify-center"
        animate={{
          x: isDark ? 28 : 4,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
      >
        {/* Icon inside thumb */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ 
            scale: 1, 
            rotate: isDark ? 0 : -180,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
        >
          {isDark ? (
            <Moon className="w-3 h-3 text-gray-700" />
          ) : (
            <Sun className="w-3 h-3 text-yellow-500" />
          )}
        </motion.div>
      </motion.div>

      {/* Background icons (decorative) */}
      <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
        <motion.div
          animate={{
            opacity: isDark ? 0.3 : 0.8,
            scale: isDark ? 0.8 : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          <Sun className="w-3 h-3 text-white" />
        </motion.div>
        <motion.div
          animate={{
            opacity: isDark ? 0.8 : 0.3,
            scale: isDark ? 1 : 0.8,
          }}
          transition={{ duration: 0.3 }}
        >
          <Moon className="w-3 h-3 text-white" />
        </motion.div>
      </div>
    </motion.button>
  );
}
