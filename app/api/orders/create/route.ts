import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      storeSlug,
      orderNumber,
      customerName,
      customerPhone,
      customerWilaya,
      customerCommune: _customerCommune,
      customerAddress: _customerAddress,
      products,
      subtotal,
      deliveryCost: _deliveryCost,
      total,
      deliveryType: _deliveryType,
      notes: _notes,
    } = body;

    if (!storeSlug || !orderNumber || !customerName || !customerPhone || !customerWilaya || !products || subtotal === undefined || total === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // TODO: Connect to Convex to create the order
    // For now, we'll return a mock response
    // Once Convex is set up with the client, use:
    // const store = await convexClient.query(api.stores.getStoreBySlug, { slug: storeSlug });
    // const orderId = await convexClient.mutation(api.orders.createOrder, { ... });

    // Simulate order creation
    const mockOrderId = `order_${Date.now()}`;

    return NextResponse.json({ 
      success: true, 
      orderId: mockOrderId,
      orderNumber 
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
