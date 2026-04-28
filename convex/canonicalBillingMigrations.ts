import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

const DEFAULT_BATCH_SIZE = 100;
const CANONICAL_POLICY_VERSION = "v1_canonical_overflow";
const OWNER_ONLY_PERMISSIONS_VERSION = "v1_owner_only";
const STORE_UNLOCK_PRICE_DZD = 2000;
const PERIOD_END_MISMATCH_TOLERANCE_MS = 5 * 60 * 1000;

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

function getStoreLegacySignals(store: Doc<"stores">) {
  return {
    subscription: store.subscription ?? null,
    paidUntil: store.paidUntil ?? null,
    lockedAt: store.lockedAt ?? null,
    orderCount: typeof store.orderCount === "number" ? store.orderCount : null,
  };
}

function getStoreCanonicalSignals(store: Doc<"stores">) {
  return {
    billingCompatibilityMode: store.billingCompatibilityMode ?? null,
    billingPolicyVersion: store.billingPolicyVersion ?? null,
    billingState: store.billingState ?? null,
    membershipMode: store.membershipMode ?? null,
    currentUnlockPeriodId: store.currentUnlockPeriodId ?? null,
  };
}

async function resolveOwnerMembershipState(ctx: any, store: Doc<"stores">) {
  const ownerMembership = await ctx.db
    .query("storeMemberships")
    .withIndex("storeUserStatus", (q: any) =>
      q.eq("storeId", store._id).eq("userId", store.ownerId).eq("status", "active"),
    )
    .first();

  return {
    hasOwnerMembership: ownerMembership?.role === "owner",
  };
}

async function resolveActiveBillingPeriodState(ctx: any, store: Doc<"stores">) {
  const activePeriods = await ctx.db
    .query("storeBillingPeriods")
    .withIndex("storeStatus", (q: any) => q.eq("storeId", store._id).eq("status", "active"))
    .collect();

  const bestActivePeriod = activePeriods.reduce((best: any, current: any) => {
    if (!best) return current;
    return current.endsAt > best.endsAt ? current : best;
  }, null);

  return {
    activePeriodId: bestActivePeriod?._id ?? null,
    activePeriodEndsAt: bestActivePeriod?.endsAt ?? null,
  };
}

export const getCanonicalReconciliationReport = internalQuery({
  args: {
    storeId: v.optional(v.id("stores")),
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? DEFAULT_BATCH_SIZE;
    const now = Date.now();

    const storeOverride = args.storeId ? await ctx.db.get(args.storeId) : null;
    const storesPage = args.storeId
      ? {
          page: storeOverride ? [storeOverride] : [],
          isDone: true,
          continueCursor: null,
        }
      : await ctx.db.query("stores").paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    const items = [];

    for (const store of storesPage.page) {
      if (!store) {
        continue;
      }

      const legacySignals = getStoreLegacySignals(store);
      const canonicalSignals = getStoreCanonicalSignals(store);

      const { hasOwnerMembership } = await resolveOwnerMembershipState(ctx, store);
      const { activePeriodId, activePeriodEndsAt } = await resolveActiveBillingPeriodState(ctx, store);

      const needsCompatibilityPatch =
        !store.billingCompatibilityMode ||
        !store.membershipMode ||
        !store.billingPolicyVersion ||
        !store.billingState;

      const hasFuturePaidUntilButNoActivePeriod =
        typeof store.paidUntil === "number" && store.paidUntil > now && !activePeriodId;

      const hasActivePeriodButStoreNotActive =
        typeof activePeriodEndsAt === "number" &&
        activePeriodEndsAt > now &&
        store.billingState !== "active";

      const legacyLockedNeedsManualReview = store.subscription === "locked";

      const periodEndMismatch =
        typeof store.paidUntil === "number" &&
        typeof activePeriodEndsAt === "number" &&
        Math.abs(store.paidUntil - activePeriodEndsAt) > PERIOD_END_MISMATCH_TOLERANCE_MS;

      items.push({
        storeId: store._id,
        storeSlug: store.slug ?? null,
        legacySignals,
        canonicalSignals,
        activePeriodId,
        activePeriodEndsAt,
        flags: {
          needsOwnerMembershipBackfill: !hasOwnerMembership,
          needsCompatibilityPatch,
          hasFuturePaidUntilButNoActivePeriod,
          hasActivePeriodButStoreNotActive,
          legacyLockedNeedsManualReview,
          periodEndMismatch,
        },
      });
    }

    return {
      items,
      isDone: storesPage.isDone,
      continueCursor: storesPage.continueCursor,
      canonicalPolicyVersion: CANONICAL_POLICY_VERSION,
    };
  },
});

export const applyCanonicalParityFixupsBatch = internalMutation({
  args: {
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? DEFAULT_BATCH_SIZE;
    const dryRun = args.dryRun ?? true;
    const now = Date.now();

    const result = await ctx.db
      .query("stores")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    let scanned = 0;
    let skippedLegacyLocked = 0;
    let patched = 0;
    let linkedUnlockPeriod = 0;
    let patchedCompatibility = 0;

    for (const store of result.page) {
      scanned += 1;

      if (store.subscription === "locked") {
        skippedLegacyLocked += 1;
        continue;
      }

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
          updates.billingStateUpdatedAt = now;
        }
      }

      const shouldLinkUnlockPeriod = !store.currentUnlockPeriodId;
      if (shouldLinkUnlockPeriod) {
        const activePeriods = await ctx.db
          .query("storeBillingPeriods")
          .withIndex("storeStatus", (q) => q.eq("storeId", store._id).eq("status", "active"))
          .collect();

        const bestActivePeriod = activePeriods.reduce((best, current) => {
          if (!best) return current;
          return current.endsAt > best.endsAt ? current : best;
        }, null as any);

        if (bestActivePeriod?._id) {
          updates.currentUnlockPeriodId = bestActivePeriod._id;
        }
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = now;

        const isCompatibilityPatch =
          "billingCompatibilityMode" in updates ||
          "membershipMode" in updates ||
          "billingPolicyVersion" in updates ||
          "billingState" in updates;
        if (isCompatibilityPatch) {
          patchedCompatibility += 1;
        }

        if ("currentUnlockPeriodId" in updates) {
          linkedUnlockPeriod += 1;
        }

        if (!dryRun) {
          await ctx.db.patch(store._id, updates);
        }
        patched += 1;
      }
    }

    if (!result.isDone) {
      await ctx.scheduler.runAfter(0, internal.canonicalBillingMigrations.applyCanonicalParityFixupsBatch, {
        cursor: result.continueCursor,
        batchSize,
        dryRun,
      });
    }

    return {
      scanned,
      skippedLegacyLocked,
      patched,
      patchedCompatibility,
      linkedUnlockPeriod,
      dryRun,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});
