import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createDeliveryOrder, DeliveryProvider, DeliveryCredentials } from "@/lib/delivery-api";
import { toDeliveryApiProvider, normalizeDeliveryProvider } from "@/lib/delivery-provider";
import { normalizeOrderStatus, type OrderStatus } from "@/lib/order-lifecycle";
import {
  getDeliveryActionMessage,
  isDeliveryAuthRuntimeError,
  isLikelyProviderAvailabilityError,
  type ActionHint,
  type DeliveryActionCode,
} from "@/lib/order-action-feedback";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { Id } from "@/convex/_generated/dataModel";

type DeliveryIntegrationRuntimeResponse = {
  provider?: string;
  decryptionError?: string;
  credentials?: {
    apiKey?: string;
    apiToken?: string;
    apiSecret?: string;
    accountNumber?: string;
  };
};

type StoreDoc = {
  _id: Id<"stores">;
  ownerId: string;
  slug: string;
};

type DispatchOrderDoc = {
  _id: Id<"orders">;
  storeId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerWilaya: string;
  customerCommune?: string;
  customerAddress?: string;
  products: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  status: string;
  deliveryProvider?: string;
  trackingNumber?: string;
};

const CREATE_ORDER_RATE_LIMIT_WINDOW_MS = 60_000;
const CREATE_ORDER_RATE_LIMIT_MAX_REQUESTS = 20;
const createOrderRateLimit = new Map<string, { count: number; resetAt: number }>();
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

class HttpError extends Error {
  status: number;
  code: DeliveryActionCode;
  action?: ActionHint;

  constructor(status: number, code: DeliveryActionCode, message?: string, action?: ActionHint) {
    const safeMessage = message ?? getDeliveryActionMessage(code);
    super(safeMessage);
    this.code = code;
    this.status = status;
    this.action = action;
  }
}

