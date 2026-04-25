import { query, mutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id, Doc } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { upsertOrderDigest } from "./performanceHelpers";
import { assertStoreRole } from "./storeAccess";
import { isStoreOverflowLocked, maskCustomerData } from "./canonicalBilling";
import { normalizeDeliveryTypeForStorage } from "../lib/order-delivery-display";
import { validateAlgerianPhone } from "../lib/phone-validation";
import {
  assertOrderStatusTransition,
  normalizeOrderStatus,
  type OrderStatus,
} from "../lib/order-lifecycle";
import {
  assertCanReconcileCodPayment,
  getCodPaymentStatusForOrderStatus,
  type CodPaymentStatus,
} from "../lib/order-cod-payment";
import { mapDeliveryProviderStatusToOrderStatus } from "../lib/delivery-status-sync";
import {
  getCallOutcomeLifecycleTransition,
  hasAnsweredCallEvidence,
  isCallOutcome,
  type OrderRiskFlag,
} from "../lib/order-confirmation";

const orderStatusValidator = v.union(
  v.literal("new"),
  v.literal("awaiting_confirmation"),
  v.literal("confirmed"),
  v.literal("cancelled"),
  v.literal("blocked"),
  v.literal("dispatch_ready"),
  v.literal("dispatched"),
  v.literal("in_transit"),
  v.literal("delivered"),
  v.literal("delivery_failed"),
  v.literal("refused"),
  v.literal("unreachable"),
  v.literal("returned"),
  v.literal("cod_collected"),
  v.literal("cod_reconciled")
);

const callOutcomeValidator = v.union(
  v.literal("answered"),
  v.literal("no_answer"),
  v.literal("wrong_number"),
  v.literal("refused")
);

const INITIAL_COD_PAYMENT_STATUS: CodPaymentStatus = "pending_collection";

const PUBLIC_ORDER_MAX_ITEMS = 20;
const PUBLIC_ORDER_MAX_QUANTITY = 99;
const PUBLIC_ORDER_STORE_WINDOW_MS = 10 * 60 * 1000;
const PUBLIC_ORDER_STORE_WINDOW_MAX = 50;
const PUBLIC_ORDER_PHONE_WINDOW_MS = 15 * 60 * 1000;
const PUBLIC_ORDER_PHONE_WINDOW_MAX = 3;
const PUBLIC_ORDER_DUPLICATE_WINDOW_MS = 30 * 60 * 1000;
const PUBLIC_ORDER_IDEMPOTENCY_PATTERN = /^[A-Za-z0-9._:-]{8,120}$/;
const CANONICAL_DAILY_ORDER_LIMIT = 5;
const ALGIERS_OFFSET_MS = 60 * 60 * 1000;

function toDeliveryEventType(status: string): "delivered" | "failed" | "rts" | null {
  const canonicalStatus = normalizeOrderStatus(status);

  if (canonicalStatus === "delivered") {
    return "delivered";
  }

  if (
    canonicalStatus === "cancelled" ||
    canonicalStatus === "blocked" ||
    canonicalStatus === "delivery_failed" ||
    canonicalStatus === "refused" ||
    canonicalStatus === "unreachable"
  ) {
    return "failed";
  }

  if (canonicalStatus === "returned") {
    return "rts";
  }

  return null;
}

const DISPATCH_RECORDED_STATUSES = new Set<OrderStatus>([
  "dispatch_ready",
  "dispatched",
  "in_transit",
  "delivered",
  "delivery_failed",
  "refused",
  "unreachable",
  "returned",
  "cod_collected",
  "cod_reconciled",
]);

function isDispatchRecordedStatus(status: unknown) {
  const canonicalStatus = normalizeOrderStatus(status);
  return Boolean(canonicalStatus && DISPATCH_RECORDED_STATUSES.has(canonicalStatus));
}

function getCodPaymentPatchForStatus(status: unknown) {
  const codPaymentStatus = getCodPaymentStatusForOrderStatus(status);
  return codPaymentStatus ? { codPaymentStatus } : {};
}

const MAX_LEGACY_TIMELINE_ENTRIES = 30;
const MAX_LEGACY_CALL_LOG_ENTRIES = 20;

function clampTimeline(
  timeline: Array<{ status: string; timestamp: number; note?: string }>
) {
  if (timeline.length <= MAX_LEGACY_TIMELINE_ENTRIES) {
    return timeline;
  }
  return timeline.slice(timeline.length - MAX_LEGACY_TIMELINE_ENTRIES);
}

function clampCallLog(
  callLog: Array<{ id: string; timestamp: number; outcome: string; notes?: string }>
) {
  if (callLog.length <= MAX_LEGACY_CALL_LOG_ENTRIES) {
    return callLog;
  }
  return callLog.slice(callLog.length - MAX_LEGACY_CALL_LOG_ENTRIES);
}

// Helper to verify store ownership via order
async function assertOrderOwnership(ctx: { db: { get: (id: Id<"orders">) => Promise<Doc<"orders"> | null> } } & Parameters<typeof assertStoreRole>[0], orderId: Id<"orders">) {
  const order = await ctx.db.get(orderId) as Doc<"orders"> | null;
  if (!order) {
    throw new Error("Order not found");
  }

  const { identity, store } = await assertStoreRole(ctx, order.storeId as Id<"stores">, "owner");
  return { identity, order, store };
}

// Helper to verify store ownership directly
async function assertStoreOwnership(ctx: Parameters<typeof assertStoreRole>[0], storeId: Id<"stores">) {
  return await assertStoreRole(ctx, storeId, "owner");
}

async function appendTimelineEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  order: Doc<"orders">,
  status: string,
  note: string | undefined,
  timestamp: number
) {
  await ctx.db.insert("orderTimelineEvents", {
    orderId: order._id,
    storeId: order.storeId,
    status,
    note,
    createdAt: timestamp,
  });
}

async function appendCallEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  order: Doc<"orders">,
  outcome: string,
  notes: string | undefined,
  timestamp: number
) {
  await ctx.db.insert("orderCallEvents", {
    orderId: order._id,
    storeId: order.storeId,
    outcome,
    notes,
    createdAt: timestamp,
  });
}

