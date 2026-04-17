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
    billingState: v.optional(v.union(
      v.literal("active"),
      v.literal("overflow_locked"),
      v.literal("unlock_pending"),
      v.literal("archived")
    )),
    billingStateUpdatedAt: v.optional(v.number()),
    billingPolicyVersion: v.optional(v.string()),
    billingCompatibilityMode: v.optional(v.union(
      v.literal("legacy_trial"),
      v.literal("canonical")
    )),
    currentUnlockPeriodId: v.optional(v.id("storeBillingPeriods")),
    membershipMode: v.optional(v.union(
      v.literal("owner_only"),
      v.literal("memberships_enabled")
    )),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
.index("ownerId", ["ownerId"])
    .index("slug", ["slug"])
    .index("subscription", ["subscription"])
    .index("billingState", ["billingState"])
    .index("billingCompatibilityMode", ["billingCompatibilityMode"]),

  storeBillingPeriods: defineTable({
    storeId: v.id("stores"),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("expired"),
      v.literal("canceled")
    ),
    startedAt: v.number(),
    endsAt: v.number(),
    activatedAt: v.optional(v.number()),
    activatedByUserId: v.optional(v.string()),
    activationSource: v.union(
      v.literal("migration"),
      v.literal("verified_webhook"),
      v.literal("internal_admin")
    ),
    priceDzd: v.number(),
    policyVersion: v.string(),
    evidencePaymentAttemptId: v.optional(v.id("paymentAttempts")),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("storeId", ["storeId"])
    .index("storeStatus", ["storeId", "status"])
    .index("endsAt", ["endsAt"]),

  paymentAttempts: defineTable({
    storeId: v.id("stores"),
    initiatedByUserId: v.string(),
    provider: v.union(v.literal("chargily"), v.literal("sofizpay")),
    purpose: v.literal("store_unlock"),
    status: v.union(
      v.literal("created"),
      v.literal("provider_pending"),
      v.literal("succeeded"),
      v.literal("failed"),
      v.literal("expired"),
      v.literal("canceled")
    ),
    amountDzd: v.number(),
    currency: v.string(),
    billingPeriodStart: v.optional(v.number()),
    billingPeriodEnd: v.optional(v.number()),
    providerCheckoutId: v.optional(v.string()),
    providerReference: v.optional(v.string()),
    idempotencyKey: v.string(),
    requestSnapshot: v.object({
      storeSlug: v.string(),
      storeName: v.string(),
      actorRole: v.union(
        v.literal("owner"),
        v.literal("admin"),
        v.literal("staff"),
        v.literal("unknown")
      ),
      policyVersion: v.string(),
    }),
    resolvedMembershipId: v.optional(v.id("storeMemberships")),
    createdAt: v.number(),
    updatedAt: v.number(),
    expiresAt: v.optional(v.number()),
  })
    .index("storeId", ["storeId"])
    .index("initiatedByUserId", ["initiatedByUserId"])
    .index("providerCheckout", ["provider", "providerCheckoutId"])
    .index("idempotencyKey", ["idempotencyKey"]),

  paymentEvidence: defineTable({
    paymentAttemptId: v.id("paymentAttempts"),
    storeId: v.id("stores"),
    provider: v.union(v.literal("chargily"), v.literal("sofizpay")),
    providerEventId: v.optional(v.string()),
    providerPaymentId: v.optional(v.string()),
    eventType: v.string(),
    verificationStatus: v.union(
      v.literal("verified"),
      v.literal("rejected"),
      v.literal("pending_review")
    ),
    verificationMethod: v.union(
      v.literal("signature"),
      v.literal("provider_fetch"),
      v.literal("manual_reconciliation")
    ),
    signatureCheckedAt: v.optional(v.number()),
    receivedAt: v.number(),
    eventCreatedAt: v.optional(v.number()),
    payloadHash: v.string(),
    payloadRedacted: v.any(),
    duplicateOfEvidenceId: v.optional(v.id("paymentEvidence")),
    appliedAt: v.optional(v.number()),
    appliedBillingPeriodId: v.optional(v.id("storeBillingPeriods")),
  })
    .index("paymentAttemptId", ["paymentAttemptId"])
    .index("storeReceivedAt", ["storeId", "receivedAt"])
    .index("providerEvent", ["provider", "providerEventId"])
    .index("providerPayment", ["provider", "providerPaymentId"]),

  storeMemberships: defineTable({
    storeId: v.id("stores"),
    userId: v.string(),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("staff")),
    status: v.union(
      v.literal("active"),
      v.literal("revoked"),
      v.literal("pending_acceptance")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    grantedByUserId: v.string(),
    revokedAt: v.optional(v.number()),
    revokedByUserId: v.optional(v.string()),
    source: v.union(
      v.literal("owner_bootstrap"),
      v.literal("invite_accept"),
      v.literal("migration")
    ),
    permissionsVersion: v.string(),
  })
    .index("storeUserStatus", ["storeId", "userId", "status"])
    .index("userStatus", ["userId", "status"])
    .index("storeRole", ["storeId", "role"]),

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
    .index("category", ["storeId", "category"])
    .index("storeArchivedSort", ["storeId", "isArchived", "sortOrder"])
    .index("storeCategoryArchivedSort", ["storeId", "category", "isArchived", "sortOrder"]),

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
    .index("storeCreatedAt", ["storeId", "createdAt"])
    .index("status", ["storeId", "status"])
    .index("orderNumber", ["orderNumber"])
    .index("storeOrderNumber", ["storeId", "orderNumber"])
    .index("storeUpdatedAt", ["storeId", "updatedAt"]),

  orderDigests: defineTable({
    orderId: v.id("orders"),
    storeId: v.string(),
    orderNumber: v.string(),
    customerName: v.string(),
    customerPhone: v.string(),
    customerWilaya: v.string(),
    status: v.string(),
    paymentStatus: v.optional(v.string()),
    total: v.number(),
    subtotal: v.number(),
    deliveryCost: v.number(),
    deliveryProvider: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
    productsCount: v.number(),
    primaryProductName: v.optional(v.string()),
    primaryProductImage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("orderId", ["orderId"])
    .index("storeUpdatedAt", ["storeId", "updatedAt"])
    .index("storeStatusUpdatedAt", ["storeId", "status", "updatedAt"])
    .index("storeOrderNumber", ["storeId", "orderNumber"]),

  orderTimelineEvents: defineTable({
    orderId: v.id("orders"),
    storeId: v.string(),
    status: v.string(),
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("orderCreatedAt", ["orderId", "createdAt"])
    .index("storeCreatedAt", ["storeId", "createdAt"]),

  orderCallEvents: defineTable({
    orderId: v.id("orders"),
    storeId: v.string(),
    outcome: v.string(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("orderCreatedAt", ["orderId", "createdAt"])
    .index("storeCreatedAt", ["storeId", "createdAt"]),

  productDigests: defineTable({
    productId: v.id("products"),
    storeId: v.string(),
    name: v.string(),
    basePrice: v.number(),
    oldPrice: v.optional(v.number()),
    primaryImage: v.optional(v.string()),
    category: v.optional(v.string()),
    isArchived: v.boolean(),
    sortOrder: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("productId", ["productId"])
    .index("storeUpdatedAt", ["storeId", "updatedAt"])
    .index("storeArchivedSort", ["storeId", "isArchived", "sortOrder"])
    .index("storeCategoryArchivedSort", ["storeId", "category", "isArchived", "sortOrder"]),

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

  deliveryAnalyticsRollups: defineTable({
    storeId: v.id("stores"),
    dayKey: v.string(),
    provider: v.string(),
    region: v.optional(v.string()),
    attempted: v.number(),
    dispatched: v.number(),
    delivered: v.number(),
    failed: v.number(),
    rts: v.number(),
    completed: v.number(),
    updatedAt: v.number(),
  })
    .index("storeDay", ["storeId", "dayKey"])
    .index("storeProviderDay", ["storeId", "provider", "dayKey"])
    .index("storeRegionDay", ["storeId", "region", "dayKey"])
    .index("storeProviderRegionDay", ["storeId", "provider", "region", "dayKey"]),
});
