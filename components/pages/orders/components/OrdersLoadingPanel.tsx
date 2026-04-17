"use client";

import { Loader2 } from "lucide-react";

export function OrdersLoadingPanel() {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[24px] border border-[var(--system-200)] bg-white px-6 py-10 text-center shadow-[var(--shadow-sm)]">
      <Loader2 className="mb-3 h-6 w-6 animate-spin text-[var(--system-500)]" />
      <p className="text-body text-[var(--system-700)]">Loading orders...</p>
      <p className="mt-1 text-body-sm text-[var(--system-400)]">
        Pulling the latest order activity for this store.
      </p>
    </div>
  );
}
