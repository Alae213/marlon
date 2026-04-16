"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeliveryPricingSettings } from "../settings/delivery-pricing-settings";
import { DeliveryIntegrationSettings } from "../settings/delivery-integration-settings";
import { StoreInfoSettings } from "../settings/store-info-settings";
import { Id } from "@/convex/_generated/dataModel";

type SettingsTab = "delivery" | "integration" | "store";

const TABS: Array<{ id: SettingsTab; label: string }> = [
  { id: "delivery", label: "Delivery Pricing" },
  { id: "integration", label: "Courier" },
  { id: "store", label: "Store Info" },
];

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: Id<"stores">;
  storeSlug: string;
  initialTab?: string;
}

function normalizeSettingsTab(tab?: string): SettingsTab {
  if (tab === "integration" || tab === "store" || tab === "delivery") {
    return tab;
  }

  if (tab === "preferences") {
    return "delivery";
  }

  return "delivery";
}

interface SettingsDialogPanelProps {
  storeId: Id<"stores">;
  storeSlug: string;
  initialTab: SettingsTab;
}

function SettingsDialogPanel({ storeId, storeSlug, initialTab }: SettingsDialogPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as SettingsTab)}
      orientation="vertical"
      className="grid w-full grid-cols-[13.5rem_minmax(0,1fr)] gap-[var(--spacing-lg)] max-[640px]:grid-cols-1"
    >
      <TabsList
        aria-label="Store settings sections"
        className="h-fit w-full rounded-[var(--radius-lg)] bg-[var(--system-800)] p-[var(--spacing-sm)]"
      >
        {TABS.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="rounded-[var(--radius-md)] border-0 shadow-none after:hidden px-[var(--spacing-md)] py-[var(--spacing-sm)] text-left text-body-sm text-[var(--system-200)] transition-colors duration-100 hover:bg-[var(--system-600)] hover:text-[var(--system-50)] data-[state=active]:bg-[var(--color-primary)] data-[state=active]:text-[var(--color-primary-foreground)] data-[state=active]:shadow-none focus-visible:border-0"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent
        value="delivery"
        className="max-h-[68vh] min-h-0 overflow-y-auto scrollbar-hide rounded-[var(--radius-xl)] bg-[var(--system-800)] p-[var(--spacing-lg)] text-[var(--system-100)]"
      >
        <DeliveryPricingSettings storeId={storeId} />
      </TabsContent>

      <TabsContent
        value="integration"
        className="max-h-[68vh] min-h-0 overflow-y-auto scrollbar-hide rounded-[var(--radius-xl)] bg-[var(--system-800)] p-[var(--spacing-lg)] text-[var(--system-100)]"
      >
        <DeliveryIntegrationSettings storeId={storeId} />
      </TabsContent>

      <TabsContent
        value="store"
        className="max-h-[68vh] min-h-0 overflow-y-auto scrollbar-hide rounded-[var(--radius-xl)] bg-[var(--system-800)] p-[var(--spacing-lg)] text-[var(--system-100)]"
      >
        <StoreInfoSettings storeId={storeId} storeSlug={storeSlug} />
      </TabsContent>
    </Tabs>
  );
}

export function SettingsDialog({ isOpen, onClose, storeId, storeSlug, initialTab }: SettingsDialogProps) {
  const normalizedInitialTab = normalizeSettingsTab(initialTab);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/40"
        style={{ boxShadow: "var(--shadow-xl-shadow)" }}
        className="w-[92vw] max-w-[900px] gap-[var(--spacing-lg)] overflow-hidden rounded-[var(--radius-2xl)] bg-[var(--system-700)] bg-[image:var(--gradient-popup)] p-[var(--spacing-lg)] text-[var(--system-50)] backdrop-blur-[12px] [corner-shape:squircle]"
      >
        <DialogHeader className="w-full">
          <div className="flex items-center justify-between w-full">
            <DialogTitle className="text-modal text-[var(--system-50)]">
              Store Settings
            </DialogTitle>
            <button
              type="button"
              aria-label="Close settings"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-[var(--system-600)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--system-700)]"
            >
              <X className="w-5 h-5 text-[var(--system-300)]" />
              <span className="sr-only">Close settings</span>
            </button>
          </div>
        </DialogHeader>

        <SettingsDialogPanel
          key={normalizedInitialTab}
          initialTab={normalizedInitialTab}
          storeId={storeId}
          storeSlug={storeSlug}
        />
      </DialogContent>
    </Dialog>
  );
}
