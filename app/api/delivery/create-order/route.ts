import { NextRequest, NextResponse } from "next/server";
import { createDeliveryOrder, DeliveryProvider, DeliveryCredentials } from "@/lib/delivery-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      orderNumber,
      customerName,
      customerPhone,
      customerWilaya,
      customerCommune,
      customerAddress,
      products,
      total,
      provider,
    } = body;

    if (!orderId || !customerName || !customerPhone || !customerWilaya) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // In production, these would be fetched from the database based on storeId
    const credentials: DeliveryCredentials = {
      apiKey: process.env[`${provider.toUpperCase()}_API_KEY`] || "demo_key",
      apiSecret: process.env[`${provider.toUpperCase()}_API_SECRET`] || "demo_secret",
      accountNumber: process.env[`${provider.toUpperCase()}_ACCOUNT_NUMBER`] || "demo_account",
    };

    const result = await createDeliveryOrder(
      provider as DeliveryProvider,
      credentials,
      {
        storeId: "",
        orderId,
        customerName,
        customerPhone,
        customerWilaya,
        customerCommune,
        customerAddress,
        products,
        total,
      }
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        trackingNumber: result.trackingNumber,
        deliveryFee: result.deliveryFee,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 400 });
    }
  } catch (error) {
    console.error("Delivery API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trackingNumber = searchParams.get("tracking");
  const provider = searchParams.get("provider") as DeliveryProvider;

  if (!trackingNumber || !provider) {
    return NextResponse.json(
      { success: false, error: "Missing tracking number or provider" },
      { status: 400 }
    );
  }

  try {
    const credentials: DeliveryCredentials = {
      apiKey: process.env[`${provider.toUpperCase()}_API_KEY`] || "demo_key",
      apiSecret: process.env[`${provider.toUpperCase()}_API_SECRET`] || "demo_secret",
    };

    const { getDeliveryStatus } = await import("@/lib/delivery-api");
    const status = await getDeliveryStatus(provider, credentials, trackingNumber);

    if (status) {
      return NextResponse.json({ success: true, status });
    } else {
      return NextResponse.json(
        { success: false, error: "Tracking number not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Delivery status error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