function normalizePublicText(value: string, maxLength: number) {
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function normalizePhoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

function assertValidPublicIdempotencyKey(value?: string) {
  if (!value) return undefined;
  const normalized = value.trim();
  if (!PUBLIC_ORDER_IDEMPOTENCY_PATTERN.test(normalized)) {
    throw new Error("PUBLIC_ORDER_INVALID_IDEMPOTENCY_KEY");
  }
  return normalized;
}

function getAlgiersDayKey(timestamp: number = Date.now()): string {
  const algiers = new Date(timestamp + ALGIERS_OFFSET_MS);
  return `${algiers.getFullYear()}-${String(algiers.getMonth() + 1).padStart(2, "0")}-${String(algiers.getDate()).padStart(2, "0")}`;
}

function getWilayaLookupValues(wilaya: string) {
  const values = new Set<string>();
  const trimmed = wilaya.trim();
  if (trimmed) values.add(trimmed);

  const parts = trimmed.split(" - ").map((part) => part.trim()).filter(Boolean);
  for (const part of parts) {
    values.add(part);
  }

  const numberMatch = trimmed.match(/^(\d+)/);
  if (numberMatch?.[1]) {
    values.add(numberMatch[1]);
  }

  return values;
}

function getVariantPriceModifier(
  product: Doc<"products">,
  variant: string | undefined
) {
  if (!variant || !product.variants?.length) {
    return 0;
  }

  const selectedOptions = new Set(
    variant
      .split(" - ")
      .map((option) => option.trim())
      .filter(Boolean)
  );

  let modifier = 0;
  for (const variantGroup of product.variants) {
    const selected = variantGroup.options.find((option) => selectedOptions.has(option.name));
    modifier += selected?.priceModifier ?? 0;
  }
  return modifier;
}

function getOrderProductsSignature(
  products: Array<{ productId: string; quantity: number; variant?: string }>
) {
  return products
    .map((product) => `${product.productId}:${product.variant ?? ""}:${product.quantity}`)
    .sort()
    .join("|");
}

function getPublicOrderRiskFlags(
  recentOrders: Doc<"orders">[],
  normalizedPhone: string,
  recentPhoneOrders: Doc<"orders">[]
): OrderRiskFlag[] {
  const flags = new Set<OrderRiskFlag>();
  const samePhoneOrders = recentOrders.filter(
    (order) => normalizePhoneDigits(order.customerPhone) === normalizedPhone
  );

  if (samePhoneOrders.length > 0) {
    flags.add("duplicate_phone");
  }

  const negativeHistoryCount = samePhoneOrders.filter((order) => {
    const status = normalizeOrderStatus(order.status);
    return status === "cancelled" || status === "refused";
  }).length;

  if (negativeHistoryCount >= 2) {
    flags.add("repeated_cancelled_or_refused");
  }

  if (recentPhoneOrders.length >= PUBLIC_ORDER_PHONE_WINDOW_MAX - 1) {
    flags.add("high_frequency_submissions");
  }

  return [...flags];
}

async function getPublicDeliveryCost(
  ctx: MutationCtx,
  storeId: Id<"stores">,
  wilaya: string,
  deliveryType: string | undefined
) {
  const pricing = await ctx.db
    .query("deliveryPricing")
    .withIndex("storeId", (q) => q.eq("storeId", storeId))
    .collect();

  const lookupValues = getWilayaLookupValues(wilaya);
  const match = pricing.find((entry) => lookupValues.has(entry.wilaya));
  const normalizedDeliveryType = normalizeDeliveryTypeForStorage(deliveryType);

  if (!match) {
    return normalizedDeliveryType === "domicile" ? 600 : 400;
  }

  return normalizedDeliveryType === "domicile"
    ? (match.homeDelivery ?? 0)
    : (match.officeDelivery ?? 0);
}

async function updatePublicOrderBillingState(
  ctx: MutationCtx,
  store: Doc<"stores">,
  now: number
) {
  const nextOrderCount = (store.orderCount || 0) + 1;
  const patch: Record<string, unknown> = {
    orderCount: nextOrderCount,
    updatedAt: now,
  };

  if (store.billingCompatibilityMode === "canonical") {
    const todayKey = getAlgiersDayKey(now);
    const orderDigests = await ctx.db
      .query("orderDigests")
      .withIndex("storeUpdatedAt", (q) => q.eq("storeId", store._id))
      .order("desc")
      .take(100);

    const todayOrderCount = orderDigests.filter(
      (digest) => getAlgiersDayKey(digest.createdAt) === todayKey
    ).length;

    if (todayOrderCount > CANONICAL_DAILY_ORDER_LIMIT && store.billingState !== "overflow_locked") {
      patch.billingState = "overflow_locked";
      patch.billingStateUpdatedAt = now;
    }
  }

  await ctx.db.patch(store._id, patch);
}

async function resolvePublicOrderProducts(
  ctx: MutationCtx,
  storeId: Id<"stores">,
  items: Array<{
    productId: Id<"products">;
    quantity: number;
    variant?: string;
  }>
) {
  const byProductAndVariant = new Map<
    string,
    { productId: Id<"products">; quantity: number; variant?: string }
  >();

  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > PUBLIC_ORDER_MAX_QUANTITY) {
      throw new Error("PUBLIC_ORDER_INVALID_PRODUCT");
    }

    const variant = item.variant ? normalizePublicText(item.variant, 120) : undefined;
    const key = `${item.productId}:${variant ?? ""}`;
    const existing = byProductAndVariant.get(key);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      byProductAndVariant.set(key, {
        productId: item.productId,
        quantity: item.quantity,
        variant,
      });
    }
  }

  const resolvedProducts = [];
  for (const item of byProductAndVariant.values()) {
    const product = await ctx.db.get(item.productId);
    if (!product || product.storeId !== storeId || product.isArchived === true) {
      throw new Error("PUBLIC_ORDER_INVALID_PRODUCT");
    }

    const unitPrice = product.basePrice + getVariantPriceModifier(product, item.variant);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new Error("PUBLIC_ORDER_INVALID_PRODUCT");
    }

    resolvedProducts.push({
      productId: product._id,
      name: product.name,
      image: product.images?.[0],
      price: unitPrice,
      quantity: item.quantity,
      variant: item.variant,
    });
  }

  return resolvedProducts;
}

