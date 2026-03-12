import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Helper to verify store ownership via order
async function assertOrderOwnership(ctx: { db: any; auth: any }, orderId: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized: No user identity found. Please ensure you are signed in.");
  }
  
  const order = await ctx.db.get(orderId);
  if (!order) {
    throw new Error("Order not found");
  }
  
  // Get the store and verify ownership
  const store = await ctx.db.get(order.storeId);
  if (!store || store.ownerId !== identity.subject) {
    throw new Error("Forbidden: You do not have permission to access this store's orders.");
  }
  
  return { identity, order, store };
}

// Helper to verify store ownership directly
async function assertStoreOwnership(ctx: { db: any; auth: any }, storeId: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized: No user identity found. Please ensure you are signed in.");
  }
  
  const store = await ctx.db.get(storeId);
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

// Add admin note to order
export const addAdminNote = mutation({
  args: {
    orderId: v.id("orders"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const { identity, order } = await assertOrderOwnership(ctx, args.orderId);

    const now = Date.now();
    // Use immutable spread and crypto.randomUUID() for unique ID
    const adminNotes = [...(order.adminNotes || []), {
      id: crypto.randomUUID(),
      text: args.text,
      timestamp: now,
      merchantId: identity.subject,
    }];

    const timeline = [...(order.timeline || []), {
      status: "admin_note",
      timestamp: now,
      note: `إضافة ملاحظة: ${args.text.substring(0, 30)}${args.text.length > 30 ? "..." : ""}`,
    }];

    await ctx.db.patch(args.orderId, {
      adminNotes,
      timeline,
      updatedAt: now,
    });

    return args.orderId;
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
    
    const products = order.products.filter((_: any, i: number) => i !== args.productIndex);
    
    // Recalculate totals
    const subtotal = products.reduce((sum: number, p: any) => sum + (p.price * p.quantity), 0);
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
