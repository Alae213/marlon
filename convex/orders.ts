import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id, Doc } from "./_generated/dataModel";
import { api } from "./_generated/api";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbWithGet = { db: { get: (id: any) => Promise<any> } };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AuthWithIdentity = { auth: { getUserIdentity: () => Promise<any> } };
type CtxWithDb = DbWithGet & AuthWithIdentity;

// Helper to verify store ownership via order
async function assertOrderOwnership(ctx: CtxWithDb, orderId: Id<"orders">) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized: No user identity found. Please ensure you are signed in.");
  }
  
  const order = await ctx.db.get(orderId) as Doc<"orders"> | null;
  if (!order) {
    throw new Error("Order not found");
  }
  
  // Get the store and verify ownership
  const store = await ctx.db.get(order.storeId as Id<"stores">) as Doc<"stores"> | null;
  if (!store || store.ownerId !== identity.subject) {
    throw new Error("Forbidden: You do not have permission to access this store's orders.");
  }
  
  return { identity, order, store };
}

// Helper to verify store ownership directly
async function assertStoreOwnership(ctx: CtxWithDb, storeId: Id<"stores">) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized: No user identity found. Please ensure you are signed in.");
  }
  
  const store = await ctx.db.get(storeId) as Doc<"stores"> | null;
  if (!store) {
    throw new Error("Store not found");
  }
  
  if (store.ownerId !== identity.subject) {
    throw new Error("Forbidden: You do not have permission to access this store.");
  }
  
  return { identity, store };
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
    return orders;
  },
});

// Get a single order by ID
export const getOrder = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const { order } = await assertOrderOwnership(ctx, args.orderId);
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
    return orders;
  },
});

// Get count of new orders
export const getNewOrdersCount = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    await assertStoreOwnership(ctx, args.storeId);

    const orders = await ctx.db
      .query("orders")
      .withIndex("status", (q) =>
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
    // Use orderNumber index for efficiency, then filter by storeId
    const order = await ctx.db
      .query("orders")
      .withIndex("orderNumber", (q) => q.eq("orderNumber", args.orderNumber))
      .filter((q) => q.eq(q.field("storeId"), args.storeId))
      .first();
    return order;
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }
    
    const store = await ctx.db.get(args.storeId);
    if (!store || store.ownerId !== identity.subject) {
      throw new Error("Forbidden");
    }
    
    const now = Date.now();
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
      deliveryType: args.deliveryType || "home",
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
    if (store) {
      await ctx.db.patch(args.storeId, {
        orderCount: (store.orderCount || 0) + 1,
        updatedAt: now,
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

    const now = Date.now();
    // Use immutable spread instead of mutating array
    const timeline = [...(order?.timeline || []), {
      status: args.status,
      timestamp: now,
      note: args.note || `تم تغيير الحالة إلى ${args.status}`,
    }];

    await ctx.db.patch(args.orderId, {
      status: args.status,
      timeline,
      updatedAt: now,
    });

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
    
    // Add to callLog array
    const callLog = [...(order.callLog || []), {
      id: `call_${now}`,
      timestamp: now,
      outcome: args.outcome,
      notes: args.notes,
    }];

    // Add to timeline
    const timeline = [...(order.timeline || []), {
      status: "call_log",
      timestamp: now,
      note: `مكالمة: ${args.outcome}${args.notes ? ` - ${args.notes}` : ""}`,
    }];

    await ctx.db.patch(args.orderId, {
      callAttempts: (order.callAttempts || 0) + 1,
      lastCallOutcome: args.outcome,
      lastCallAt: now,
      callLog,
      timeline,
      updatedAt: now,
    });

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

    const now = Date.now();
    // Use immutable spread instead of mutating array
    const timeline = [...(order.timeline || []), {
      status: "tracking",
      timestamp: now,
      note: `تم إضافة رقم التتبع: ${args.trackingNumber}`,
    }];

    await ctx.db.patch(args.orderId, {
      trackingNumber: args.trackingNumber,
      deliveryProvider: args.provider,
      deliveryDispatchedAt: now,
      timeline,
      updatedAt: now,
    });

    await ctx.runMutation(api.deliveryAnalytics.recordDeliveryEvent, {
      storeId: order.storeId as Id<"stores">,
      orderId: String(args.orderId),
      eventType: "dispatched",
      provider: args.provider ?? order.deliveryProvider ?? "unknown",
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

    const now = Date.now();
    const timeline = [...(order.timeline || []), {
      status: "tracking",
      timestamp: now,
      note: `Delivery dispatched with ${args.provider}. Tracking: ${args.trackingNumber}`,
    }];

    await ctx.db.patch(args.orderId, {
      trackingNumber: args.trackingNumber,
      deliveryProvider: args.provider,
      deliveryDispatchedAt: now,
      timeline,
      updatedAt: now,
    });

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
    await assertOrderOwnership(ctx, args.orderId);

    await ctx.db.patch(args.orderId, {
      notes: args.notes,
      updatedAt: Date.now(),
    });

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
    const isClearing = text.length === 0;

    const timeline = [...(order.timeline || []), {
      status: "admin_note",
      timestamp: now,
      note: isClearing ? "تم مسح ملاحظة الإدارة" : "تم تحديث ملاحظة الإدارة",
    }];

    await ctx.db.patch(args.orderId, {
      adminNoteText: text,
      adminNoteUpdatedAt: now,
      adminNoteUpdatedBy: identity.subject,
      timeline,
      updatedAt: now,
    });

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
      const { _id, _creationTime, adminNotes: _adminNotes, ...rest } = orderAny as {
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
    // Use the helper to verify ownership
    await assertOrderOwnership(ctx, args.orderId);
    
    await ctx.db.delete(args.orderId);
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
    if (products[args.productIndex]) {
      products[args.productIndex] = {
        ...products[args.productIndex],
        quantity: args.quantity,
      };
      
      // Recalculate totals
      const subtotal = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
      const total = subtotal + (order.deliveryCost || 0);
      
      await ctx.db.patch(args.orderId, {
        products,
        subtotal,
        total,
        updatedAt: Date.now(),
      });
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
    
    // Type for product in order
    type OrderProduct = { price: number; quantity: number };
    
    const products = order.products.filter((_: OrderProduct, i: number) => i !== args.productIndex);
    
    // Recalculate totals
    const subtotal = products.reduce((sum: number, p: OrderProduct) => sum + (p.price * p.quantity), 0);
    const total = subtotal + (order.deliveryCost || 0);
    
    await ctx.db.patch(args.orderId, {
      products,
      subtotal,
      total,
      updatedAt: Date.now(),
    });
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
    
    // Recalculate totals
    const subtotal = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const total = subtotal + (order.deliveryCost || 0);
    
    await ctx.db.patch(args.orderId, {
      products,
      subtotal,
      total,
      updatedAt: Date.now(),
    });
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
    if (products[args.productIndex]) {
      products[args.productIndex] = args.product;
      
      // Recalculate totals
      const subtotal = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
      const total = subtotal + (order.deliveryCost || 0);
      
      await ctx.db.patch(args.orderId, {
        products,
        subtotal,
        total,
        updatedAt: Date.now(),
      });
    }
  },
});
