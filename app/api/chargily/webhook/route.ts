import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ConvexHttpClient } from "convex/browser";
import crypto from "crypto";
import { getPaymentProvider } from "@/lib/payment-service";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;
if (!CONVEX_URL) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL not configured");
}

const REPLAY_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  let rawBody: string;
  let providerName: string;
  let webhookEvent: ReturnType<typeof getPaymentProvider>["verifyWebhook"] extends (
    ...args: any[]
  ) => Promise<infer R>
    ? R
    : never;
  let convex: ConvexHttpClient;

  try {
    providerName = getPaymentProvider().constructor.name;
    rawBody = await request.text();
    convex = new ConvexHttpClient(CONVEX_URL);
  } catch (error) {
    console.error("Webhook init error:", error);
    return NextResponse.json({ error: "Webhook configuration error" }, { status: 500 });
  }

  let body: Record<string, any>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const signature =
    request.headers.get("X-Chargily-Signature") ||
    request.headers.get("X-Sofizpay-Signature") ||
    request.headers.get("X-Signature") ||
    "";

  const provider = getPaymentProvider();
  webhookEvent = await provider.verifyWebhook(rawBody, signature);

  if (!webhookEvent) {
    console.warn("Webhook signature verification failed", {
      hasSignature: !!signature,
      provider: providerName,
    });
    return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
  }

  const { event, paymentId, storeId: rawStoreId, metadata } = webhookEvent;
  const providerPaymentId = paymentId;
  const idempotencyKey = body.idempotencyKey || metadata?.idempotencyKey || "";
  const providerEventId = body.eventId || body.id || "";

  if (!providerPaymentId) {
    return NextResponse.json({ error: "Missing provider payment ID" }, { status: 400 });
  }

  try {
    const duplicateEvidence = await convex.query(api.payments.findDuplicateEvidence, {
      provider: providerName === "ChargilyProvider" ? "chargily" : "sofizpay",
      providerPaymentId,
    });

    if (duplicateEvidence) {
      console.log("Duplicate webhook ignored", { providerPaymentId, evidenceId: duplicateEvidence._id });
      if (duplicateEvidence.appliedAt) {
        return NextResponse.json({ received: true, deduplicated: true, alreadyApplied: true });
      }
      return NextResponse.json({ received: true, deduplicated: true });
    }

    const recentEvidence = await convex.query(api.payments.findRecentWebhookEvidence, {
      storeId: rawStoreId as Id<"stores">,
      windowStart: Date.now() - REPLAY_WINDOW_MS,
    });

    if (recentEvidence && recentEvidence.length > 0) {
      for (const ev of recentEvidence) {
        if (ev.providerEventId === providerEventId && providerEventId) {
          console.log("Replay detected: matching event ID in window", { providerEventId, storeId: rawStoreId });
          return NextResponse.json({ received: true, replayDetected: true });
        }
      }
    }

    const paymentAttempt = await convex.query(api.payments.findPaymentAttemptByIdempotencyKey, {
      idempotencyKey,
    });

    if (!paymentAttempt && rawStoreId) {
      const attempts = await convex.query(api.payments.findPaymentAttemptsByStore, {
        storeId: rawStoreId as Id<"stores">,
      });
      if (attempts.length > 0) {
        const matchedAttempt = attempts.find(
          (a: any) => a.status === "provider_pending" || a.status === "created"
        );
        if (matchedAttempt) {
          return NextResponse.json(
            { error: "Store already has active payment attempt" },
            { status: 409 }
          );
        }
      }
    }

    if (!paymentAttempt) {
      console.warn("No matching payment attempt for webhook", { providerPaymentId, idempotencyKey, storeId: rawStoreId });
      return NextResponse.json({ error: "No matching payment attempt" }, { status: 404 });
    }

    if (paymentAttempt.status === "succeeded" || paymentAttempt.status === "expired") {
      console.log("Ignoring webhook for closed payment attempt", {
        paymentAttemptId: paymentAttempt._id,
        status: paymentAttempt.status,
      });
      return NextResponse.json({ received: true, idempotent: true });
    }

    if (event !== "payment.succeeded" && event !== "payment.completed" && event !== "payment.updated") {
      console.log("Ignoring non-payment-success event", { event, providerPaymentId });
      return NextResponse.json({ received: true, ignored: true });
    }

    const now = Date.now();
    const signatureCheckedAt = now;

    const evidenceId = await convex.mutation(api.payments.recordPaymentEvidence, {
      paymentAttemptId: paymentAttempt._id as Id<"paymentAttempts">,
      provider: providerName === "ChargilyProvider" ? "chargily" : "sofizpay",
      providerEventId: providerEventId || undefined,
      providerPaymentId,
      eventType: event,
      verificationStatus: "verified",
      verificationMethod: "signature",
      signatureCheckedAt,
      eventCreatedAt: body.createdAt ? new Date(body.createdAt).getTime() : undefined,
      payloadRedacted: {
        event,
        paymentId: providerPaymentId,
        metadata,
        idempotencyKey,
      },
    });

    const activationResult = await convex.mutation(api.canonicalBilling.applyCanonicalUnlockFromPayment, {
      paymentAttemptId: paymentAttempt._id as Id<"paymentAttempts">,
      evidenceId: evidenceId as Id<"paymentEvidence">,
    });

    console.log("Webhook payment activated successfully", {
      providerPaymentId,
      storeId: activationResult.storeId,
      billingPeriodId: activationResult.billingPeriodId,
      paidUntil: new Date(activationResult.paidUntil).toISOString(),
    });

    return NextResponse.json({
      received: true,
      activated: true,
      storeId: activationResult.storeId,
      paidUntil: activationResult.paidUntil,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", provider: process.env.PAYMENT_PROVIDER || "chargily" });
}