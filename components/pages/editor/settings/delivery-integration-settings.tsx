"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/primitives/core/buttons/button";

type Provider = "none" | "zr-express" | "yalidine";

const PROVIDERS: Array<{ value: Provider; label: string }> = [
  { value: "none", label: "None" },
  { value: "zr-express", label: "ZR Express" },
  { value: "yalidine", label: "Yalidine" },
];

interface DeliveryIntegrationSettingsProps {
  storeId: Id<"stores">;
}

export function DeliveryIntegrationSettings({ storeId }: DeliveryIntegrationSettingsProps) {
  const deliveryIntegration = useQuery(
    api.siteContent.getDeliveryIntegration,
    { storeId }
  );
  const setDeliveryIntegration = useMutation(api.siteContent.setDeliveryIntegration);
  const testDeliveryConnection = useAction(api.siteContent.testDeliveryConnection);

  const [provider, setProvider] = useState<Provider>("none");
  const [apiKey, setApiKey] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);

  // Sync state when query data arrives
  const prevDataRef = useRef<typeof deliveryIntegration>(undefined);
  useEffect(() => {
    if (deliveryIntegration && deliveryIntegration !== prevDataRef.current) {
      prevDataRef.current = deliveryIntegration;
      setProvider((deliveryIntegration.provider as Provider) || "none");
      setApiKey(deliveryIntegration.apiKey ?? "");
      setApiToken(deliveryIntegration.apiToken ?? "");
    }
  }, [deliveryIntegration]);

  const handleProviderChange = useCallback(
    async (newProvider: Provider) => {
      setProvider(newProvider);
      setTestResult(null);
      try {
        await setDeliveryIntegration({
          storeId,
          provider: newProvider,
          apiKey: newProvider === "none" ? "" : apiKey,
          apiToken: newProvider === "none" ? "" : apiToken,
        });
        setSavedMessage(true);
        setTimeout(() => setSavedMessage(false), 2000);
      } catch (error) {
        console.error("Failed to save provider:", error);
      }
    },
    [setDeliveryIntegration, storeId, apiKey, apiToken]
  );

  const handleSaveCredentials = useCallback(async () => {
    if (provider === "none") return;
    setIsSaving(true);
    try {
      await setDeliveryIntegration({ storeId, provider, apiKey, apiToken });
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2000);
    } catch (error) {
      console.error("Failed to save credentials:", error);
    }
    setIsSaving(false);
  }, [setDeliveryIntegration, storeId, provider, apiKey, apiToken]);

  const handleTestConnection = useCallback(async () => {
    if (!apiKey || !apiToken) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testDeliveryConnection({
        storeId,
        provider: provider as "zr-express" | "yalidine",
        apiKey,
        apiToken,
      });
      setTestResult(result);
    } catch {
      setTestResult({ success: false, message: "Connection failed" });
    }
    setIsTesting(false);
  }, [testDeliveryConnection, storeId, provider, apiKey, apiToken]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[--system-700]">Courier Integration</h3>
          <p className="text-sm text-[--system-400] mt-1">Connect your store to a courier service</p>
        </div>
        {savedMessage && <span className="text-sm font-medium text-[--color-success]">✓ Saved</span>}
      </div>

      <div className="flex gap-3 p-1 bg-[--system-100] rounded-xl">
        {PROVIDERS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleProviderChange(opt.value)}
            className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all ${
              provider === opt.value
                ? "bg-white text-[--system-700] shadow-sm border border-[--system-200]"
                : "text-[--system-400] hover:text-[--system-500]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {provider !== "none" && (
        <div className="space-y-4 p-5 bg-white border border-[--system-200] rounded-xl">
          <div>
            <label className="block text-sm font-medium mb-2 text-[--system-500]">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onBlur={handleSaveCredentials}
              className="w-full h-11 px-4 border border-[--system-200] bg-white text-[--system-700] rounded-lg focus:outline-none focus:border-[--color-primary] focus:ring-2 focus:ring-[--color-primary]/10 transition-all"
              placeholder="Enter API key"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-[--system-500]">API Token</label>
            <input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              onBlur={handleSaveCredentials}
              className="w-full h-11 px-4 border border-[--system-200] bg-white text-[--system-700] rounded-lg focus:outline-none focus:border-[--color-primary] focus:ring-2 focus:ring-[--color-primary]/10 transition-all"
              placeholder="Enter API token"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={!apiKey || !apiToken || isTesting}
              className="flex-1"
            >
              {isTesting ? "Testing..." : "Test Connection"}
            </Button>
            <Button onClick={handleSaveCredentials} disabled={isSaving} className="flex-1">
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>

          {testResult && (
            <div
              className={`p-4 rounded-xl text-sm font-medium ${
                testResult.success
                  ? "bg-[--color-success-bg] text-[--color-success] border border-[--color-success]"
                  : "bg-[--color-error-bg] text-[--color-error] border border-[--color-error]"
              }`}
            >
              {testResult.message}
            </div>
          )}

          <p className="text-xs text-[--system-400] pt-2 border-t border-[--system-200]">
            {provider === "zr-express" && "Get your API key from ZR Express dashboard"}
            {provider === "yalidine" && "Get your API key and token from Yalidine dashboard"}
          </p>
        </div>
      )}

      {provider === "none" && (
        <div className="p-5 bg-[--system-100] rounded-xl border border-[--system-200]">
          <p className="text-sm text-[--system-400]">No courier selected. Shipping will be handled manually.</p>
        </div>
      )}
    </div>
  );
}