"use client";

import { useState } from "react";
import { Save, TestTube, Eye, EyeOff, Package } from "lucide-react";
import { Button } from "@/components/core/button";
import { Input } from "@/components/core/input";
import { Select } from "@/components/core/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/core/card";
import { Tabs } from "@/components/core/tabs";

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

interface DeliveryPricing {
  wilaya: string;
  homeDelivery: number;
  officeDelivery: number;
}

const MOCK_DELIVERY_PRICING: DeliveryPricing[] = WILAYAS.map(wilaya => ({
  wilaya: wilaya.value,
  homeDelivery: Math.floor(Math.random() * 1500) + 500,
  officeDelivery: Math.floor(Math.random() * 1000) + 400,
}));

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("delivery");
  const [deliveryPricing, setDeliveryPricing] = useState<DeliveryPricing[]>(MOCK_DELIVERY_PRICING);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [apiKeys, setApiKeys] = useState({
    zrExpress: "",
    yalidine: "",
  });

  const tabs = [
    { id: "delivery", label: "أسعار التوصيل" },
    { id: "apis", label: "واجهات التوصيل" },
    { id: "store", label: "بيانات المتجر" },
  ];

  const updatePrice = (wilaya: string, field: "homeDelivery" | "officeDelivery", value: number) => {
    setDeliveryPricing((pricing: DeliveryPricing[]) => 
      pricing.map((p: DeliveryPricing) => 
        p.wilaya === wilaya 
          ? { ...p, [field]: value }
          : p
      )
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">الإعدادات</h1>
        <Button>
          <Save className="w-5 h-5" />
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
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-start">
                  <th className="px-4 py-3 text-sm font-medium text-zinc-500">الولاية</th>
                  <th className="px-4 py-3 text-sm font-medium text-zinc-500">توصيل للمنزل (د.ج)</th>
                  <th className="px-4 py-3 text-sm font-medium text-zinc-500">توصيل للمكتب (د.ج)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {deliveryPricing.map((pricing: DeliveryPricing) => (
                  <tr key={pricing.wilaya} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                      {pricing.wilaya}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={pricing.homeDelivery}
                        onChange={(e) => updatePrice(pricing.wilaya, "homeDelivery", parseInt(e.target.value) || 0)}
                        className="w-32 h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#00853f] focus:border-transparent transition-all"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={pricing.officeDelivery}
                        onChange={(e) => updatePrice(pricing.wilaya, "officeDelivery", parseInt(e.target.value) || 0)}
                        className="w-32 h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#00853f] focus:border-transparent transition-all"
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
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showApiKeys ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <Button variant="outline">
                  <TestTube className="w-4 h-4" />
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
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showApiKeys ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <Button variant="outline">
                  <TestTube className="w-4 h-4" />
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
                label="اسم المتجر"
                defaultValue="متجري الأول"
              />
              <Input
                label="رابط المتجر"
                defaultValue="my-store"
                disabled
              />
              <Input
                label="رقم الهاتف"
                type="tel"
                placeholder="0551 23 45 67"
              />
              <Select
                label="الولاية"
                options={WILAYAS}
                placeholder="اختر الولاية"
              />
              <div className="md:col-span-2">
                <Input
                  label="العنوان"
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
