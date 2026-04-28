import { beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";

const authMock = mock();
const convexQueryMock = mock();
const convexMutationMock = mock();
const convexSetAdminAuthMock = mock();

class MockConvexHttpClient {
  constructor() {}

  setAdminAuth(token) {
    convexSetAdminAuthMock(token);
  }

  query(reference, args) {
    return convexQueryMock(reference, args);
  }

  mutation(reference, args) {
    return convexMutationMock(reference, args);
  }
}

mock.module("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

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

let previewPOST;
let fixupsPOST;

beforeAll(async () => {
  ({ POST: previewPOST } = await import("@/app/api/_internal/migrations/preview/route"));
  ({ POST: fixupsPOST } = await import("@/app/api/_internal/migrations/fixups/route"));
});

beforeEach(() => {
  process.env.NEXT_PUBLIC_CONVEX_URL = "https://example.convex.cloud";
  process.env.CONVEX_ADMIN_KEY = "admin_key";
  process.env.ENABLE_INTERNAL_MIGRATIONS_UI = "true";
  process.env.INTERNAL_MIGRATIONS_ALLOWLIST_USER_IDS = "user_1";

  authMock.mockReset();
  convexQueryMock.mockReset();
  convexMutationMock.mockReset();
  convexSetAdminAuthMock.mockReset();

  authMock.mockResolvedValue({ userId: "user_1" });
});

describe("internal migrations routes", () => {
  it("returns 404 when the feature gate is disabled", async () => {
    process.env.ENABLE_INTERNAL_MIGRATIONS_UI = "false";

    const response = await previewPOST();
    expect(response.status).toBe(404);
  });

  it("returns 404 when the caller is not allowlisted", async () => {
    process.env.INTERNAL_MIGRATIONS_ALLOWLIST_USER_IDS = "someone_else";

    const response = await previewPOST();
    expect(response.status).toBe(404);
    expect(convexQueryMock).not.toHaveBeenCalled();
  });

  it("returns 500 when Convex admin auth is not configured", async () => {
    delete process.env.CONVEX_ADMIN_KEY;

    const response = await previewPOST();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });

  it("runs internal preview via Convex admin client when allowlisted", async () => {
    convexQueryMock.mockResolvedValue({ totalStores: 1 });

    const response = await previewPOST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ success: true, result: { totalStores: 1 } });
    expect(convexSetAdminAuthMock).toHaveBeenCalledWith("admin_key");
    expect(convexQueryMock).toHaveBeenCalledWith(expect.anything(), {});
  });

  it("runs parity fix-ups with provided args", async () => {
    convexMutationMock.mockResolvedValue({ patched: 0, dryRun: true });

    const response = await fixupsPOST(
      new Request("http://localhost:3000/api/_internal/migrations/fixups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ batchSize: 50, dryRun: true }),
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(convexMutationMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ batchSize: 50, dryRun: true }),
    );
  });
});

