export type DeliveryProviderDisplay = {
  key: "yalidine" | "zr-express" | "unknown";
  label: string;
  trackingUrl?: string;
};

export type DeliveryTypeDisplay = {
  normalized: "domicile" | "stopdesk" | null;
  label: string | null;
  icon: "home" | "building" | null;
};

function normalizeProviderKey(provider?: string | null): string {
  return String(provider ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");
}

function humanizeValue(value: string): string {
  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getDeliveryProviderDisplay(
  provider?: string | null,
  trackingNumber?: string | null,
): DeliveryProviderDisplay {
  const normalizedProvider = normalizeProviderKey(provider);
  const tracking = String(trackingNumber ?? "").trim();

  if (!normalizedProvider) {
    return { key: "unknown", label: "Unknown" };
  }

  if (normalizedProvider === "yalidine") {
    return {
      key: "yalidine",
      label: "Yalidine",
      trackingUrl: tracking ? `https://yalidine.dz/track/${encodeURIComponent(tracking)}` : undefined,
    };
  }

  if (normalizedProvider === "zr-express" || normalizedProvider === "zrexpress") {
    return {
      key: "zr-express",
      label: "ZR Express",
      trackingUrl: tracking ? `https://zrexpress.dz/tracking/${encodeURIComponent(tracking)}` : undefined,
    };
  }

  return {
    key: "unknown",
    label: humanizeValue(provider ?? "Unknown") || "Unknown",
  };
}

export function getDeliveryTypeDisplay(deliveryType?: string | null): DeliveryTypeDisplay {
  const normalizedType = String(deliveryType ?? "").trim().toLowerCase();

  if (!normalizedType) {
    return { normalized: null, label: null, icon: null };
  }

  if (["domicile", "home", "home_delivery"].includes(normalizedType)) {
    return {
      normalized: "domicile",
      label: "Home delivery",
      icon: "home",
    };
  }

  if (["stopdesk", "office_delivery", "pickup"].includes(normalizedType)) {
    return {
      normalized: "stopdesk",
      label: "Stop desk",
      icon: "building",
    };
  }

  return {
    normalized: null,
    label: humanizeValue(deliveryType ?? "") || "Unknown",
    icon: null,
  };
}

export function normalizeDeliveryTypeForStorage(
  deliveryType?: string | null,
): "domicile" | "stopdesk" {
  const normalizedType = String(deliveryType ?? "").trim().toLowerCase();

  if (["stopdesk", "office_delivery", "pickup"].includes(normalizedType)) {
    return "stopdesk";
  }

  return "domicile";
}
