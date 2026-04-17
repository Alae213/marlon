import { describe, expect, it } from "bun:test";

import {
  getDeliveryProviderDisplay,
  getDeliveryTypeDisplay,
  normalizeDeliveryTypeForStorage,
} from "@/lib/order-delivery-display";

describe("order delivery display helpers", () => {
  it("maps supported delivery providers to labels and tracking URLs", () => {
    const yalidine = getDeliveryProviderDisplay("yalidine", "YD123");
    const zrExpressDashed = getDeliveryProviderDisplay("zr-express", "ZR123");
    const zrExpressUnderscored = getDeliveryProviderDisplay("zr_express", "ZR123");
    const unknown = getDeliveryProviderDisplay("custom-provider", "CP123");

    expect(yalidine).toEqual({
      key: "yalidine",
      label: "Yalidine",
      trackingUrl: "https://yalidine.dz/track/YD123",
    });

    expect(zrExpressDashed).toEqual({
      key: "zr-express",
      label: "ZR Express",
      trackingUrl: "https://zrexpress.dz/tracking/ZR123",
    });

    expect(zrExpressUnderscored).toEqual(zrExpressDashed);
    expect(unknown.key).toBe("unknown");
    expect(unknown.label).toBe("Custom Provider");
    expect(unknown.trackingUrl).toBeUndefined();
  });

  it("maps delivery types to consistent merchant-facing labels", () => {
    expect(getDeliveryTypeDisplay("home")).toEqual({
      normalized: "domicile",
      label: "Home delivery",
      icon: "home",
    });

    expect(getDeliveryTypeDisplay("domicile")).toEqual({
      normalized: "domicile",
      label: "Home delivery",
      icon: "home",
    });

    expect(getDeliveryTypeDisplay("stopdesk")).toEqual({
      normalized: "stopdesk",
      label: "Stop desk",
      icon: "building",
    });

    expect(getDeliveryTypeDisplay(undefined)).toEqual({
      normalized: null,
      label: null,
      icon: null,
    });

    expect(getDeliveryTypeDisplay("warehouse_pickup")).toEqual({
      normalized: null,
      label: "Warehouse Pickup",
      icon: null,
    });
  });

  it("normalizes delivery types for storage without changing the public contract", () => {
    expect(normalizeDeliveryTypeForStorage("home")).toBe("domicile");
    expect(normalizeDeliveryTypeForStorage("domicile")).toBe("domicile");
    expect(normalizeDeliveryTypeForStorage("stopdesk")).toBe("stopdesk");
    expect(normalizeDeliveryTypeForStorage("pickup")).toBe("stopdesk");
    expect(normalizeDeliveryTypeForStorage(undefined)).toBe("domicile");
    expect(normalizeDeliveryTypeForStorage("anything-else")).toBe("domicile");
  });
});
