import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id, Doc } from "./_generated/dataModel";
import { assertStoreRole } from "./storeAccess";

const MAX_DAILY_ORDERS = 5;
const UNLOCK_PRICE_DZD = 2000;
const OVERFLOW_RETENTION_DAYS = 5;
const OVERFLOW_RETENTION_MS = OVERFLOW_RETENTION_DAYS * 24 * 60 * 60 * 1000;

const ALGIERS_OFFSET_MS = 1 * 60 * 60 * 1000;

function getAlgiersDayKey(timestamp: number = Date.now()): string {
  const utc = timestamp;
  const algiers = new Date(utc + ALGIERS_OFFSET_MS);
  return `${algiers.getFullYear()}-${String(algiers.getMonth() + 1).padStart(2, "0")}-${String(algiers.getDate()).padStart(2, "0")}`;
}

export type BillingState = "active" | "overflow_locked" | "unlock_pending" | "archived";

export function maskCustomerData<T extends { customerName?: string; customerPhone?: string; customerWilaya?: string; customerCommune?: string; customerAddress?: string; createdAt: number }>(
  order: T
): T {
  return {
    ...order,
    customerName: "معلومات محمية",
    customerPhone: "معلومات محمية",
    customerWilaya: "معلومات محمية",
    customerCommune: "معلومات محمية",
    customerAddress: "معلومات محمية",
  };
}

export async function isStoreOverflowLocked(
  ctx: { db: { get: (id: Id<"stores">) => Promise<Doc<"stores"> | null> } },
  storeId: Id<"stores">
): Promise<boolean> {
  const store = await ctx.db.get(storeId);
  if (!store) return false;
  
  if (store.billingCompatibilityMode !== "canonical") {
    return store.subscription === "locked";
  }
  
  return store.billingState === "overflow_locked";
}

export const getStoreBillingStatusCanonical = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store) {
      return null;
    }

    const now = Date.now();
    const algiersDayKey = getAlgiersDayKey(now);
    const isCanonical = store.billingCompatibilityMode === "canonical";
    const isLegacyLocked = store.subscription === "locked";

    let todayOrderCount = 0;
    const orderDigests = await ctx.db
      .query("orderDigests")
      .withIndex("storeUpdatedAt", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .take(100);

    for (const digest of orderDigests) {
      const digestDayKey = getAlgiersDayKey(digest.createdAt);
      if (digestDayKey === algiersDayKey) {
        todayOrderCount++;
      }
    }

    const isOverflow = todayOrderCount > MAX_DAILY_ORDERS;
    
    const billingState: BillingState = isCanonical 
      ? ((store.billingState as BillingState) || "unlock_pending")
      : (isLegacyLocked ? "overflow_locked" : "unlock_pending");
    
    const isLocked = billingState === "overflow_locked" || (!isCanonical && isLegacyLocked);

    let daysRemaining: number | null = null;
    
    if (store.currentUnlockPeriodId) {
      const period = await ctx.db.get(store.currentUnlockPeriodId);
      if (period && period.status === "active") {
        daysRemaining = Math.max(0, Math.ceil((period.endsAt - now) / (24 * 60 * 60 * 1000)));
      }
    }

    return {
      billingState,
      billingStateUpdatedAt: store.billingStateUpdatedAt ?? null,
      isLocked,
      isOverflow,
      todayOrderCount,
      maxDailyOrders: MAX_DAILY_ORDERS,
      ordersRemaining: Math.max(0, MAX_DAILY_ORDERS - todayOrderCount),
      daysRemaining,
      priceDzd: UNLOCK_PRICE_DZD,
      policyVersion: store.billingPolicyVersion || "v1_canonical_overflow",
      compatibilityMode: store.billingCompatibilityMode || "legacy_trial",
    };
  },
});

export const canStoreAcceptOrder = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store) {
      return { canAccept: false, isOverflow: false, todayCount: 0 };
    }

    const now = Date.now();
    const algiersDayKey = getAlgiersDayKey(now);

    let todayOrderCount = 0;
    const orderDigests = await ctx.db
      .query("orderDigests")
      .withIndex("storeUpdatedAt", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .take(100);

    for (const digest of orderDigests) {
      const digestDayKey = getAlgiersDayKey(digest.createdAt);
      if (digestDayKey === algiersDayKey) {
        todayOrderCount++;
      }
    }

    const isOverflow = todayOrderCount > MAX_DAILY_ORDERS;
    
    return {
      canAccept: true,
      isOverflow,
      todayCount: todayOrderCount,
    };
  },
});

