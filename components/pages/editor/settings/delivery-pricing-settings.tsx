"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { Input } from "@/components/primitives/core/inputs/input";

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
          <h3 className="text-heading-sm text-[var(--system-50)]">Delivery Pricing by Region</h3>
          <p className="mt-1 text-body-sm text-[var(--system-200)]">Set delivery costs for each wilaya (region)</p>
        </div>
        {savedMessage && <span className="text-body-sm text-[var(--color-success)]">Saved</span>}
      </div>

      <div className="overflow-hidden rounded-lg bg-[var(--system-700)] p-1">
        <div className="overflow-x-auto">
        <table className="min-w-[560px] w-full rounded-md bg-[var(--system-800)]">
            <thead className="bg-[var(--system-700)]">
              <tr>
                <th scope="col" className="p-2 text-left text-caption text-[var(--system-100)] sm:p-3 sm:text-body-sm">Wilaya</th>
                <th scope="col" className="p-2 text-center text-caption text-[var(--system-100)] sm:p-3 sm:text-body-sm">Home Delivery (DZD)</th>
                <th scope="col" className="p-2 text-center text-caption text-[var(--system-100)] sm:p-3 sm:text-body-sm">Office Delivery (DZD)</th>
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
                  <tr key={wilaya} className="transition-colors hover:bg-[var(--system-600)]">
                    <th scope="row" className="p-2 text-left text-caption text-[var(--system-50)] sm:p-3 sm:text-body-sm">{wilaya}</th>
                    <td className="p-2 sm:p-3">
                      <label htmlFor={homeInputId} className="sr-only">{`${wilaya} home delivery price`}</label>
                      <div className="rounded-md bg-[var(--system-600)] p-[2px]">
                        <Input
                          id={homeInputId}
                          type="number"
                          key={`${wilaya}-home-${homePrice}`}
                          defaultValue={homePrice}
                          onBlur={(e) => handleSave(wilaya, "homeDelivery", parseInt(e.target.value, 10) || 0)}
                          placeholder="0"
                          aria-label={`${wilaya} home delivery price`}
                        />
                      </div>
                    </td>
                    <td className="p-2 sm:p-3">
                      <label htmlFor={officeInputId} className="sr-only">{`${wilaya} office delivery price`}</label>
                      <div className="rounded-md bg-[var(--system-600)] p-[2px]">
                        <Input
                          id={officeInputId}
                          type="number"
                          key={`${wilaya}-office-${officePrice}`}
                          defaultValue={officePrice}
                          onBlur={(e) => handleSave(wilaya, "officeDelivery", parseInt(e.target.value, 10) || 0)}
                          placeholder="0"
                          aria-label={`${wilaya} office delivery price`}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-caption text-[var(--system-200)]">
        * Default pricing: Home delivery {DEFAULT_HOME} DZD | Office delivery {DEFAULT_OFFICE} DZD
      </p>
    </div>
  );
}
