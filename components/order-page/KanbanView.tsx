"use client";

import { SubtleTab, SubtleTabItem } from "@/components/ui/subtle-tab";
import type { LucideIcon } from "lucide-react";

// Custom icon components - SVG icons styled to match text color via currentColor
const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_164_2937)">
      <path d="M2.594 2.59478C3.5215 1.66732 5.01428 1.66732 7.99984 1.66732C10.9854 1.66732 12.4782 1.66732 13.4057 2.59478C14.3332 3.52232 14.3332 5.01512 14.3332 8.00065C14.3332 10.9862 14.3332 12.479 13.4057 13.4065C12.4782 14.334 10.9854 14.334 7.99984 14.334C5.01428 14.334 3.5215 14.334 2.594 13.4065C1.6665 12.479 1.6665 10.9862 1.6665 8.00065C1.6665 5.01512 1.6665 3.52232 2.594 2.59478Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M1.6665 10.334L14.3332 10.334" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M1.6665 5.66602L14.3332 5.66602" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
    <defs>
      <clipPath id="clip0_164_2937">
        <rect width="16" height="16" fill="white" transform="translate(6.99382e-07 16) rotate(-90)"/>
      </clipPath>
    </defs>
  </svg>
);

const KanbanIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2.3999" y="2" width="3.6" height="14" rx="1" fill="currentColor"/>
    <rect x="7.2002" y="2" width="3.6" height="14" rx="1" fill="currentColor"/>
    <rect x="12" y="2" width="3.6" height="14" rx="1" fill="currentColor"/>
  </svg>
);

interface KanbanViewProps {
  viewMode: "list" | "state";
  onViewModeChange: (mode: "list" | "state") => void;
}

export function KanbanView({ viewMode, onViewModeChange }: KanbanViewProps) {
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-start gap-1">
        {/* View Toggle */}
        <SubtleTab
          selectedIndex={viewMode === "list" ? 0 : 1}
          onSelect={(index) => onViewModeChange(index === 0 ? "list" : "state")}
        >
          <SubtleTabItem index={0} icon={ListIcon as unknown as LucideIcon} label="List" />
          <SubtleTabItem index={1} icon={KanbanIcon as unknown as LucideIcon} label="By State" />
        </SubtleTab>
      </div>

      {/* Content */}
      <div className="flex items-center justify-center min-h-[400px] bg-white dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] rounded-xl">
        <div className="text-center">
          <h2 className="headline-2xl text-[var(--system-600)] mb-2">Coming Soon</h2>
          <p className="body-base text-[var(--system-300)]">Group orders by status view is under development</p>
        </div>
      </div>
    </div>
  );
}
