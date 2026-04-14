import { beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";

const authMock = mock();
const createDeliveryOrderMock = mock();

const convexQueryMock = mock();
const convexSetAuthMock = mock();

class MockConvexHttpClient {
  constructor(_url) {}

  setAuth(token) {
    convexSetAuthMock(token);
  }

  query(queryRef, args) {
    return convexQueryMock(queryRef, args);
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
});