// Get all orders for a store
export const getOrders = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    // Verify ownership for security
    await assertStoreOwnership(ctx, args.storeId);

    const orders = await ctx.db
      .query("orders")
      .withIndex("storeId", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .collect();
    
    // Apply masking if store is overflow locked
    const isOverflowLocked = await isStoreOverflowLocked(ctx, args.storeId);
    if (isOverflowLocked) {
      return orders.map(maskCustomerData);
    }
    
    return orders;
  },
});

// Get a single order by ID
export const getOrder = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const { order, store } = await assertOrderOwnership(ctx, args.orderId);
    
    // Apply masking if store is overflow locked
    const isOverflowLocked = await isStoreOverflowLocked(ctx, store._id);
    if (isOverflowLocked) {
      return maskCustomerData(order);
    }
    
    return order;
  },
});

// Get orders by status
export const getOrdersByStatus = query({
  args: { storeId: v.id("stores"), status: orderStatusValidator },
  handler: async (ctx, args) => {
    await assertStoreOwnership(ctx, args.storeId);

    const orders = await ctx.db
      .query("orders")
      .withIndex("status", (q) =>
        q.eq("storeId", args.storeId).eq("status", args.status)
      )
      .order("desc")
      .collect();
    
    // Apply masking if store is overflow locked
    const isOverflowLocked = await isStoreOverflowLocked(ctx, args.storeId);
    if (isOverflowLocked) {
      return orders.map(maskCustomerData);
    }
    
    return orders;
  },
});

// Get count of new orders
export const getNewOrdersCount = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    await assertStoreOwnership(ctx, args.storeId);

    const orders = await ctx.db
      .query("orderDigests")
      .withIndex("storeStatusUpdatedAt", (q) =>
        q.eq("storeId", args.storeId).eq("status", "new")
      )
      .collect();
    return orders.length;
  },
});

// Get order by order number
export const getOrderByNumber = query({
  args: { storeId: v.id("stores"), orderNumber: v.string() },
  handler: async (ctx, args) => {
    await assertStoreOwnership(ctx, args.storeId);

    const order = await ctx.db
      .query("orders")
      .withIndex("storeOrderNumber", (q) =>
        q.eq("storeId", args.storeId).eq("orderNumber", args.orderNumber)
      )
      .first();
    
    if (!order) return null;
    
    // Apply masking if store is overflow locked
    const isOverflowLocked = await isStoreOverflowLocked(ctx, args.storeId);
    if (isOverflowLocked) {
      return maskCustomerData(order);
    }
    
    return order;
  },
});

// Lightweight order list read path for high-frequency list UIs.
export const getOrderDigests = query({
  args: {
    storeId: v.id("stores"),
    status: v.optional(orderStatusValidator),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertStoreOwnership(ctx, args.storeId);
    const limit = Math.min(200, Math.max(1, args.limit ?? 100));

    let digests;
    if (args.status) {
      digests = await ctx.db
        .query("orderDigests")
        .withIndex("storeStatusUpdatedAt", (q) =>
          q.eq("storeId", args.storeId).eq("status", args.status!)
        )
        .order("desc")
        .take(limit);
    } else {
      digests = await ctx.db
        .query("orderDigests")
        .withIndex("storeUpdatedAt", (q) => q.eq("storeId", args.storeId))
        .order("desc")
        .take(limit);
    }
    
    // Apply masking if store is overflow locked
    const isOverflowLocked = await isStoreOverflowLocked(ctx, args.storeId);
    if (isOverflowLocked) {
      return digests.map(maskCustomerData);
    }
    
    return digests;
  },
});

