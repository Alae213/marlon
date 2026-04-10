"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";

const WILAYAS = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Bejaia", "Biskra", "Bechar", "Blida", "Bouira",
  "Tamanrasset", "Tebessa", "Tlemcen", "Tiaret", "Oran", "Saida", "Skikda", "Sidi Bel Abbes", "Annaba", "Constantine",
  "Medea", "Mostaganem", "Mascara", "Ouargla", "El Bayadh", "Illizi", "Bordj Bou Arreridj", "Boumerdes", "El Tarf", "Tindouf",
  "Tissemsilt", "El Oued", "Khenchela", "Souk Ahras", "Tipaza", "Mila", "Ain Defla", "Naama", "Ain Temouchent", "Ghardaia",
  "Relizane", "Bchar", "Touggourt", "Djamaa",
];

const DEFAULT_HOME = 600;
const DEFAULT_OFFICE = 400;

interface DeliveryPricingSettingsProps {
  storeId: Id<"stores">;
}

export function DeliveryPricingSettings({ storeId }: DeliveryPricingSettingsProps) {
  const deliveryPricing = useQuery(
    api.siteContent.getDeliveryPricing,
    { storeId }
  );
  const setDeliveryPricing = useMutation(api.siteContent.setDeliveryPricing);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = useCallback(
    async (wilaya: string, field: "homeDelivery" | "officeDelivery", value: number) => {
      try {
        await setDeliveryPricing({ storeId, wilaya, [field]: value });
        setSavedMessage(true);
        setTimeout(() => setSavedMessage(false), 2000);
      } catch (error) {
        console.error("Failed to save pricing:", error);
      }
    },
    [setDeliveryPricing, storeId]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[#171717] dark:text-[#fafafa]">Delivery Pricing by Region</h3>
          <p className="text-sm text-[#737373] mt-1">Set delivery costs for each wilaya (region)</p>
        </div>
        {savedMessage && <span className="text-sm font-medium text-green-600">✓ Saved</span>}
      </div>

      <div className="border border-[#e5e5e5] dark:border-[#262626] rounded-xl overflow-hidden bg-white dark:bg-[#0a0a0a]">
        <div className="grid grid-cols-3 gap-4 bg-[#f5f5f5] dark:bg-[#171717] p-3 text-sm font-semibold text-[#525252] dark:text-[#d4d4d4]">
          <span>Wilaya</span>
          <span className="text-center">Home Delivery (DZD)</span>
          <span className="text-center">Office Delivery (DZD)</span>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {WILAYAS.map((wilaya) => {
            const pricing = deliveryPricing?.find((p: Doc<"deliveryPricing">) => p.wilaya === wilaya);
            const homePrice = pricing?.homeDelivery ?? DEFAULT_HOME;
            const officePrice = pricing?.officeDelivery ?? DEFAULT_OFFICE;

            return (
              <div
                key={wilaya}
                className="grid grid-cols-3 gap-4 p-3 border-t border-[#e5e5e5] dark:border-[#262626] items-center hover:bg-[#f5f5f5] dark:hover:bg-[#171717]/50 transition-colors"
              >
                <span className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">{wilaya}</span>
                <input
                  type="number"
                  key={`${wilaya}-home-${homePrice}`}
                  defaultValue={homePrice}
                  onBlur={(e) => handleSave(wilaya, "homeDelivery", parseInt(e.target.value, 10) || 0)}
                  className="h-9 px-3 text-center text-sm border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#fafafa] rounded-lg focus:outline-none focus:border-[#171717] dark:focus:border-[#fafafa] focus:ring-2 focus:ring-[#171717]/10 dark:focus:ring-[#fafafa]/10 transition-all"
                  placeholder="0"
                />
                <input
                  type="number"
                  key={`${wilaya}-office-${officePrice}`}
                  defaultValue={officePrice}
                  onBlur={(e) => handleSave(wilaya, "officeDelivery", parseInt(e.target.value, 10) || 0)}
                  className="h-9 px-3 text-center text-sm border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#fafafa] rounded-lg focus:outline-none focus:border-[#171717] dark:focus:border-[#fafafa] focus:ring-2 focus:ring-[#171717]/10 dark:focus:ring-[#fafafa]/10 transition-all"
                  placeholder="0"
                />
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-[#737373]">
        * Default pricing: Home delivery {DEFAULT_HOME} DZD | Office delivery {DEFAULT_OFFICE} DZD
      </p>
    </div>
  );
}
