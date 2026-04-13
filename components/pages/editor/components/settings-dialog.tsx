"use client";

import { useState } from "react";
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

  return (
    <>
      <div className="flex w-full border-b border-white/10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-white text-white"
                : "text-white/55 hover:text-white/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-h-[60vh] w-full overflow-y-auto rounded-[24px] bg-white p-4 text-[--system-700]">
        {activeTab === "delivery" && <DeliveryPricingSettings storeId={storeId} />}
        {activeTab === "integration" && <DeliveryIntegrationSettings storeId={storeId} />}
        {activeTab === "store" && <StoreInfoSettings storeId={storeId} storeSlug={storeSlug} />}
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
        className="max-w-[600px] gap-[12px] overflow-hidden rounded-[48px] border-white/10 bg-[--system-100] bg-[image:var(--gradient-popup)] p-[20px] text-white backdrop-blur-[12px] [corner-shape:squircle]"
      >
        <DialogHeader className="w-full">
          <div className="flex items-center justify-between w-full">
            <DialogTitle className="text-modal text-white">
              Store Settings
            </DialogTitle>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
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