// Create a new order
export const createOrder = mutation({
  args: {
    storeId: v.id("stores"),
    orderNumber: v.string(),
    customerName: v.string(),
    customerPhone: v.string(),
    customerWilaya: v.string(),
    customerCommune: v.optional(v.string()),
    customerAddress: v.optional(v.string()),
    products: v.array(
      v.object({
        productId: v.string(),
        name: v.string(),
        image: v.optional(v.string()),
        price: v.number(),
        quantity: v.number(),
        variant: v.optional(v.string()),
      })
    ),
    subtotal: v.number(),
    deliveryCost: v.number(),
    total: v.number(),
    deliveryType: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify ownership of the store
    const { store } = await assertStoreOwnership(ctx, args.storeId);
    
    const now = Date.now();
    const normalizedDeliveryType = normalizeDeliveryTypeForStorage(args.deliveryType);
    const orderId = await ctx.db.insert("orders", {
      storeId: args.storeId,
      orderNumber: args.orderNumber,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      customerWilaya: args.customerWilaya,
      customerCommune: args.customerCommune,
      customerAddress: args.customerAddress,
      products: args.products,
      subtotal: args.subtotal,
      deliveryCost: args.deliveryCost,
      total: args.total,
      deliveryType: normalizedDeliveryType,
      status: "new",
      paymentStatus: "pending",
      codPaymentStatus: INITIAL_COD_PAYMENT_STATUS,
      callAttempts: 0,
      timeline: [
        {
          status: "new",
          timestamp: now,
          note: "تم إنشاء الطلب",
        },
      ],
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    // Update store order count
    const nextOrderCount = (store.orderCount || 0) + 1;
    if (store.orderCount !== nextOrderCount || store.updatedAt !== now) {
      await ctx.db.patch(args.storeId, {
        orderCount: nextOrderCount,
        updatedAt: now,
      });
    }

const createdOrder = await ctx.db.get(orderId);
    if (createdOrder) {
      await upsertOrderDigest(ctx, createdOrder);
      const firstTimeline = createdOrder.timeline?.[0];
      await appendTimelineEvent(
        ctx,
        createdOrder,
        firstTimeline?.status ?? "new",
        firstTimeline?.note,
        firstTimeline?.timestamp ?? now
      );

      await ctx.runMutation(api.canonicalBilling.checkAndUpdateOverflowState, {
        storeId: args.storeId,
      });
    }

    return orderId;
  },
});

export const createPublicOrder = mutation({
  args: {
    storeSlug: v.string(),
    idempotencyKey: v.optional(v.string()),
    customerName: v.string(),
    customerPhone: v.string(),
    customerWilaya: v.string(),
    customerCommune: v.optional(v.string()),
    customerAddress: v.optional(v.string()),
    products: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
        variant: v.optional(v.string()),
      })
    ),
    deliveryType: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const storeSlug = normalizePublicText(args.storeSlug, 120);
    if (!storeSlug) {
      throw new Error("PUBLIC_ORDER_INVALID_STORE");
    }

    const store = await ctx.db
      .query("stores")
      .withIndex("slug", (q) => q.eq("slug", storeSlug))
      .first();

    if (!store || store.status === "archived") {
      throw new Error("PUBLIC_ORDER_INVALID_STORE");
    }

    const idempotencyKey = assertValidPublicIdempotencyKey(args.idempotencyKey);
    if (idempotencyKey) {
      const existingOrder = await ctx.db
        .query("orders")
        .withIndex("storeIdempotencyKey", (q) =>
          q.eq("storeId", store._id).eq("publicIdempotencyKey", idempotencyKey)
        )
        .first();

      if (existingOrder) {
        return {
          orderId: existingOrder._id,
          orderNumber: existingOrder.orderNumber,
          duplicate: true,
          totals: {
            subtotal: existingOrder.subtotal,
            deliveryCost: existingOrder.deliveryCost,
            total: existingOrder.total,
          },
        };
      }
    }

    const customerName = normalizePublicText(args.customerName, 120);
    const customerPhone = normalizePublicText(args.customerPhone, 30);
    const customerWilaya = normalizePublicText(args.customerWilaya, 120);
    const customerCommune = args.customerCommune
      ? normalizePublicText(args.customerCommune, 120)
      : undefined;
    const customerAddress = args.customerAddress
      ? normalizePublicText(args.customerAddress, 240)
      : undefined;
    const notes = args.notes ? normalizePublicText(args.notes, 500) : undefined;

    if (!customerName || !customerPhone || !customerWilaya) {
      throw new Error("PUBLIC_ORDER_MISSING_FIELDS");
    }

    const phoneValidation = validateAlgerianPhone(customerPhone);
    if (!phoneValidation.isValid) {
      throw new Error("PUBLIC_ORDER_INVALID_PHONE");
    }

    if (args.products.length < 1 || args.products.length > PUBLIC_ORDER_MAX_ITEMS) {
      throw new Error("PUBLIC_ORDER_INVALID_PRODUCT");
    }

    const resolvedProducts = await resolvePublicOrderProducts(
      ctx,
      store._id,
      args.products
    );

    const now = Date.now();
    const normalizedPhone = normalizePhoneDigits(customerPhone);
    const recentOrders = await ctx.db
      .query("orders")
      .withIndex("storeCreatedAt", (q) => q.eq("storeId", store._id))
      .order("desc")
      .take(100);

    const storeRecentCount = recentOrders.filter(
      (order) => now - order.createdAt <= PUBLIC_ORDER_STORE_WINDOW_MS
    ).length;
    if (storeRecentCount >= PUBLIC_ORDER_STORE_WINDOW_MAX) {
      throw new Error("PUBLIC_ORDER_STORE_VELOCITY_LIMIT");
    }

    const recentPhoneOrders = recentOrders.filter(
      (order) =>
        normalizePhoneDigits(order.customerPhone) === normalizedPhone &&
        now - order.createdAt <= PUBLIC_ORDER_PHONE_WINDOW_MS
    );

    if (recentPhoneOrders.length >= PUBLIC_ORDER_PHONE_WINDOW_MAX) {
      throw new Error("PUBLIC_ORDER_PHONE_VELOCITY_LIMIT");
    }

    const riskFlags = getPublicOrderRiskFlags(
      recentOrders,
      normalizedPhone,
      recentPhoneOrders
    );

    const productSignature = getOrderProductsSignature(resolvedProducts);
    const recentDuplicate = recentOrders.find(
      (order) =>
        normalizePhoneDigits(order.customerPhone) === normalizedPhone &&
        now - order.createdAt <= PUBLIC_ORDER_DUPLICATE_WINDOW_MS &&
        getOrderProductsSignature(order.products) === productSignature
    );

    if (recentDuplicate) {
      throw new Error("PUBLIC_ORDER_DUPLICATE_RECENT");
    }

    const subtotal = resolvedProducts.reduce(
      (sum, product) => sum + product.price * product.quantity,
      0
    );
    const deliveryCost = await getPublicDeliveryCost(
      ctx,
      store._id,
      customerWilaya,
      args.deliveryType
    );
    const total = subtotal + deliveryCost;
    const normalizedDeliveryType = normalizeDeliveryTypeForStorage(args.deliveryType);
    const orderNumber = `ORD-${now.toString(36).toUpperCase()}-${String(recentOrders.length + 1)
      .padStart(3, "0")}`;
    const initialTimeline = [
      {
        status: "new",
        timestamp: now,
        note: "Public checkout order created",
      },
      ...(riskFlags.length > 0
        ? [
            {
              status: "risk_flagged",
              timestamp: now,
              note: `Risk flags: ${riskFlags.join(", ")}`,
            },
          ]
        : []),
    ];

    const orderId = await ctx.db.insert("orders", {
      storeId: store._id,
      orderNumber,
      customerName,
      customerPhone,
      customerWilaya,
      customerCommune,
      customerAddress,
      products: resolvedProducts,
      subtotal,
      deliveryCost,
      total,
      deliveryType: normalizedDeliveryType,
      status: "new",
      paymentStatus: "pending",
      codPaymentStatus: INITIAL_COD_PAYMENT_STATUS,
      callAttempts: 0,
      publicIdempotencyKey: idempotencyKey,
      riskFlags: riskFlags.length > 0 ? riskFlags : undefined,
      timeline: initialTimeline,
      notes,
      createdAt: now,
      updatedAt: now,
    });

    const createdOrder = await ctx.db.get(orderId);
    if (createdOrder) {
      await upsertOrderDigest(ctx, createdOrder);
      for (const timelineEvent of createdOrder.timeline || []) {
        await appendTimelineEvent(
          ctx,
          createdOrder,
          timelineEvent.status,
          timelineEvent.note,
          timelineEvent.timestamp
        );
      }
    }

    await updatePublicOrderBillingState(ctx, store, now);

    return {
      orderId,
      orderNumber,
      duplicate: false,
      totals: {
        subtotal,
        deliveryCost,
        total,
      },
    };
  },
});

