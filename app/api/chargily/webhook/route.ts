import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ConvexHttpClient } from "convex/browser";
import { getPaymentProvider } from "@/lib/payment-service";

export async function POST(request: NextRequest) {
  try {
    // Get the payment provider to verify webhook
    const provider = getPaymentProvider();
    
    // Get raw body for signature verification if needed
    const rawBody = await request.text();
    
    // Parse the webhook data
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      body = await request.json();
    }
    
    const { event, data } = body;

    // Process different event types
    if (event === "payment.succeeded" || event === "payment.completed") {
      const paymentId = data?.id;
      const metadata = data?.attributes?.metadata || data?.metadata || {};
      const storeId = metadata?.storeId;

      if (!paymentId) {
        return NextResponse.json(
          { error: "Missing payment ID" },
          { status: 400 }
        );
      }

      console.log("Payment webhook received:", { paymentId, storeId });

      if (storeId) {
        await activateStore(storeId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function activateStore(storeId: string) {
  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      console.error("CONVEX_URL not configured");
      return;
    }

    const convex = new ConvexHttpClient(convexUrl);
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const paidUntil = Date.now() + thirtyDaysMs;

    await convex.mutation(api.stores.updateSubscription, {
      storeId: storeId as Id<"stores">,
      subscription: "active",
      paidUntil,
    });

    console.log("Store activated:", storeId, "until", new Date(paidUntil).toISOString());
  } catch (error) {
    console.error("Failed to activate store:", error);
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", provider: process.env.PAYMENT_PROVIDER || "chargily" });
}
