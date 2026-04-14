import { describe, expect, it } from "bun:test";

export function runDeliveryProviderContractSuite({
  name,
  createAdapter,
  validCredentials,
  validRequest,
  trackingNumber,
  mockFetch,
}) {
  describe(`delivery provider contract: ${name}`, () => {
    it("createOrder returns normalized response shape", async () => {
      const adapter = createAdapter();
      await mockFetch?.("createOrder");

      const result = await adapter.createOrder(validCredentials, validRequest);

      expect(typeof result.success).toBe("boolean");
      if (result.success) {
        expect(typeof result.trackingNumber).toBe("string");
      }
    });

    it("getStatus returns normalized status or null", async () => {
      const adapter = createAdapter();
      await mockFetch?.("getStatus");

      const status = await adapter.getStatus(validCredentials, trackingNumber);
      if (status === null) {
        expect(status).toBeNull();
        return;
      }

      expect(typeof status.trackingNumber).toBe("string");
      expect([
        "pending",
        "picked_up",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "returned",
        "failed",
      ]).toContain(status.status);
    });
  });
}