// Update order status
export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: orderStatusValidator,
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertOrderOwnership(ctx, args.orderId);

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status === args.status && !args.note) {
      return args.orderId;
    }

    assertOrderStatusTransition(order.status, args.status, "merchant");
    if (args.status === "confirmed" && !hasAnsweredCallEvidence(order)) {
      throw new Error("ORDER_CONFIRMATION_REQUIRES_ANSWERED_CALL");
    }
    if (args.status === "cod_reconciled") {
      assertCanReconcileCodPayment(order.status, order.codPaymentStatus);
    }

    const now = Date.now();
    const timelineNote = args.note || `Status changed to ${args.status}`;
    const timeline = clampTimeline([
      ...(order.timeline || []),
      {
        status: args.status,
        timestamp: now,
        note: timelineNote,
      },
    ]);

    await ctx.db.patch(args.orderId, {
      status: args.status,
      ...getCodPaymentPatchForStatus(args.status),
      timeline,
      updatedAt: now,
    });

    const updatedOrder = await ctx.db.get(args.orderId);
    if (updatedOrder) {
      await appendTimelineEvent(ctx, updatedOrder, args.status, timelineNote, now);
      await upsertOrderDigest(ctx, updatedOrder);
    }

    const analyticsEventType = toDeliveryEventType(args.status);
    if (analyticsEventType) {
      await ctx.runMutation(api.deliveryAnalytics.recordDeliveryEvent, {
        storeId: order.storeId as Id<"stores">,
        orderId: String(args.orderId),
        eventType: analyticsEventType,
        provider: order.deliveryProvider ?? "unknown",
        region: order.customerWilaya,
        trackingNumber: order.trackingNumber,
        source: "orders.updateOrderStatus",
        createdAt: now,
      });
    }

    return args.orderId;
  },
});

