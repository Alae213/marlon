import { describe, expect, it } from "bun:test";

import {
  assertCanReconcileCodPayment,
  getCodPaymentStatusForOrderStatus,
} from "@/lib/order-cod-payment";

describe("COD payment substates", () => {
  it("keeps active orders pending collection", () => {
    expect(getCodPaymentStatusForOrderStatus("new")).toBe("pending_collection");
    expect(getCodPaymentStatusForOrderStatus("confirmed")).toBe("pending_collection");
    expect(getCodPaymentStatusForOrderStatus("in_transit")).toBe("pending_collection");
  });

  it("marks delivered orders as pending reconciliation, not reconciled", () => {
    expect(getCodPaymentStatusForOrderStatus("delivered")).toBe("reconciliation_pending");
  });

  it("leaves failed COD outcomes not collected", () => {
    expect(getCodPaymentStatusForOrderStatus("refused")).toBe("not_collected");
    expect(getCodPaymentStatusForOrderStatus("returned")).toBe("not_collected");
    expect(getCodPaymentStatusForOrderStatus("unreachable")).toBe("not_collected");
  });

  it("requires collected COD before reconciliation", () => {
    expect(() => assertCanReconcileCodPayment("cod_collected", "collected")).not.toThrow();
    expect(() =>
      assertCanReconcileCodPayment("delivered", "reconciliation_pending"),
    ).toThrow("COD_RECONCILIATION_REQUIRES_COLLECTED_PAYMENT");
  });
});
