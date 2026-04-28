import { describe, expect, it, mock } from "bun:test";

import {
  abandonPublicCheckoutAttempt,
  createPublicOrder,
  recoverPublicCheckoutAttempt,
  startPublicCheckoutAttempt,
} from "@/convex/orders";

const runCreatePublicOrder = createPublicOrder._handler;
const runStartPublicCheckoutAttempt = startPublicCheckoutAttempt._handler;
const runAbandonPublicCheckoutAttempt = abandonPublicCheckoutAttempt._handler;
const runRecoverPublicCheckoutAttempt = recoverPublicCheckoutAttempt._handler;

function createProduct(overrides = {}) {
  return {
    _id: "prod_1",
    storeId: "store_1",
    name: "Server Product",
    basePrice: 1000,
    images: ["https://example.com/product.jpg"],
    variants: [
      {
        name: "Size",
        options: [
          { name: "Large", priceModifier: 250 },
        ],
      },
    ],
    isArchived: false,
    _creationTime: Date.now() - 10000,
    createdAt: Date.now() - 10000,
    updatedAt: Date.now() - 10000,
    ...overrides,
  };
}

function createStore(overrides = {}) {
  return {
    _id: "store_1",
    slug: "demo-store",
    ownerId: "owner_1",
    name: "Demo Store",
    orderCount: 0,
    billingCompatibilityMode: "canonical",
    billingState: "active",
    createdAt: Date.now() - 10000,
    updatedAt: Date.now() - 10000,
    ...overrides,
  };
}

function createExistingOrder(overrides = {}) {
  const now = Date.now();
  return {
    _id: `order_${Math.random().toString(36).slice(2)}`,
    storeId: "store_1",
    orderNumber: "ORD-OLD",
    customerName: "Existing Customer",
    customerPhone: "0550123456",
    customerWilaya: "Alger",
    products: [
      {
        productId: "older_product",
        name: "Older Product",
        price: 500,
        quantity: 1,
      },
    ],
    subtotal: 500,
    deliveryCost: 400,
    total: 900,
    status: "cancelled",
    paymentStatus: "pending",
    callAttempts: 0,
    timeline: [],
    createdAt: now - 5 * 60 * 1000,
    updatedAt: now - 5 * 60 * 1000,
    ...overrides,
  };
}

function createCtx({ store = createStore(), products = [createProduct()], orders = [], deliveryPricing = [], checkoutAttempts = [] } = {}) {
  const stores = [store];
  const orderDigests = [];
  const orderTimelineEvents = [];
  const patchMock = mock(async (id, patch) => {
    const target =
      stores.find((item) => item._id === id) ??
      orders.find((item) => item._id === id) ??
      orderDigests.find((item) => item._id === id) ??
      checkoutAttempts.find((item) => item._id === id);
    if (target) {
      Object.assign(target, patch);
    }
  });
  const insertMock = mock(async (table, doc) => {
    const id = `${table}_${orders.length + orderDigests.length + orderTimelineEvents.length + checkoutAttempts.length + 1}`;
    const record = { _id: id, ...doc };
    if (table === "orders") {
      orders.push(record);
    } else if (table === "orderDigests") {
      orderDigests.push(record);
    } else if (table === "orderTimelineEvents") {
      orderTimelineEvents.push(record);
    } else if (table === "checkoutAttempts") {
      checkoutAttempts.push(record);
    }
    return id;
  });

  const queryTable = (table) => ({
    withIndex: (indexName) => {
      const chain = {
        async first() {
          if (table === "stores" && indexName === "slug") {
            return stores.find((item) => item.slug === store.slug) ?? null;
          }
          if (table === "orders" && indexName === "storeIdempotencyKey") {
            return orders.find((item) => item.publicIdempotencyKey) ?? null;
          }
          if (table === "checkoutAttempts" && indexName === "storeAttemptKey") {
            return checkoutAttempts.find((item) => item.storeId === store._id) ?? null;
          }
          if (table === "orderDigests" && indexName === "orderId") {
            return null;
          }
          return null;
        },
        async collect() {
          if (table === "deliveryPricing") return deliveryPricing;
          return [];
        },
        order() {
          return {
            async take() {
              if (table === "orders") {
                return [...orders].sort((a, b) => b.createdAt - a.createdAt);
              }
              if (table === "orderDigests") {
                return [...orderDigests].sort((a, b) => b.updatedAt - a.updatedAt);
              }
              return [];
            },
          };
        },
      };
      return chain;
    },
  });

  return {
    ctx: {
      db: {
        get: async (id) => {
          return (
            stores.find((item) => item._id === id) ??
            products.find((item) => item._id === id) ??
            orders.find((item) => item._id === id) ??
            checkoutAttempts.find((item) => item._id === id) ??
            null
          );
        },
        query: queryTable,
        insert: insertMock,
        patch: patchMock,
      },
    },
    orders,
    orderDigests,
    checkoutAttempts,
    orderTimelineEvents,
    patchMock,
    insertMock,
  };
}