export const bulkUpdateOrderStatus = mutation({
  args: {
    orderIds: v.array(v.id("orders")),
    status: orderStatusValidator,
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let updatedCount = 0;

    for (const orderId of args.orderIds) {
      let order: Doc<"orders"> | null = null;
      try {
        const owned = await assertOrderOwnership(ctx, orderId);
        order = owned.order;
      } catch {
        continue;
      }

      if (!order) {
        continue;
      }

      if (order.status === args.status && !args.note) {
        continue;
      }

      assertOrderStatusTransition(order.status, args.status, "merchant");
      if (args.status === "confirmed" && !hasAnsweredCallEvidence(order)) {
        throw new Error("ORDER_CONFIRMATION_REQUIRES_ANSWERED_CALL");
      }
      if (args.status === "cod_reconciled") {
        assertCanReconcileCodPayment(order.status, order.codPaymentStatus);
      }

      const now = Date.now();
      const timelineNote = args.note || `Status changed to ${args.status}`;
      const timeline = clampTimeline([
        ...(order.timeline || []),
        {
          status: args.status,
          timestamp: now,
          note: timelineNote,
        },
      ]);

      await ctx.db.patch(orderId, {
        status: args.status,
        ...getCodPaymentPatchForStatus(args.status),
        timeline,
        updatedAt: now,
      });

      const updatedOrder = await ctx.db.get(orderId);
      if (updatedOrder) {
        await appendTimelineEvent(ctx, updatedOrder, args.status, timelineNote, now);
        await upsertOrderDigest(ctx, updatedOrder);
      }

      updatedCount += 1;
    }

    return { updatedCount };
  },
});
// Add call log to order
export const addCallLog = mutation({
  args: {
    orderId: v.id("orders"),
    outcome: callOutcomeValidator,
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!isCallOutcome(args.outcome)) {
      throw new Error(`Unknown call outcome: ${String(args.outcome)}`);
    }

    const { order } = await assertOrderOwnership(ctx, args.orderId);

    const now = Date.now();
    const notes = args.notes?.trim() ? args.notes.trim().slice(0, 500) : undefined;
    const callEntry = {
      id: `call_${now}`,
      timestamp: now,
      outcome: args.outcome,
      notes,
    };

    const callLog = clampCallLog([...(order.callLog || []), callEntry]);
    const nextStatus = getCallOutcomeLifecycleTransition(order, args.outcome, callLog);
    if (nextStatus) {
      assertOrderStatusTransition(order.status, nextStatus, "system");
    }

    const timelineNote = `Call: ${args.outcome}${notes ? ` - ${notes}` : ""}`;
    const timelineEntries = [
      {
        status: "call_log",
        timestamp: now,
        note: timelineNote,
      },
      ...(nextStatus && normalizeOrderStatus(order.status) !== nextStatus
        ? [
            {
              status: nextStatus,
              timestamp: now,
              note: `Call outcome ${args.outcome} moved order to ${nextStatus}`,
            },
          ]
        : []),
    ];
    const timeline = clampTimeline([...(order.timeline || []), ...timelineEntries]);

    const patch: {
      callAttempts: number;
      lastCallOutcome: string;
      lastCallAt: number;
      callLog: Array<{ id: string; timestamp: number; outcome: string; notes?: string }>;
      timeline: Array<{ status: string; timestamp: number; note?: string }>;
      updatedAt: number;
      status?: string;
      codPaymentStatus?: CodPaymentStatus;
    } = {
      callAttempts: (order.callAttempts || 0) + 1,
      lastCallOutcome: args.outcome,
      lastCallAt: now,
      callLog,
      timeline,
      updatedAt: now,
    };

    if (nextStatus && normalizeOrderStatus(order.status) !== nextStatus) {
      patch.status = nextStatus;
      Object.assign(patch, getCodPaymentPatchForStatus(nextStatus));
    }

    await ctx.db.patch(args.orderId, patch);

    const updatedOrder = await ctx.db.get(args.orderId);
    if (updatedOrder) {
      await appendCallEvent(ctx, updatedOrder, args.outcome, notes, now);
      for (const event of timelineEntries) {
        await appendTimelineEvent(ctx, updatedOrder, event.status, event.note, event.timestamp);
      }
      await upsertOrderDigest(ctx, updatedOrder);
    }

    return {
      orderId: args.orderId,
      status: updatedOrder?.status ?? patch.status ?? order.status,
      callEntry,
    };
  },
});
// Update tracking number
export const updateTrackingNumber = mutation({
  args: {
    orderId: v.id("orders"),
    trackingNumber: v.string(),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { order } = await assertOrderOwnership(ctx, args.orderId);

    const normalizedProvider = args.provider ?? order.deliveryProvider;
    const noTrackingChange =
      order.trackingNumber === args.trackingNumber &&
      order.deliveryProvider === normalizedProvider;

    if (noTrackingChange) {
      return args.orderId;
    }

    const now = Date.now();
    const timelineNote = `Tracking added: ${args.trackingNumber}`;
    const timeline = clampTimeline([
      ...(order.timeline || []),
      {
        status: "tracking",
        timestamp: now,
        note: timelineNote,
      },
    ]);

    await ctx.db.patch(args.orderId, {
      trackingNumber: args.trackingNumber,
      deliveryProvider: normalizedProvider,
      deliveryDispatchedAt: now,
      timeline,
      updatedAt: now,
    });

    const updatedOrder = await ctx.db.get(args.orderId);
    if (updatedOrder) {
      await appendTimelineEvent(ctx, updatedOrder, "tracking", timelineNote, now);
      await upsertOrderDigest(ctx, updatedOrder);
    }

    await ctx.runMutation(api.deliveryAnalytics.recordDeliveryEvent, {
      storeId: order.storeId as Id<"stores">,
      orderId: String(args.orderId),
      eventType: "dispatched",
      provider: normalizedProvider ?? "unknown",
      region: order.customerWilaya,
      trackingNumber: args.trackingNumber,
      source: "orders.updateTrackingNumber",
      createdAt: now,
    });

    return args.orderId;
  },
});
export const markOrderDispatchedFromDeliveryApi = mutation({
  args: {
    orderId: v.id("orders"),
    trackingNumber: v.string(),
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    const { order } = await assertOrderOwnership(ctx, args.orderId);
    const currentStatus = normalizeOrderStatus(order.status);

    if (!currentStatus) {
      throw new Error(`Unknown current order status: ${String(order.status)}`);
    }

    if (
      order.trackingNumber === args.trackingNumber &&
      order.deliveryProvider === args.provider &&
      isDispatchRecordedStatus(currentStatus)
    ) {
      return {
        orderId: args.orderId,
        status: currentStatus,
        trackingNumber: args.trackingNumber,
        provider: args.provider,
        duplicate: true,
      };
    }

    if (currentStatus !== "confirmed") {
      throw new Error("Order must be confirmed before dispatch.");
    }

    const now = Date.now();
    const timelineNote = `Delivery dispatched with ${args.provider}. Tracking: ${args.trackingNumber}`;
    const timeline = clampTimeline([
      ...(order.timeline || []),
      {
        status: "dispatched",
        timestamp: now,
        note: timelineNote,
      },
    ]);

    assertOrderStatusTransition(currentStatus, "dispatched", "system");

    await ctx.db.patch(args.orderId, {
      status: "dispatched",
      ...getCodPaymentPatchForStatus("dispatched"),
      trackingNumber: args.trackingNumber,
      deliveryProvider: args.provider,
      deliveryDispatchedAt: now,
      timeline,
      updatedAt: now,
    });

    const updatedOrder = await ctx.db.get(args.orderId);
    if (updatedOrder) {
      await appendTimelineEvent(ctx, updatedOrder, "dispatched", timelineNote, now);
      await upsertOrderDigest(ctx, updatedOrder);
    }

    await ctx.runMutation(api.deliveryAnalytics.recordDeliveryEvent, {
      storeId: order.storeId as Id<"stores">,
      orderId: String(args.orderId),
      eventType: "dispatched",
      provider: args.provider,
      region: order.customerWilaya,
      trackingNumber: args.trackingNumber,
      source: "orders.markOrderDispatchedFromDeliveryApi",
      createdAt: now,
    });

    return {
      orderId: args.orderId,
      status: "dispatched",
      trackingNumber: args.trackingNumber,
      provider: args.provider,
      duplicate: false,
    };
  },
});

