import { beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";

const authMock = mock();
const createDeliveryOrderMock = mock();

const convexQueryMock = mock();
const convexMutationMock = mock();
const convexSetAuthMock = mock();

class MockConvexHttpClient {
  constructor() {}

  setAuth(token) {
    convexSetAuthMock(token);
  }

  query(queryRef, args) {
    return convexQueryMock(queryRef, args);
  }

  mutation(mutationRef, args) {
    return convexMutationMock(mutationRef, args);
  }
}

mock.module("@clerk/nextjs/server", () => ({
  auth: authMock,
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

mock.module("@/lib/delivery-api", () => ({
  createDeliveryOrder: createDeliveryOrderMock,
}));

mock.module("convex/browser", () => ({
  ConvexHttpClient: MockConvexHttpClient,
}));

let POST;

beforeAll(async () => {
  ({ POST } = await import("@/app/api/delivery/create-order/route"));
});

beforeEach(() => {
  process.env.NEXT_PUBLIC_CONVEX_URL = "https://example.convex.cloud";

  authMock.mockReset();
  createDeliveryOrderMock.mockReset();
  convexQueryMock.mockReset();
  convexMutationMock.mockReset();
  convexSetAuthMock.mockReset();

  authMock.mockResolvedValue({
    userId: "user_1",
    getToken: async () => "convex_token",
  });
});

function createRequest(body) {
  return new Request("http://localhost:3000/api/delivery/create-order", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validOrderBody = {
  orderId: "order_1",
  customerName: "Jane Doe",
  customerPhone: "0555555555",
  customerWilaya: "Algiers",
  customerCommune: "Bab Ezzouar",
  customerAddress: "Some street",
  products: [{ name: "Product A", quantity: 1, price: 1000 }],
  total: 1000,
};

const ownedStore = {
  _id: "store_123",
  ownerId: "user_1",
  slug: "demo-store",
};

function createConfirmedOrder(overrides = {}) {
  return {
    _id: "order_1",
    storeId: "store_123",
    orderNumber: "ORD-1",
    customerName: "Jane Doe",
    customerPhone: "0555555555",
    customerWilaya: "Algiers",
    customerCommune: "Bab Ezzouar",
    customerAddress: "Some street",
    products: [{ name: "Product A", quantity: 1, price: 1000 }],
    total: 1000,
    status: "confirmed",
    ...overrides,
  };
}

function mockDispatchQueries({ store = ownedStore, order = createConfirmedOrder(), integration }) {
  const responses = [store, order, integration].filter((response) => response !== undefined);
  convexQueryMock.mockImplementation(async () => responses.shift() ?? null);
}

describe("POST /api/delivery/create-order validation and auth", () => {
  it("returns 400 when store context is missing", async () => {
    const response = await POST(createRequest(validOrderBody));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Missing store context");
  });

  it("returns 401 when user is unauthenticated", async () => {
    authMock.mockResolvedValue({
      userId: null,
      getToken: async () => null,
    });

    const response = await POST(createRequest(validOrderBody));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 403 when authenticated user does not own store", async () => {
    convexQueryMock.mockImplementation(async (_queryRef, args) => {
      if (args && args.storeId) {
        return {
          _id: args.storeId,
          ownerId: "different_owner",
          slug: "demo-store",
        };
      }

      return null;
    });

    const response = await POST(
      createRequest({
        ...validOrderBody,
        storeId: "store_123",
      })
    );
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("You do not have access to this store.");
    expect(createDeliveryOrderMock).not.toHaveBeenCalled();
  });

  it("rejects unconfirmed orders before calling the delivery provider", async () => {
    mockDispatchQueries({
      order: createConfirmedOrder({
        status: "new",
      }),
    });

    const response = await POST(
      createRequest({
        ...validOrderBody,
        storeId: "store_123",
      })
    );
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe("Order must be confirmed before dispatch.");
    expect(createDeliveryOrderMock).not.toHaveBeenCalled();
    expect(convexMutationMock).not.toHaveBeenCalled();
  });

  it("records successful dispatch status, tracking, and analytics through one order mutation", async () => {
    mockDispatchQueries({
      integration: {
        provider: "zr-express",
        credentials: {
          apiKey: "key",
          apiSecret: "secret",
        },
      },
    });
    createDeliveryOrderMock.mockResolvedValue({
      success: true,
      trackingNumber: "TRK1",
      deliveryFee: 300,
    });
    convexMutationMock.mockResolvedValue({
      orderId: "order_1",
      status: "dispatched",
      trackingNumber: "TRK1",
      provider: "zr_express",
      duplicate: false,
    });

    const response = await POST(
      createRequest({
        ...validOrderBody,
        storeId: "store_123",
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      trackingNumber: "TRK1",
      deliveryFee: 300,
      status: "dispatched",
    });
    expect(createDeliveryOrderMock).toHaveBeenCalledTimes(1);
    expect(convexMutationMock).toHaveBeenCalledTimes(1);
    expect(convexMutationMock.mock.calls[0][1]).toEqual({
      orderId: "order_1",
      trackingNumber: "TRK1",
      provider: "zr_express",
    });
  });

  it("leaves the order lifecycle untouched when provider dispatch fails", async () => {
    mockDispatchQueries({
      integration: {
        provider: "yalidine",
        credentials: {
          apiKey: "key",
          apiSecret: "secret",
        },
      },
    });
    createDeliveryOrderMock.mockResolvedValue({
      success: false,
      error: "Provider rejected the order",
    });
    convexMutationMock.mockResolvedValue("analytics_1");

    const response = await POST(
      createRequest({
        ...validOrderBody,
        storeId: "store_123",
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Provider rejected the order");
    expect(createDeliveryOrderMock).toHaveBeenCalledTimes(1);
    expect(convexMutationMock).toHaveBeenCalledTimes(1);
    expect(convexMutationMock.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        orderId: "order_1",
        eventType: "failed",
        provider: "yalidine",
      })
    );
  });

  it("treats duplicate dispatches as idempotent and does not call the provider again", async () => {
    mockDispatchQueries({
      order: createConfirmedOrder({
        status: "dispatched",
        trackingNumber: "TRK1",
        deliveryProvider: "zr_express",
      }),
    });

    const response = await POST(
      createRequest({
        ...validOrderBody,
        storeId: "store_123",
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      duplicate: true,
      trackingNumber: "TRK1",
      provider: "zr_express",
      status: "dispatched",
    });
    expect(createDeliveryOrderMock).not.toHaveBeenCalled();
    expect(convexMutationMock).not.toHaveBeenCalled();
  });

  it("recovers confirmed orders that already have tracking without creating another courier order", async () => {
    mockDispatchQueries({
      order: createConfirmedOrder({
        status: "confirmed",
        trackingNumber: "TRK1",
        deliveryProvider: "zr_express",
      }),
    });
    convexMutationMock.mockResolvedValue({
      orderId: "order_1",
      status: "dispatched",
      trackingNumber: "TRK1",
      provider: "zr_express",
      duplicate: false,
    });

    const response = await POST(
      createRequest({
        ...validOrderBody,
        storeId: "store_123",
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      duplicate: true,
      recovered: true,
      trackingNumber: "TRK1",
      provider: "zr_express",
      status: "dispatched",
    });
    expect(createDeliveryOrderMock).not.toHaveBeenCalled();
    expect(convexMutationMock).toHaveBeenCalledTimes(1);
    expect(convexMutationMock.mock.calls[0][1]).toEqual({
      orderId: "order_1",
      trackingNumber: "TRK1",
      provider: "zr_express",
    });
  });

  it("gates delivery providers that do not have live adapters", async () => {
    mockDispatchQueries({
      integration: {
        provider: "andrson",
        credentials: {
          apiKey: "key",
          apiSecret: "secret",
        },
      },
    });

    const response = await POST(
      createRequest({
        ...validOrderBody,
        storeId: "store_123",
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("No supported delivery provider configured for this store.");
    expect(createDeliveryOrderMock).not.toHaveBeenCalled();
    expect(convexMutationMock).not.toHaveBeenCalled();
  });
});
