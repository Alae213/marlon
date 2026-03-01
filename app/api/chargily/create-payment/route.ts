import { NextRequest, NextResponse } from "next/server";

const CHARGILY_API_URL = "https://api.chargily.com/dashboard/api/v2/checkouts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeName, amount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    const chargilyApiKey = process.env.CHARGILY_API_KEY;
    const webhookUrl = process.env.CHARGILY_WEBHOOK_URL;
    const returnUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (!chargilyApiKey) {
      console.warn("Chargily API key not configured, using mock response");
      return NextResponse.json({
        checkoutUrl: null,
        success: true,
        message: "Demo mode - payment would be created",
      });
    }

    const response = await fetch(CHARGILY_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${chargilyApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: amount * 100,
            currency: "dzd",
            description: `اشتراك ${storeName} - خطة سنوية`,
            webhook_url: webhookUrl,
            success_url: `${returnUrl}/dashboard?payment=success`,
            failed_url: `${returnUrl}/dashboard?payment=failed`,
            customer: {
              name: storeName,
              email: "customer@example.com",
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Chargily API error:", error);
      return NextResponse.json(
        { error: "Failed to create payment" },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      checkoutUrl: data.data?.attributes?.checkout_url,
      checkoutId: data.data?.id,
    });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