export const syncDeliveryProviderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    providerStatus: v.string(),
    provider: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
    note: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { order } = await assertOrderOwnership(ctx, args.orderId);
    const currentStatus = normalizeOrderStatus(order.status);
    const nextStatus = mapDeliveryProviderStatusToOrderStatus(args.providerStatus);

    if (!currentStatus) {
      throw new Error(`Unknown current order status: ${String(order.status)}`);
    }

    if (!nextStatus) {
      throw new Error(`Unknown provider delivery status: ${String(args.providerStatus)}`);
    }

    const provider = args.provider ?? order.deliveryProvider ?? "unknown";
    const trackingNumber = args.trackingNumber ?? order.trackingNumber;
    const metadataPatch: {
      deliveryProvider?: string;
      trackingNumber?: string;
    } = {};

    if (args.provider && args.provider !== order.deliveryProvider) {
      metadataPatch.deliveryProvider = args.provider;
    }

    if (args.trackingNumber && args.trackingNumber !== order.trackingNumber) {
      metadataPatch.trackingNumber = args.trackingNumber;
    }

    if (currentStatus === nextStatus) {
      if (Object.keys(metadataPatch).length === 0) {
        return {
          orderId: args.orderId,
          status: currentStatus,
          duplicate: true,
        };
      }

      const now = Date.now();
      await ctx.db.patch(args.orderId, {
        ...metadataPatch,
        updatedAt: now,
      });

      const updatedOrder = await ctx.db.get(args.orderId);
      if (updatedOrder) {
        await upsertOrderDigest(ctx, updatedOrder);
      }

      return {
        orderId: args.orderId,
        status: currentStatus,
        duplicate: true,
      };
    }

    assertOrderStatusTransition(currentStatus, nextStatus, "provider");

    const now = Date.now();
    const timelineNote =
      args.note?.trim() ||
      `Provider status ${args.providerStatus} mapped to ${nextStatus}`;
    const timeline = clampTimeline([
      ...(order.timeline || []),
      {
        status: nextStatus,
        timestamp: now,
        note: timelineNote,
      },
    ]);

    await ctx.db.patch(args.orderId, {
      status: nextStatus,
      ...getCodPaymentPatchForStatus(nextStatus),
      ...metadataPatch,
      timeline,
      updatedAt: now,
    });

    const updatedOrder = await ctx.db.get(args.orderId);
    if (updatedOrder) {
      await appendTimelineEvent(ctx, updatedOrder, nextStatus, timelineNote, now);
      await upsertOrderDigest(ctx, updatedOrder);
    }

    const analyticsEventType = toDeliveryEventType(nextStatus);
    if (analyticsEventType) {
      await ctx.runMutation(api.deliveryAnalytics.recordDeliveryEvent, {
        storeId: order.storeId as Id<"stores">,
        orderId: String(args.orderId),
        eventType: analyticsEventType,
        provider,
        region: order.customerWilaya,
        trackingNumber,
        reason: args.providerStatus,
        source: args.source ?? "orders.syncDeliveryProviderStatus",
        createdAt: now,
      });
    }

    return {
      orderId: args.orderId,
      status: nextStatus,
      duplicate: false,
    };
  },
});

export const reconcileCodPayment = mutation({
  args: {
    orderId: v.id("orders"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { order } = await assertOrderOwnership(ctx, args.orderId);
    assertCanReconcileCodPayment(order.status, order.codPaymentStatus);
    assertOrderStatusTransition(order.status, "cod_reconciled", "merchant");

    const now = Date.now();
    const timelineNote = args.note?.trim() || "COD payment reconciled";
    const timeline = clampTimeline([
      ...(order.timeline || []),
      {
        status: "cod_reconciled",
        timestamp: now,
        note: timelineNote,
      },
    ]);

    await ctx.db.patch(args.orderId, {
      status: "cod_reconciled",
      codPaymentStatus: "reconciled",
      timeline,
      updatedAt: now,
    });

    const updatedOrder = await ctx.db.get(args.orderId);
    if (updatedOrder) {
      await appendTimelineEvent(ctx, updatedOrder, "cod_reconciled", timelineNote, now);
      await upsertOrderDigest(ctx, updatedOrder);
    }

    return args.orderId;
  },
});
// Update order notes
export const updateOrderNotes = mutation({
  args: {
    orderId: v.id("orders"),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const { order } = await assertOrderOwnership(ctx, args.orderId);

    if ((order.notes ?? "") === args.notes) {
      return args.orderId;
    }

    const now = Date.now();
    await ctx.db.patch(args.orderId, {
      notes: args.notes,
      updatedAt: now,
    });

    const updatedOrder = await ctx.db.get(args.orderId);
    if (updatedOrder) {
      await upsertOrderDigest(ctx, updatedOrder);
    }

    return args.orderId;
  },
});
// Upsert single admin note for an order.
// Clearing is supported by passing an empty/whitespace-only string.
export const upsertAdminNote = mutation({
  args: {
    orderId: v.id("orders"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const { identity, order } = await assertOrderOwnership(ctx, args.orderId);

    const now = Date.now();
    const text = args.text.trim();

    const isUnchanged =
      (order.adminNoteText ?? "") === text &&
      order.adminNoteUpdatedBy === identity.subject;

    if (isUnchanged) {
      return args.orderId;
    }

    const isClearing = text.length === 0;
    const timelineNote = isClearing ? "Admin note cleared" : "Admin note updated";
    const timeline = clampTimeline([
      ...(order.timeline || []),
      {
        status: "admin_note",
        timestamp: now,
        note: timelineNote,
      },
    ]);

    await ctx.db.patch(args.orderId, {
      adminNoteText: text,
      adminNoteUpdatedAt: now,
      adminNoteUpdatedBy: identity.subject,
      timeline,
      updatedAt: now,
    });

    const updatedOrder = await ctx.db.get(args.orderId);
    if (updatedOrder) {
      await appendTimelineEvent(ctx, updatedOrder, "admin_note", timelineNote, now);
      await upsertOrderDigest(ctx, updatedOrder);
    }

    return args.orderId;
  },
});
// One-time cleanup to remove legacy adminNotes history and any old timeline entries.
// Does NOT migrate existing note text.
export const purgeLegacyAdminNotesForStore = mutation({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    await assertStoreOwnership(ctx, args.storeId);

    const orders = await ctx.db
      .query("orders")
      .withIndex("storeId", (q) => q.eq("storeId", args.storeId))
      .collect();

    let updatedCount = 0;

    for (const order of orders) {
      const orderAny = order as unknown as Record<string, unknown>;
      const _id = orderAny._id as Id<"orders">;
      const rest = { ...orderAny };
      delete rest._id;
      delete rest._creationTime;
      delete rest.adminNotes;

      const timelineRaw = rest.timeline;
      const timeline = Array.isArray(timelineRaw)
        ? timelineRaw.filter((entry) => {
            if (!entry || typeof entry !== "object") return true;
            const status = (entry as Record<string, unknown>).status;
            return status !== "admin_note";
          })
        : timelineRaw;

      const nextDoc: Record<string, unknown> = {
        ...rest,
        timeline,
        adminNoteText: "",
      };

      delete nextDoc.adminNoteUpdatedAt;
      delete nextDoc.adminNoteUpdatedBy;

      await ctx.db.replace(_id, nextDoc as Omit<Doc<"orders">, "_id" | "_creationTime">);
      updatedCount += 1;
    }

    return { updatedCount };
  },
});

// Hard delete order (permanent)
export const deleteOrder = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const { order } = await assertOrderOwnership(ctx, args.orderId);

    const digest = await ctx.db
      .query("orderDigests")
      .withIndex("orderId", (q) => q.eq("orderId", args.orderId))
      .first();

    if (digest) {
      await ctx.db.delete(digest._id);
    }

    const callEvents = await ctx.db
      .query("orderCallEvents")
      .withIndex("orderCreatedAt", (q) => q.eq("orderId", args.orderId))
      .collect();
    for (const event of callEvents) {
      await ctx.db.delete(event._id);
    }

    const timelineEvents = await ctx.db
      .query("orderTimelineEvents")
      .withIndex("orderCreatedAt", (q) => q.eq("orderId", args.orderId))
      .collect();
    for (const event of timelineEvents) {
      await ctx.db.delete(event._id);
    }

    await ctx.db.delete(args.orderId);

    // Best-effort store count correction.
    const store = await ctx.db.get(order.storeId as Id<"stores">);
    if (store && (store.orderCount ?? 0) > 0) {
      await ctx.db.patch(store._id, {
        orderCount: Math.max(0, (store.orderCount ?? 0) - 1),
        updatedAt: Date.now(),
      });
    }
  },
});

