import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id, Doc } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { upsertOrderDigest } from "./performanceHelpers";
import { assertStoreRole } from "./storeAccess";
import { isStoreOverflowLocked, maskCustomerData } from "./canonicalBilling";
import { normalizeDeliveryTypeForStorage } from "../lib/order-delivery-display";

function toDeliveryEventType(status: string): "delivered" | "failed" | "rts" | null {
  if (status === "succeeded") {
    return "delivered";
  }

  if (status === "canceled" || status === "blocked") {
    return "failed";
  }

  if (status === "router") {
    return "rts";
  }

  return null;
}

const MAX_LEGACY_TIMELINE_ENTRIES = 30;
const MAX_LEGACY_CALL_LOG_ENTRIES = 20;

function clampTimeline(
  timeline: Array<{ status: string; timestamp: number; note?: string }>
) {
  if (timeline.length <= MAX_LEGACY_TIMELINE_ENTRIES) {
    return timeline;
  }
  return timeline.slice(timeline.length - MAX_LEGACY_TIMELINE_ENTRIES);
}

function clampCallLog(
  callLog: Array<{ id: string; timestamp: number; outcome: string; notes?: string }>
) {
  if (callLog.length <= MAX_LEGACY_CALL_LOG_ENTRIES) {
    return callLog;
  }
  return callLog.slice(callLog.length - MAX_LEGACY_CALL_LOG_ENTRIES);
}

// Helper to verify store ownership via order
async function assertOrderOwnership(ctx: { db: { get: (id: Id<"orders">) => Promise<Doc<"orders"> | null> } } & Parameters<typeof assertStoreRole>[0], orderId: Id<"orders">) {
  const order = await ctx.db.get(orderId) as Doc<"orders"> | null;
  if (!order) {
    throw new Error("Order not found");
  }

  const { identity, store } = await assertStoreRole(ctx, order.storeId as Id<"stores">, "owner");
  return { identity, order, store };
}

// Helper to verify store ownership directly
async function assertStoreOwnership(ctx: Parameters<typeof assertStoreRole>[0], storeId: Id<"stores">) {
  return await assertStoreRole(ctx, storeId, "owner");
}

async function appendTimelineEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  order: Doc<"orders">,
  status: string,
  note: string | undefined,
  timestamp: number
) {
  await ctx.db.insert("orderTimelineEvents", {
    orderId: order._id,
    storeId: order.storeId,
    status,
    note,
    createdAt: timestamp,
  });
}

async function appendCallEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  order: Doc<"orders">,
  outcome: string,
  notes: string | undefined,
  timestamp: number
) {
  await ctx.db.insert("orderCallEvents", {
    orderId: order._id,
    storeId: order.storeId,
    outcome,
    notes,
    createdAt: timestamp,
  });
}

// Get all orders for a store
export const getOrders = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    // Verify ownership for security
    await assertStoreOwnership(ctx, args.storeId);

    const orders = await ctx.db
      .query("orders")
      .withIndex("storeId", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .collect();
    
    // Apply masking if store is overflow locked
    const isOverflowLocked = await isStoreOverflowLocked(ctx, args.storeId);
    if (isOverflowLocked) {
      return orders.map(maskCustomerData);
    }
    
    return orders;
  },
});

// Get a single order by ID
export const getOrder = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const { order, store } = await assertOrderOwnership(ctx, args.orderId);
    
    // Apply masking if store is overflow locked
    const isOverflowLocked = await isStoreOverflowLocked(ctx, store._id);
    if (isOverflowLocked) {
      return maskCustomerData(order);
    }
    
    return order;
  },
});

// Get orders by status
export const getOrdersByStatus = query({
  args: { storeId: v.id("stores"), status: v.string() },
  handler: async (ctx, args) => {
    await assertStoreOwnership(ctx, args.storeId);

    const orders = await ctx.db
      .query("orders")
      .withIndex("status", (q) =>
        q.eq("storeId", args.storeId).eq("status", args.status)
      )
      .order("desc")
      .collect();
    
    // Apply masking if store is overflow locked
    const isOverflowLocked = await isStoreOverflowLocked(ctx, args.storeId);
    if (isOverflowLocked) {
      return orders.map(maskCustomerData);
    }
    
    return orders;
  },
});