function getConvexClient(authToken: string) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new HttpError(500, "DELIVERY_NOT_CONFIGURED", "Delivery service is not configured.");
  }

  const convex = new ConvexHttpClient(convexUrl);
  convex.setAuth(authToken);
  return convex;
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(",");
    if (firstIp) {
      return firstIp.trim();
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

function consumeRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { limited: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = createOrderRateLimit.get(key);

  if (!existing || existing.resetAt <= now) {
    createOrderRateLimit.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, retryAfterSeconds: 0 };
  }

  if (existing.count >= maxRequests) {
    return {
      limited: true,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  createOrderRateLimit.set(key, existing);
  return { limited: false, retryAfterSeconds: 0 };
}

function hasCredentials(credentials?: Partial<DeliveryCredentials> | null) {
  return Boolean(credentials?.apiKey && credentials?.apiSecret);
}

function isGlobalFallbackEnabled() {
  return process.env.DELIVERY_ALLOW_GLOBAL_CREDENTIAL_FALLBACK === "true";
}

function getEmergencyFallbackCredentials(provider: DeliveryProvider): DeliveryCredentials | null {
  if (!isGlobalFallbackEnabled()) {
    return null;
  }

  if (provider === "zr_express") {
    const apiKey = process.env.ZR_EXPRESS_API_KEY;
    const apiSecret = process.env.ZR_EXPRESS_API_SECRET;
    const accountNumber = process.env.ZR_EXPRESS_ACCOUNT_NUMBER;
    if (apiKey && apiSecret) {
      return { apiKey, apiSecret, accountNumber };
    }
    return null;
  }

  if (provider === "yalidine") {
    const apiKey = process.env.YALIDINE_API_KEY;
    const apiSecret = process.env.YALIDINE_API_SECRET ?? process.env.YALIDINE_API_TOKEN;
    if (apiKey && apiSecret) {
      return { apiKey, apiSecret };
    }
  }

  return null;
}

function parseProviderHint(provider: unknown): string | undefined {
  if (provider === undefined || provider === null || provider === "") {
    return undefined;
  }

  if (typeof provider !== "string") {
    throw new HttpError(400, "DELIVERY_BAD_REQUEST", "Invalid delivery provider.");
  }

  const normalizedProvider = normalizeDeliveryProvider(provider);
  if (normalizedProvider === "none") {
    throw new HttpError(400, "DELIVERY_BAD_REQUEST", "Invalid delivery provider.");
  }

  if (!toDeliveryApiProvider(normalizedProvider)) {
    throw new HttpError(400, "DELIVERY_PROVIDER_UNSUPPORTED");
  }

  return normalizedProvider;
}

async function resolveOwnedStoreId(
  convex: ConvexHttpClient,
  userId: string,
  storeId?: string,
  storeSlug?: string
) {
  if (!storeId && !storeSlug) {
    throw new HttpError(400, "DELIVERY_BAD_REQUEST", "Missing store context: provide storeId or storeSlug.");
  }

  let storeFromId: StoreDoc | null = null;
  if (storeId) {
    try {
      storeFromId = (await convex.query(api.stores.getStore, {
        storeId: storeId as Id<"stores">,
      })) as StoreDoc | null;
    } catch {
      throw new HttpError(400, "DELIVERY_BAD_REQUEST", "Invalid storeId.");
    }

    if (!storeFromId) {
      throw new HttpError(404, "DELIVERY_BAD_REQUEST", "Store not found.");
    }
  }

  let storeFromSlug: StoreDoc | null = null;
  if (storeSlug) {
    storeFromSlug = (await convex.query(api.stores.getStoreBySlug, {
      slug: storeSlug,
    })) as StoreDoc | null;

    if (!storeFromSlug) {
      throw new HttpError(404, "DELIVERY_BAD_REQUEST", "Store not found.");
    }
  }

  if (storeFromId && storeFromSlug && storeFromId._id !== storeFromSlug._id) {
    throw new HttpError(400, "DELIVERY_BAD_REQUEST", "storeId does not match storeSlug.");
  }

  const store = storeFromId ?? storeFromSlug;
  if (!store) {
    throw new HttpError(400, "DELIVERY_BAD_REQUEST", "Missing store context: provide storeId or storeSlug.");
  }

  if (store.ownerId !== userId) {
    throw new HttpError(403, "DELIVERY_FORBIDDEN");
  }

  return store._id;
}

async function loadDeliveryConfig(
  convex: ConvexHttpClient,
  storeId: Id<"stores">,
  providerHint?: string,
  setupHref?: string
) {
  const integration = (await convex.query(api.siteContent.getDeliveryCredentialsForOwnerRuntime, {
    storeId,
  })) as DeliveryIntegrationRuntimeResponse | null;

  const providerFromStore = normalizeDeliveryProvider(integration?.provider);
  const providerFromHint = normalizeDeliveryProvider(providerHint);
  const normalizedProvider = providerFromStore !== "none" ? providerFromStore : providerFromHint;
  const provider = toDeliveryApiProvider(normalizedProvider);
  const setupAction = setupHref
    ? {
        label: "Open Courier settings",
        href: setupHref,
      }
    : undefined;

  if (!provider) {
    if (normalizedProvider !== "none") {
      throw new HttpError(400, "DELIVERY_PROVIDER_UNSUPPORTED", undefined, setupAction);
    }
    throw new HttpError(400, "DELIVERY_NOT_CONFIGURED", undefined, setupAction);
  }

  const credentialsFromStore: DeliveryCredentials = {
    apiKey: integration?.credentials?.apiKey ?? "",
    apiSecret:
      integration?.credentials?.apiSecret ?? integration?.credentials?.apiToken ?? "",
    accountNumber: integration?.credentials?.accountNumber,
  };

  if (hasCredentials(credentialsFromStore)) {
    return { provider, credentials: credentialsFromStore };
  }

  if (integration?.decryptionError?.includes("DELIVERY_CREDENTIALS_KEY")) {
    throw new HttpError(
      500,
      "DELIVERY_NOT_CONFIGURED",
      "Delivery credentials cannot be decrypted. Configure DELIVERY_CREDENTIALS_KEY before dispatching."
    );
  }

  const emergencyFallback = getEmergencyFallbackCredentials(provider);
  if (emergencyFallback) {
    return { provider, credentials: emergencyFallback };
  }

  throw new HttpError(400, "DELIVERY_CREDENTIALS_MISSING", undefined, setupAction);
}

async function loadDispatchOrder(
  convex: ConvexHttpClient,
  orderId: string,
  storeId: Id<"stores">
) {
  let order: DispatchOrderDoc | null = null;
  try {
    order = (await convex.query(api.orders.getOrder, {
      orderId: orderId as Id<"orders">,
    })) as DispatchOrderDoc | null;
  } catch {
    throw new HttpError(404, "DELIVERY_ORDER_NOT_FOUND");
  }

  if (!order) {
    throw new HttpError(404, "DELIVERY_ORDER_NOT_FOUND");
  }

  if (order.storeId !== storeId) {
    throw new HttpError(403, "DELIVERY_FORBIDDEN", "Order does not belong to this store.");
  }

  const canonicalStatus = normalizeOrderStatus(order.status);
  const duplicateDispatch =
    Boolean(order.trackingNumber && order.deliveryProvider) &&
    Boolean(canonicalStatus && DISPATCH_RECORDED_STATUSES.has(canonicalStatus));

  if (duplicateDispatch) {
    return { order, duplicate: true, recoverExistingDispatch: false };
  }

  if (
    (canonicalStatus === "confirmed" || canonicalStatus === "dispatch_ready") &&
    order.trackingNumber &&
    order.deliveryProvider
  ) {
    return { order, duplicate: false, recoverExistingDispatch: true };
  }

  if (canonicalStatus !== "confirmed" && canonicalStatus !== "dispatch_ready") {
    throw new HttpError(409, "DELIVERY_NOT_CONFIRMED");
  }

  return { order, duplicate: false, recoverExistingDispatch: false };
}

function toErrorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        action: error.action,
      },
      { status: error.status }
    );
  }

  if (isDeliveryAuthRuntimeError(error)) {
    const code: DeliveryActionCode = "DELIVERY_AUTH_REQUIRED";
    return NextResponse.json(
      {
        success: false,
        error: getDeliveryActionMessage(code),
        code,
      },
      { status: 401 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: getDeliveryActionMessage("DELIVERY_PROVIDER_UNAVAILABLE"),
      code: "DELIVERY_PROVIDER_UNAVAILABLE",
    },
    { status: 500 }
  );
}

