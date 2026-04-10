"use client";

import { useState } from "react";
import { Truck, Key, CheckCircle, XCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/primitives/core/layout/card";
import { Button } from "@/components/primitives/core/buttons/button";
import { Input } from "@/components/primitives/core/inputs/input";

interface DeliverySettingsProps {
  storeId: string;
}

type DeliveryProvider = "zr_express" | "yalidine" | null;

interface DeliveryConfig {
  provider: DeliveryProvider;
  apiKey: string;
  apiSecret: string;
  accountNumber?: string;
  isActive: boolean;
}

export function DeliverySettings({ storeId: _storeId }: DeliverySettingsProps) {
  const [selectedProvider, setSelectedProvider] = useState<DeliveryProvider>(null);
  const [config, setConfig] = useState<DeliveryConfig>({
    provider: null,
    apiKey: "",
    apiSecret: "",
    accountNumber: "",
    isActive: false,
  });
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const handleProviderSelect = (provider: DeliveryProvider) => {
    setSelectedProvider(provider);
    setConfig(prev => ({ ...prev, provider }));
    setTestResult(null);
  };

  const handleSave = async () => {
    if (!config.provider || !config.apiKey) return;
    
    setIsTesting(true);
    setTestResult(null);

    // Simulate API test - in production, this would call the actual API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For demo, we'll simulate success
    setTestResult("success");
    setConfig(prev => ({ ...prev, isActive: true }));
    setIsTesting(false);
  };

  const handleDisconnect = () => {
    setConfig({
      provider: null,
      apiKey: "",
      apiSecret: "",
      accountNumber: "",
      isActive: false,
    });
    setSelectedProvider(null);
    setTestResult(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          إعدادات شركات التوصيل
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ZR Express */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Truck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-50">ZR Express</h3>
                  <p className="text-sm text-zinc-500">شركة تطوير الرفاق</p>
                </div>
              </div>
              {config.isActive && config.provider === "zr_express" && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  متصل
                </span>
              )}
            </div>

            {!config.isActive || config.provider !== "zr_express" ? (
              <Button
                variant={selectedProvider === "zr_express" ? "primary" : "outline"}
                onClick={() => handleProviderSelect("zr_express")}
                className="w-full"
              >
                إعداد
              </Button>
            ) : (
              <Button
                variant="danger"
                onClick={handleDisconnect}
                className="w-full"
              >
                فصل
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Yalidine */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Truck className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-50">Yalidine</h3>
                  <p className="text-sm text-zinc-500">شركة ياليدين</p>
                </div>
              </div>
              {config.isActive && config.provider === "yalidine" && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  متصل
                </span>
              )}
            </div>

            {!config.isActive || config.provider !== "yalidine" ? (
              <Button
                variant={selectedProvider === "yalidine" ? "primary" : "outline"}
                onClick={() => handleProviderSelect("yalidine")}
                className="w-full"
              >
                إعداد
              </Button>
            ) : (
              <Button
                variant="danger"
                onClick={handleDisconnect}
                className="w-full"
              >
                فصل
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedProvider && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedProvider === "zr_express" ? "إعدادات ZR Express" : "إعدادات Yalidine"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                <Key className="w-4 h-4 inline-block ms-2" />
                API Key
              </label>
              <Input
                type="text"
                value={config.apiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="أدخل API Key"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                <Key className="w-4 h-4 inline-block ms-2" />
                API Secret
              </label>
              <div className="relative">
                <Input
                  type={showApiSecret ? "text" : "password"}
                  value={config.apiSecret}
                  onChange={(e) => setConfig(prev => ({ ...prev, apiSecret: e.target.value }))}
                  placeholder="أدخل API Secret"
                />
                <button
                  type="button"
                  onClick={() => setShowApiSecret(!showApiSecret)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  {showApiSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {selectedProvider === "zr_express" && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  رقم الحساب
                </label>
                <Input
                  type="text"
                  value={config.accountNumber || ""}
                  onChange={(e) => setConfig(prev => ({ ...prev, accountNumber: e.target.value }))}
                  placeholder="أدخل رقم الحساب"
                />
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={!config.apiKey || isTesting}
                className="flex-1"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري الاختبار...
                  </>
                ) : (
                  "حفظ واختبار الاتصال"
                )}
              </Button>
            </div>

            {testResult === "success" && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-xl">
                <CheckCircle className="w-5 h-5" />
                <span>تم الاتصال بنجاح!</span>
              </div>
            )}

            {testResult === "error" && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
                <XCircle className="w-5 h-5" />
                <span>فشل الاتصال. يرجى التحقق من البيانات.</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {config.isActive && (
        <Card>
          <CardHeader>
            <CardTitle>إرسال طلبات متعددة</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              يمكنك تحديد عدة طلبات في صفحة الطلبات وإرسالها لشركة التوصيل دفعة واحدة.
            </p>
            <Button variant="outline">
              <Truck className="w-4 h-4" />
              إرسال محدد
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