export const bulkDeleteOrders = mutation({
  args: { orderIds: v.array(v.id("orders")) },
  handler: async (ctx, args) => {
    let deletedCount = 0;

    for (const orderId of args.orderIds) {
      try {
        await assertOrderOwnership(ctx, orderId);
      } catch {
        continue;
      }

      const digest = await ctx.db
        .query("orderDigests")
        .withIndex("orderId", (q) => q.eq("orderId", orderId))
        .first();
      if (digest) {
        await ctx.db.delete(digest._id);
      }

      const callEvents = await ctx.db
        .query("orderCallEvents")
        .withIndex("orderCreatedAt", (q) => q.eq("orderId", orderId))
        .collect();
      for (const event of callEvents) {
        await ctx.db.delete(event._id);
      }

      const timelineEvents = await ctx.db
        .query("orderTimelineEvents")
        .withIndex("orderCreatedAt", (q) => q.eq("orderId", orderId))
        .collect();
      for (const event of timelineEvents) {
        await ctx.db.delete(event._id);
      }

      await ctx.db.delete(orderId);
      deletedCount += 1;
    }

    return { deletedCount };
  },
});
// Update order product quantity
export const updateOrderProductQuantity = mutation({
  args: {
    orderId: v.id("orders"),
    productIndex: v.number(),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const { order } = await assertOrderOwnership(ctx, args.orderId);

    const products = [...order.products];
    if (!products[args.productIndex]) {
      return;
    }

    if (products[args.productIndex].quantity === args.quantity) {
      return;
    }

    products[args.productIndex] = {
      ...products[args.productIndex],
      quantity: args.quantity,
    };

    const subtotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const total = subtotal + (order.deliveryCost || 0);

    await ctx.db.patch(args.orderId, {
      products,
      subtotal,
      total,
      updatedAt: Date.now(),
    });

    const updatedOrder = await ctx.db.get(args.orderId);
    if (updatedOrder) {
      await upsertOrderDigest(ctx, updatedOrder);
    }
  },
});
// Remove product from order
export const removeOrderProduct = mutation({
  args: {
    orderId: v.id("orders"),
    productIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const { order } = await assertOrderOwnership(ctx, args.orderId);

    type OrderProduct = { price: number; quantity: number };

    const products = order.products.filter((_: OrderProduct, i: number) => i !== args.productIndex);
    if (products.length === order.products.length) {
      return;
    }

    const subtotal = products.reduce((sum: number, p: OrderProduct) => sum + p.price * p.quantity, 0);
    const total = subtotal + (order.deliveryCost || 0);

    await ctx.db.patch(args.orderId, {
      products,
      subtotal,
      total,
      updatedAt: Date.now(),
    });

    const updatedOrder = await ctx.db.get(args.orderId);
    if (updatedOrder) {
      await upsertOrderDigest(ctx, updatedOrder);
    }
  },
});
// Add product to order
export const addProductToOrder = mutation({
  args: {
    orderId: v.id("orders"),
    product: v.object({
      productId: v.string(),
      name: v.string(),
      image: v.optional(v.string()),
      price: v.number(),
      quantity: v.number(),
      variant: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const { order } = await assertOrderOwnership(ctx, args.orderId);

    const products = [...order.products, args.product];
    const subtotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const total = subtotal + (order.deliveryCost || 0);

    await ctx.db.patch(args.orderId, {
      products,
      subtotal,
      total,
      updatedAt: Date.now(),
    });

    const updatedOrder = await ctx.db.get(args.orderId);
    if (updatedOrder) {
      await upsertOrderDigest(ctx, updatedOrder);
    }
  },
});
// Replace product in order (at specific index)
export const replaceOrderProduct = mutation({
  args: {
    orderId: v.id("orders"),
    productIndex: v.number(),
    product: v.object({
      productId: v.string(),
      name: v.string(),
      image: v.optional(v.string()),
      price: v.number(),
      quantity: v.number(),
      variant: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const { order } = await assertOrderOwnership(ctx, args.orderId);

    const products = [...order.products];
    if (!products[args.productIndex]) {
      return;
    }

    const current = products[args.productIndex];
    if (
      current.productId === args.product.productId &&
      current.name === args.product.name &&
      current.image === args.product.image &&
      current.price === args.product.price &&
      current.quantity === args.product.quantity &&
      current.variant === args.product.variant
    ) {
      return;
    }

    products[args.productIndex] = args.product;

    const subtotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const total = subtotal + (order.deliveryCost || 0);

    await ctx.db.patch(args.orderId, {
      products,
      subtotal,
      total,
      updatedAt: Date.now(),
    });

    const updatedOrder = await ctx.db.get(args.orderId);
    if (updatedOrder) {
      await upsertOrderDigest(ctx, updatedOrder);
    }
  },
});

