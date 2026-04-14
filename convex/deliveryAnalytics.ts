import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

type DeliveryEventType = "attempted" | "dispatched" | "delivered" | "failed" | "rts";

function normalizeDimension(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function buildSummary(events: Array<{ eventType: DeliveryEventType }>) {
  const counts: Record<DeliveryEventType, number> = {
    attempted: 0,
    dispatched: 0,
    delivered: 0,
    failed: 0,
    rts: 0,
  };

  for (const event of events) {
    counts[event.eventType] += 1;
  }

  const completed = counts.delivered + counts.failed + counts.rts;
  const successRate = completed > 0 ? counts.delivered / completed : 0;

  return {
    counts,
    completed,
    successRate,
  };
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
    const createdAt = args.createdAt ?? Date.now();

    return await ctx.db.insert("deliveryAnalyticsEvents", {
      storeId: args.storeId,
      orderId: normalizeDimension(args.orderId),
      eventType: args.eventType,
      provider: normalizeDimension(args.provider) ?? "unknown",
      region: normalizeDimension(args.region),
      trackingNumber: normalizeDimension(args.trackingNumber),
      reason: normalizeDimension(args.reason),
      source: normalizeDimension(args.source),
      createdAt,
    });
  },
});

export const getDeliveryPerformanceSummary = query({
  args: {
    storeId: v.id("stores"),
    provider: v.optional(v.string()),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const providerFilter = normalizeDimension(args.provider);
    const regionFilter = normalizeDimension(args.region);

    const allEvents = await ctx.db
      .query("deliveryAnalyticsEvents")
      .withIndex("storeCreatedAt", (q) => q.eq("storeId", args.storeId))
      .collect();

    const filtered = allEvents.filter((event) => {
      if (providerFilter && event.provider !== providerFilter) {
        return false;
      }
      if (regionFilter && event.region !== regionFilter) {
        return false;
      }
      return true;
    });

    const overall = buildSummary(filtered as Array<{ eventType: DeliveryEventType }>);

    const byProvider = new Map<string, Array<{ eventType: DeliveryEventType }>>();
    const byRegion = new Map<string, Array<{ eventType: DeliveryEventType }>>();

    for (const event of filtered as Array<{ provider: string; region?: string; eventType: DeliveryEventType }>) {
      const providerKey = event.provider || "unknown";
      const providerEvents = byProvider.get(providerKey) ?? [];
      providerEvents.push({ eventType: event.eventType });
      byProvider.set(providerKey, providerEvents);

      const regionKey = event.region || "unknown";
      const regionEvents = byRegion.get(regionKey) ?? [];
      regionEvents.push({ eventType: event.eventType });
      byRegion.set(regionKey, regionEvents);
    }

    return {
      overall,
      byProvider: Array.from(byProvider.entries()).map(([provider, events]) => ({
        provider,
        ...buildSummary(events),
      })),
      byRegion: Array.from(byRegion.entries()).map(([region, events]) => ({
        region,
        ...buildSummary(events),
      })),
    };
  },
});
