import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

import { assertStoreRole } from "./storeAccess";

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash | 0;
  }
  return hash.toString(16);
}

export const beginStoreUnlockPaymentAttempt = mutation({
  args: {
    storeId: v.id("stores"),
    provider: v.union(v.literal("chargily"), v.literal("sofizpay")),
    amountDzd: v.number(),
    currency: v.string(),
    idempotencyKey: v.string(),
    policyVersion: v.string(),
    billingPeriodStart: v.optional(v.number()),
    billingPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const access = await assertStoreRole(ctx, args.storeId, "admin");
    const now = Date.now();

    const paymentAttemptId = await ctx.db.insert("paymentAttempts", {
      storeId: access.store._id,
      initiatedByUserId: access.identity.subject,
      provider: args.provider,
      purpose: "store_unlock",
      status: "created",
      amountDzd: args.amountDzd,
      currency: args.currency,
      billingPeriodStart: args.billingPeriodStart,
      billingPeriodEnd: args.billingPeriodEnd,
      idempotencyKey: args.idempotencyKey,
      requestSnapshot: {
        storeSlug: access.store.slug,
        storeName: access.store.name,
        actorRole: access.actorRole,
        policyVersion: args.policyVersion,
      },
      resolvedMembershipId: access.membership?._id,
      createdAt: now,
      updatedAt: now,
    });

    return {
      paymentAttemptId,
      storeId: access.store._id,
      storeName: access.store.name,
      storeSlug: access.store.slug,
      actorRole: access.actorRole,
      membershipId: access.membership?._id ?? null,
    };
  },
});

export const recordStoreUnlockCheckoutResult = mutation({
  args: {
    paymentAttemptId: v.id("paymentAttempts"),
    status: v.union(
      v.literal("created"),
      v.literal("provider_pending"),
      v.literal("succeeded"),
      v.literal("failed"),
      v.literal("expired"),
      v.literal("canceled"),
    ),
    providerCheckoutId: v.optional(v.string()),
    providerReference: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const paymentAttempt = await ctx.db.get(args.paymentAttemptId);
    if (!paymentAttempt) {
      throw new Error("Payment attempt not found");
    }

    const access = await assertStoreRole(ctx, paymentAttempt.storeId, "owner");
    if (access.identity.subject !== paymentAttempt.initiatedByUserId) {
      throw new Error("Forbidden");
    }

    await ctx.db.patch(args.paymentAttemptId, {
      status: args.status,
      providerCheckoutId: args.providerCheckoutId,
      providerReference: args.providerReference,
      expiresAt: args.expiresAt,
      updatedAt: Date.now(),
    });

    return args.paymentAttemptId;
  },
});

export const findPaymentAttemptByIdempotencyKey = query({
  args: { idempotencyKey: v.string() },
  handler: async (ctx, args) => {
    const attempts = await ctx.db
      .query("paymentAttempts")
      .withIndex("idempotencyKey", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .collect();
    return attempts[0] ?? null;
  },
});

export const findPaymentAttemptsByStore = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("paymentAttempts")
      .withIndex("storeId", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .take(20);
  },
});

export const findRecentWebhookEvidence = query({
  args: {
    storeId: v.id("stores"),
    windowStart: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("paymentEvidence")
      .withIndex("storeReceivedAt", (q) =>
        q.eq("storeId", args.storeId).gte("receivedAt", args.windowStart)
      )
      .collect();
  },
});

export const recordPaymentEvidence = mutation({
  args: {
    paymentAttemptId: v.id("paymentAttempts"),
    provider: v.union(v.literal("chargily"), v.literal("sofizpay")),
    providerEventId: v.optional(v.string()),
    providerPaymentId: v.string(),
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
    eventCreatedAt: v.optional(v.number()),
    payloadRedacted: v.any(),
  },
  handler: async (ctx, args) => {
    const paymentAttempt = await ctx.db.get(args.paymentAttemptId);
    if (!paymentAttempt) {
      throw new Error("Payment attempt not found");
    }

    const now = Date.now();
    const payloadHash = simpleHash(JSON.stringify(args.payloadRedacted));

    const evidenceId = await ctx.db.insert("paymentEvidence", {
      paymentAttemptId: args.paymentAttemptId,
      storeId: paymentAttempt.storeId,
      provider: args.provider,
      providerEventId: args.providerEventId,
      providerPaymentId: args.providerPaymentId,
      eventType: args.eventType,
      verificationStatus: args.verificationStatus,
      verificationMethod: args.verificationMethod,
      signatureCheckedAt: args.signatureCheckedAt,
      receivedAt: now,
      eventCreatedAt: args.eventCreatedAt,
      payloadHash,
      payloadRedacted: args.payloadRedacted,
    });

    return evidenceId;
  },
});

export const findDuplicateEvidence = query({
  args: {
    provider: v.union(v.literal("chargily"), v.literal("sofizpay")),
    providerPaymentId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("paymentEvidence")
      .withIndex("providerPayment", (q) =>
        q.eq("provider", args.provider).eq("providerPaymentId", args.providerPaymentId)
      )
      .collect();
    return existing[0] ?? null;
  },
});

export const activateStoreFromVerifiedPayment = internalMutation({
  args: {
    paymentAttemptId: v.id("paymentAttempts"),
    evidenceId: v.id("paymentEvidence"),
  },
  handler: async (ctx, args) => {
    const attempt = await ctx.db.get(args.paymentAttemptId);
    if (!attempt) {
      throw new Error("Payment attempt not found");
    }

    const existingPeriods = await ctx.db
      .query("storeBillingPeriods")
      .withIndex("storeStatus", (q) =>
        q.eq("storeId", attempt.storeId).eq("status", "active")
      )
      .collect();

    const now = Date.now();
    const periodLengthMs = 365 * 24 * 60 * 60 * 1000;
    const billingPeriodStart = attempt.billingPeriodStart ?? now;
    const billingPeriodEnd = attempt.billingPeriodEnd ?? now + periodLengthMs;

    let activatedPeriodId: Id<"storeBillingPeriods"> | null = null;

    if (existingPeriods.length === 0) {
      const periodId = await ctx.db.insert("storeBillingPeriods", {
        storeId: attempt.storeId,
        status: "active",
        startedAt: billingPeriodStart,
        endsAt: billingPeriodEnd,
        activatedAt: now,
        activatedByUserId: attempt.initiatedByUserId,
        activationSource: "verified_webhook",
        priceDzd: attempt.amountDzd,
        policyVersion: attempt.requestSnapshot.policyVersion,
        evidencePaymentAttemptId: attempt._id,
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

    await ctx.db.patch(attempt.storeId, {
      subscription: "active",
      paidUntil: billingPeriodEnd,
      status: "active",
      currentUnlockPeriodId: activatedPeriodId,
      updatedAt: now,
    });

    await ctx.db.patch(attempt._id, {
      status: "succeeded",
      updatedAt: now,
    });

    await ctx.db.patch(args.evidenceId, {
      appliedAt: now,
      appliedBillingPeriodId: activatedPeriodId,
    });

    return {
      storeId: attempt.storeId,
      billingPeriodId: activatedPeriodId,
      paidUntil: billingPeriodEnd,
    };
  },
});
