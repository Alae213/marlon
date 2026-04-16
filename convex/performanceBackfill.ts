import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { toDayKey, upsertOrderDigest, upsertProductDigest } from "./performanceHelpers";

function normalizeDimension(value?: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export const backfillOrderDigestsBatch = internalMutation({
  args: {
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 100;
    const result = await ctx.db
      .query("orders")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    let migrated = 0;
    for (const order of result.page) {
      await upsertOrderDigest(ctx, order);
      migrated += 1;
    }

    if (!result.isDone) {
      await ctx.scheduler.runAfter(0, internal.performanceBackfill.backfillOrderDigestsBatch, {
        cursor: result.continueCursor,
        batchSize,
      });
    }

    return {
      migrated,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const backfillOrderEventsBatch = internalMutation({
  args: {
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 100;
    const result = await ctx.db
      .query("orders")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    let timelineEventsInserted = 0;
    let callEventsInserted = 0;

    for (const order of result.page) {
      const existingTimeline = await ctx.db
        .query("orderTimelineEvents")
        .withIndex("orderCreatedAt", (q) => q.eq("orderId", order._id))
        .first();

      if (!existingTimeline && order.timeline?.length) {
        for (const entry of order.timeline) {
          await ctx.db.insert("orderTimelineEvents", {
            orderId: order._id,
            storeId: order.storeId,
            status: entry.status,
            note: entry.note,
            createdAt: entry.timestamp,
          });
          timelineEventsInserted += 1;
        }
      }

      const existingCall = await ctx.db
        .query("orderCallEvents")
        .withIndex("orderCreatedAt", (q) => q.eq("orderId", order._id))
        .first();

      if (!existingCall && order.callLog?.length) {
        for (const entry of order.callLog) {
          await ctx.db.insert("orderCallEvents", {
            orderId: order._id,
            storeId: order.storeId,
            outcome: entry.outcome,
            notes: entry.notes,
            createdAt: entry.timestamp,
          });
          callEventsInserted += 1;
        }
      }
    }

    if (!result.isDone) {
      await ctx.scheduler.runAfter(0, internal.performanceBackfill.backfillOrderEventsBatch, {
        cursor: result.continueCursor,
        batchSize,
      });
    }

    return {
      timelineEventsInserted,
      callEventsInserted,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const backfillProductDigestsBatch = internalMutation({
  args: {
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 100;
    const result = await ctx.db
      .query("products")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    let migrated = 0;
    for (const product of result.page) {
      await upsertProductDigest(ctx, product);
      migrated += 1;
    }

    if (!result.isDone) {
      await ctx.scheduler.runAfter(0, internal.performanceBackfill.backfillProductDigestsBatch, {
        cursor: result.continueCursor,
        batchSize,
      });
    }

    return {
      migrated,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const backfillAnalyticsRollupsBatch = internalMutation({
  args: {
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 200;
    const result = await ctx.db
      .query("deliveryAnalyticsEvents")
      .paginate({ cursor: args.cursor ?? null, numItems: batchSize });

    let processed = 0;
    for (const event of result.page) {
      const dayKey = toDayKey(event.createdAt);
      const provider = normalizeDimension(event.provider) ?? "unknown";
      const region = normalizeDimension(event.region);

      const existing = await ctx.db
        .query("deliveryAnalyticsRollups")
        .withIndex("storeProviderRegionDay", (q) =>
          q
            .eq("storeId", event.storeId)
            .eq("provider", provider)
            .eq("region", region)
            .eq("dayKey", dayKey)
        )
        .first();

      const delta = {
        attempted: event.eventType === "attempted" ? 1 : 0,
        dispatched: event.eventType === "dispatched" ? 1 : 0,
        delivered: event.eventType === "delivered" ? 1 : 0,
        failed: event.eventType === "failed" ? 1 : 0,
        rts: event.eventType === "rts" ? 1 : 0,
      };
      const completedDelta = delta.delivered + delta.failed + delta.rts;

      if (existing) {
        await ctx.db.patch(existing._id, {
          attempted: existing.attempted + delta.attempted,
          dispatched: existing.dispatched + delta.dispatched,
          delivered: existing.delivered + delta.delivered,
          failed: existing.failed + delta.failed,
          rts: existing.rts + delta.rts,
          completed: existing.completed + completedDelta,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("deliveryAnalyticsRollups", {
          storeId: event.storeId,
          dayKey,
          provider,
          region,
          attempted: delta.attempted,
          dispatched: delta.dispatched,
          delivered: delta.delivered,
          failed: delta.failed,
          rts: delta.rts,
          completed: completedDelta,
          updatedAt: Date.now(),
        });
      }

      processed += 1;
    }

    if (!result.isDone) {
      await ctx.scheduler.runAfter(0, internal.performanceBackfill.backfillAnalyticsRollupsBatch, {
        cursor: result.continueCursor,
        batchSize,
      });
    }

    return {
      processed,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const startFullPerformanceBackfill = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize ?? 100;
    await ctx.scheduler.runAfter(0, internal.performanceBackfill.backfillOrderDigestsBatch, { batchSize });
    await ctx.scheduler.runAfter(0, internal.performanceBackfill.backfillOrderEventsBatch, { batchSize });
    await ctx.scheduler.runAfter(0, internal.performanceBackfill.backfillProductDigestsBatch, { batchSize });
    await ctx.scheduler.runAfter(0, internal.performanceBackfill.backfillAnalyticsRollupsBatch, {
      batchSize: Math.max(100, batchSize),
    });
    return { scheduled: true, batchSize };
  },
});
