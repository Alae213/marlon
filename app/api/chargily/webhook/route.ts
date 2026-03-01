import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data } = body;

    if (event !== "payment.succeeded") {
      return NextResponse.json({ received: true });
    }

    const paymentId = data?.id;
    const customerEmail = data?.attributes?.customer?.email;
    const amount = data?.attributes?.amount;

    if (!paymentId) {
      return NextResponse.json(
        { error: "Missing payment ID" },
        { status: 400 }
      );
    }

    console.log("Payment webhook received:", {
      paymentId,
      customerEmail,
      amount,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok" });
}
