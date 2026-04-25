import { beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";

const convexMutationMock = mock();

class MockConvexHttpClient {
  constructor() {}

  mutation(mutationRef, args) {
    return convexMutationMock(mutationRef, args);
  }
}

mock.module("convex/browser", () => ({
  ConvexHttpClient: MockConvexHttpClient,
}));

mock.module("next/server", () => ({
  NextResponse: {
    json(body, init = {}) {
      return new Response(JSON.stringify(body), {
        status: init.status ?? 200,
        headers: { "content-type": "application/json" },
      });
    },
  },
}));

let POST;

beforeAll(async () => {
  ({ POST } = await import("@/app/api/orders/create/route"));
});

beforeEach(() => {
  process.env.NEXT_PUBLIC_CONVEX_URL = "https://example.convex.cloud";
  convexMutationMock.mockReset();
});

function createRequest(body, headers = {}) {
  return new Request("http://localhost:3000/api/orders/create", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

const validBody = {
  storeSlug: "demo-store",
  idempotencyKey: "checkout-key-123",
  customerName: "Jane Doe",
  customerPhone: "0550123456",
  customerWilaya: "16 - Alger - الجزائر",
  customerCommune: "Bab Ezzouar",
  customerAddress: "123 Market Street",
  deliveryType: "domicile",
  products: [
    {
      productId: "prod_1",
      quantity: 2,
      price: 1,
      name: "Tampered name",
    },
  ],
  subtotal: 1,
  deliveryCost: 1,
  total: 2,
};

describe("POST /api/orders/create public checkout route", () => {
  it("lets an anonymous shopper create an order through the public mutation", async () => {
    convexMutationMock.mockResolvedValue({
      orderId: "order_1",
      orderNumber: "ORD-1",
      duplicate: false,
      totals: { subtotal: 2000, deliveryCost: 600, total: 2600 },
    });

    const response = await POST(createRequest(validBody, { "Idempotency-Key": "checkout-key-123" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      orderId: "order_1",
      orderNumber: "ORD-1",
      duplicate: false,
      totals: { subtotal: 2000, deliveryCost: 600, total: 2600 },
    });
  });

  it("does not pass client-supplied names, prices, subtotal, delivery cost, or total to Convex", async () => {
    convexMutationMock.mockResolvedValue({
      orderId: "order_1",
      orderNumber: "ORD-1",
      duplicate: false,
      totals: { subtotal: 2000, deliveryCost: 600, total: 2600 },
    });

    await POST(createRequest(validBody));

    const [, args] = convexMutationMock.mock.calls[0];
    expect(args.subtotal).toBeUndefined();
    expect(args.deliveryCost).toBeUndefined();
    expect(args.total).toBeUndefined();
    expect(args.products).toEqual([
      {
        productId: "prod_1",
        quantity: 2,
        variant: undefined,
      },
    ]);
  });

  it("returns the existing order response for a duplicate idempotency key", async () => {
    convexMutationMock.mockResolvedValue({
      orderId: "order_1",
      orderNumber: "ORD-1",
      duplicate: true,
      totals: { subtotal: 2000, deliveryCost: 600, total: 2600 },
    });

    const response = await POST(createRequest(validBody));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.duplicate).toBe(true);
  });

  it("fails malformed payloads safely before calling Convex", async () => {
    const response = await POST(createRequest({ ...validBody, products: [] }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Malformed order payload.");
    expect(convexMutationMock).not.toHaveBeenCalled();
  });

  it("maps invalid phone errors from Convex to a safe client error", async () => {
    convexMutationMock.mockRejectedValue(new Error("PUBLIC_ORDER_INVALID_PHONE"));

    const response = await POST(createRequest(validBody));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid phone number.");
  });
});
