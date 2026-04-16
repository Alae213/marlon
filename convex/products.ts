import { query, mutation, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id, Doc } from "./_generated/dataModel";
import { upsertProductDigest } from "./performanceHelpers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbWithGet = { db: { get: (id: any) => Promise<any> } };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AuthWithIdentity = { auth: { getUserIdentity: () => Promise<any> } };
type CtxWithDb = DbWithGet & AuthWithIdentity;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StorageCtx = { storage: { getUrl: (id: any) => Promise<string | null> } };

// Helper to verify product/store ownership via product
async function assertProductOwnership(ctx: CtxWithDb, productId: Id<"products">) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  
  const product = await ctx.db.get(productId) as Doc<"products"> | null;
  if (!product) {
    throw new Error("Product not found");
  }
  
  // Get the store and verify ownership
  const store = await ctx.db.get(product.storeId as Id<"stores">) as Doc<"stores"> | null;
  if (!store || store.ownerId !== identity.subject) {
    throw new Error("Forbidden");
  }
  
  return { identity, product, store };
}

// Helper to verify store ownership
async function assertStoreOwnership(ctx: CtxWithDb, storeId: Id<"stores">) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  
  const store = await ctx.db.get(storeId) as Doc<"stores"> | null;
  if (!store || store.ownerId !== identity.subject) {
    throw new Error("Forbidden");
  }
  
  return { identity, store };
}

function isAbsoluteUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

// Helper to resolve product images
async function resolveProductImages(ctx: StorageCtx, product: Doc<"products">) {
  if (!product.images || product.images.length === 0) return product;
  
  const resolvedImages = await Promise.all(
    product.images.map(async (img) => {
      if (img.startsWith("http")) return img;
      try {
        return await ctx.storage.getUrl(img);
      } catch {
        return null;
      }
    })
  );
  
  return {
    ...product,
    images: resolvedImages.filter((img): img is string => img !== null),
  };
}

// Ensure product images are persisted as direct URLs.
async function normalizeProductImageUrls(ctx: StorageCtx, images?: string[]) {
  if (!images || images.length === 0) return [];

  const resolvedImages = await Promise.all(
    images.map(async (img) => {
      if (isAbsoluteUrl(img)) return img;
      try {
        return await ctx.storage.getUrl(img);
      } catch {
        return null;
      }
    })
  );

  return resolvedImages.filter((img): img is string => img !== null);
}

async function queryActiveProducts(
  ctx: QueryCtx,
  storeId: Id<"stores">
) {
  const active = await ctx.db
    .query("products")
    .withIndex("storeArchivedSort", (q) =>
      q.eq("storeId", storeId).eq("isArchived", false)
    )
    .collect();

  const legacyUnset = await ctx.db
    .query("products")
    .withIndex("storeArchivedSort", (q) =>
      q.eq("storeId", storeId).eq("isArchived", undefined)
    )
    .collect();

  return [...active, ...legacyUnset];
}

// Get all products for a store
export const getProducts = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const products = await queryActiveProducts(ctx, args.storeId);
    return products.sort((a, b) => {
      const aSort = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const bSort = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
      if (aSort !== bSort) return aSort - bSort;
      return a._creationTime - b._creationTime;
    });
  },
});

export const getProductDigests = query({
  args: {
    storeId: v.id("stores"),
    includeArchived: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(500, Math.max(1, args.limit ?? 200));
    if (args.includeArchived) {
      return await ctx.db
        .query("productDigests")
        .withIndex("storeUpdatedAt", (q) => q.eq("storeId", args.storeId))
        .order("desc")
        .take(limit);
    }

    const active = await ctx.db
      .query("productDigests")
      .withIndex("storeArchivedSort", (q) =>
        q.eq("storeId", args.storeId).eq("isArchived", false)
      )
      .take(limit);
    return active;
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
    return products;
  },
});

// Get a single product by ID
export const getProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return null;
    return product;
  },
});

// Get products by category
export const getProductsByCategory = query({
  args: { storeId: v.id("stores"), category: v.string() },
  handler: async (ctx, args) => {
    const active = await ctx.db
      .query("products")
      .withIndex("storeCategoryArchivedSort", (q) =>
        q.eq("storeId", args.storeId).eq("category", args.category).eq("isArchived", false)
      )
      .collect();
    const legacyUnset = await ctx.db
      .query("products")
      .withIndex("storeCategoryArchivedSort", (q) =>
        q.eq("storeId", args.storeId).eq("category", args.category).eq("isArchived", undefined)
      )
      .collect();

    return [...active, ...legacyUnset];
  },
});

