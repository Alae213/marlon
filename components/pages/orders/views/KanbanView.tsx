"use client";

import { OrderViewToggle } from "../components/OrderViewToggle";

interface KanbanViewProps {
  viewMode: "list" | "state";
  onViewModeChange: (mode: "list" | "state") => void;
  isStateViewEnabled: boolean;
}

export function KanbanView({
  viewMode,
  onViewModeChange,
  isStateViewEnabled,
}: KanbanViewProps) {
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-start gap-1">
        <OrderViewToggle
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          isStateViewEnabled={isStateViewEnabled}
        />
      </div>

      {/* Content */}
      <div className="flex items-center justify-center min-h-[400px] bg-white dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] rounded-xl">
        <div className="text-center">
          <h2 className="headline-2xl text-[var(--system-600)] mb-2">Coming Soon</h2>
          <p className="text-body text-[var(--system-300)]">Group orders by status view is under development</p>
        </div>
      </div>
    </div>
  );
}
