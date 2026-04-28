import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

import { api } from "@/convex/_generated/api";
import {
  getPublicOrderCodeFromError,
  getPublicOrderErrorMessage,
  type PublicOrderErrorCode,
} from "@/lib/order-action-feedback";

type PublicOrderProductInput = {
  productId?: unknown;
  quantity?: unknown;
  variant?: unknown;
};

type PublicOrderBody = {
  storeSlug?: unknown;
  idempotencyKey?: unknown;
  checkoutAttemptId?: unknown;
  checkoutAttemptKey?: unknown;
  customerName?: unknown;
  customerPhone?: unknown;
  customerWilaya?: unknown;
  customerCommune?: unknown;
  customerAddress?: unknown;
  deliveryType?: unknown;
  notes?: unknown;
  products?: unknown;
};

const PUBLIC_ORDER_ERROR_STATUSES: Record<PublicOrderErrorCode, number> = {
  PUBLIC_ORDER_INVALID_STORE: 404,
  PUBLIC_ORDER_INVALID_IDEMPOTENCY_KEY: 400,
  PUBLIC_ORDER_MISSING_FIELDS: 400,
  PUBLIC_ORDER_INVALID_PHONE: 400,
  PUBLIC_ORDER_INVALID_PRODUCT: 400,
  PUBLIC_ORDER_STORE_VELOCITY_LIMIT: 429,
  PUBLIC_ORDER_PHONE_VELOCITY_LIMIT: 429,
  PUBLIC_ORDER_DUPLICATE_RECENT: 409,
  PUBLIC_CHECKOUT_INVALID_ATTEMPT: 400,
  PUBLIC_CHECKOUT_INVALID_ATTEMPT_KEY: 400,
  PUBLIC_CHECKOUT_INVALID_STORE: 404,
  PUBLIC_CHECKOUT_ATTEMPT_STORE_MISMATCH: 400,
  PUBLIC_ORDER_MALFORMED_PAYLOAD: 400,
  PUBLIC_ORDER_CONVEX_NOT_CONFIGURED: 500,
  PUBLIC_ORDER_UNAVAILABLE: 503,
};

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("PUBLIC_ORDER_CONVEX_NOT_CONFIGURED");
  }

  return new ConvexHttpClient(convexUrl);
}

function readString(value: unknown, maxLength: number) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error("PUBLIC_ORDER_MALFORMED_PAYLOAD");
  }

  return value.trim().slice(0, maxLength);
}

function readProducts(value: unknown) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 20) {
    throw new Error("PUBLIC_ORDER_MALFORMED_PAYLOAD");
  }

  return value.map((item: PublicOrderProductInput) => {
    if (!item || typeof item !== "object") {
      throw new Error("PUBLIC_ORDER_MALFORMED_PAYLOAD");
    }

    const productId = readString(item.productId, 80);
    if (!productId) {
      throw new Error("PUBLIC_ORDER_MALFORMED_PAYLOAD");
    }

    const quantity = typeof item.quantity === "number" ? item.quantity : Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new Error("PUBLIC_ORDER_MALFORMED_PAYLOAD");
    }

    return {
      productId,
      quantity,
      variant: readString(item.variant, 120),
    };
  });
}

function getIdempotencyKey(request: NextRequest, body: PublicOrderBody) {
  const headerKey = request.headers.get("idempotency-key") ?? undefined;
  const bodyKey = readString(body.idempotencyKey, 120);
  return headerKey?.trim() || bodyKey;
}

function toErrorResponse(error: unknown) {
  const code = getPublicOrderCodeFromError(error);
  return NextResponse.json(
    { success: false, code, error: getPublicOrderErrorMessage(code) },
    { status: PUBLIC_ORDER_ERROR_STATUSES[code] }
  );
}

export async function POST(request: NextRequest) {
  try {
    let body: PublicOrderBody;
    try {
      body = (await request.json()) as PublicOrderBody;
    } catch {
      throw new Error("PUBLIC_ORDER_MALFORMED_PAYLOAD");
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("PUBLIC_ORDER_MALFORMED_PAYLOAD");
    }

    const storeSlug = readString(body.storeSlug, 120);
    const customerName = readString(body.customerName, 120);
    const customerPhone = readString(body.customerPhone, 30);
    const customerWilaya = readString(body.customerWilaya, 120);
    const products = readProducts(body.products);

    if (!storeSlug || !customerName || !customerPhone || !customerWilaya) {
      throw new Error("PUBLIC_ORDER_MALFORMED_PAYLOAD");
    }

    const convex = getConvexClient();
    const order = await convex.mutation(api.orders.createPublicOrder, {
      storeSlug,
      idempotencyKey: getIdempotencyKey(request, body),
      checkoutAttemptId: readString(body.checkoutAttemptId, 80),
      checkoutAttemptKey: readString(body.checkoutAttemptKey, 120),
      customerName,
      customerPhone,
      customerWilaya,
      customerCommune: readString(body.customerCommune, 120),
      customerAddress: readString(body.customerAddress, 240),
      deliveryType: readString(body.deliveryType, 40),
      notes: readString(body.notes, 500),
      products,
    });

    return NextResponse.json({
      success: true,
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      checkoutAttemptId: order.checkoutAttemptId,
      duplicate: order.duplicate,
      totals: order.totals,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
