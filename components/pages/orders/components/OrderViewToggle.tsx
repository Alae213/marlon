"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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
    <rect x="2.3999" y="2" width="3.6" height="14" rx="1" fill="currentColor" />
    <rect x="7.2002" y="2" width="3.6" height="14" rx="1" fill="currentColor" />
    <rect x="12" y="2" width="3.6" height="14" rx="1" fill="currentColor" />
  </svg>
);

interface OrderViewToggleProps {
  viewMode: "list" | "state";
  onViewModeChange: (mode: "list" | "state") => void;
  isStateViewEnabled: boolean;
}

export function OrderViewToggle({
  viewMode,
  onViewModeChange,
  isStateViewEnabled,
}: OrderViewToggleProps) {
  return (
    <Tabs value={viewMode} onValueChange={(value) => onViewModeChange(value as "list" | "state")}>
      <TabsList className="bg-[var(--system-100)]">
        <TabsTrigger value="list" className="gap-2">
          <ListIcon />
          <span>List</span>
        </TabsTrigger>
        <TabsTrigger
          value="state"
          disabled={!isStateViewEnabled}
          aria-disabled={!isStateViewEnabled}
          className={cn(
            "gap-2",
            !isStateViewEnabled && "cursor-not-allowed opacity-60 data-[state=active]:bg-[var(--system-100)] data-[state=active]:text-[var(--system-400)]",
          )}
        >
          <KanbanIcon />
          <span>By State</span>
          {!isStateViewEnabled ? (
            <span className="rounded-full bg-[var(--system-200)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.02em] text-[var(--system-500)]">
              Soon
            </span>
          ) : null}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
