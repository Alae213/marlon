import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

import { api } from "@/convex/_generated/api";

type CheckoutAttemptBody = {
  action?: unknown;
  storeSlug?: unknown;
  attemptKey?: unknown;
  customerPhone?: unknown;
  customerWilaya?: unknown;
  recoverySource?: unknown;
  products?: unknown;
};

type CheckoutAttemptProductInput = {
  productId?: unknown;
  quantity?: unknown;
  variant?: unknown;
};

function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("PUBLIC_CHECKOUT_CONVEX_NOT_CONFIGURED");
  }

  return new ConvexHttpClient(convexUrl);
}

function readString(value: unknown, maxLength: number) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error("PUBLIC_CHECKOUT_MALFORMED_PAYLOAD");
  }

  return value.trim().slice(0, maxLength);
}

function readProducts(value: unknown) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length === 0 || value.length > 20) {
    throw new Error("PUBLIC_CHECKOUT_MALFORMED_PAYLOAD");
  }

  return value.map((item: CheckoutAttemptProductInput) => {
    if (!item || typeof item !== "object") {
      throw new Error("PUBLIC_CHECKOUT_MALFORMED_PAYLOAD");
    }

    const productId = readString(item.productId, 80);
    const quantity = typeof item.quantity === "number" ? item.quantity : Number(item.quantity);
    if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new Error("PUBLIC_CHECKOUT_MALFORMED_PAYLOAD");
    }

    return {
      productId,
      quantity,
      variant: readString(item.variant, 120),
    };
  });
}

function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("PUBLIC_CHECKOUT_MALFORMED_PAYLOAD")) {
    return NextResponse.json({ success: false, error: "Malformed checkout payload." }, { status: 400 });
  }

  if (message.includes("PUBLIC_CHECKOUT_INVALID_STORE")) {
    return NextResponse.json({ success: false, error: "Store not found." }, { status: 404 });
  }

  if (message.includes("PUBLIC_CHECKOUT_INVALID")) {
    return NextResponse.json({ success: false, error: "Invalid checkout attempt." }, { status: 400 });
  }

  if (message.includes("PUBLIC_CHECKOUT_CONVEX_NOT_CONFIGURED")) {
    return NextResponse.json({ success: false, error: "Checkout service is not configured." }, { status: 500 });
  }

  return NextResponse.json({ success: false, error: "Failed to update checkout attempt." }, { status: 500 });
}

export async function POST(request: NextRequest) {
  try {
    let body: CheckoutAttemptBody;
    try {
      body = (await request.json()) as CheckoutAttemptBody;
    } catch {
      throw new Error("PUBLIC_CHECKOUT_MALFORMED_PAYLOAD");
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("PUBLIC_CHECKOUT_MALFORMED_PAYLOAD");
    }

    const action = readString(body.action, 32) ?? "start";
    const storeSlug = readString(body.storeSlug, 120);
    const attemptKey = readString(body.attemptKey, 120);
    if (!storeSlug || !attemptKey) {
      throw new Error("PUBLIC_CHECKOUT_MALFORMED_PAYLOAD");
    }

    const convex = getConvexClient();
    const baseArgs = { storeSlug, attemptKey };

    const result =
      action === "abandon"
        ? await convex.mutation(api.orders.abandonPublicCheckoutAttempt, baseArgs)
        : action === "recover"
          ? await convex.mutation(api.orders.recoverPublicCheckoutAttempt, {
              ...baseArgs,
              recoverySource: readString(body.recoverySource, 120),
            })
          : await convex.mutation(api.orders.startPublicCheckoutAttempt, {
              ...baseArgs,
              customerPhone: readString(body.customerPhone, 30),
              customerWilaya: readString(body.customerWilaya, 120),
              products: readProducts(body.products),
            });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