// Search products
export const searchProducts = query({
  args: { storeId: v.id("stores"), searchQuery: v.string() },
  handler: async (ctx, args) => {
    const products = await queryActiveProducts(ctx, args.storeId);
    
    const queryStr = args.searchQuery.toLowerCase();
    const filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(queryStr) ||
        p.description?.toLowerCase().includes(queryStr)
    );

    return filtered;
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
    const normalizedImages = await normalizeProductImageUrls(ctx, args.images);
    
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
      images: normalizedImages,
      category: args.category,
      variants: args.variants,
      isArchived: false,
      sortOrder,
      createdAt: now,
      updatedAt: now,
    });

    const createdProduct = await ctx.db.get(productId);
    if (createdProduct) {
      await upsertProductDigest(ctx, createdProduct);
    }
    
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
    const { product } = await assertProductOwnership(ctx, args.productId);
    
    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };
    
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.basePrice !== undefined) updates.basePrice = args.basePrice;
    if (args.oldPrice !== undefined) updates.oldPrice = args.oldPrice;
    if (args.category !== undefined) updates.category = args.category;
    if (args.variants !== undefined) updates.variants = args.variants;
    
    const nextImages = args.images !== undefined
      ? await normalizeProductImageUrls(ctx, args.images)
      : undefined;
    if (nextImages !== undefined) {
      updates.images = nextImages;
    }

    const hasChanges =
      (args.name !== undefined && args.name !== product.name) ||
      (args.description !== undefined && args.description !== product.description) ||
      (args.basePrice !== undefined && args.basePrice !== product.basePrice) ||
      (args.oldPrice !== undefined && args.oldPrice !== product.oldPrice) ||
      (args.category !== undefined && args.category !== product.category) ||
      (args.variants !== undefined) ||
      (nextImages !== undefined &&
        (nextImages.length !== (product.images ?? []).length ||
          nextImages.some((img, i) => img !== (product.images ?? [])[i])));

    if (!hasChanges) {
      return args.productId;
    }

    await ctx.db.patch(args.productId, updates);
    const updatedProduct = await ctx.db.get(args.productId);
    if (updatedProduct) {
      await upsertProductDigest(ctx, updatedProduct);
    }
    return args.productId;
  },
});

// One-time migration to convert storage IDs in product images to direct URLs.
export const backfillProductImageUrls = mutation({
  args: { storeId: v.optional(v.id("stores")) },
  handler: async (ctx, args) => {
    if (args.storeId) {
      await assertStoreOwnership(ctx, args.storeId);
    }

    const products = args.storeId
      ? await ctx.db
          .query("products")
          .withIndex("storeId", (q) => q.eq("storeId", args.storeId!))
          .collect()
      : await (async () => {
          const identity = await ctx.auth.getUserIdentity();
          if (!identity) {
            throw new Error("Unauthorized");
          }

          const ownedStores = await ctx.db
            .query("stores")
            .withIndex("ownerId", (q) => q.eq("ownerId", identity.subject))
            .collect();

          const productsByStore = await Promise.all(
            ownedStores.map((store) =>
              ctx.db
                .query("products")
                .withIndex("storeId", (q) => q.eq("storeId", store._id))
                .collect()
            )
          );

          return productsByStore.flat();
        })();

    let scanned = 0;
    let migrated = 0;
    for (const product of products) {
      scanned += 1;
      const currentImages = product.images ?? [];
      const nextImages = await normalizeProductImageUrls(ctx, currentImages);
      const unchanged =
        currentImages.length === nextImages.length &&
        currentImages.every((img, index) => img === nextImages[index]);
      if (unchanged) {
        continue;
      }

      await ctx.db.patch(product._id, {
        images: nextImages,
        updatedAt: Date.now(),
      });
      const updated = await ctx.db.get(product._id);
      if (updated) {
        await upsertProductDigest(ctx, updated);
      }
      migrated += 1;
    }

    return { scanned, migrated };
  },
});

// Archive a product (soft delete)
export const archiveProduct = mutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const { product } = await assertProductOwnership(ctx, args.productId);
    if (product.isArchived === true) {
      return args.productId;
    }

    await ctx.db.patch(args.productId, {
      isArchived: true,
      updatedAt: Date.now(),
    });
    const updated = await ctx.db.get(args.productId);
    if (updated) {
      await upsertProductDigest(ctx, updated);
    }
    
    return args.productId;
  },
});

// Unarchive a product
export const unarchiveProduct = mutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const { product } = await assertProductOwnership(ctx, args.productId);
    if (product.isArchived === false) {
      return args.productId;
    }

    await ctx.db.patch(args.productId, {
      isArchived: false,
      updatedAt: Date.now(),
    });
    const updated = await ctx.db.get(args.productId);
    if (updated) {
      await upsertProductDigest(ctx, updated);
    }
    
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
    let changedCount = 0;
    for (let i = 0; i < args.productIds.length; i++) {
      const productId = args.productIds[i];
      const product = await ctx.db.get(productId);
      if (!product || product.storeId !== args.storeId) {
        continue;
      }

      if ((product.sortOrder ?? -1) === i) {
        continue;
      }

      await ctx.db.patch(productId, {
        sortOrder: i,
        updatedAt: Date.now(),
      });

      const updated = await ctx.db.get(productId);
      if (updated) {
        await upsertProductDigest(ctx, updated);
      }
      changedCount += 1;
    }
    
    return changedCount;
  },
});

// Get product categories for a store
export const getCategories = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const products = await queryActiveProducts(ctx, args.storeId);
    
    const categories = new Set<string>();
    products.forEach((p) => {
      if (p.category) {
        categories.add(p.category);
      }
    });
    
    return Array.from(categories).sort();
  },
});
