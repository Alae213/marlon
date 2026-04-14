import { describe, expect, it, mock } from "bun:test";

import { updateOrderStatus } from "@/convex/orders";

const runUpdateOrderStatus = updateOrderStatus._handler;

function createCtx({ order }) {
  const patchMock = mock(async () => null);
  const runMutationMock = mock(async () => null);

  return {
    ctx: {
      auth: {
        getUserIdentity: async () => ({ subject: "owner_1" }),
      },
      db: {
        get: async (id) => {
          if (id === "order_1") {
            return order;
          }
          if (id === "store_1") {
            return { _id: "store_1", ownerId: "owner_1" };
          }
          return null;
        },
        patch: patchMock,
      },
      runMutation: runMutationMock,
    },
    patchMock,
    runMutationMock,
  };
}

describe("orders.updateOrderStatus delivery analytics events", () => {
  it("emits delivered analytics event when order succeeds", async () => {
    const { ctx, runMutationMock } = createCtx({
      order: {
        _id: "order_1",
        storeId: "store_1",
        timeline: [],
        customerWilaya: "Algiers",
        trackingNumber: "TRK1",
        deliveryProvider: "zr_express",
      },
    });

    await runUpdateOrderStatus(ctx, {
      orderId: "order_1",
      status: "succeeded",
    });

    expect(runMutationMock).toHaveBeenCalledTimes(1);
    const analyticsCall = runMutationMock.mock.calls[0];
    expect(analyticsCall[1].eventType).toBe("delivered");
    expect(analyticsCall[1].provider).toBe("zr_express");
  });
});
