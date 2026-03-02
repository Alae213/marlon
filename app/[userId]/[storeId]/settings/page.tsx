"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Save, TestTube, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/core/button";
import { Input } from "@/components/core/input";
import { Select } from "@/components/core/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/core/card";
import { Tabs } from "@/components/core/tabs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const WILAYAS = [
  { value: "الجزائر", label: "الجزائر" },
  { value: "وهران", label: "وهران" },
  { value: "قسنطينة", label: "قسنطينة" },
  { value: "عنابة", label: "عنابة" },
  { value: "باتنة", label: "باتنة" },
  { value: "أدرار", label: "أدرار" },
  { value: "المسيلة", label: "المسيلة" },
  { value: "مستغانم", label: "مستغانم" },
  { value: "بسكرة", label: "بسكرة" },
  { value: "بجاية", label: "بجاية" },
];

interface DeliveryPricingData {
  _id: Id<"deliveryPricing">;
  wilaya: string;
  homeDelivery?: number;
  officeDelivery?: number;
}

interface LocalDeliveryPricing {
  wilaya: string;
  homeDelivery: number;
  officeDelivery: number;
}

export default function SettingsPage() {
  const params = useParams();
  const slug = params?.storeId as string; // storeId param contains the slug
  const [activeTab, setActiveTab] = useState("delivery");
  const [localPricing, setLocalPricing] = useState<LocalDeliveryPricing[]>([]);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [apiKeys, setApiKeys] = useState({
    zrExpress: "",
    yalidine: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Get store by slug
  const store = useQuery(
    api.stores.getStoreBySlug,
    slug ? { slug } : "skip"
  );

  // Get delivery pricing from Convex
  const convexPricing = useQuery(
    api.stores.getDeliveryPricing,
    store?._id ? { storeId: store._id as Id<"stores"> } : "skip"
  );

  // Mutations
  const updateStoreMutation = useMutation(api.stores.updateStore);
  const updateDeliveryPricingMutation = useMutation(api.stores.updateDeliveryPricing);

  // Initialize local pricing from Convex data or defaults
  useEffect(() => {
    if (convexPricing !== undefined) {
      // Convert Convex pricing to local format
      const pricingMap = new Map<string, { homeDelivery: number; officeDelivery: number }>();
      
      // First add any existing convex pricing
      convexPricing?.forEach((p: DeliveryPricingData) => {
        pricingMap.set(p.wilaya, {
          homeDelivery: p.homeDelivery || 0,
          officeDelivery: p.officeDelivery || 0,
        });
      });

      // Create full list with defaults for missing wilayas
      const fullPricing = WILAYAS.map(wilaya => {
        const existing = pricingMap.get(wilaya.value);
        return {
          wilaya: wilaya.value,
          homeDelivery: existing?.homeDelivery ?? 600,
          officeDelivery: existing?.officeDelivery ?? 400,
        };
      });
      
      setLocalPricing(fullPricing);
    }
  }, [convexPricing]);

  // Initialize store fields when store data is available
  useEffect(() => {
    // Store fields are set directly from store query in the JSX
  }, [store]);

  const updatePrice = (wilaya: string, field: "homeDelivery" | "officeDelivery", value: number) => {
    setLocalPricing((pricing: LocalDeliveryPricing[]) => 
      pricing.map((p: LocalDeliveryPricing) => 
        p.wilaya === wilaya 
          ? { ...p, [field]: value }
          : p
      )
    );
  };

  const handleSave = async () => {
    if (!store?._id) return;
    
    setIsSaving(true);
    try {
      // Save delivery pricing
      for (const pricing of localPricing) {
        await updateDeliveryPricingMutation({
          storeId: store._id as Id<"stores">,
          wilaya: pricing.wilaya,
          homeDelivery: pricing.homeDelivery,
          officeDelivery: pricing.officeDelivery,
        });
      }

      // Save store info (get from form state)
      const storeNameEl = document.getElementById('store-name') as HTMLInputElement;
      const storePhoneEl = document.getElementById('store-phone') as HTMLInputElement;
      const storeWilayaEl = document.getElementById('store-wilaya') as HTMLInputElement;
      const storeAddressEl = document.getElementById('store-address') as HTMLInputElement;

      if (storeNameEl || storePhoneEl || storeWilayaEl || storeAddressEl) {
        await updateStoreMutation({
          storeId: store._id as Id<"stores">,
          name: storeNameEl?.value,
          phone: storePhoneEl?.value,
          wilaya: storeWilayaEl?.value,
          address: storeAddressEl?.value,
        });
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "delivery", label: "أسعار التوصيل" },
    { id: "apis", label: "واجهات التوصيل" },
    { id: "store", label: "بيانات المتجر" },
  ];

  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-[#171717] dark:text-[#fafafa]" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-normal text-[#171717] dark:text-[#fafafa]">الإعدادات</h1>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          حفظ التغييرات
        </Button>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "delivery" && (
        <Card padding="none" className="mt-6">
          <CardHeader>
            <CardTitle>أسعار التوصيل حسب الولاية</CardTitle>
            <CardDescription>حدد سعر التوصيل لكل ولاية</CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e5e5e5] dark:border-[#262626] text-start">
                  <th className="px-4 py-3 text-sm font-normal text-[#737373]">الولاية</th>
                  <th className="px-4 py-3 text-sm font-normal text-[#737373]">توصيل للمنزل (د.ج)</th>
                  <th className="px-4 py-3 text-sm font-normal text-[#737373]">توصيل للمكتب (د.ج)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5e5] dark:divide-[#262626]">
                {localPricing.map((pricing: LocalDeliveryPricing) => (
                  <tr key={pricing.wilaya} className="hover:bg-[#f5f5f5] dark:hover:bg-[#171717]/50 transition-colors">
                    <td className="px-4 py-3 font-normal text-[#171717] dark:text-[#fafafa]">
                      {pricing.wilaya}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={pricing.homeDelivery}
                        onChange={(e) => updatePrice(pricing.wilaya, "homeDelivery", parseInt(e.target.value) || 0)}
                        className="w-28 h-10 px-3 border border-[#e5e5e5] dark:border-[#404040] bg-white dark:bg-[#171717] text-[#171717] dark:text-[#fafafa] focus:outline-none focus:border-[#171717] dark:focus:border-[#fafafa] transition-colors"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={pricing.officeDelivery}
                        onChange={(e) => updatePrice(pricing.wilaya, "officeDelivery", parseInt(e.target.value) || 0)}
                        className="w-28 h-10 px-3 border border-[#e5e5e5] dark:border-[#404040] bg-white dark:bg-[#171717] text-[#171717] dark:text-[#fafafa] focus:outline-none focus:border-[#171717] dark:focus:border-[#fafafa] transition-colors"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === "apis" && (
        <div className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>ZR Express</CardTitle>
              <CardDescription>أدخل مفتاح API للتكامل</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Input
                    type={showApiKeys ? "text" : "password"}
                    value={apiKeys.zrExpress}
                    onChange={(e) => setApiKeys({ ...apiKeys, zrExpress: e.target.value })}
                    placeholder="أدخل مفتاح API..."
                    className="pe-12"
                  />
                  <button
                    onClick={() => setShowApiKeys(!showApiKeys)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#171717] dark:hover:text-[#fafafa]"
                  >
                    {showApiKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button variant="outline">
                  <TestTube className="w-3.5 h-3.5" />
                  اختبار الاتصال
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Yalidine</CardTitle>
              <CardDescription>أدخل مفتاح API للتكامل</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Input
                    type={showApiKeys ? "text" : "password"}
                    value={apiKeys.yalidine}
                    onChange={(e) => setApiKeys({ ...apiKeys, yalidine: e.target.value })}
                    placeholder="أدخل مفتاح API..."
                    className="pe-12"
                  />
                  <button
                    onClick={() => setShowApiKeys(!showApiKeys)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#171717] dark:hover:text-[#fafafa]"
                  >
                    {showApiKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button variant="outline">
                  <TestTube className="w-3.5 h-3.5" />
                  اختبار الاتصال
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "store" && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>بيانات المتجر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                id="store-name"
                label="اسم المتجر"
                defaultValue={store.name}
                placeholder="متجري الأول"
              />
              <Input
                label="رابط المتجر"
                value={slug}
                disabled
              />
              <Input
                id="store-phone"
                label="رقم الهاتف"
                type="tel"
                defaultValue={store.phone}
                placeholder="0551 23 45 67"
              />
              <Select
                id="store-wilaya"
                label="الولاية"
                options={WILAYAS}
                defaultValue={store.wilaya}
                placeholder="اختر الولاية"
              />
              <div className="md:col-span-2">
                <Input
                  id="store-address"
                  label="العنوان"
                  defaultValue={store.address}
                  placeholder="العنوان التفصيلي..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
