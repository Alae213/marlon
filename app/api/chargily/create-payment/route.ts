import { NextRequest, NextResponse } from "next/server";
import { getPaymentProvider, CreateCheckoutParams } from "@/lib/payment-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, storeName, amount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    const provider = getPaymentProvider();
    
    const params: CreateCheckoutParams = {
      storeId,
      storeName,
      amount,
      currency: "dzd",
      customerEmail: "customer@example.com",
      description: `اشتراك ${storeName} - خطة سنوية`,
    };

    const result = await provider.createCheckout(params);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create payment" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      checkoutUrl: result.checkoutUrl,
      checkoutId: result.checkoutId,
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}