"use client";

import { KeyboardEvent, useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const activePanelId = `${activeTab}-panel`;

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentTab: SettingsTab) => {
    const currentIndex = TABS.findIndex((tab) => tab.id === currentTab);
    if (currentIndex < 0) return;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = (currentIndex + 1) % TABS.length;
      setActiveTab(TABS[nextIndex].id);
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      const prevIndex = (currentIndex - 1 + TABS.length) % TABS.length;
      setActiveTab(TABS[prevIndex].id);
    }

    if (event.key === "Home") {
      event.preventDefault();
      setActiveTab(TABS[0].id);
    }

    if (event.key === "End") {
      event.preventDefault();
      setActiveTab(TABS[TABS.length - 1].id);
    }
  };

  return (
    <>
      <div className="grid w-full grid-cols-[11rem_minmax(0,1fr)] gap-[var(--spacing-md)] max-[520px]:grid-cols-1">
        <div
          role="tablist"
          aria-label="Store settings sections"
          aria-orientation="vertical"
          className="flex h-fit flex-col gap-[var(--spacing-xs)] rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-[var(--spacing-xs)]"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              id={`${tab.id}-tab`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
              className={`rounded-[var(--radius-md)] px-[var(--spacing-sm)] py-[var(--spacing-sm)] text-left text-body-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring] ${
                activeTab === tab.id
                  ? "bg-white text-[--system-700]"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div
          id={activePanelId}
          role="tabpanel"
          aria-labelledby={`${activeTab}-tab`}
          className="max-h-[60vh] min-h-0 overflow-y-auto rounded-[var(--radius-xl)] bg-white p-[var(--spacing-md)] text-[--system-700]"
        >
          {activeTab === "delivery" && <DeliveryPricingSettings storeId={storeId} />}
          {activeTab === "integration" && <DeliveryIntegrationSettings storeId={storeId} />}
          {activeTab === "store" && <StoreInfoSettings storeId={storeId} storeSlug={storeSlug} />}
        </div>
      </div>
    </>
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
        className="max-w-[600px] gap-[var(--spacing-md)] overflow-hidden rounded-[var(--radius-2xl)] border-white/10 bg-[--system-100] bg-[image:var(--gradient-popup)] p-[var(--spacing-lg)] text-white backdrop-blur-[12px] [corner-shape:squircle]"
      >
        <DialogHeader className="w-full">
          <div className="flex items-center justify-between w-full">
            <DialogTitle className="text-modal text-white">
              Store Settings
            </DialogTitle>
            <button
              type="button"
              aria-label="Close settings"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-[--system-700]"
            >
              <X className="w-5 h-5 text-white/70" />
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
