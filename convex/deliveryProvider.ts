export type NormalizedDeliveryProvider = "yalidine" | "zr-express" | "andrson" | "noest" | "none";

const SUPPORTED_PROVIDERS: Record<string, NormalizedDeliveryProvider> = {
  "yalidine": "yalidine",
  "zr-express": "zr-express",
  "zr_express": "zr-express",
  "andrson": "andrson",
  "noest": "noest",
  "noest-express": "noest",
  "none": "none",
};

export function normalizeDeliveryProvider(provider?: string | null): NormalizedDeliveryProvider {
  if (!provider) {
    return "none";
  }

  const normalized = provider.trim().toLowerCase().replace(/_/g, "-");
  return SUPPORTED_PROVIDERS[normalized] ?? "none";
}
