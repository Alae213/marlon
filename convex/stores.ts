import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get store by slug
export const getStoreBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const store = await ctx.db
      .query("stores")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();
    return store;
  },
});

// Get all stores for a user
export const getUserStores = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const stores = await ctx.db
      .query("stores")
      .withIndex("ownerId", (q) => q.eq("ownerId", args.userId))
      .order("desc")
      .collect();
    return stores;
  },
});

// Real-time subscription to user stores (for dashboard)
export const subscribeToUserStores = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.userId || args.userId === undefined) {
      // If no userId provided, return all stores (for admin dashboard)
      const stores = await ctx.db.query("stores").order("desc").collect();
      return stores;
    }
    
    const stores = await ctx.db
      .query("stores")
      .withIndex("ownerId", (q) => q.eq("ownerId", args.userId as string))
      .order("desc")
      .collect();
    return stores;
  },
});

// Get a single store by ID
export const getStore = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    return store;
  },
});

// Check if slug is available
export const isSlugAvailable = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const existingStore = await ctx.db
      .query("stores")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();
    return !existingStore;
  },
});

// Generate unique slug suggestions
export const generateSlugSuggestions = query({
  args: { baseSlug: v.string() },
  handler: async (ctx, args) => {
    const suggestions: string[] = [];
    const baseSlug = args.baseSlug.toLowerCase().replace(/[^a-z0-9]/g, "-");
    
    // Check base slug
    const existing = await ctx.db
      .query("stores")
      .withIndex("slug", (q) => q.eq("slug", baseSlug))
      .first();
    
    if (!existing) {
      suggestions.push(baseSlug);
    }
    
    // Generate 5 suggestions
    for (let i = 1; i <= 5; i++) {
      const slug = `${baseSlug}-${i}`;
      const exists = await ctx.db
        .query("stores")
        .withIndex("slug", (q) => q.eq("slug", slug))
        .first();
      
      if (!exists) {
        suggestions.push(slug);
      }
      
      if (suggestions.length >= 3) break;
    }
    
    return suggestions;
  },
});

// Create a new store
export const createStore = mutation({
  args: {
    ownerId: v.string(),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    phone: v.optional(v.string()),
    wilaya: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if slug already exists
    const existing = await ctx.db
      .query("stores")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();
    
    if (existing) {
      throw new Error("Slug already exists");
    }
    
    const storeId = await ctx.db.insert("stores", {
      ownerId: args.ownerId,
      name: args.name,
      slug: args.slug,
      description: args.description,
      phone: args.phone,
      wilaya: args.wilaya,
      status: "active",
      subscription: "trial",
      orderCount: 0,
      trialEndsAt: now + 30 * 24 * 60 * 60 * 1000, // 30 days
      createdAt: now,
      updatedAt: now,
    });
    
    return storeId;
  },
});

// Update store
export const updateStore = mutation({
  args: {
    storeId: v.id("stores"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    logo: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    wilaya: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store) {
      throw new Error("Store not found");
    }
    
    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };
    
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.logo !== undefined) updates.logo = args.logo;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.address !== undefined) updates.address = args.address;
    if (args.wilaya !== undefined) updates.wilaya = args.wilaya;
    
    await ctx.db.patch(args.storeId, updates);
    return args.storeId;
  },
});

// Update store subscription
export const updateSubscription = mutation({
  args: {
    storeId: v.id("stores"),
    subscription: v.string(),
    paidUntil: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store) {
      throw new Error("Store not found");
    }
    
    await ctx.db.patch(args.storeId, {
      subscription: args.subscription,
      paidUntil: args.paidUntil,
      status: args.subscription === "active" ? "active" : store.status,
      updatedAt: Date.now(),
    });
    
    return args.storeId;
  },
});

// Get delivery pricing for a store
export const getDeliveryPricing = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const pricing = await ctx.db
      .query("deliveryPricing")
      .withIndex("storeId", (q) => q.eq("storeId", args.storeId))
      .collect();
    return pricing;
  },
});

// Update delivery pricing
export const updateDeliveryPricing = mutation({
  args: {
    storeId: v.id("stores"),
    wilaya: v.string(),
    homeDelivery: v.optional(v.number()),
    officeDelivery: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Find existing pricing for this wilaya
    const existing = await ctx.db
      .query("deliveryPricing")
      .withIndex("wilaya", (q) =>
        q.eq("storeId", args.storeId).eq("wilaya", args.wilaya)
      )
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        homeDelivery: args.homeDelivery,
        officeDelivery: args.officeDelivery,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("deliveryPricing", {
        storeId: args.storeId,
        wilaya: args.wilaya,
        homeDelivery: args.homeDelivery,
        officeDelivery: args.officeDelivery,
        updatedAt: Date.now(),
      });
    }
  },
});

// Get delivery cost for a specific wilaya
export const getDeliveryCost = query({
  args: { storeId: v.id("stores"), wilaya: v.string() },
  handler: async (ctx, args) => {
    const pricing = await ctx.db
      .query("deliveryPricing")
      .withIndex("wilaya", (q) =>
        q.eq("storeId", args.storeId).eq("wilaya", args.wilaya)
      )
      .first();
    
    return pricing || null;
  },
});

