"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/primitives/core/buttons/button";

type Provider = "yalidine" | "zr-express" | "andrson" | "noest";

interface ProviderConfig {
  value: Provider;
  label: string;
}

const PROVIDERS: ProviderConfig[] = [
  { value: "yalidine", label: "Yalidine" },
  { value: "zr-express", label: "ZR Express" },
  { value: "andrson", label: "Andrson" },
  { value: "noest", label: "Noest Express" },
];

interface DeliveryIntegrationSettingsProps {
  storeId: Id<"stores">;
}

interface MultiProviderState {
  enabled: boolean;
  credentials: Record<string, string>;
  hasStoredCredentials: boolean;
  credentialsUpdatedAt?: number | null;
}

interface EnabledProvidersState {
  yalidine: boolean;
  "zr-express": boolean;
  andrson: boolean;
  noest: boolean;
}

type CredentialField = "apiKey" | "apiSecret" | "accountNumber";

const PROVIDER_REQUIREMENTS: Record<Provider, { required: CredentialField[]; optional: CredentialField[]; helpText: string }> = {
  yalidine: {
    required: ["apiKey", "apiSecret"],
    optional: [],
    helpText: "Use your Yalidine API key and API secret.",
  },
  "zr-express": {
    required: ["apiKey", "apiSecret"],
    optional: ["accountNumber"],
    helpText: "Use your ZR Express API key and API secret. Account number is optional.",
  },
  andrson: {
    required: ["apiKey"],
    optional: ["apiSecret", "accountNumber"],
    helpText: "Andrson integration (TBD). Contact provider for credentials.",
  },
  noest: {
    required: ["apiKey"],
    optional: ["apiSecret", "accountNumber"],
    helpText: "Noest Express integration (TBD). Contact provider for credentials.",
  },
};

function createEmptyCredentials(): Record<string, string> {
  return { apiKey: "", apiSecret: "", accountNumber: "" };
}

function hasAnyCredentialValue(credentials: Record<string, string>): boolean {
  return Object.values(credentials).some((value) => value.trim().length > 0);
}

function getMissingFields(provider: Provider, credentials: Record<string, string>): CredentialField[] {
  return PROVIDER_REQUIREMENTS[provider].required.filter((field) => !credentials[field].trim());
}

function getFieldLabel(field: CredentialField): string {
  const labels: Record<CredentialField, string> = {
    apiKey: "API key",
    apiSecret: "API secret",
    accountNumber: "Account number",
  };
  return labels[field];
}

