import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    theme: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("clerkId", ["clerkId"]),

  stores: defineTable({
    ownerId: v.string(),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    logo: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    wilaya: v.optional(v.string()),
    status: v.optional(v.string()),
    subscription: v.optional(v.string()),
    orderCount: v.optional(v.number()),
    firstOrderAt: v.optional(v.number()),
    trialEndsAt: v.optional(v.number()),
    paidUntil: v.optional(v.number()),
    lockedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("ownerId", ["ownerId"])
    .index("slug", ["slug"]),

  products: defineTable({
    storeId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    basePrice: v.number(),
    oldPrice: v.optional(v.number()),
    images: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    variants: v.optional(v.array(v.object({
      name: v.string(),
      options: v.array(v.object({
        name: v.string(),
        priceModifier: v.optional(v.number()),
      })),
    }))),
    isArchived: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("storeId", ["storeId"])
    .index("category", ["storeId", "category"]),

  orders: defineTable({
    storeId: v.string(),
    orderNumber: v.string(),
    customerName: v.string(),
    customerPhone: v.string(),
    customerWilaya: v.string(),
    customerCommune: v.optional(v.string()),
    customerAddress: v.optional(v.string()),
    products: v.array(v.object({
      productId: v.string(),
      name: v.string(),
      image: v.optional(v.string()),
      price: v.number(),
      quantity: v.number(),
      variant: v.optional(v.string()),
    })),
    subtotal: v.number(),
    deliveryCost: v.number(),
    total: v.number(),
    deliveryType: v.optional(v.string()),
    status: v.string(),
    paymentStatus: v.optional(v.string()),
    callAttempts: v.optional(v.number()),
    lastCallOutcome: v.optional(v.string()),
    lastCallAt: v.optional(v.number()),
    trackingNumber: v.optional(v.string()),
    deliveryProvider: v.optional(v.string()),
    deliveryDispatchedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    // Extended fields for order management
    callLog: v.optional(v.array(v.object({
      id: v.string(),
      timestamp: v.number(),
      outcome: v.string(),
      notes: v.optional(v.string()),
    }))),
    adminNoteText: v.optional(v.string()),
    adminNoteUpdatedAt: v.optional(v.number()),
    adminNoteUpdatedBy: v.optional(v.string()),
    // Legacy field - will be removed after migration
    adminNotes: v.optional(v.any()),
    auditTrail: v.optional(v.array(v.object({
      id: v.string(),
      timestamp: v.number(),
      action: v.string(),
      details: v.string(),
    }))),
    timeline: v.optional(v.array(v.object({
      status: v.string(),
      timestamp: v.number(),
      note: v.optional(v.string()),
    }))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("storeId", ["storeId"])
    .index("status", ["storeId", "status"])
    .index("orderNumber", ["orderNumber"]),

  siteContent: defineTable({
    storeId: v.string(),
    section: v.string(),
    content: v.any(),
    updatedAt: v.number(),
  })
    .index("storeId", ["storeId"])
    .index("section", ["storeId", "section"]),

  deliveryPricing: defineTable({
    storeId: v.string(),
    wilaya: v.string(),
    homeDelivery: v.optional(v.number()),
    officeDelivery: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("storeId", ["storeId"])
    .index("wilaya", ["storeId", "wilaya"]),

deliveryCredentials: defineTable({
    storeId: v.id("stores"),
    provider: v.union(v.literal("zr-express"), v.literal("zr_express"), v.literal("yalidine"), v.literal("andrson"), v.literal("noest")),
    algorithm: v.literal("aes-256-gcm"),
    ciphertextHex: v.string(),
    ivHex: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("storeId", ["storeId"])
    .index("storeProvider", ["storeId", "provider"]),

  deliveryAnalyticsEvents: defineTable({
    storeId: v.id("stores"),
    orderId: v.optional(v.string()),
    eventType: v.union(
      v.literal("attempted"),
      v.literal("dispatched"),
      v.literal("delivered"),
      v.literal("failed"),
      v.literal("rts")
    ),
    provider: v.string(),
    region: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
    reason: v.optional(v.string()),
    source: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("storeCreatedAt", ["storeId", "createdAt"])
    .index("storeProvider", ["storeId", "provider"])
    .index("storeRegion", ["storeId", "region"]),
});
