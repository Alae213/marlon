"use client";

import { Id } from "@/convex/_generated/dataModel";
import { useBilling, BillingProvider } from "@/contexts/billing-context";
import { BillingSection } from "@/components/features/billing/billing-section";

interface BillingSettingsProps {
  storeId: Id<"stores">;
}

function BillingSettingsContent() {
  return (
    <div className="space-y-4">
      <BillingSection storeName="My Store" />
    </div>
  );
}

export function BillingSettings({ storeId }: BillingSettingsProps) {
  return (
    <BillingProvider storeId={storeId}>
      <BillingSettingsContent />
    </BillingProvider>
  );
}