export const migrateStoreToCanonical = internalMutation({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store) {
      throw new Error("Store not found");
    }

    if (store.billingCompatibilityMode === "canonical") {
      return { action: "already_canonical" };
    }

    const now = Date.now();
    let billingState: BillingState = "active";
    
    if (store.subscription === "locked") {
      billingState = "overflow_locked";
    }

    await ctx.db.patch(args.storeId, {
      billingCompatibilityMode: "canonical",
      billingPolicyVersion: "v1_canonical_overflow",
      billingState,
      billingStateUpdatedAt: now,
      membershipMode: store.membershipMode || "owner_only",
      updatedAt: now,
    });

    return { action: "migrated", newBillingState: billingState };
  },
});

export const migrateAllStoresToCanonical = internalMutation({
  args: {},
  handler: async (ctx) => {
    const stores = await ctx.db.query("stores").collect();
    let migrated = 0;
    let skipped = 0;

    for (const store of stores) {
      if (store.billingCompatibilityMode === "canonical") {
        skipped++;
        continue;
      }

      const now = Date.now();
      let billingState: BillingState = "active";
      
      if (store.subscription === "locked") {
        billingState = "overflow_locked";
      }

      await ctx.db.patch(store._id, {
        billingCompatibilityMode: "canonical",
        billingPolicyVersion: "v1_canonical_overflow",
        billingState,
        billingStateUpdatedAt: now,
        membershipMode: store.membershipMode || "owner_only",
        updatedAt: now,
      });
      migrated++;
    }

    return { migrated, skipped, total: stores.length };
  },
});

export const cleanupOverflowOrders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const cutoffTime = now - OVERFLOW_RETENTION_MS;

    const allStores = await ctx.db.query("stores").collect();
    let totalDeleted = 0;

    for (const store of allStores) {
      if (store.billingCompatibilityMode !== "canonical") {
        continue;
      }
      if (store.billingState !== "overflow_locked" || !store.billingStateUpdatedAt) {
        continue;
      }

      if (store.billingStateUpdatedAt < cutoffTime) {
        const orders = await ctx.db
          .query("orders")
          .withIndex("storeId", (q) => q.eq("storeId", store._id))
          .collect();

        for (const order of orders) {
          if (order.createdAt < store.billingStateUpdatedAt) {
            await ctx.db.delete(order._id);
            
            const digest = await ctx.db
              .query("orderDigests")
              .withIndex("orderId", (q) => q.eq("orderId", order._id))
              .first();
            if (digest) {
              await ctx.db.delete(digest._id);
            }
            
            totalDeleted++;
          }
        }
      }
    }

    return { deletedCount: totalDeleted };
  },
});

export const getNonOverflowOrders = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    await assertStoreRole(ctx, args.storeId, "owner");
    
    const store = await ctx.db.get(args.storeId);
    if (!store) {
      return [];
    }
    
    const isOverflowLocked = store.billingCompatibilityMode === "canonical" 
      && store.billingState === "overflow_locked";
    
    if (isOverflowLocked) {
      return [];
    }
    
    const orders = await ctx.db
      .query("orders")
      .withIndex("storeId", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .collect();
    
    return orders;
  },
});

