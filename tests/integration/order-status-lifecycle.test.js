import { describe, expect, it, mock } from "bun:test";

import {
  addCallLog,
  markOrderDispatchedFromDeliveryApi,
  reconcileCodPayment,
  syncDeliveryProviderStatus,
  updateOrderStatus,
} from "@/convex/orders";

const runUpdateOrderStatus = updateOrderStatus._handler;
const runAddCallLog = addCallLog._handler;
const runMarkOrderDispatchedFromDeliveryApi = markOrderDispatchedFromDeliveryApi._handler;
const runReconcileCodPayment = reconcileCodPayment._handler;
const runSyncDeliveryProviderStatus = syncDeliveryProviderStatus._handler;

function createOrder(overrides = {}) {
  return {
    _id: "order_1",
    storeId: "store_1",
    orderNumber: "1001",
    customerName: "Jane Doe",
    customerPhone: "0550123456",
    customerWilaya: "Alger",
    products: [
      {
        productId: "prod_1",
        name: "Widget",
        price: 1500,
        quantity: 1,
      },
    ],
    subtotal: 1500,
    deliveryCost: 500,
    total: 2000,
    status: "new",
    paymentStatus: "pending",
    codPaymentStatus: "pending_collection",
    timeline: [],
    createdAt: Date.now() - 1000,
    updatedAt: Date.now() - 1000,
    ...overrides,
  };
}

function createQueryMock() {
  return {
    withIndex: () => ({
      first: async () => null,
      collect: async () => [],
    }),
    order: () => ({
      collect: async () => [],
    }),
  };
}

function createCtx({ order }) {
  const patchMock = mock(async (id, patch) => {
    if (id === "order_1") {
      Object.assign(order, patch);
    }
  });
  const timelineEvents = [];
  const callEvents = [];
  const orderDigests = [];
  const insertMock = mock(async (table, doc) => {
    const id = `${table}_${timelineEvents.length + callEvents.length + orderDigests.length + 1}`;
    const record = { _id: id, ...doc };
    if (table === "orderTimelineEvents") {
      timelineEvents.push(record);
    }
    if (table === "orderCallEvents") {
      callEvents.push(record);
    }
    if (table === "orderDigests") {
      orderDigests.push(record);
    }
    return id;
  });
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
        insert: insertMock,
        query: (table) => {
          if (table === "orderDigests") {
            return {
              withIndex: () => ({
                first: async () => null,
              }),
            };
          }
          return createQueryMock();
        },
      },
      runMutation: runMutationMock,
    },
    patchMock,
    insertMock,
    runMutationMock,
    timelineEvents,
    callEvents,
  };
}

