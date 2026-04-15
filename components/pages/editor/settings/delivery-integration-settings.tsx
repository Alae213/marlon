"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  const providerLabelId = `${provider}-label`;
  const apiKeyId = `${provider}-api-key`;
  const apiSecretId = `${provider}-api-secret`;
  const accountNumberId = `${provider}-account-number`;

  return (
    <div className={`p-4 rounded-xl border transition-all ${state.enabled ? "bg-white border-[--system-200]" : "bg-[--system-50] border-[--system-100]"}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={state.enabled}
            aria-labelledby={providerLabelId}
            onClick={() => onToggle(!state.enabled)}
            className={`relative w-10 h-6 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring] focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
              state.enabled ? "bg-[--color-primary]" : "bg-[--system-200]"
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                state.enabled ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
          <span id={providerLabelId} className="text-body-sm text-[--system-700]">{config.label}</span>
        </div>
        {state.enabled && state.hasStoredCredentials && (
          <span className="text-caption text-[--system-400]">
            {state.credentialsUpdatedAt
              ? `Updated ${new Date(state.credentialsUpdatedAt).toLocaleDateString()}`
              : "Configured"}
          </span>
        )}
      </div>

      {state.enabled && (
        <div className="space-y-4">
          <div>
            <label htmlFor={apiKeyId} className="mb-2 block text-caption text-[--system-500]">API Key</label>
            <input
              id={apiKeyId}
              type="password"
              value={state.credentials.apiKey}
              onChange={(e) => onUpdateCredential("apiKey", e.target.value)}
              onBlur={onSave}
              className="text-body-sm h-10 w-full rounded-lg border border-[--system-200] bg-white px-3 text-[--system-700] transition-all focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10"
              placeholder="Enter API key"
            />
          </div>

          {requirements.required.includes("apiSecret") && (
            <div>
              <label htmlFor={apiSecretId} className="mb-2 block text-caption text-[--system-500]">API Secret</label>
              <input
                id={apiSecretId}
                type="password"
                value={state.credentials.apiSecret}
                onChange={(e) => onUpdateCredential("apiSecret", e.target.value)}
                onBlur={onSave}
                className="text-body-sm h-10 w-full rounded-lg border border-[--system-200] bg-white px-3 text-[--system-700] transition-all focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10"
                placeholder="Enter API secret"
              />
            </div>
          )}

          {requirements.optional.includes("accountNumber") && (
            <div>
              <label htmlFor={accountNumberId} className="mb-2 block text-caption text-[--system-500]">Account Number (optional)</label>
              <input
                id={accountNumberId}
                type="text"
                value={state.credentials.accountNumber}
                onChange={(e) => onUpdateCredential("accountNumber", e.target.value)}
                onBlur={onSave}
                className="text-body-sm h-10 w-full rounded-lg border border-[--system-200] bg-white px-3 text-[--system-700] transition-all focus:border-[--color-primary] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/10"
                placeholder="Account number if provided"
              />
            </div>
          )}

          {missing.length > 0 && (
            <p className="text-caption text-[--color-error]">
              Required: {missing.map(getFieldLabel).join(", ")}
            </p>
          )}

          {state.hasStoredCredentials && !hasValues && (
            <p className="text-caption text-[--system-400]">Saved. Leave blank to keep current.</p>
          )}

          <div className="flex gap-2">
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
              className={`text-caption rounded-lg p-3 ${
                testResult.success
                  ? "bg-[--color-success-bg] text-[--color-success]"
                  : "bg-[--color-error-bg] text-[--color-error]"
              }`}
            >
              {testResult.message}
            </div>
          )}

          <p className="text-caption border-t border-[--system-100] pt-2 text-[--system-400]">
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

  // Track previous deliveryIntegration to detect changes
  const prevDeliveryIntegration = useRef(deliveryIntegration);

  /* eslint-disable react-hooks/set-state-in-effect */
  // Sync with external Convex query data - this is intentional for state synchronization
  useEffect(() => {
    // Skip if deliveryIntegration hasn't changed
    if (prevDeliveryIntegration.current === deliveryIntegration) {
      return;
    }
    prevDeliveryIntegration.current = deliveryIntegration;
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
      setProviderStates((prev) => {
        const next = { ...prev };
        for (const p of PROVIDERS) {
          const isEnabled = newEnabled[p.value];
          next[p.value] = {
            ...prev[p.value],
            enabled: isEnabled,
            hasStoredCredentials: isEnabled ? (data.hasCredentials ?? false) : false,
            credentialsUpdatedAt: isEnabled ? (data.credentialsUpdatedAt ?? null) : null,
            credentials: isEnabled ? prev[p.value].credentials : createEmptyCredentials(),
          };
        }
        return next;
      });
    }
  }, [deliveryIntegration]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleToggle = useCallback(
    async (provider: Provider, enabled: boolean) => {
      const previousEnabledValue = enabledProviders[provider];
      const previousProviderState = providerStates[provider];
      const nextEnabledProviders: EnabledProvidersState = {
        ...enabledProviders,
        [provider]: enabled,
      };

      const enabledProviderList = (Object.entries(nextEnabledProviders) as Array<[Provider, boolean]>)
        .filter(([, isEnabled]) => isEnabled)
        .map(([providerName]) => providerName);
      const providerForMutation: "yalidine" | "zr-express" | "andrson" | "noest" | "none" =
        enabledProviderList[0] ?? "none";

      setEnabledProviders(nextEnabledProviders);
      setTestResults((prev) => ({ ...prev, [provider]: null }));
      setProviderStates((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          enabled,
          credentials: createEmptyCredentials(),
          hasStoredCredentials: enabled ? prev[provider].hasStoredCredentials : false,
          credentialsUpdatedAt: enabled ? prev[provider].credentialsUpdatedAt : null,
        },
      }));

      try {
        await setDeliveryIntegration({
          storeId,
          provider: providerForMutation,
          enabledProviders: enabledProviderList as ("yalidine" | "zr-express" | "andrson" | "noest")[],
        });
      } catch (error) {
        setEnabledProviders((prev) => ({ ...prev, [provider]: previousEnabledValue }));
        setProviderStates((prev) => ({ ...prev, [provider]: previousProviderState }));
        console.error("Failed to update provider settings:", error);
      }
    },
    [storeId, setDeliveryIntegration, enabledProviders, providerStates]
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
      } catch {
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
        <p className="mt-1 text-body-sm text-[--system-400]">
          Enable providers and save credentials securely for this store.
        </p>
      </div>

      <div className="text-caption rounded-xl border border-[--system-200] bg-[--system-100] p-3 text-[--system-500]">
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
            <p className="text-body-sm text-[--system-400]">
              No courier enabled. Shipping will be handled manually.
            </p>
          </div>
        )}
    </div>
  );
}
