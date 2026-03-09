import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

// Helper to verify product/store ownership via product
async function assertProductOwnership(ctx: { db: any; auth: any }, productId: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  
  const product = await ctx.db.get(productId);
  if (!product) {
    throw new Error("Product not found");
  }
  
  // Get the store and verify ownership
  const store = await ctx.db.get(product.storeId);
  if (!store || store.ownerId !== identity.subject) {
    throw new Error("Forbidden");
  }
  
  return { identity, product, store };
}

// Helper to verify store ownership
async function assertStoreOwnership(ctx: { db: any; auth: any }, storeId: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  
  const store = await ctx.db.get(storeId);
  if (!store || store.ownerId !== identity.subject) {
    throw new Error("Forbidden");
  }
  
  return { identity, store };
}

// Helper to resolve product images
async function resolveProductImages(ctx: any, product: Doc<"products">) {
  if (!product.images || product.images.length === 0) return product;
  
  const resolvedImages = await Promise.all(
    product.images.map(async (img) => {
      if (img.startsWith("http")) return img;
      try {
        return await ctx.storage.getUrl(img);
      } catch (e) {
        return null;
      }
    })
  );
  
  return {
    ...product,
    images: resolvedImages.filter((img): img is string => img !== null),
  };
}

// Get all products for a store
export const getProducts = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.neq(q.field("isArchived"), true))
      .order("asc")
      .collect();
    
    return Promise.all(products.map((p) => resolveProductImages(ctx, p)));
  },
});

// Get all products including archived
export const getAllProducts = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("storeId", (q) => q.eq("storeId", args.storeId))
      .order("asc")
      .collect();
    
    return Promise.all(products.map((p) => resolveProductImages(ctx, p)));
  },
});

// Get a single product by ID
export const getProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return null;
    return resolveProductImages(ctx, product);
  },
});

// Get products by category
export const getProductsByCategory = query({
  args: { storeId: v.id("stores"), category: v.string() },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("category", (q) =>
        q.eq("storeId", args.storeId).eq("category", args.category)
      )
      .filter((q) => q.neq(q.field("isArchived"), true))
      .collect();
    
    return Promise.all(products.map((p) => resolveProductImages(ctx, p)));
  },
});

// Search products
export const searchProducts = query({
  args: { storeId: v.id("stores"), searchQuery: v.string() },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.neq(q.field("isArchived"), true))
      .collect();
    
    const queryStr = args.searchQuery.toLowerCase();
    const filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(queryStr) ||
        p.description?.toLowerCase().includes(queryStr)
    );

    return Promise.all(filtered.map((p) => resolveProductImages(ctx, p)));
  },
});

// Create a new product
export const createProduct = mutation({
  args: {
    storeId: v.id("stores"),
    name: v.string(),
    description: v.optional(v.string()),
    basePrice: v.number(),
    oldPrice: v.optional(v.number()),
    images: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    variants: v.optional(
      v.array(
        v.object({
          name: v.string(),
          options: v.array(
            v.object({
              name: v.string(),
              priceModifier: v.optional(v.number()),
            })
          ),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    // Verify ownership of the store
    await assertStoreOwnership(ctx, args.storeId);
    
    const now = Date.now();
    
    // Get all products to find the actual max sortOrder
    const products = await ctx.db
      .query("products")
      .withIndex("storeId", (q) => q.eq("storeId", args.storeId))
      .collect();
    
    const sortOrder = products.length > 0
      ? Math.max(...products.map(p => p.sortOrder ?? 0)) + 1
      : 0;
    
    const productId = await ctx.db.insert("products", {
      storeId: args.storeId,
      name: args.name,
      description: args.description,
      basePrice: args.basePrice,
      oldPrice: args.oldPrice,
      images: args.images || [],
      category: args.category,
      variants: args.variants,
      isArchived: false,
      sortOrder,
      createdAt: now,
      updatedAt: now,
    });
    
    return productId;
  },
});

// Update a product
export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    basePrice: v.optional(v.number()),
    oldPrice: v.optional(v.number()),
    images: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    variants: v.optional(
      v.array(
        v.object({
          name: v.string(),
          options: v.array(
            v.object({
              name: v.string(),
              priceModifier: v.optional(v.number()),
            })
          ),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    await assertProductOwnership(ctx, args.productId);
    
    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };
    
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.basePrice !== undefined) updates.basePrice = args.basePrice;
    if (args.oldPrice !== undefined) updates.oldPrice = args.oldPrice;
    if (args.images !== undefined) updates.images = args.images;
    if (args.category !== undefined) updates.category = args.category;
    if (args.variants !== undefined) updates.variants = args.variants;
    
    await ctx.db.patch(args.productId, updates);
    return args.productId;
  },
});

// Archive a product (soft delete)
export const archiveProduct = mutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    await assertProductOwnership(ctx, args.productId);
    
    await ctx.db.patch(args.productId, {
      isArchived: true,
      updatedAt: Date.now(),
    });
    
    return args.productId;
  },
});

// Unarchive a product
export const unarchiveProduct = mutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    await assertProductOwnership(ctx, args.productId);
    
    await ctx.db.patch(args.productId, {
      isArchived: false,
      updatedAt: Date.now(),
    });
    
    return args.productId;
  },
});

// Reorder products
export const reorderProducts = mutation({
  args: {
    storeId: v.id("stores"),
    productIds: v.array(v.id("products")),
  },
  handler: async (ctx, args) => {
    // Verify ownership of the store
    await assertStoreOwnership(ctx, args.storeId);
    for (let i = 0; i < args.productIds.length; i++) {
      await ctx.db.patch(args.productIds[i], {
        sortOrder: i,
        updatedAt: Date.now(),
      });
    }
    
    return args.productIds.length;
  },
});

// Get product categories for a store
export const getCategories = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("storeId", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.neq(q.field("isArchived"), true))
      .collect();
    
    const categories = new Set<string>();
    products.forEach((p) => {
      if (p.category) {
        categories.add(p.category);
      }
    });
    
    return Array.from(categories).sort();
  },
});
