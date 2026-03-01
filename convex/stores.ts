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
