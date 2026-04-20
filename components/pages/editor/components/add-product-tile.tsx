"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";

interface AddProductTileProps {
  onClick: () => void;
}

const baseClasses =
  "group relative aspect-[1/1.3] cursor-pointer overflow-hidden h-full w-full rounded-2xl bg-[var(--system-200)]/50 flex items-center justify-center transition-colors duration-200 ease-[cubic-bezier(0.2,0,0,1)]";


export function AddProductTile({ onClick }: AddProductTileProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label="Add new product"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", duration: 0.2, bounce: 0 }}
      className={baseClasses}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[#EAF3FF]/0 transition-colors duration-200 ease-[cubic-bezier(0.2,0,0,1)] group-hover:bg-[#EAF3FF]/50"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_0_1px_rgba(180,202,245,0)] transition-shadow duration-200 ease-[cubic-bezier(0.2,0,0,1)] group-hover:shadow-[inset_0_0_0_1px_rgba(180,202,245,0.55),0_20px_40px_-24px_rgba(84,131,207,0.35)]"
      />
      <div
        className="relative z-10 text-[var(--system-300)]/90 transition-[color,filter,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)] group-hover:scale-[1.06] group-hover:text-[#B4CAF5] group-hover:[filter:drop-shadow(0_6px_18px_rgba(84,131,207,0.18))]"
      >
        <Plus className="h-10 w-10 stroke-3" />
      </div>
    </motion.button>
  );
}
