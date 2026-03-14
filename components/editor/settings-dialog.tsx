"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/animate-ui/primitives/radix/dialog";
import { PreferencesSettings } from "./preferences-settings";
import { DeliveryPricingSettings } from "./delivery-pricing-settings";
import { DeliveryIntegrationSettings } from "./delivery-integration-settings";
import { StoreInfoSettings } from "./store-info-settings";
import { Id } from "@/convex/_generated/dataModel";

type SettingsTab = "preferences" | "delivery" | "integration" | "store";

const TABS: Array<{ id: SettingsTab; label: string }> = [
  { id: "preferences", label: "Preferences" },
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

export function SettingsDialog({ isOpen, onClose, storeId, storeSlug, initialTab }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>((initialTab as SettingsTab) || "preferences");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-[60] bg-black/40" />
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <DialogContent
            style={{ boxShadow: "var(--shadow-xl-shadow)" } as React.CSSProperties}
            className="w-[600px] max-h-[80vh] overflow-hidden bg-[--system-100] [corner-shape:squircle] rounded-[48px] bg-[image:var(--gradient-popup)] p-[20px] flex flex-col gap-[12px] items-start backdrop-blur-[12px]"
            from="top"
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <DialogHeader className="w-full">
              <div className="flex items-center justify-between w-full">
                <DialogTitle className="text-lg font-semibold text-[#171717] dark:text-[#fafafa]">
                  Store Settings
                </DialogTitle>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-[#f5f5f5] dark:hover:bg-[#171717] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-[#525252] dark:text-[#d4d4d4]" />
                </button>
              </div>
            </DialogHeader>

            <div className="flex border-b border-[#e5e5e5] dark:border-[#262626] w-full">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "border-b-2 border-[#171717] dark:border-[#fafafa] text-[#171717] dark:text-[#fafafa]"
                      : "text-[#737373] hover:text-[#525252] dark:hover:text-[#d4d4d4]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh] w-full">
              {activeTab === "preferences" && <PreferencesSettings />}
              {activeTab === "delivery" && <DeliveryPricingSettings storeId={storeId} />}
              {activeTab === "integration" && <DeliveryIntegrationSettings storeId={storeId} />}
              {activeTab === "store" && <StoreInfoSettings storeId={storeId} storeSlug={storeSlug} />}
            </div>
          </DialogContent>
        </div>
      </DialogPortal>
    </Dialog>
  );
}