// Get count of new orders
export const getNewOrdersCount = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    await assertStoreOwnership(ctx, args.storeId);

    const orders = await ctx.db
      .query("orderDigests")
      .withIndex("storeStatusUpdatedAt", (q) =>
        q.eq("storeId", args.storeId).eq("status", "new")
      )
      .collect();
    return orders.length;
  },
});

// Get order by order number
export const getOrderByNumber = query({
  args: { storeId: v.id("stores"), orderNumber: v.string() },
  handler: async (ctx, args) => {
    await assertStoreOwnership(ctx, args.storeId);

    const order = await ctx.db
      .query("orders")
      .withIndex("storeOrderNumber", (q) =>
        q.eq("storeId", args.storeId).eq("orderNumber", args.orderNumber)
      )
      .first();
    
    if (!order) return null;
    
    // Apply masking if store is overflow locked
    const isOverflowLocked = await isStoreOverflowLocked(ctx, args.storeId);
    if (isOverflowLocked) {
      return maskCustomerData(order);
    }
    
    return order;
  },
});

// Lightweight order list read path for high-frequency list UIs.
export const getOrderDigests = query({
  args: {
    storeId: v.id("stores"),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertStoreOwnership(ctx, args.storeId);
    const limit = Math.min(200, Math.max(1, args.limit ?? 100));

    let digests;
    if (args.status) {
      digests = await ctx.db
        .query("orderDigests")
        .withIndex("storeStatusUpdatedAt", (q) =>
          q.eq("storeId", args.storeId).eq("status", args.status!)
        )
        .order("desc")
        .take(limit);
    } else {
      digests = await ctx.db
        .query("orderDigests")
        .withIndex("storeUpdatedAt", (q) => q.eq("storeId", args.storeId))
        .order("desc")
        .take(limit);
    }
    
    // Apply masking if store is overflow locked
    const isOverflowLocked = await isStoreOverflowLocked(ctx, args.storeId);
    if (isOverflowLocked) {
      return digests.map(maskCustomerData);
    }
    
    return digests;
  },
});

// Create a new order
export const createOrder = mutation({
  args: {
    storeId: v.id("stores"),
    orderNumber: v.string(),
    customerName: v.string(),
    customerPhone: v.string(),
    customerWilaya: v.string(),
    customerCommune: v.optional(v.string()),
    customerAddress: v.optional(v.string()),
    products: v.array(
      v.object({
        productId: v.string(),
        name: v.string(),
        image: v.optional(v.string()),
        price: v.number(),
        quantity: v.number(),
        variant: v.optional(v.string()),
      })
    ),
    subtotal: v.number(),
    deliveryCost: v.number(),
    total: v.number(),
    deliveryType: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify ownership of the store
    const { store } = await assertStoreOwnership(ctx, args.storeId);
    
    const now = Date.now();
    const normalizedDeliveryType = normalizeDeliveryTypeForStorage(args.deliveryType);
    const orderId = await ctx.db.insert("orders", {
      storeId: args.storeId,
      orderNumber: args.orderNumber,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      customerWilaya: args.customerWilaya,
      customerCommune: args.customerCommune,
      customerAddress: args.customerAddress,
      products: args.products,
      subtotal: args.subtotal,
      deliveryCost: args.deliveryCost,
      total: args.total,
      deliveryType: normalizedDeliveryType,
      status: "new",
      paymentStatus: "pending",
      callAttempts: 0,
      timeline: [
        {
          status: "new",
          timestamp: now,
          note: "تم إنشاء الطلب",
        },
      ],
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    // Update store order count
    const nextOrderCount = (store.orderCount || 0) + 1;
    if (store.orderCount !== nextOrderCount || store.updatedAt !== now) {
      await ctx.db.patch(args.storeId, {
        orderCount: nextOrderCount,
        updatedAt: now,
      });
    }

const createdOrder = await ctx.db.get(orderId);
    if (createdOrder) {
      await upsertOrderDigest(ctx, createdOrder);
      const firstTimeline = createdOrder.timeline?.[0];
      await appendTimelineEvent(
        ctx,
        createdOrder,
        firstTimeline?.status ?? "new",
        firstTimeline?.note,
        firstTimeline?.timestamp ?? now
      );

      await ctx.runMutation(api.canonicalBilling.checkAndUpdateOverflowState, {
        storeId: args.storeId,
      });
    }

    return orderId;
  },
});

// Update order status
export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertOrderOwnership(ctx, args.orderId);

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status === args.status && !args.note) {
      return args.orderId;
    }

    const now = Date.now();
    const timelineNote = args.note || `Status changed to ${args.status}`;
    const timeline = clampTimeline([
      ...(order.timeline || []),
      {
        status: args.status,
        timestamp: now,
        note: timelineNote,
      },
    ]);

    await ctx.db.patch(args.orderId, {
      status: args.status,
      timeline,
      updatedAt: now,
    });

    const updatedOrder = await ctx.db.get(args.orderId);
    if (updatedOrder) {
      await appendTimelineEvent(ctx, updatedOrder, args.status, timelineNote, now);
      await upsertOrderDigest(ctx, updatedOrder);
    }

    const analyticsEventType = toDeliveryEventType(args.status);
    if (analyticsEventType) {
      await ctx.runMutation(api.deliveryAnalytics.recordDeliveryEvent, {
        storeId: order.storeId as Id<"stores">,
        orderId: String(args.orderId),
        eventType: analyticsEventType,
        provider: order.deliveryProvider ?? "unknown",
        region: order.customerWilaya,
        trackingNumber: order.trackingNumber,
        source: "orders.updateOrderStatus",
        createdAt: now,
      });
    }

    return args.orderId;
  },
});