export const checkAndUpdateOverflowState = mutation({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const store = await ctx.db.get(args.storeId);
    if (!store) {
      throw new Error("Store not found");
    }

    if (store.ownerId !== identity.subject) {
      throw new Error("Forbidden");
    }

    if (store.billingCompatibilityMode !== "canonical") {
      return { action: "legacy_mode", isOverflow: false };
    }

    const now = Date.now();
    const algiersDayKey = getAlgiersDayKey(now);
    
    const orderDigests = await ctx.db
      .query("orderDigests")
      .withIndex("storeUpdatedAt", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .take(100);

    let todayOrderCount = 0;
    for (const digest of orderDigests) {
      const digestDayKey = getAlgiersDayKey(digest.createdAt);
      if (digestDayKey === algiersDayKey) {
        todayOrderCount++;
      }
    }

    const isOverflow = todayOrderCount > MAX_DAILY_ORDERS;
    const currentBillingState = store.billingState as BillingState;

    if (isOverflow && currentBillingState !== "overflow_locked") {
      await ctx.db.patch(args.storeId, {
        billingState: "overflow_locked",
        billingStateUpdatedAt: now,
        updatedAt: now,
      });
      return { action: "locked", isOverflow: true, todayOrderCount };
    }

    if (!isOverflow && currentBillingState === "overflow_locked") {
      const activePeriod = await ctx.db
        .query("storeBillingPeriods")
        .withIndex("storeId", (q) => q.eq("storeId", args.storeId))
        .collect();
      
      const active = activePeriod.find(p => p.status === "active");

      if (active && active.endsAt > now) {
        await ctx.db.patch(args.storeId, {
          billingState: "active",
          billingStateUpdatedAt: now,
          updatedAt: now,
        });
        return { action: "unlocked", isOverflow: false, todayOrderCount };
      }
    }

    return { action: "unchanged", isOverflow, todayOrderCount };
  },
});

export const getCanonicalPaymentAmount = query({
  args: {},
  handler: async () => {
    return {
      amountDzd: UNLOCK_PRICE_DZD,
      currency: "DZD",
      periodDays: 30,
      description: "اشتراك شهري - فتح الطلبات",
    };
  },
});

export const applyCanonicalUnlockFromPayment = mutation({
  args: {
    paymentAttemptId: v.id("paymentAttempts"),
    evidenceId: v.id("paymentEvidence"),
  },
  handler: async (ctx, args) => {
    const paymentAttempt = await ctx.db.get(args.paymentAttemptId);
    if (!paymentAttempt) {
      throw new Error("Payment attempt not found");
    }

    const now = Date.now();
    const billingPeriodStart = paymentAttempt.billingPeriodStart ?? now;
    const billingPeriodEnd = paymentAttempt.billingPeriodEnd ?? (now + 30 * 24 * 60 * 60 * 1000);

    const existingPeriods = await ctx.db
      .query("storeBillingPeriods")
      .withIndex("storeStatus", (q) =>
        q.eq("storeId", paymentAttempt.storeId).eq("status", "active")
      )
      .collect();

    let activatedPeriodId: Id<"storeBillingPeriods"> | null = null;

    if (existingPeriods.length === 0) {
      const periodId = await ctx.db.insert("storeBillingPeriods", {
        storeId: paymentAttempt.storeId,
        status: "active",
        startedAt: billingPeriodStart,
        endsAt: billingPeriodEnd,
        activatedAt: now,
        activatedByUserId: paymentAttempt.initiatedByUserId,
        activationSource: "verified_webhook",
        priceDzd: paymentAttempt.amountDzd,
        policyVersion: paymentAttempt.requestSnapshot?.policyVersion || "v1_canonical_overflow",
        evidencePaymentAttemptId: paymentAttempt._id,
        createdAt: now,
        updatedAt: now,
      });
      activatedPeriodId = periodId;
    } else {
      const existing = existingPeriods[0];
      const newEnd = Math.max(existing.endsAt, billingPeriodEnd);
      await ctx.db.patch(existing._id, {
        endsAt: newEnd,
        updatedAt: now,
      });
      activatedPeriodId = existing._id;
    }

    const store = await ctx.db.get(paymentAttempt.storeId);
    if (!store) {
      throw new Error("Store not found");
    }

    await ctx.db.patch(paymentAttempt.storeId, {
      billingCompatibilityMode: "canonical",
      billingPolicyVersion: "v1_canonical_overflow",
      billingState: "active",
      billingStateUpdatedAt: now,
      currentUnlockPeriodId: activatedPeriodId,
      paidUntil: billingPeriodEnd,
      subscription: "active",
      status: "active",
      updatedAt: now,
    });

    await ctx.db.patch(paymentAttempt._id, {
      status: "succeeded",
      updatedAt: now,
    });

    await ctx.db.patch(args.evidenceId, {
      appliedAt: now,
      appliedBillingPeriodId: activatedPeriodId,
    });

    return {
      storeId: paymentAttempt.storeId,
      billingPeriodId: activatedPeriodId,
      paidUntil: billingPeriodEnd,
    };
  },
});