import { afterEach, beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";

const authMock = mock();
const getActivePaymentProviderMock = mock();
const createCheckoutMock = mock();
const convexMutationMock = mock();
const convexSetAuthMock = mock();

class MockConvexHttpClient {
  constructor() {}

  setAuth(token) {
    convexSetAuthMock(token);
  }

  mutation(reference, args) {
    return convexMutationMock(reference, args);
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

mock.module("convex/browser", () => ({
  ConvexHttpClient: MockConvexHttpClient,
}));

mock.module("@/lib/payment-service", () => ({
  getActivePaymentProvider: getActivePaymentProviderMock,
  getPaymentProvider: () => ({
    createCheckout: createCheckoutMock,
  }),
}));

let POST;
let consoleErrorSpy;
const originalConsoleError = console.error;

beforeAll(async () => {
  ({ POST } = await import("@/app/api/chargily/create-payment/route"));
});

beforeEach(() => {
  process.env.NEXT_PUBLIC_CONVEX_URL = "https://example.convex.cloud";

  authMock.mockReset();
  getActivePaymentProviderMock.mockReset();
  createCheckoutMock.mockReset();
  convexMutationMock.mockReset();
  convexSetAuthMock.mockReset();

  authMock.mockResolvedValue({
    userId: "user_1",
    getToken: async () => "convex_token",
  });
  getActivePaymentProviderMock.mockReturnValue("chargily");

  consoleErrorSpy = mock(() => {});
  console.error = consoleErrorSpy;
});

afterEach(() => {
  console.error = originalConsoleError;
});

function createRequest(body) {
  return new Request("http://localhost:3000/api/chargily/create-payment", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/chargily/create-payment", () => {
  it("returns 400 when store context is missing", async () => {
    const response = await POST(createRequest({}));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing store context.");
    expect(convexMutationMock).not.toHaveBeenCalled();
    expect(createCheckoutMock).not.toHaveBeenCalled();
  });

  it("returns 401 when user is unauthenticated", async () => {
    authMock.mockResolvedValue({
      userId: null,
      getToken: async () => null,
    });

    const response = await POST(createRequest({ storeId: "store_1" }));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
    expect(convexMutationMock).not.toHaveBeenCalled();
  });

  it("returns 403 when the actor cannot initiate checkout for the store", async () => {
    convexMutationMock.mockRejectedValue(new Error("Forbidden"));

    const response = await POST(createRequest({ storeId: "store_1" }));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("You do not have access to this store.");
    expect(createCheckoutMock).not.toHaveBeenCalled();
  });

  it("creates checkout from server-owned store context and records the attempt", async () => {
    convexMutationMock
      .mockResolvedValueOnce({
        paymentAttemptId: "attempt_1",
        storeId: "store_real",
        storeName: "Canonical Store",
        storeSlug: "canonical-store",
        actorRole: "owner",
      })
      .mockResolvedValueOnce("attempt_1");

    createCheckoutMock.mockResolvedValue({
      success: true,
      checkoutUrl: "https://checkout.example/1",
      checkoutId: "checkout_1",
    });

    const response = await POST(
      createRequest({
        storeId: "store_real",
        storeName: "Spoofed Store",
        amount: 1,
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      success: true,
      checkoutUrl: "https://checkout.example/1",
      checkoutId: "checkout_1",
      paymentAttemptId: "attempt_1",
    });

    expect(convexSetAuthMock).toHaveBeenCalledWith("convex_token");
    expect(convexMutationMock).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        storeId: "store_real",
        provider: "chargily",
        amountDzd: 2000,
        currency: "dzd",
      }),
    );
    expect(createCheckoutMock).toHaveBeenCalledWith(
      expect.objectContaining({
        storeId: "store_real",
        storeName: "Canonical Store",
        amount: 2000,
        currency: "dzd",
        description: "اشتراك شهري Canonical Store - فتح الطلبات",
        metadata: expect.objectContaining({
          storeId: "store_real",
          storeSlug: "canonical-store",
          paymentAttemptId: "attempt_1",
          purpose: "store_unlock",
          actorRole: "owner",
        }),
      }),
    );
    expect(convexMutationMock).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      {
        paymentAttemptId: "attempt_1",
        status: "provider_pending",
        providerCheckoutId: "checkout_1",
        providerReference: "checkout_1",
      },
    );
  });
});