export const bulkUpdateOrderStatus = mutation({
  args: {
    orderIds: v.array(v.id("orders")),
    status: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let updatedCount = 0;

    for (const orderId of args.orderIds) {
      let order: Doc<"orders"> | null = null;
      try {
        const owned = await assertOrderOwnership(ctx, orderId);
        order = owned.order;
      } catch {
        continue;
      }

      if (!order) {
        continue;
      }

      if (order.status === args.status && !args.note) {
        continue;
      }

      const now = Date.now();
      const timelineNote = args.note || `Status changed to ${args.status}`;
      const timeline = clampTimeline([
        ...(order.timeline || []),
        {
          status: args.status,
          timestamp: now,
          note: timelineNote,
        },
      ]);

      await ctx.db.patch(orderId, {
        status: args.status,
        timeline,
        updatedAt: now,
      });

      const updatedOrder = await ctx.db.get(orderId);
      if (updatedOrder) {
        await appendTimelineEvent(ctx, updatedOrder, args.status, timelineNote, now);
        await upsertOrderDigest(ctx, updatedOrder);
      }

      updatedCount += 1;
    }

    return { updatedCount };
  },
});
// Add call log to order
export const addCallLog = mutation({
  args: {
    orderId: v.id("orders"),
    outcome: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { order } = await assertOrderOwnership(ctx, args.orderId);

    const now = Date.now();
    const callEntry = {
      id: `call_${now}`,
      timestamp: now,
      outcome: args.outcome,
      notes: args.notes,
    };

    const callLog = clampCallLog([...(order.callLog || []), callEntry]);
    const timelineNote = `Call: ${args.outcome}${args.notes ? ` - ${args.notes}` : ""}`;
    const timeline = clampTimeline([
      ...(order.timeline || []),
      {
        status: "call_log",
        timestamp: now,
        note: timelineNote,
      },
    ]);

    await ctx.db.patch(args.orderId, {
      callAttempts: (order.callAttempts || 0) + 1,
      lastCallOutcome: args.outcome,
      lastCallAt: now,
      callLog,
      timeline,
      updatedAt: now,
    });

    const updatedOrder = await ctx.db.get(args.orderId);
    if (updatedOrder) {
      await appendCallEvent(ctx, updatedOrder, args.outcome, args.notes, now);
      await appendTimelineEvent(ctx, updatedOrder, "call_log", timelineNote, now);
      await upsertOrderDigest(ctx, updatedOrder);
    }

    return args.orderId;
  },
});
// Update tracking number
export const updateTrackingNumber = mutation({
  args: {
    orderId: v.id("orders"),
    trackingNumber: v.string(),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { order } = await assertOrderOwnership(ctx, args.orderId);

    const normalizedProvider = args.provider ?? order.deliveryProvider;
    const noTrackingChange =
      order.trackingNumber === args.trackingNumber &&
      order.deliveryProvider === normalizedProvider;

    if (noTrackingChange) {
      return args.orderId;
    }

    const now = Date.now();
    const timelineNote = `Tracking added: ${args.trackingNumber}`;
    const timeline = clampTimeline([
      ...(order.timeline || []),
      {
        status: "tracking",
        timestamp: now,
        note: timelineNote,
      },
    ]);

    await ctx.db.patch(args.orderId, {
      trackingNumber: args.trackingNumber,
      deliveryProvider: normalizedProvider,
      deliveryDispatchedAt: now,
      timeline,
      updatedAt: now,
    });

    const updatedOrder = await ctx.db.get(args.orderId);
    if (updatedOrder) {
      await appendTimelineEvent(ctx, updatedOrder, "tracking", timelineNote, now);
      await upsertOrderDigest(ctx, updatedOrder);
    }

    await ctx.runMutation(api.deliveryAnalytics.recordDeliveryEvent, {
      storeId: order.storeId as Id<"stores">,
      orderId: String(args.orderId),
      eventType: "dispatched",
      provider: normalizedProvider ?? "unknown",
      region: order.customerWilaya,
      trackingNumber: args.trackingNumber,
      source: "orders.updateTrackingNumber",
      createdAt: now,
    });

    return args.orderId;
  },
});
export const markOrderDispatchedFromDeliveryApi = mutation({
  args: {
    orderId: v.id("orders"),
    trackingNumber: v.string(),
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    const { order } = await assertOrderOwnership(ctx, args.orderId);

    if (order.trackingNumber === args.trackingNumber && order.deliveryProvider === args.provider) {
      return args.orderId;
    }

    const now = Date.now();
    const timelineNote = `Delivery dispatched with ${args.provider}. Tracking: ${args.trackingNumber}`;
    const timeline = clampTimeline([
      ...(order.timeline || []),
      {
        status: "tracking",
        timestamp: now,
        note: timelineNote,
      },
    ]);

    await ctx.db.patch(args.orderId, {
      trackingNumber: args.trackingNumber,
      deliveryProvider: args.provider,
      deliveryDispatchedAt: now,
      timeline,
      updatedAt: now,
    });

    const updatedOrder = await ctx.db.get(args.orderId);
    if (updatedOrder) {
      await appendTimelineEvent(ctx, updatedOrder, "tracking", timelineNote, now);
      await upsertOrderDigest(ctx, updatedOrder);
    }

    return args.orderId;
  },
});
// Update order notes
export const updateOrderNotes = mutation({
  args: {
    orderId: v.id("orders"),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const { order } = await assertOrderOwnership(ctx, args.orderId);

    if ((order.notes ?? "") === args.notes) {
      return args.orderId;
    }

    const now = Date.now();
    await ctx.db.patch(args.orderId, {
      notes: args.notes,
      updatedAt: now,
    });

    const updatedOrder = await ctx.db.get(args.orderId);
    if (updatedOrder) {
      await upsertOrderDigest(ctx, updatedOrder);
    }

    return args.orderId;
  },
});
// Upsert single admin note for an order.
// Clearing is supported by passing an empty/whitespace-only string.
export const upsertAdminNote = mutation({
  args: {
    orderId: v.id("orders"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const { identity, order } = await assertOrderOwnership(ctx, args.orderId);

    const now = Date.now();
    const text = args.text.trim();

    const isUnchanged =
      (order.adminNoteText ?? "") === text &&
      order.adminNoteUpdatedBy === identity.subject;

    if (isUnchanged) {
      return args.orderId;
    }

    const isClearing = text.length === 0;
    const timelineNote = isClearing ? "Admin note cleared" : "Admin note updated";
    const timeline = clampTimeline([
      ...(order.timeline || []),
      {
        status: "admin_note",
        timestamp: now,
        note: timelineNote,
      },
    ]);

    await ctx.db.patch(args.orderId, {
      adminNoteText: text,
      adminNoteUpdatedAt: now,
      adminNoteUpdatedBy: identity.subject,
      timeline,
      updatedAt: now,
    });

    const updatedOrder = await ctx.db.get(args.orderId);
    if (updatedOrder) {
      await appendTimelineEvent(ctx, updatedOrder, "admin_note", timelineNote, now);
      await upsertOrderDigest(ctx, updatedOrder);
    }

    return args.orderId;
  },
});
// One-time cleanup to remove legacy adminNotes history and any old timeline entries.
// Does NOT migrate existing note text.
export const purgeLegacyAdminNotesForStore = mutation({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    await assertStoreOwnership(ctx, args.storeId);

    const orders = await ctx.db
      .query("orders")
      .withIndex("storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    let updatedCount = 0;

    for (const order of orders) {
      const orderAny = order as unknown as Record<string, unknown>;
      const {
        _id,
        _creationTime: _ignoredCreationTime,
        adminNotes: _ignoredAdminNotes,
        ...rest
      } = orderAny as {
        _id: Id<"orders">;
        _creationTime: number;
        adminNotes?: unknown;
      } & Record<string, unknown>;

      const timelineRaw = rest.timeline;
      const timeline = Array.isArray(timelineRaw)
        ? timelineRaw.filter((entry) => {
            if (!entry || typeof entry !== "object") return true;
            const status = (entry as Record<string, unknown>).status;
            return status !== "admin_note";
          })
        : timelineRaw;

      const nextDoc: Record<string, unknown> = {
        ...rest,
        timeline,
        adminNoteText: "",
      };

      delete nextDoc.adminNoteUpdatedAt;
      delete nextDoc.adminNoteUpdatedBy;

      await ctx.db.replace(_id, nextDoc as Omit<Doc<"orders">, "_id" | "_creationTime">);
      updatedCount += 1;
    }

    return { updatedCount };
  },
});

// Hard delete order (permanent)
export const deleteOrder = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const { order } = await assertOrderOwnership(ctx, args.orderId);

    const digest = await ctx.db
      .query("orderDigests")
      .withIndex("orderId", (q) => q.eq("orderId", args.orderId))
      .first();

    if (digest) {
      await ctx.db.delete(digest._id);
    }

    const callEvents = await ctx.db
      .query("orderCallEvents")
      .withIndex("orderCreatedAt", (q) => q.eq("orderId", args.orderId))
      .collect();
    for (const event of callEvents) {
      await ctx.db.delete(event._id);
    }

    const timelineEvents = await ctx.db
      .query("orderTimelineEvents")
      .withIndex("orderCreatedAt", (q) => q.eq("orderId", args.orderId))
      .collect();
    for (const event of timelineEvents) {
      await ctx.db.delete(event._id);
    }

    await ctx.db.delete(args.orderId);

    // Best-effort store count correction.
    const store = await ctx.db.get(order.storeId as Id<"stores">);
    if (store && (store.orderCount ?? 0) > 0) {
      await ctx.db.patch(store._id, {
        orderCount: Math.max(0, (store.orderCount ?? 0) - 1),
        updatedAt: Date.now(),
      });
    }
  },
});