const validArgs = {
  storeSlug: "demo-store",
  idempotencyKey: "checkout-key-123",
  customerName: "Jane Doe",
  customerPhone: "0550123456",
  customerWilaya: "16 - Alger - الجزائر",
  customerCommune: "Bab Ezzouar",
  customerAddress: "123 Market Street",
  deliveryType: "domicile",
  products: [
    {
      productId: "prod_1",
      quantity: 2,
      variant: "Large",
    },
  ],
};

describe("orders.createPublicOrder", () => {
  it("creates a real anonymous order with server-resolved product and delivery totals", async () => {
    const { ctx, orders, checkoutAttempts } = createCtx({
      deliveryPricing: [{ storeId: "store_1", wilaya: "Alger", homeDelivery: 700, officeDelivery: 400 }],
    });

    const result = await runCreatePublicOrder(ctx, validArgs);

    expect(result.duplicate).toBe(false);
    expect(orders).toHaveLength(1);
    expect(orders[0]).toEqual(
      expect.objectContaining({
        storeId: "store_1",
        customerPhone: "0550123456",
        subtotal: 2500,
        deliveryCost: 700,
        total: 3200,
        status: "new",
        paymentStatus: "pending",
        publicIdempotencyKey: "checkout-key-123",
        checkoutAttemptId: checkoutAttempts[0]._id,
      }),
    );
    expect(checkoutAttempts).toHaveLength(1);
    expect(checkoutAttempts[0]).toEqual(
      expect.objectContaining({
        lifecycle: "converted",
        convertedOrderId: orders[0]._id,
        productCount: 2,
      }),
    );
    expect(orders[0].products).toEqual([
      {
        productId: "prod_1",
        name: "Server Product",
        image: "https://example.com/product.jpg",
        price: 1250,
        quantity: 2,
        variant: "Large",
      },
    ]);
  });

  it("returns the existing order for a duplicate idempotency key without inserting twice", async () => {
    const state = createCtx();

    const first = await runCreatePublicOrder(state.ctx, validArgs);
    const second = await runCreatePublicOrder(state.ctx, validArgs);

    expect(first.duplicate).toBe(false);
    expect(second.duplicate).toBe(true);
    expect(second.orderId).toBe(first.orderId);
    expect(state.orders).toHaveLength(1);
    expect(state.checkoutAttempts).toHaveLength(1);
  });

  it("creates and links a checkout attempt before order conversion", async () => {
    const state = createCtx();

    const attempt = await runStartPublicCheckoutAttempt(state.ctx, {
      storeSlug: "demo-store",
      attemptKey: "attempt-key-123",
      products: [{ productId: "prod_1", quantity: 1 }],
    });

    expect(attempt.lifecycle).toBe("started");
    expect(state.checkoutAttempts[0]).toEqual(
      expect.objectContaining({
        lifecycle: "started",
      }),
    );
    expect(state.checkoutAttempts[0].convertedOrderId).toBeUndefined();

    const order = await runCreatePublicOrder(state.ctx, {
      ...validArgs,
      idempotencyKey: "checkout-linked-order",
      checkoutAttemptKey: "attempt-key-123",
    });

    expect(order.checkoutAttemptId).toBe(attempt.checkoutAttemptId);
    expect(state.checkoutAttempts[0]).toEqual(
      expect.objectContaining({
        lifecycle: "converted",
        convertedOrderId: order.orderId,
      }),
    );
  });

  it("marks abandoned and recovered checkout attempts without creating orders", async () => {
    const state = createCtx();

    await runStartPublicCheckoutAttempt(state.ctx, {
      storeSlug: "demo-store",
      attemptKey: "attempt-abandon-1",
      products: [{ productId: "prod_1", quantity: 1 }],
    });

    const abandoned = await runAbandonPublicCheckoutAttempt(state.ctx, {
      storeSlug: "demo-store",
      attemptKey: "attempt-abandon-1",
    });

    expect(abandoned.lifecycle).toBe("abandoned");
    expect(state.orders).toHaveLength(0);
    expect(state.checkoutAttempts[0]).toEqual(
      expect.objectContaining({
        lifecycle: "abandoned",
      }),
    );
    expect(state.checkoutAttempts[0].convertedOrderId).toBeUndefined();

    const recovered = await runRecoverPublicCheckoutAttempt(state.ctx, {
      storeSlug: "demo-store",
      attemptKey: "attempt-abandon-1",
      recoverySource: "sms",
    });

    expect(recovered.lifecycle).toBe("recovered");
    expect(state.checkoutAttempts[0]).toEqual(
      expect.objectContaining({
        lifecycle: "recovered",
        recoverySource: "sms",
      }),
    );
  });

  it("rejects invalid phone numbers safely", async () => {
    const { ctx, orders } = createCtx();

    await expect(
      runCreatePublicOrder(ctx, {
        ...validArgs,
        idempotencyKey: "checkout-key-456",
        customerPhone: "123",
      }),
    ).rejects.toThrow("PUBLIC_ORDER_INVALID_PHONE");

    expect(orders).toHaveLength(0);
  });

  it("rejects products that do not belong to the resolved store", async () => {
    const { ctx, orders } = createCtx({
      products: [createProduct({ storeId: "other_store" })],
    });

    await expect(runCreatePublicOrder(ctx, validArgs)).rejects.toThrow("PUBLIC_ORDER_INVALID_PRODUCT");
    expect(orders).toHaveLength(0);
  });

  it("rejects a recent duplicate order without an idempotency key", async () => {
    const state = createCtx();

    await runCreatePublicOrder(state.ctx, { ...validArgs, idempotencyKey: undefined });

    await expect(
      runCreatePublicOrder(state.ctx, {
        ...validArgs,
        idempotencyKey: undefined,
      }),
    ).rejects.toThrow("PUBLIC_ORDER_DUPLICATE_RECENT");
    expect(state.orders).toHaveLength(1);
  });

  it("adds lightweight risk flags for duplicate phone, negative history, and high-frequency submissions", async () => {
    const state = createCtx({
      orders: [
        createExistingOrder({
          _id: "order_old_1",
          status: "cancelled",
          createdAt: Date.now() - 8 * 60 * 1000,
          products: [{ productId: "older_product_1", name: "Old 1", price: 500, quantity: 1 }],
        }),
        createExistingOrder({
          _id: "order_old_2",
          status: "refused",
          createdAt: Date.now() - 12 * 60 * 1000,
          products: [{ productId: "older_product_2", name: "Old 2", price: 700, quantity: 1 }],
        }),
      ],
    });

    await runCreatePublicOrder(state.ctx, {
      ...validArgs,
      idempotencyKey: "checkout-risk-key",
    });

    expect(state.orders).toHaveLength(3);
    expect(state.orders[2]).toEqual(
      expect.objectContaining({
        status: "new",
        riskFlags: [
          "duplicate_phone",
          "repeated_cancelled_or_refused",
          "high_frequency_submissions",
        ],
      }),
    );
  });
});