describe("orders.updateOrderStatus lifecycle validation", () => {
  it("rejects unknown target statuses before writing", async () => {
    const { ctx, patchMock } = createCtx({ order: createOrder() });

    await expect(
      runUpdateOrderStatus(ctx, {
        orderId: "order_1",
        status: "succeeded",
      }),
    ).rejects.toThrow("Unknown target order status: succeeded");

    expect(patchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid lifecycle jumps before writing", async () => {
    const { ctx, patchMock } = createCtx({ order: createOrder() });

    await expect(
      runUpdateOrderStatus(ctx, {
        orderId: "order_1",
        status: "delivered",
      }),
    ).rejects.toThrow("Invalid order status transition: new -> delivered");

    expect(patchMock).not.toHaveBeenCalled();
  });

  it("allows valid merchant confirmation and writes canonical status", async () => {
    const order = createOrder({ lastCallOutcome: "answered" });
    const { ctx, patchMock } = createCtx({ order });

    await runUpdateOrderStatus(ctx, {
      orderId: "order_1",
      status: "confirmed",
    });

    expect(patchMock).toHaveBeenCalledWith(
      "order_1",
      expect.objectContaining({
        status: "confirmed",
      }),
    );
    expect(order.status).toBe("confirmed");
    expect(order.codPaymentStatus).toBe("pending_collection");
  });

  it("requires answered-call evidence before merchant confirmation", async () => {
    const order = createOrder();
    const { ctx, patchMock } = createCtx({ order });

    await expect(
      runUpdateOrderStatus(ctx, {
        orderId: "order_1",
        status: "confirmed",
      }),
    ).rejects.toThrow("ORDER_CONFIRMATION_REQUIRES_ANSWERED_CALL");

    expect(patchMock).not.toHaveBeenCalled();
  });

  it("normalizes a legacy current status before validating the next action", async () => {
    const order = createOrder({ status: "packaged" });
    const { ctx, patchMock } = createCtx({ order });

    await runUpdateOrderStatus(ctx, {
      orderId: "order_1",
      status: "dispatched",
    });

    expect(patchMock).toHaveBeenCalledWith(
      "order_1",
      expect.objectContaining({
        status: "dispatched",
      }),
    );
    expect(order.status).toBe("dispatched");
  });

  it("treats answered calls as confirmation evidence and moves new orders to awaiting confirmation", async () => {
    const order = createOrder();
    const { ctx, patchMock, callEvents, timelineEvents } = createCtx({ order });

    await runAddCallLog(ctx, {
      orderId: "order_1",
      outcome: "answered",
      notes: "Customer confirmed address",
    });

    expect(patchMock).toHaveBeenCalledWith(
      "order_1",
      expect.objectContaining({
        status: "awaiting_confirmation",
        lastCallOutcome: "answered",
        callAttempts: 1,
      }),
    );
    expect(order.status).toBe("awaiting_confirmation");
    expect(callEvents).toHaveLength(1);
    expect(callEvents[0]).toEqual(
      expect.objectContaining({
        outcome: "answered",
        notes: "Customer confirmed address",
      }),
    );
    expect(timelineEvents.some((event) => event.status === "call_log")).toBe(true);
    expect(timelineEvents.some((event) => event.status === "awaiting_confirmation")).toBe(true);
  });

  it("maps refused calls to refused and prevents invalid delivery jumps", async () => {
    const order = createOrder({ status: "awaiting_confirmation" });
    const { ctx, patchMock } = createCtx({ order });

    await runAddCallLog(ctx, {
      orderId: "order_1",
      outcome: "refused",
    });

    expect(patchMock).toHaveBeenCalledWith(
      "order_1",
      expect.objectContaining({
        status: "refused",
        lastCallOutcome: "refused",
      }),
    );

    await expect(
      runUpdateOrderStatus(ctx, {
        orderId: "order_1",
        status: "delivered",
      }),
    ).rejects.toThrow("Invalid order status transition: refused -> delivered");
  });

  it("maps wrong numbers to blocked and repeated no-answer calls to unreachable", async () => {
    const wrongNumberOrder = createOrder({ status: "awaiting_confirmation" });
    const wrongNumberCtx = createCtx({ order: wrongNumberOrder });

    await runAddCallLog(wrongNumberCtx.ctx, {
      orderId: "order_1",
      outcome: "wrong_number",
    });

    expect(wrongNumberOrder.status).toBe("blocked");

    const noAnswerOrder = createOrder({
      status: "awaiting_confirmation",
      callLog: [
        { id: "call_1", timestamp: Date.now() - 2000, outcome: "no_answer" },
        { id: "call_2", timestamp: Date.now() - 1000, outcome: "no_answer" },
      ],
      callAttempts: 2,
      lastCallOutcome: "no_answer",
    });
    const noAnswerCtx = createCtx({ order: noAnswerOrder });

    await runAddCallLog(noAnswerCtx.ctx, {
      orderId: "order_1",
      outcome: "no_answer",
    });

    expect(noAnswerOrder.status).toBe("unreachable");
    expect(noAnswerOrder.callAttempts).toBe(3);
  });
});

describe("orders delivery dispatch lifecycle", () => {
  it("dispatch success writes tracking, dispatched status, timeline, digest, and analytics once", async () => {
    const order = createOrder({ status: "confirmed" });
    const { ctx, patchMock, runMutationMock, timelineEvents } = createCtx({ order });

    const result = await runMarkOrderDispatchedFromDeliveryApi(ctx, {
      orderId: "order_1",
      trackingNumber: "TRK1",
      provider: "zr_express",
    });

    expect(result).toEqual({
      orderId: "order_1",
      status: "dispatched",
      trackingNumber: "TRK1",
      provider: "zr_express",
      duplicate: false,
    });
    expect(patchMock).toHaveBeenCalledWith(
      "order_1",
      expect.objectContaining({
        status: "dispatched",
        trackingNumber: "TRK1",
        deliveryProvider: "zr_express",
      }),
    );
    expect(order.status).toBe("dispatched");
    expect(timelineEvents.some((event) => event.status === "dispatched")).toBe(true);
    expect(runMutationMock).toHaveBeenCalledTimes(1);
    expect(runMutationMock.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        orderId: "order_1",
        eventType: "dispatched",
        provider: "zr_express",
        trackingNumber: "TRK1",
        source: "orders.markOrderDispatchedFromDeliveryApi",
      }),
    );
  });

  it("rejects server dispatch unless the order is confirmed", async () => {
    const order = createOrder({ status: "awaiting_confirmation" });
    const { ctx, patchMock, runMutationMock } = createCtx({ order });

    await expect(
      runMarkOrderDispatchedFromDeliveryApi(ctx, {
        orderId: "order_1",
        trackingNumber: "TRK1",
        provider: "zr_express",
      }),
    ).rejects.toThrow("Order must be confirmed before dispatch.");

    expect(patchMock).not.toHaveBeenCalled();
    expect(runMutationMock).not.toHaveBeenCalled();
  });

  it("treats duplicate dispatch metadata as idempotent", async () => {
    const order = createOrder({
      status: "dispatched",
      trackingNumber: "TRK1",
      deliveryProvider: "zr_express",
    });
    const { ctx, patchMock, runMutationMock } = createCtx({ order });

    const result = await runMarkOrderDispatchedFromDeliveryApi(ctx, {
      orderId: "order_1",
      trackingNumber: "TRK1",
      provider: "zr_express",
    });

    expect(result).toEqual({
      orderId: "order_1",
      status: "dispatched",
      trackingNumber: "TRK1",
      provider: "zr_express",
      duplicate: true,
    });
    expect(patchMock).not.toHaveBeenCalled();
    expect(runMutationMock).not.toHaveBeenCalled();
  });

  it("maps provider refused and returned statuses to COD-specific order states", async () => {
    const refusedOrder = createOrder({
      status: "dispatched",
      trackingNumber: "TRK1",
      deliveryProvider: "zr_express",
    });
    const refusedCtx = createCtx({ order: refusedOrder });

    await runSyncDeliveryProviderStatus(refusedCtx.ctx, {
      orderId: "order_1",
      providerStatus: "refused",
    });

    expect(refusedOrder.status).toBe("refused");
    expect(refusedOrder.codPaymentStatus).toBe("not_collected");
    expect(refusedCtx.runMutationMock.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        eventType: "failed",
        reason: "refused",
      }),
    );

    const returnedOrder = createOrder({
      status: "dispatched",
      trackingNumber: "TRK2",
      deliveryProvider: "yalidine",
    });
    const returnedCtx = createCtx({ order: returnedOrder });

    await runSyncDeliveryProviderStatus(returnedCtx.ctx, {
      orderId: "order_1",
      providerStatus: "returned",
    });

    expect(returnedOrder.status).toBe("returned");
    expect(returnedOrder.codPaymentStatus).toBe("not_collected");
    expect(returnedCtx.runMutationMock.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        eventType: "rts",
        reason: "returned",
      }),
    );
  });

  it("sets delivered orders to reconciliation pending without marking COD reconciled", async () => {
    const order = createOrder({
      status: "in_transit",
      trackingNumber: "TRK3",
      deliveryProvider: "zr_express",
    });
    const { ctx } = createCtx({ order });

    await runSyncDeliveryProviderStatus(ctx, {
      orderId: "order_1",
      providerStatus: "delivered",
    });

    expect(order.status).toBe("delivered");
    expect(order.codPaymentStatus).toBe("reconciliation_pending");
    expect(order.codPaymentStatus).not.toBe("reconciled");
  });

  it("moves delivered COD through collected and reconciled merchant settlement states", async () => {
    const order = createOrder({
      status: "delivered",
      codPaymentStatus: "reconciliation_pending",
    });
    const { ctx, patchMock, timelineEvents } = createCtx({ order });

    await runUpdateOrderStatus(ctx, {
      orderId: "order_1",
      status: "cod_collected",
    });

    expect(order.status).toBe("cod_collected");
    expect(order.codPaymentStatus).toBe("collected");

    await runReconcileCodPayment(ctx, {
      orderId: "order_1",
      note: "Courier cash settled",
    });

    expect(order.status).toBe("cod_reconciled");
    expect(order.codPaymentStatus).toBe("reconciled");
    expect(patchMock.mock.calls.at(-1)?.[1]).toEqual(
      expect.objectContaining({
        status: "cod_reconciled",
        codPaymentStatus: "reconciled",
      }),
    );
    expect(timelineEvents.some((event) => event.note === "Courier cash settled")).toBe(true);
  });

  it("rejects COD reconciliation until collection has been recorded", async () => {
    const order = createOrder({
      status: "delivered",
      codPaymentStatus: "reconciliation_pending",
    });
    const { ctx, patchMock } = createCtx({ order });

    await expect(
      runReconcileCodPayment(ctx, {
        orderId: "order_1",
      }),
    ).rejects.toThrow("COD_RECONCILIATION_REQUIRES_COLLECTED_PAYMENT");

    expect(patchMock).not.toHaveBeenCalled();
  });
});
