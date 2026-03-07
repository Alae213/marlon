"use client";

interface KanbanViewProps {
  onViewChange: (view: "list" | "state") => void;
}

export function KanbanView({ onViewChange }: KanbanViewProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] bg-white dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] rounded-lg">
      <div className="text-center">
        <h2 className="text-xl font-normal text-[#171717] dark:text-[#fafafa] mb-2">Coming Soon</h2>
        <p className="text-[#737373]">Group orders by status view is under development</p>
      </div>
    </div>
  );
}
