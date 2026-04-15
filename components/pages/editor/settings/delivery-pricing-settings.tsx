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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[--system-700]">Delivery Pricing by Region</h3>
          <p className="mt-1 text-body-sm text-[--system-400]">Set delivery costs for each wilaya (region)</p>
        </div>
        {savedMessage && <span className="text-body-sm text-[--color-success]">Saved</span>}
      </div>

      <div className="overflow-hidden rounded-xl border border-[--system-200] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[560px] w-full border-collapse">
            <thead className="bg-[--system-100]">
              <tr>
                <th scope="col" className="p-2 text-left text-caption text-[--system-500] sm:p-3 sm:text-body-sm">Wilaya</th>
                <th scope="col" className="p-2 text-center text-caption text-[--system-500] sm:p-3 sm:text-body-sm">Home Delivery (DZD)</th>
                <th scope="col" className="p-2 text-center text-caption text-[--system-500] sm:p-3 sm:text-body-sm">Office Delivery (DZD)</th>
              </tr>
            </thead>
            <tbody>
              {WILAYAS.map((wilaya) => {
                const pricing = deliveryPricing?.find((p: Doc<"deliveryPricing">) => p.wilaya === wilaya);
                const homePrice = pricing?.homeDelivery ?? DEFAULT_HOME;
                const officePrice = pricing?.officeDelivery ?? DEFAULT_OFFICE;
                const wilayaId = wilaya.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                const homeInputId = `${wilayaId}-home-delivery`;
                const officeInputId = `${wilayaId}-office-delivery`;

                return (
                  <tr key={wilaya} className="border-t border-[--system-200] transition-colors hover:bg-[--system-100]">
                    <th scope="row" className="p-2 text-left text-caption text-[--system-700] sm:p-3 sm:text-body-sm">{wilaya}</th>
                    <td className="p-2 sm:p-3">
                      <label htmlFor={homeInputId} className="sr-only">{`${wilaya} home delivery price`}</label>
                      <input
                        id={homeInputId}
                        type="number"
                        key={`${wilaya}-home-${homePrice}`}
                        defaultValue={homePrice}
                        onBlur={(e) => handleSave(wilaya, "homeDelivery", parseInt(e.target.value, 10) || 0)}
                        className="h-8 w-full rounded-lg border border-[--system-200] bg-white px-2 text-center text-caption text-[--system-700] transition-all focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10 sm:h-9 sm:px-3 sm:text-body-sm"
                        placeholder="0"
                        aria-label={`${wilaya} home delivery price`}
                      />
                    </td>
                    <td className="p-2 sm:p-3">
                      <label htmlFor={officeInputId} className="sr-only">{`${wilaya} office delivery price`}</label>
                      <input
                        id={officeInputId}
                        type="number"
                        key={`${wilaya}-office-${officePrice}`}
                        defaultValue={officePrice}
                        onBlur={(e) => handleSave(wilaya, "officeDelivery", parseInt(e.target.value, 10) || 0)}
                        className="h-8 w-full rounded-lg border border-[--system-200] bg-white px-2 text-center text-caption text-[--system-700] transition-all focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10 sm:h-9 sm:px-3 sm:text-body-sm"
                        placeholder="0"
                        aria-label={`${wilaya} office delivery price`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-caption text-[--system-400]">
        * Default pricing: Home delivery {DEFAULT_HOME} DZD | Office delivery {DEFAULT_OFFICE} DZD
      </p>
    </div>
  );
}
