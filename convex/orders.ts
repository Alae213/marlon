import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all orders for a store
export const getOrders = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("storeId", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .collect();
    return orders;
  },
});

// Real-time subscription to store orders
export const subscribeToStoreOrders = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
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
    const order = await ctx.db.get(args.orderId);
    return order;
  },
});

// Get orders by status
export const getOrdersByStatus = query({
  args: { storeId: v.id("stores"), status: v.string() },
  handler: async (ctx, args) => {
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
    const orders = await ctx.db
      .query("orders")
      .withIndex("storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.eq(q.field("orderNumber"), args.orderNumber))
      .first();
    return orders;
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
    const store = await ctx.db.get(args.storeId);
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
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    const now = Date.now();
    const timeline = order.timeline || [];
    timeline.push({
      status: args.status,
      timestamp: now,
      note: args.note || `تم تغيير الحالة إلى ${args.status}`,
    });

    await ctx.db.patch(args.orderId, {
      status: args.status,
      timeline,
      updatedAt: now,
    });

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
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    const now = Date.now();
    const timeline = order.timeline || [];
    timeline.push({
      status: "call_log",
      timestamp: now,
      note: `مكالمة: ${args.outcome}${args.notes ? ` - ${args.notes}` : ""}`,
    });

    await ctx.db.patch(args.orderId, {
      callAttempts: (order.callAttempts || 0) + 1,
      lastCallOutcome: args.outcome,
      lastCallAt: now,
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
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    const now = Date.now();
    const timeline = order.timeline || [];
    timeline.push({
      status: "tracking",
      timestamp: now,
      note: `تم إضافة رقم التتبع: ${args.trackingNumber}`,
    });

    await ctx.db.patch(args.orderId, {
      trackingNumber: args.trackingNumber,
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
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    await ctx.db.patch(args.orderId, {
      notes: args.notes,
      updatedAt: Date.now(),
    });

    return args.orderId;
  },
});

// Add admin note to order
export const addAdminNote = mutation({
  args: {
    orderId: v.id("orders"),
    text: v.string(),
    merchantId: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    const now = Date.now();
    const adminNotes = order.adminNotes || [];
    adminNotes.push({
      id: `note_${now}`,
      text: args.text,
      timestamp: now,
      merchantId: args.merchantId,
    });

    const timeline = order.timeline || [];
    timeline.push({
      status: "admin_note",
      timestamp: now,
      note: `إضافة ملاحظة: ${args.text.substring(0, 30)}${args.text.length > 30 ? "..." : ""}`,
    });

    await ctx.db.patch(args.orderId, {
      adminNotes,
      timeline,
      updatedAt: now,
    });

    return args.orderId;
  },
});