// Constants for billing
const TRIAL_WINDOW_DAYS = 30;
const TRIAL_WINDOW_MS = TRIAL_WINDOW_DAYS * 24 * 60 * 60 * 1000;
const MAX_ORDERS_BEFORE_LOCK = 50;
const LOCKED_ORDER_RETENTION_DAYS = 20;
const LOCKED_ORDER_RETENTION_MS = LOCKED_ORDER_RETENTION_DAYS * 24 * 60 * 60 * 1000;

// Handle subscription expiry and order counting on new order
// Per PRD §Billing State Machine
export const handleNewOrderSubscription = mutation({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store) throw new Error("Store not found");

    const now = Date.now();
    const subscription = store.subscription || "trial";
    const paidUntil = store.paidUntil;
    const firstOrderAt = store.firstOrderAt;
    const orderCount = store.orderCount || 0;

    // Check if subscription has expired
    const hasExpired = paidUntil && paidUntil < now;

    if (hasExpired && subscription === "active") {
      // Expiry detected - revert to trial
      // Reset order count to 1 (the current order)
      // Start new 30-day window
      await ctx.db.patch(args.storeId, {
        subscription: "trial",
        orderCount: 1,
        firstOrderAt: now,
        paidUntil: undefined,
        lockedAt: undefined,
        updatedAt: now,
      });
      return { action: "reverted_to_trial", newStatus: "trial" };
    }

    // If already in trial, check if we need to increment order count
    if (subscription === "trial" && firstOrderAt) {
      let newOrderCount = orderCount + 1;

      // Check if trial window has expired (30 days passed)
      const trialWindowExpired = (now - firstOrderAt) > TRIAL_WINDOW_MS;

      if (trialWindowExpired) {
        // Start new 30-day window with this order as count = 1
        newOrderCount = 1;
      }

      // Check if order count exceeds 50 - lock the store
      let newSubscription = subscription;
      let lockedAt = store.lockedAt;

      if (newOrderCount > MAX_ORDERS_BEFORE_LOCK) {
        newSubscription = "locked";
        lockedAt = now;
      }

      await ctx.db.patch(args.storeId, {
        orderCount: newOrderCount,
        firstOrderAt: trialWindowExpired ? now : firstOrderAt,
        subscription: newSubscription,
        lockedAt,
        updatedAt: now,
      });

      return { 
        action: newSubscription === "locked" ? "locked" : "trial_updated", 
        newStatus: newSubscription,
        orderCount: newOrderCount 
      };
    }

    // For active subscriptions, increment order count
    if (subscription === "active") {
      await ctx.db.patch(args.storeId, {
        orderCount: orderCount + 1,
        updatedAt: now,
      });
      return { action: "active_order", newStatus: "active", orderCount: orderCount + 1 };
    }

    return { action: "no_change", newStatus: subscription, orderCount };
  },
});

// Clean up orders from locked stores older than 20 days
// Per PRD §Billing Edge Case 3
// This should be run as a scheduled function (cron)
export const cleanupLockedStoreOrders = mutation({
  args: {},
  handler: async (ctx, args) => {
    const now = Date.now();
    const cutoffTime = now - LOCKED_ORDER_RETENTION_MS;

    // Find all locked stores
    const lockedStores = await ctx.db
      .query("stores")
      .filter((q) => q.eq(q.field("subscription"), "locked"))
      .collect();

    let totalDeleted = 0;

    for (const store of lockedStores) {
      if (!store.lockedAt) continue;

      // Check if locked more than 20 days ago
      if (store.lockedAt < cutoffTime) {
        // Delete orders older than the lockedAt time
        const ordersToDelete = await ctx.db
          .query("orders")
          .withIndex("storeId", (q) => q.eq("storeId", store._id))
          .filter((q) => q.lt(q.field("createdAt"), store.lockedAt!))
          .collect();

        for (const order of ordersToDelete) {
          await ctx.db.delete(order._id);
          totalDeleted++;
        }
      }
    }

    return { deletedCount: totalDeleted };
  },
});

// Get store billing status
export const getStoreBillingStatus = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store) return null;

    const now = Date.now();
    const subscription = store.subscription || "trial";
    const firstOrderAt = store.firstOrderAt;
    const orderCount = store.orderCount || 0;

    let daysRemaining = 0;
    let isTrialWindowExpired = false;

    if (firstOrderAt) {
      const trialEndTime = firstOrderAt + TRIAL_WINDOW_MS;
      daysRemaining = Math.max(0, Math.ceil((trialEndTime - now) / (24 * 60 * 60 * 1000)));
      isTrialWindowExpired = now > trialEndTime;
    }

    const ordersRemaining = Math.max(0, MAX_ORDERS_BEFORE_LOCK - orderCount);

    return {
      subscription,
      orderCount,
      firstOrderAt,
      paidUntil: store.paidUntil,
      lockedAt: store.lockedAt,
      daysRemaining,
      ordersRemaining,
      isTrialWindowExpired,
      isLocked: subscription === "locked",
    };
  },
});
