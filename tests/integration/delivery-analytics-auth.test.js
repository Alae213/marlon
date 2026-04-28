import { describe, expect, it, mock } from "bun:test";

import { recordDeliveryEvent } from "@/convex/deliveryAnalytics";

const runRecordDeliveryEvent = recordDeliveryEvent._handler;

function createCtx({ orderStoreId = "store_1", identity = { subject: "owner_1" } } = {}) {
  const insertMock = mock(async (table) => `${table}_1`);
  const patchMock = mock(async () => null);

  return {
    ctx: {
      auth: {
        getUserIdentity: async () => identity,
      },
      db: {
        get: async (id) => {
          if (id === "store_1") {
            return { _id: "store_1", ownerId: "owner_1" };
          }
          if (id === "order_1") {
            return { _id: "order_1", storeId: orderStoreId };
          }
          return null;
        },
        insert: insertMock,
        patch: patchMock,
        query: () => ({
          withIndex: () => ({
            first: async () => null,
          }),
        }),
      },
    },
    insertMock,
  };
}

describe("deliveryAnalytics.recordDeliveryEvent authorization", () => {
  it("rejects analytics writes for orders outside the target store", async () => {
    const { ctx, insertMock } = createCtx({ orderStoreId: "store_2" });

    await expect(
      runRecordDeliveryEvent(ctx, {
        storeId: "store_1",
        orderId: "order_1",
        eventType: "failed",
        provider: "zr_express",
      }),
    ).rejects.toThrow("DELIVERY_ANALYTICS_ORDER_STORE_MISMATCH");

    expect(insertMock).not.toHaveBeenCalled();
  });

  it("allows owner-scoped analytics writes when the order belongs to the store", async () => {
    const { ctx, insertMock } = createCtx();

    await runRecordDeliveryEvent(ctx, {
      storeId: "store_1",
      orderId: "order_1",
      eventType: "delivered",
      provider: "zr_express",
      source: "orders.updateOrderStatus",
    });

    expect(insertMock).toHaveBeenCalledWith(
      "deliveryAnalyticsEvents",
      expect.objectContaining({
        storeId: "store_1",
        orderId: "order_1",
        eventType: "delivered",
      }),
    );
  });
});
