import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  getActivePaymentProvider,
  getPaymentProvider,
  type CreateCheckoutParams,
} from "@/lib/payment-service";

const CURRENT_UNLOCK_PRICE_DZD = 2000;
const CURRENT_UNLOCK_CURRENCY = "dzd";
const CURRENT_UNLOCK_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const CURRENT_UNLOCK_POLICY_VERSION = "v1_canonical_overflow";

function getConvexClient(authToken: string) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL.");
  }

  const convex = new ConvexHttpClient(convexUrl);
  convex.setAuth(authToken);
  return convex;
}

function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Internal server error";

  if (message === "Invalid JSON body") {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (message === "Unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (message === "Forbidden") {
    return NextResponse.json(
      { error: "You do not have access to this store." },
      { status: 403 },
    );
  }

  if (message === "Store not found") {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  if (message === "Payment attempt not found") {
    return NextResponse.json({ error: "Payment attempt not found" }, { status: 404 });
  }

  if (message === "Missing NEXT_PUBLIC_CONVEX_URL.") {
    return NextResponse.json(
      { error: "Payment service is not configured." },
      { status: 500 },
    );
  }

  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await auth();
    if (!authResult.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const token = await authResult.getToken({ template: "convex" });
    if (!token) {
      return NextResponse.json(
        { error: "Unable to authenticate payment request." },
        { status: 401 },
      );
    }

    let body: { storeId?: string };
    try {
      body = (await request.json()) as { storeId?: string };
    } catch {
      throw new Error("Invalid JSON body");
    }

    const storeId = body.storeId;

    if (!storeId) {
      return NextResponse.json(
        { error: "Missing store context." },
        { status: 400 },
      );
    }

    const convex = getConvexClient(token);
    const providerName = getActivePaymentProvider();
    if (providerName === "custom") {
      return NextResponse.json(
        { error: "Unsupported payment provider." },
        { status: 500 },
      );
    }

    const now = Date.now();
    const billingPeriodStart = now;
    const billingPeriodEnd = now + CURRENT_UNLOCK_WINDOW_MS;
    const idempotencyKey = crypto.randomUUID();

    const checkoutContext = await convex.mutation(
      api.payments.beginStoreUnlockPaymentAttempt,
      {
        storeId: storeId as Id<"stores">,
        provider: providerName,
        amountDzd: CURRENT_UNLOCK_PRICE_DZD,
        currency: CURRENT_UNLOCK_CURRENCY,
        idempotencyKey,
        policyVersion: CURRENT_UNLOCK_POLICY_VERSION,
        billingPeriodStart,
        billingPeriodEnd,
      },
    );

    const provider = getPaymentProvider();

    const params: CreateCheckoutParams = {
      storeId: checkoutContext.storeId,
      storeName: checkoutContext.storeName,
      amount: CURRENT_UNLOCK_PRICE_DZD,
      currency: CURRENT_UNLOCK_CURRENCY,
      description: `اشتراك شهري ${checkoutContext.storeName} - فتح الطلبات`,
      metadata: {
        storeId: checkoutContext.storeId,
        storeSlug: checkoutContext.storeSlug,
        paymentAttemptId: checkoutContext.paymentAttemptId,
        idempotencyKey,
        purpose: "store_unlock",
        actorRole: checkoutContext.actorRole,
      },
    };

    const result = await provider.createCheckout(params);

    if (!result.success) {
      await convex.mutation(api.payments.recordStoreUnlockCheckoutResult, {
        paymentAttemptId: checkoutContext.paymentAttemptId,
        status: "failed",
      });

      return NextResponse.json(
        { error: result.error || "Failed to create payment" },
        { status: 500 },
      );
    }

    await convex.mutation(api.payments.recordStoreUnlockCheckoutResult, {
      paymentAttemptId: checkoutContext.paymentAttemptId,
      status: "provider_pending",
      providerCheckoutId: result.checkoutId,
      providerReference: result.checkoutId,
    });

    return NextResponse.json({
      checkoutUrl: result.checkoutUrl,
      checkoutId: result.checkoutId,
      paymentAttemptId: checkoutContext.paymentAttemptId,
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Payment error:", error);
    return toErrorResponse(error);
  }
}
