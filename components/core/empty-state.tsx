import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-full bg-[#f5f5f5] dark:bg-[#171717] flex items-center justify-center mb-6">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-[#171717] dark:text-[#fafafa] mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-[#737373] mb-6 max-w-sm">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