async function recordDeliveryEventSafe(
  convex: ConvexHttpClient,
  payload: {
    storeId: Id<"stores">;
    orderId?: string;
    eventType: "attempted" | "dispatched" | "failed";
    provider: DeliveryProvider;
    region?: string;
    trackingNumber?: string;
    reason?: string;
  }
) {
  try {
    await convex.mutation(api.deliveryAnalytics.recordDeliveryEvent, {
      storeId: payload.storeId,
      orderId: payload.orderId,
      eventType: payload.eventType,
      provider: payload.provider,
      region: payload.region,
      trackingNumber: payload.trackingNumber,
      reason: payload.reason,
      source: "api.delivery.create-order",
    });
  } catch (analyticsError) {
    console.warn("Failed to write delivery analytics event:", analyticsError);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) {
      throw new HttpError(401, "DELIVERY_AUTH_REQUIRED");
    }

    const token = await authResult.getToken({ template: "convex" });
    if (!token) {
      throw new HttpError(401, "DELIVERY_AUTH_REQUIRED", "Unable to authenticate delivery request.");
    }

    const rateLimitKey = `create-order:${userId}:${getClientIp(request)}`;
    const rateLimit = consumeRateLimit(
      rateLimitKey,
      CREATE_ORDER_RATE_LIMIT_MAX_REQUESTS,
      CREATE_ORDER_RATE_LIMIT_WINDOW_MS
    );

    if (rateLimit.limited) {
      throw new HttpError(
        429,
        "DELIVERY_RATE_LIMITED",
        `Too many dispatch requests. Try again in ${rateLimit.retryAfterSeconds}s.`
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      throw new HttpError(400, "DELIVERY_BAD_REQUEST", "Invalid JSON body.");
    }

    const storeId = typeof body.storeId === "string" ? body.storeId : undefined;
    const storeSlug = typeof body.storeSlug === "string" ? body.storeSlug : undefined;
    const orderId = typeof body.orderId === "string" ? body.orderId : "";
    const providerHint = parseProviderHint(body.provider);

    if (!orderId) {
      throw new HttpError(400, "DELIVERY_BAD_REQUEST", "Missing required fields.");
    }

    const convex = getConvexClient(token);
    const resolvedStoreId = await resolveOwnedStoreId(convex, userId, storeId, storeSlug);
    const { order, duplicate, recoverExistingDispatch } = await loadDispatchOrder(
      convex,
      orderId,
      resolvedStoreId
    );

    if (duplicate) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        trackingNumber: order.trackingNumber,
        provider: order.deliveryProvider,
        status: normalizeOrderStatus(order.status),
      });
    }

    if (recoverExistingDispatch) {
      const dispatchRecord = await convex.mutation(api.orders.markOrderDispatchedFromDeliveryApi, {
        orderId: orderId as Id<"orders">,
        trackingNumber: order.trackingNumber!,
        provider: order.deliveryProvider!,
      });

      return NextResponse.json({
        success: true,
        duplicate: true,
        recovered: true,
        trackingNumber: order.trackingNumber,
        provider: order.deliveryProvider,
        status:
          dispatchRecord && typeof dispatchRecord === "object" && "status" in dispatchRecord
            ? dispatchRecord.status
            : "dispatched",
      });
    }

    const config = await loadDeliveryConfig(
      convex,
      resolvedStoreId,
      providerHint,
      storeSlug ? `/editor/${storeSlug}?settings=integration` : undefined
    );

    const result = await createDeliveryOrder(config.provider, config.credentials, {
      storeId: resolvedStoreId,
      orderId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerWilaya: order.customerWilaya,
      customerCommune: order.customerCommune ?? "",
      customerAddress: order.customerAddress ?? "",
      products: order.products,
      total: order.total,
    });

    if (result.success) {
      if (!result.trackingNumber) {
        throw new HttpError(502, "DELIVERY_TRACKING_MISSING");
      }

      const dispatchRecord = await convex.mutation(api.orders.markOrderDispatchedFromDeliveryApi, {
        orderId: orderId as Id<"orders">,
        trackingNumber: result.trackingNumber,
        provider: config.provider,
      });

      return NextResponse.json({
        success: true,
        trackingNumber: result.trackingNumber,
        deliveryFee: result.deliveryFee,
        status:
          dispatchRecord && typeof dispatchRecord === "object" && "status" in dispatchRecord
            ? dispatchRecord.status
            : "dispatched",
      });
    }

    const providerCode = isLikelyProviderAvailabilityError(result.error)
      ? "DELIVERY_PROVIDER_UNAVAILABLE"
      : "DELIVERY_PROVIDER_REJECTED";
    const providerMessage =
      providerCode === "DELIVERY_PROVIDER_REJECTED" && result.error
        ? `Delivery provider rejected the order: ${result.error}`
        : getDeliveryActionMessage(providerCode);

    await recordDeliveryEventSafe(convex, {
      storeId: resolvedStoreId,
      orderId,
      eventType: "failed",
      provider: config.provider,
      region: order.customerWilaya,
      reason: providerMessage,
    });

    return NextResponse.json(
      {
        success: false,
        error: providerMessage,
        code: providerCode,
      },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof HttpError) {
      return toErrorResponse(error);
    }

    if (!isDeliveryAuthRuntimeError(error)) {
      console.error("Delivery API error:", error);
    }
    return toErrorResponse(error);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trackingNumber = searchParams.get("tracking");
  const storeId = searchParams.get("storeId") ?? undefined;
  const storeSlug = searchParams.get("storeSlug") ?? undefined;
  const providerHintRaw = searchParams.get("provider") ?? undefined;

  if (!trackingNumber) {
    return NextResponse.json(
      { success: false, error: "Missing tracking number" },
      { status: 400 }
    );
  }

  try {
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const token = await authResult.getToken({ template: "convex" });
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unable to authenticate delivery request." },
        { status: 401 }
      );
    }

    const providerHint = parseProviderHint(providerHintRaw);
    const convex = getConvexClient(token);
    const resolvedStoreId = await resolveOwnedStoreId(convex, userId, storeId, storeSlug);
    const config = await loadDeliveryConfig(convex, resolvedStoreId, providerHint);

    const { getDeliveryStatus } = await import("@/lib/delivery-api");
    const status = await getDeliveryStatus(config.provider, config.credentials, trackingNumber);

    if (status) {
      return NextResponse.json({ success: true, status });
    }

    return NextResponse.json(
      { success: false, error: "Tracking number not found" },
      { status: 404 }
    );
  } catch (error) {
    if (!isDeliveryAuthRuntimeError(error)) {
      console.error("Delivery status error:", error);
    }
    return toErrorResponse(error);
  }
}
