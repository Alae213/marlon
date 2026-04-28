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
  ({ POST } = await import("@/app/api/checkout-attempts/route"));
});

beforeEach(() => {
  process.env.NEXT_PUBLIC_CONVEX_URL = "https://example.convex.cloud";
  convexMutationMock.mockReset();
});

function createRequest(body) {
  return new Request("http://localhost:3000/api/checkout-attempts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/checkout-attempts", () => {
  it("starts an anonymous checkout attempt before order conversion", async () => {
    convexMutationMock.mockResolvedValue({
      checkoutAttemptId: "attempt_1",
      lifecycle: "started",
      duplicate: false,
    });

    const response = await POST(
      createRequest({
        action: "start",
        storeSlug: "demo-store",
        attemptKey: "attempt-key-123",
        products: [{ productId: "prod_1", quantity: 2 }],
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      checkoutAttemptId: "attempt_1",
      lifecycle: "started",
      duplicate: false,
    });
    expect(convexMutationMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        storeSlug: "demo-store",
        attemptKey: "attempt-key-123",
        products: [{ productId: "prod_1", quantity: 2, variant: undefined }],
      }),
    );
  });

  it("marks abandoned attempts without creating orders", async () => {
    convexMutationMock.mockResolvedValue({
      checkoutAttemptId: "attempt_1",
      lifecycle: "abandoned",
      ignored: false,
    });

    const response = await POST(
      createRequest({
        action: "abandon",
        storeSlug: "demo-store",
        attemptKey: "attempt-key-123",
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.lifecycle).toBe("abandoned");
  });

  it("fails malformed attempt payloads safely", async () => {
    const response = await POST(
      createRequest({
        action: "start",
        storeSlug: "demo-store",
        attemptKey: "attempt-key-123",
        products: [],
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Malformed checkout payload.");
    expect(convexMutationMock).not.toHaveBeenCalled();
  });
});