export const bulkDeleteOrders = mutation({
  args: { orderIds: v.array(v.id("orders")) },
  handler: async (ctx, args) => {
    let deletedCount = 0;

    for (const orderId of args.orderIds) {
      try {
        await assertOrderOwnership(ctx, orderId);
      } catch {
        continue;
      }

      const digest = await ctx.db
        .query("orderDigests")
        .withIndex("orderId", (q) => q.eq("orderId", orderId))
        .first();
      if (digest) {
        await ctx.db.delete(digest._id);
      }

      const callEvents = await ctx.db
        .query("orderCallEvents")
        .withIndex("orderCreatedAt", (q) => q.eq("orderId", orderId))
        .collect();
      for (const event of callEvents) {
        await ctx.db.delete(event._id);
      }

      const timelineEvents = await ctx.db
        .query("orderTimelineEvents")
        .withIndex("orderCreatedAt", (q) => q.eq("orderId", orderId))
        .collect();
      for (const event of timelineEvents) {
        await ctx.db.delete(event._id);
      }

      await ctx.db.delete(orderId);
      deletedCount += 1;
    }

    return { deletedCount };
  },
});
// Update order product quantity
export const updateOrderProductQuantity = mutation({
  args: {
    orderId: v.id("orders"),
    productIndex: v.number(),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const { order } = await assertOrderOwnership(ctx, args.orderId);

    const products = [...order.products];
    if (!products[args.productIndex]) {
      return;
    }

    if (products[args.productIndex].quantity === args.quantity) {
      return;
    }

    products[args.productIndex] = {
      ...products[args.productIndex],
      quantity: args.quantity,
    };

    const subtotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const total = subtotal + (order.deliveryCost || 0);

    await ctx.db.patch(args.orderId, {
      products,
      subtotal,
      total,
      updatedAt: Date.now(),
    });

    const updatedOrder = await ctx.db.get(args.orderId);
    if (updatedOrder) {
      await upsertOrderDigest(ctx, updatedOrder);
    }
  },
});
// Remove product from order
export const removeOrderProduct = mutation({
  args: {
    orderId: v.id("orders"),
    productIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const { order } = await assertOrderOwnership(ctx, args.orderId);

    type OrderProduct = { price: number; quantity: number };

    const products = order.products.filter((_: OrderProduct, i: number) => i !== args.productIndex);
    if (products.length === order.products.length) {
      return;
    }

    const subtotal = products.reduce((sum: number, p: OrderProduct) => sum + p.price * p.quantity, 0);
    const total = subtotal + (order.deliveryCost || 0);

    await ctx.db.patch(args.orderId, {
      products,
      subtotal,
      total,
      updatedAt: Date.now(),
    });

    const updatedOrder = await ctx.db.get(args.orderId);
    if (updatedOrder) {
      await upsertOrderDigest(ctx, updatedOrder);
    }
  },
});
// Add product to order
export const addProductToOrder = mutation({
  args: {
    orderId: v.id("orders"),
    product: v.object({
      productId: v.string(),
      name: v.string(),
      image: v.optional(v.string()),
      price: v.number(),
      quantity: v.number(),
      variant: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const { order } = await assertOrderOwnership(ctx, args.orderId);

    const products = [...order.products, args.product];
    const subtotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const total = subtotal + (order.deliveryCost || 0);

    await ctx.db.patch(args.orderId, {
      products,
      subtotal,
      total,
      updatedAt: Date.now(),
    });

    const updatedOrder = await ctx.db.get(args.orderId);
    if (updatedOrder) {
      await upsertOrderDigest(ctx, updatedOrder);
    }
  },
});
// Replace product in order (at specific index)
export const replaceOrderProduct = mutation({
  args: {
    orderId: v.id("orders"),
    productIndex: v.number(),
    product: v.object({
      productId: v.string(),
      name: v.string(),
      image: v.optional(v.string()),
      price: v.number(),
      quantity: v.number(),
      variant: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const { order } = await assertOrderOwnership(ctx, args.orderId);

    const products = [...order.products];
    if (!products[args.productIndex]) {
      return;
    }

    const current = products[args.productIndex];
    if (
      current.productId === args.product.productId &&
      current.name === args.product.name &&
      current.image === args.product.image &&
      current.price === args.product.price &&
      current.quantity === args.product.quantity &&
      current.variant === args.product.variant
    ) {
      return;
    }

    products[args.productIndex] = args.product;

    const subtotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const total = subtotal + (order.deliveryCost || 0);

    await ctx.db.patch(args.orderId, {
      products,
      subtotal,
      total,
      updatedAt: Date.now(),
    });

    const updatedOrder = await ctx.db.get(args.orderId);
    if (updatedOrder) {
      await upsertOrderDigest(ctx, updatedOrder);
    }
  },
});

