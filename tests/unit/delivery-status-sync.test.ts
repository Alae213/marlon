import { describe, expect, it } from "bun:test";

import { mapDeliveryProviderStatusToOrderStatus } from "@/lib/delivery-status-sync";

describe("delivery provider status sync mapper", () => {
  it("maps active provider shipment statuses into order shipment states", () => {
    expect(mapDeliveryProviderStatusToOrderStatus("pending")).toBe("dispatched");
    expect(mapDeliveryProviderStatusToOrderStatus("picked up")).toBe("in_transit");
    expect(mapDeliveryProviderStatusToOrderStatus("in-transit")).toBe("in_transit");
    expect(mapDeliveryProviderStatusToOrderStatus("out_for_delivery")).toBe("in_transit");
  });

  it("maps COD terminal outcomes to canonical order states", () => {
    expect(mapDeliveryProviderStatusToOrderStatus("delivered")).toBe("delivered");
    expect(mapDeliveryProviderStatusToOrderStatus("failed")).toBe("delivery_failed");
    expect(mapDeliveryProviderStatusToOrderStatus("unreachable")).toBe("unreachable");
    expect(mapDeliveryProviderStatusToOrderStatus("refused")).toBe("refused");
    expect(mapDeliveryProviderStatusToOrderStatus("returned")).toBe("returned");
    expect(mapDeliveryProviderStatusToOrderStatus("rts")).toBe("returned");
  });

  it("recognizes live provider-native status names", () => {
    expect(mapDeliveryProviderStatusToOrderStatus("en_attente")).toBe("dispatched");
    expect(mapDeliveryProviderStatusToOrderStatus("collectee")).toBe("in_transit");
    expect(mapDeliveryProviderStatusToOrderStatus("en_livraison")).toBe("in_transit");
    expect(mapDeliveryProviderStatusToOrderStatus("livree")).toBe("delivered");
    expect(mapDeliveryProviderStatusToOrderStatus("retour")).toBe("returned");
    expect(mapDeliveryProviderStatusToOrderStatus("echouee")).toBe("delivery_failed");
  });

  it("maps unknown provider statuses to in transit so sync stays conservative", () => {
    expect(mapDeliveryProviderStatusToOrderStatus("mystery")).toBe("in_transit");
    expect(mapDeliveryProviderStatusToOrderStatus(null)).toBeNull();
  });
});
