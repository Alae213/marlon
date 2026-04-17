import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

const DEFAULT_BATCH_SIZE = 100;
const CANONICAL_POLICY_VERSION = "v1_canonical_overflow";
const OWNER_ONLY_PERMISSIONS_VERSION = "v1_owner_only";
const STORE_UNLOCK_PRICE_DZD = 2000;

function deriveCompatibilityBillingState(store: Doc<"stores">) {
  if (store.status === "archived") {
    return "archived" as const;
  }

  if (!store.subscription || store.subscription === "trial" || store.subscription === "active") {
    return "active" as const;
  }

  return undefined;
}

export const previewCanonicalScaffoldingState = internalQuery({
  args: {},
  handler: async (ctx) => {
    const stores = await ctx.db.query("stores").collect();
    const now = Date.now();

    let missingCompatibilityMode = 0;
    let missingMembershipMode = 0;
    let missingOwnerMembership = 0;
    let futurePaidUntilStores = 0;
    let legacyLockedStoresForReview = 0;

    for (const store of stores) {
      if (!store.billingCompatibilityMode) missingCompatibilityMode += 1;
      if (!store.membershipMode) missingMembershipMode += 1;
      if (store.paidUntil && store.paidUntil > now) futurePaidUntilStores += 1;
      if (store.subscription === "locked") legacyLockedStoresForReview += 1;

      const ownerMembership = await ctx.db
        .query("storeMemberships")
        .withIndex("storeUserStatus", (q) =>
          q.eq("storeId", store._id).eq("userId", store.ownerId).eq("status", "active"),
        )
        .first();

      if (ownerMembership?.role !== "owner") missingOwnerMembership += 1;
    }

    return {
      totalStores: stores.length,
      missingCompatibilityMode,
      missingMembershipMode,
      missingOwnerMembership,
      futurePaidUntilStores,
      legacyLockedStoresForReview,
      canonicalPolicyVersion: CANONICAL_POLICY_VERSION,
    };
  },
});

export const backfillStoreCompatibilityBatch = internalMutation({
  args: {
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? DEFAULT_BATCH_SIZE;
    const result = await ctx.db
      .query("stores")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    let patched = 0;
    let legacyLockedNeedsReview = 0;

    for (const store of result.page) {
      const updates: Partial<Doc<"stores">> = {};

      if (!store.billingCompatibilityMode) {
        updates.billingCompatibilityMode = "legacy_trial";
      }

      if (!store.membershipMode) {
        updates.membershipMode = "owner_only";
      }

      if (!store.billingPolicyVersion) {
        updates.billingPolicyVersion = CANONICAL_POLICY_VERSION;
      }

      if (!store.billingState) {
        const billingState = deriveCompatibilityBillingState(store);
        if (billingState) {
          updates.billingState = billingState;
          updates.billingStateUpdatedAt = Date.now();
        } else if (store.subscription === "locked") {
          legacyLockedNeedsReview += 1;
        }
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = Date.now();
        await ctx.db.patch(store._id, updates);
        patched += 1;
      }
    }

    if (!result.isDone) {
      await ctx.scheduler.runAfter(0, internal.canonicalBillingMigrations.backfillStoreCompatibilityBatch, {
        cursor: result.continueCursor,
        batchSize,
      });
    }

    return {
      patched,
      legacyLockedNeedsReview,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const backfillOwnerMembershipsBatch = internalMutation({
  args: {
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? DEFAULT_BATCH_SIZE;
    const result = await ctx.db
      .query("stores")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    let inserted = 0;

    for (const store of result.page) {
      const ownerMembership = await ctx.db
        .query("storeMemberships")
        .withIndex("storeUserStatus", (q) =>
          q.eq("storeId", store._id).eq("userId", store.ownerId).eq("status", "active"),
        )
        .first();

      if (ownerMembership?.role === "owner") {
        continue;
      }

      await ctx.db.insert("storeMemberships", {
        storeId: store._id,
        userId: store.ownerId,
        role: "owner",
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        grantedByUserId: store.ownerId,
        source: "migration",
        permissionsVersion: OWNER_ONLY_PERMISSIONS_VERSION,
      });
      inserted += 1;
    }

    if (!result.isDone) {
      await ctx.scheduler.runAfter(0, internal.canonicalBillingMigrations.backfillOwnerMembershipsBatch, {
        cursor: result.continueCursor,
        batchSize,
      });
    }

    return {
      inserted,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const seedBillingPeriodsFromLegacyPaidUntilBatch = internalMutation({
  args: {
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? DEFAULT_BATCH_SIZE;
    const result = await ctx.db
      .query("stores")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });
    const now = Date.now();

    let inserted = 0;
    let skippedExpired = 0;

    for (const store of result.page) {
      if (!store.paidUntil || store.paidUntil <= now) {
        skippedExpired += 1;
        continue;
      }

      const existingActivePeriod = await ctx.db
        .query("storeBillingPeriods")
        .withIndex("storeStatus", (q) => q.eq("storeId", store._id).eq("status", "active"))
        .first();

      if (existingActivePeriod && existingActivePeriod.endsAt >= store.paidUntil) {
        continue;
      }

      const billingPeriodId = await ctx.db.insert("storeBillingPeriods", {
        storeId: store._id,
        status: "active",
        startedAt: now,
        endsAt: store.paidUntil,
        activatedAt: now,
        activatedByUserId: store.ownerId,
        activationSource: "migration",
        priceDzd: STORE_UNLOCK_PRICE_DZD,
        policyVersion: CANONICAL_POLICY_VERSION,
        notes: "Seeded from legacy paidUntil during canonical billing migration.",
        createdAt: now,
        updatedAt: now,
      });

      if (!store.currentUnlockPeriodId) {
        await ctx.db.patch(store._id, {
          currentUnlockPeriodId: billingPeriodId,
          updatedAt: now,
        });
      }

      inserted += 1;
    }

    if (!result.isDone) {
      await ctx.scheduler.runAfter(0, internal.canonicalBillingMigrations.seedBillingPeriodsFromLegacyPaidUntilBatch, {
        cursor: result.continueCursor,
        batchSize,
      });
    }

    return {
      inserted,
      skippedExpired,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const startCanonicalScaffoldingBackfill = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? DEFAULT_BATCH_SIZE;

    await ctx.scheduler.runAfter(0, internal.canonicalBillingMigrations.backfillStoreCompatibilityBatch, {
      batchSize,
    });
    await ctx.scheduler.runAfter(0, internal.canonicalBillingMigrations.backfillOwnerMembershipsBatch, {
      batchSize,
    });
    await ctx.scheduler.runAfter(0, internal.canonicalBillingMigrations.seedBillingPeriodsFromLegacyPaidUntilBatch, {
      batchSize,
    });

    return {
      scheduled: true,
      batchSize,
      canonicalPolicyVersion: CANONICAL_POLICY_VERSION,
    };
  },
});
