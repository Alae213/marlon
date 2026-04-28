import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { toDayKey } from "./performanceHelpers";
import { assertStoreRole } from "./storeAccess";

type DeliveryEventType = "attempted" | "dispatched" | "delivered" | "failed" | "rts";

function normalizeDimension(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function buildSummaryFromCounts(counts: {
  attempted: number;
  dispatched: number;
  delivered: number;
  failed: number;
  rts: number;
}) {
  const completed = counts.delivered + counts.failed + counts.rts;
  const successRate = completed > 0 ? counts.delivered / completed : 0;

  return {
    counts,
    completed,
    successRate,
  };
}

async function incrementRollup(
  ctx: MutationCtx,
  args: {
    storeId: Id<"stores">;
    provider: string;
    region?: string;
    createdAt: number;
    eventType: DeliveryEventType;
  }
) {
  const dayKey = toDayKey(args.createdAt);
  const now = Date.now();
  const rollupDelta = {
    attempted: 0,
    dispatched: 0,
    delivered: 0,
    failed: 0,
    rts: 0,
    completed: 0,
  };

  rollupDelta[args.eventType] += 1;
  if (args.eventType === "delivered" || args.eventType === "failed" || args.eventType === "rts") {
    rollupDelta.completed += 1;
  }

  const existingExact = await ctx.db
    .query("deliveryAnalyticsRollups")
    .withIndex("storeProviderRegionDay", (q) =>
      q
        .eq("storeId", args.storeId)
        .eq("provider", args.provider)
        .eq("region", args.region)
        .eq("dayKey", dayKey)
    )
    .first();

  if (existingExact) {
    await ctx.db.patch(existingExact._id, {
      attempted: existingExact.attempted + rollupDelta.attempted,
      dispatched: existingExact.dispatched + rollupDelta.dispatched,
      delivered: existingExact.delivered + rollupDelta.delivered,
      failed: existingExact.failed + rollupDelta.failed,
      rts: existingExact.rts + rollupDelta.rts,
      completed: existingExact.completed + rollupDelta.completed,
      updatedAt: now,
    });
  } else {
    await ctx.db.insert("deliveryAnalyticsRollups", {
      storeId: args.storeId,
      dayKey,
      provider: args.provider,
      region: args.region,
      attempted: rollupDelta.attempted,
      dispatched: rollupDelta.dispatched,
      delivered: rollupDelta.delivered,
      failed: rollupDelta.failed,
      rts: rollupDelta.rts,
      completed: rollupDelta.completed,
      updatedAt: now,
    });
  }

  if (args.region) {
    const existingProviderGlobal = await ctx.db
      .query("deliveryAnalyticsRollups")
      .withIndex("storeProviderRegionDay", (q) =>
        q
          .eq("storeId", args.storeId)
          .eq("provider", args.provider)
          .eq("region", undefined)
          .eq("dayKey", dayKey)
      )
      .first();

    if (existingProviderGlobal) {
      await ctx.db.patch(existingProviderGlobal._id, {
        attempted: existingProviderGlobal.attempted + rollupDelta.attempted,
        dispatched: existingProviderGlobal.dispatched + rollupDelta.dispatched,
        delivered: existingProviderGlobal.delivered + rollupDelta.delivered,
        failed: existingProviderGlobal.failed + rollupDelta.failed,
        rts: existingProviderGlobal.rts + rollupDelta.rts,
        completed: existingProviderGlobal.completed + rollupDelta.completed,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("deliveryAnalyticsRollups", {
        storeId: args.storeId,
        dayKey,
        provider: args.provider,
        region: undefined,
        attempted: rollupDelta.attempted,
        dispatched: rollupDelta.dispatched,
        delivered: rollupDelta.delivered,
        failed: rollupDelta.failed,
        rts: rollupDelta.rts,
        completed: rollupDelta.completed,
        updatedAt: now,
      });
    }
  }
}

export const recordDeliveryEvent = mutation({
  args: {
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
    createdAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertStoreRole(ctx, args.storeId, "owner");

    if (args.orderId) {
      const order = await ctx.db.get(args.orderId as Id<"orders">);
      if (!order || order.storeId !== args.storeId) {
        throw new Error("DELIVERY_ANALYTICS_ORDER_STORE_MISMATCH");
      }
    }

    const createdAt = args.createdAt ?? Date.now();
    const provider = normalizeDimension(args.provider) ?? "unknown";
    const region = normalizeDimension(args.region);

    const eventId = await ctx.db.insert("deliveryAnalyticsEvents", {
      storeId: args.storeId,
      orderId: normalizeDimension(args.orderId),
      eventType: args.eventType,
      provider,
      region,
      trackingNumber: normalizeDimension(args.trackingNumber),
      reason: normalizeDimension(args.reason),
      source: normalizeDimension(args.source),
      createdAt,
    });

    await incrementRollup(ctx, {
      storeId: args.storeId,
      provider,
      region,
      createdAt,
      eventType: args.eventType,
    });

    return eventId;
  },
});

export const getDeliveryPerformanceSummary = query({
  args: {
    storeId: v.id("stores"),
    provider: v.optional(v.string()),
    region: v.optional(v.string()),
    sinceDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const providerFilter = normalizeDimension(args.provider);
    const regionFilter = normalizeDimension(args.region);
    const sinceDays = args.sinceDays ?? 30;
    const now = Date.now();
    const sinceTimestamp = now - sinceDays * 24 * 60 * 60 * 1000;
    const sinceDayKey = toDayKey(sinceTimestamp);

    const byDay = await ctx.db
      .query("deliveryAnalyticsRollups")
      .withIndex("storeDay", (q) => q.eq("storeId", args.storeId).gte("dayKey", sinceDayKey))
      .collect();

    const filteredRows = byDay.filter((row) => {
      if (providerFilter && row.provider !== providerFilter) {
        return false;
      }
      if (regionFilter) {
        return row.region === regionFilter;
      }
      return row.region === undefined;
    });

    const overallCounts = {
      attempted: 0,
      dispatched: 0,
      delivered: 0,
      failed: 0,
      rts: 0,
    };

    const providerCounts = new Map<string, typeof overallCounts>();
    const regionCounts = new Map<string, typeof overallCounts>();

    for (const row of filteredRows) {
      overallCounts.attempted += row.attempted;
      overallCounts.dispatched += row.dispatched;
      overallCounts.delivered += row.delivered;
      overallCounts.failed += row.failed;
      overallCounts.rts += row.rts;

      const providerKey = row.provider || "unknown";
      const p = providerCounts.get(providerKey) ?? {
        attempted: 0,
        dispatched: 0,
        delivered: 0,
        failed: 0,
        rts: 0,
      };
      p.attempted += row.attempted;
      p.dispatched += row.dispatched;
      p.delivered += row.delivered;
      p.failed += row.failed;
      p.rts += row.rts;
      providerCounts.set(providerKey, p);

      const regionKey = row.region || "unknown";
      const r = regionCounts.get(regionKey) ?? {
        attempted: 0,
        dispatched: 0,
        delivered: 0,
        failed: 0,
        rts: 0,
      };
      r.attempted += row.attempted;
      r.dispatched += row.dispatched;
      r.delivered += row.delivered;
      r.failed += row.failed;
      r.rts += row.rts;
      regionCounts.set(regionKey, r);
    }

    return {
      overall: buildSummaryFromCounts(overallCounts),
      byProvider: Array.from(providerCounts.entries()).map(([provider, counts]) => ({
        provider,
        ...buildSummaryFromCounts(counts),
      })),
      byRegion: Array.from(regionCounts.entries()).map(([region, counts]) => ({
        region,
        ...buildSummaryFromCounts(counts),
      })),
      sinceDayKey,
      windowDays: sinceDays,
    };
  },
});