function ProviderCard({
  provider,
  config,
  state,
  onToggle,
  onUpdateCredential,
  onTest,
  onSave,
  isTesting,
  testResult,
}: {
  provider: Provider;
  config: ProviderConfig;
  state: MultiProviderState;
  onToggle: (enabled: boolean) => void;
  onUpdateCredential: (field: CredentialField, value: string) => void;
  onTest: () => void;
  onSave: () => void;
  isTesting: boolean;
  testResult: { success: boolean; message: string } | null;
}) {
  const requirements = PROVIDER_REQUIREMENTS[provider];
  const missing = state.enabled ? getMissingFields(provider, state.credentials) : [];
  const testDisabled = !state.enabled || missing.length > 0 || isTesting;
  const hasValues = hasAnyCredentialValue(state.credentials);

  return (
    <div className={`p-4 rounded-xl border transition-all ${state.enabled ? "bg-white border-[--system-200]" : "bg-[--system-50] border-[--system-100]"}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggle(!state.enabled)}
            className={`relative w-10 h-6 rounded-full transition-colors ${
              state.enabled ? "bg-[--color-primary]" : "bg-[--system-200]"
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                state.enabled ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
          <span className="font-medium text-[--system-700]">{config.label}</span>
        </div>
        {state.enabled && state.hasStoredCredentials && (
          <span className="text-xs text-[--system-400]">
            {state.credentialsUpdatedAt
              ? `Updated ${new Date(state.credentialsUpdatedAt).toLocaleDateString()}`
              : "Configured"}
          </span>
        )}
      </div>

      {state.enabled && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-[--system-500]">API Key</label>
            <input
              type="password"
              value={state.credentials.apiKey}
              onChange={(e) => onUpdateCredential("apiKey", e.target.value)}
              onBlur={onSave}
              className="w-full h-10 px-3 text-sm border border-[--system-200] bg-white text-[--system-700] rounded-lg focus:outline-none focus:border-[--color-primary] focus:ring-2 focus:ring-[--color-primary]/10 transition-all"
              placeholder="Enter API key"
            />
          </div>

          {requirements.required.includes("apiSecret") && (
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[--system-500]">API Secret</label>
              <input
                type="password"
                value={state.credentials.apiSecret}
                onChange={(e) => onUpdateCredential("apiSecret", e.target.value)}
                onBlur={onSave}
                className="w-full h-10 px-3 text-sm border border-[--system-200] bg-white text-[--system-700] rounded-lg focus:outline-none focus:border-[--color-primary] focus:ring-2 focus:ring-[--color-primary]/10 transition-all"
                placeholder="Enter API secret"
              />
            </div>
          )}

          {requirements.optional.includes("accountNumber") && (
            <div>
              <label className="block text-xs font-medium mb-1.5 text-[--system-500]">Account Number (optional)</label>
              <input
                type="text"
                value={state.credentials.accountNumber}
                onChange={(e) => onUpdateCredential("accountNumber", e.target.value)}
                onBlur={onSave}
                className="w-full h-10 px-3 text-sm border border-[--system-200] bg-white text-[--system-700] rounded-lg focus:outline-none focus:border-[--color-primary] focus:ring-2 focus:ring-[--color-primary]/10 transition-all"
                placeholder="Account number if provided"
              />
            </div>
          )}

          {missing.length > 0 && (
            <p className="text-xs text-[--color-error]">
              Required: {missing.map(getFieldLabel).join(", ")}
            </p>
          )}

          {state.hasStoredCredentials && !hasValues && (
            <p className="text-xs text-[--system-400]">Saved. Leave blank to keep current.</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onTest}
              disabled={testDisabled}
              className="flex-1"
            >
              {isTesting ? "Testing..." : "Test"}
            </Button>
            <Button size="sm" onClick={onSave} disabled={missing.length > 0} className="flex-1">
              Save
            </Button>
          </div>

          {testResult && (
            <div
              className={`p-2 rounded-lg text-xs font-medium ${
                testResult.success
                  ? "bg-[--color-success-bg] text-[--color-success]"
                  : "bg-[--color-error-bg] text-[--color-error]"
              }`}
            >
              {testResult.message}
            </div>
          )}

          <p className="text-xs text-[--system-400] pt-1 border-t border-[--system-100]">
            {requirements.helpText}
          </p>
        </div>
      )}
    </div>
  );
}

export function DeliveryIntegrationSettings({ storeId }: DeliveryIntegrationSettingsProps) {
  const deliveryIntegration = useQuery(api.siteContent.getDeliveryIntegration, { storeId });
  const setDeliveryIntegration = useMutation(api.siteContent.setDeliveryIntegration);
  const testDeliveryConnection = useAction(api.siteContent.testDeliveryConnection);

  const [enabledProviders, setEnabledProviders] = useState<EnabledProvidersState>({
    yalidine: false,
    "zr-express": false,
    andrson: false,
    noest: false,
  });

  const [providerStates, setProviderStates] = useState<Record<Provider, MultiProviderState>>({
    yalidine: { enabled: false, credentials: createEmptyCredentials(), hasStoredCredentials: false },
    "zr-express": { enabled: false, credentials: createEmptyCredentials(), hasStoredCredentials: false },
    andrson: { enabled: false, credentials: createEmptyCredentials(), hasStoredCredentials: false },
    noest: { enabled: false, credentials: createEmptyCredentials(), hasStoredCredentials: false },
  });

  const [testingProvider, setTestingProvider] = useState<Provider | null>(null);
  const [testResults, setTestResults] = useState<Record<Provider, { success: boolean; message: string } | null>>({
    yalidine: null,
    "zr-express": null,
    andrson: null,
    noest: null,
  });

  useEffect(() => {
    if (deliveryIntegration) {
      const data = deliveryIntegration as {
        provider?: string;
        hasCredentials?: boolean;
        credentialsUpdatedAt?: number | null;
        enabledProviders?: string[];
      };
      
      const enabled = data.enabledProviders || (data.provider && data.provider !== "none" ? [data.provider] : []);
      const newEnabled: EnabledProvidersState = {
        yalidine: enabled.includes("yalidine"),
        "zr-express": enabled.includes("zr-express"),
        andrson: enabled.includes("andrson"),
        noest: enabled.includes("noest"),
      };
      setEnabledProviders(newEnabled);

      for (const p of PROVIDERS) {
        if (newEnabled[p.value]) {
          setProviderStates((prev) => ({
            ...prev,
            [p.value]: {
              ...prev[p.value],
              enabled: true,
              hasStoredCredentials: data.hasCredentials ?? false,
              credentialsUpdatedAt: data.credentialsUpdatedAt ?? null,
            },
          }));
        }
      }
    }
  }, [deliveryIntegration]);

  const handleToggle = useCallback(
    async (provider: Provider, enabled: boolean) => {
      setEnabledProviders((prev) => ({ ...prev, [provider]: enabled }));
      setTestResults((prev) => ({ ...prev, [provider]: null }));

      if (enabled) {
        setProviderStates((prev) => ({
          ...prev,
          [provider]: { ...prev[provider], enabled, credentials: createEmptyCredentials() },
        }));
      } else {
        setProviderStates((prev) => ({
          ...prev,
          [provider]: { ...prev[provider], enabled, credentials: createEmptyCredentials() },
        }));
      }

      const currentEnabled = Object.entries(enabledProviders)
        .filter(([_, v]) => v || (provider === _ && enabled))
        .map(([k]) => k);

      if (enabled) {
        currentEnabled.push(provider);
      } else {
        const idx = currentEnabled.indexOf(provider);
        if (idx > -1) currentEnabled.splice(idx, 1);
      }

      const uniqueEnabled = [...new Set(currentEnabled)];
      const primaryProvider = uniqueEnabled[0] || "none";

      try {
        await setDeliveryIntegration({
          storeId,
          provider: primaryProvider as "yalidine" | "zr-express" | "andrson" | "noest" | "none",
          enabledProviders: uniqueEnabled as ("yalidine" | "zr-express" | "andrson" | "noest")[],
        });
      } catch (error) {
        console.error("Failed to update provider settings:", error);
      }
    },
    [storeId, setDeliveryIntegration, enabledProviders]
  );

  const handleUpdateCredential = useCallback(
    (provider: Provider, field: CredentialField, value: string) => {
      setProviderStates((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          credentials: { ...prev[provider].credentials, [field]: value },
        },
      }));
      setTestResults((prev) => ({ ...prev, [provider]: null }));
    },
    []
  );

  const handleSave = useCallback(
    async (provider: Provider) => {
      const state = providerStates[provider];
      const missing = getMissingFields(provider, state.credentials);
      if (missing.length > 0) return;

      try {
        await setDeliveryIntegration({
          storeId,
          provider,
          credentials: {
            apiKey: state.credentials.apiKey,
            apiSecret: state.credentials.apiSecret,
            accountNumber: state.credentials.accountNumber,
          },
        });

        setProviderStates((prev) => ({
          ...prev,
          [provider]: {
            ...prev[provider],
            hasStoredCredentials: true,
            credentialsUpdatedAt: Date.now(),
          },
        }));
      } catch (error) {
        console.error("Failed to save credentials:", error);
      }
    },
    [storeId, setDeliveryIntegration, providerStates]
  );

  const handleTest = useCallback(
    async (provider: Provider) => {
      const state = providerStates[provider];
      const missing = getMissingFields(provider, state.credentials);
      if (missing.length > 0) return;

      setTestingProvider(provider);
      setTestResults((prev) => ({ ...prev, [provider]: null }));

      try {
        const result = await testDeliveryConnection({
          storeId,
          provider,
          credentials: {
            apiKey: state.credentials.apiKey,
            apiSecret: state.credentials.apiSecret,
            accountNumber: state.credentials.accountNumber,
          },
        });
        setTestResults((prev) => ({ ...prev, [provider]: result }));
      } catch (error) {
        setTestResults((prev) => ({
          ...prev,
          [provider]: { success: false, message: "Test failed. Check credentials." },
        }));
      }
      setTestingProvider(null);
    },
    [storeId, testDeliveryConnection, providerStates]
  );

  if (deliveryIntegration === undefined) {
    return (
      <div className="rounded-xl border border-[--system-200] bg-[--system-100] p-5">
        <p className="text-sm text-[--system-400]">Loading courier settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-[--system-700]">Courier Integration</h3>
        <p className="text-sm text-[--system-400] mt-1">
          Enable providers and save credentials securely for this store.
        </p>
      </div>

      <div className="rounded-xl border border-[--system-200] bg-[--system-100] p-3 text-xs text-[--system-500]">
        Credentials are write-only. Existing keys are never displayed after save.
      </div>

      <div className="space-y-3">
        {PROVIDERS.map((config) => (
          <ProviderCard
            key={config.value}
            provider={config.value}
            config={config}
            state={providerStates[config.value]}
            onToggle={(enabled) => handleToggle(config.value, enabled)}
            onUpdateCredential={(field, value) => handleUpdateCredential(config.value, field, value)}
            onTest={() => handleTest(config.value)}
            onSave={() => handleSave(config.value)}
            isTesting={testingProvider === config.value}
            testResult={testResults[config.value]}
          />
        ))}
      </div>

      {!enabledProviders.yalidine &&
        !enabledProviders["zr-express"] &&
        !enabledProviders.andrson &&
        !enabledProviders.noest && (
          <div className="p-4 bg-[--system-100] rounded-xl border border-[--system-200]">
            <p className="text-sm text-[--system-400]">
              No courier enabled. Shipping will be handled manually.
            </p>
          </div>
        )}
    </div>
  );
}