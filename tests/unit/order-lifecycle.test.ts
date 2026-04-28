import { describe, expect, it } from "bun:test";

import {
  assertOrderStatusTransition,
  canTransitionOrderStatus,
  getAllowedOrderStatusTransitions,
  normalizeOrderStatus,
} from "@/lib/order-lifecycle";

describe("canonical order lifecycle", () => {
  it("normalizes legacy statuses into the COD lifecycle", () => {
    expect(normalizeOrderStatus("packaged")).toBe("dispatch_ready");
    expect(normalizeOrderStatus("shipped")).toBe("in_transit");
    expect(normalizeOrderStatus("succeeded")).toBe("delivered");
    expect(normalizeOrderStatus("canceled")).toBe("cancelled");
    expect(normalizeOrderStatus("router")).toBe("returned");
  });

  it("rejects unknown target statuses", () => {
    expect(() => {
      assertOrderStatusTransition("new", "succeeded", "merchant");
    }).toThrow("Unknown target order status: succeeded");
  });

  it("rejects invalid jumps", () => {
    expect(() => {
      assertOrderStatusTransition("new", "delivered", "merchant");
    }).toThrow("Invalid order status transition: new -> delivered");
  });

  it("allows valid merchant confirmation and cancellation paths", () => {
    expect(canTransitionOrderStatus("new", "confirmed", "merchant")).toBe(true);
    expect(canTransitionOrderStatus("new", "cancelled", "merchant")).toBe(true);
    expect(canTransitionOrderStatus("awaiting_confirmation", "refused", "merchant")).toBe(true);
  });

  it("maps legacy current statuses before checking transitions", () => {
    expect(canTransitionOrderStatus("packaged", "cancelled", "merchant")).toBe(true);
    expect(canTransitionOrderStatus("packaged", "dispatched", "system")).toBe(true);
  });

  it("keeps provider-owned delivery outcomes out of merchant next actions", () => {
    expect(getAllowedOrderStatusTransitions("dispatched", "merchant")).toEqual([]);
    expect(canTransitionOrderStatus("dispatched", "delivered", "provider")).toBe(true);
    expect(canTransitionOrderStatus("dispatched", "delivered", "merchant")).toBe(false);
  });

  it("allows the server-owned dispatch operation to move confirmed orders to dispatched", () => {
    expect(canTransitionOrderStatus("confirmed", "dispatched", "system")).toBe(true);
    expect(canTransitionOrderStatus("confirmed", "dispatched", "merchant")).toBe(false);
  });
});
