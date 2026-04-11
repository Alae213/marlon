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
          <h3 className="font-semibold text-[--system-700]">Delivery Pricing by Region</h3>
          <p className="text-sm text-[--system-400] mt-1">Set delivery costs for each wilaya (region)</p>
        </div>
        {savedMessage && <span className="text-sm font-medium text-[--color-success]">✓ Saved</span>}
      </div>

      <div className="border border-[--system-200] rounded-xl overflow-hidden bg-white">
        <div className="grid grid-cols-3 gap-4 bg-[--system-100] p-3 text-sm font-semibold text-[--system-500]">
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
                className="grid grid-cols-3 gap-4 p-3 border-t border-[--system-200] items-center hover:bg-[--system-100] transition-colors"
              >
                <span className="text-sm font-medium text-[--system-700]">{wilaya}</span>
                <input
                  type="number"
                  key={`${wilaya}-home-${homePrice}`}
                  defaultValue={homePrice}
                  onBlur={(e) => handleSave(wilaya, "homeDelivery", parseInt(e.target.value, 10) || 0)}
                  className="h-9 px-3 text-center text-sm border border-[--system-200] bg-white text-[--system-700] rounded-lg focus:outline-none focus:border-[--color-primary] focus:ring-2 focus:ring-[--color-primary]/10 transition-all"
                  placeholder="0"
                />
                <input
                  type="number"
                  key={`${wilaya}-office-${officePrice}`}
                  defaultValue={officePrice}
                  onBlur={(e) => handleSave(wilaya, "officeDelivery", parseInt(e.target.value, 10) || 0)}
                  className="h-9 px-3 text-center text-sm border border-[--system-200] bg-white text-[--system-700] rounded-lg focus:outline-none focus:border-[--color-primary] focus:ring-2 focus:ring-[--color-primary]/10 transition-all"
                  placeholder="0"
                />
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-[--system-400]">
        * Default pricing: Home delivery {DEFAULT_HOME} DZD | Office delivery {DEFAULT_OFFICE} DZD
      </p>
    </div>
  );
}