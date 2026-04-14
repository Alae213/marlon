import { describe, expect, it } from "bun:test";

import { getDeliveryIntegration } from "@/convex/siteContent";

const runGetDeliveryIntegration = getDeliveryIntegration._handler;

function createCtx({ sectionDoc, storedCredentials }) {
  return {
    db: {
      query(tableName) {
        if (tableName === "siteContent") {
          return {
            withIndex() {
              return {
                first: async () => sectionDoc,
              };
            },
          };
        }

        if (tableName === "deliveryCredentials") {
          return {
            withIndex() {
              return {
                first: async () => storedCredentials,
              };
            },
          };
        }

        throw new Error(`Unexpected table queried: ${tableName}`);
      },
    },
  };
}

describe("getDeliveryIntegration public metadata safety", () => {
  it("returns only metadata and never decrypted credentials when encrypted row exists", async () => {
    const result = await runGetDeliveryIntegration(
      createCtx({
        sectionDoc: {
          updatedAt: 100,
          content: {
            provider: "zr-express",
            credentials: {
              apiKey: "legacy_key_should_not_leak",
              apiSecret: "legacy_secret_should_not_leak",
            },
          },
        },
        storedCredentials: {
          updatedAt: 200,
          ciphertextHex: "deadbeef",
          ivHex: "00112233445566778899aabb",
        },
      }),
      { storeId: "store_1" }
    );

    expect(result).toEqual({
      provider: "zr-express",
      hasCredentials: true,
      lastUpdatedAt: 100,
      credentialsUpdatedAt: 200,
    });
    expect(result.credentials).toBeUndefined();
    expect(result.apiKey).toBeUndefined();
    expect(result.apiSecret).toBeUndefined();
    expect(result.apiToken).toBeUndefined();
  });

  it("marks legacy credentials presence without exposing raw secrets", async () => {
    const result = await runGetDeliveryIntegration(
      createCtx({
        sectionDoc: {
          updatedAt: 100,
          content: {
            provider: "zr_express",
            apiKey: "legacy_key",
            apiSecret: "legacy_secret",
          },
        },
        storedCredentials: null,
      }),
      { storeId: "store_1" }
    );

    expect(result).toEqual({
      provider: "zr-express",
      hasCredentials: true,
      lastUpdatedAt: 100,
      credentialsUpdatedAt: null,
      fromLegacyPayload: true,
    });
    expect(result.credentials).toBeUndefined();
    expect(result.apiKey).toBeUndefined();
    expect(result.apiSecret).toBeUndefined();
  });
});
