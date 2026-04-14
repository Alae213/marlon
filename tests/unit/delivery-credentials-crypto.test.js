import { afterEach, describe, expect, it } from "bun:test";

import {
  decryptDeliveryCredentials,
  encryptDeliveryCredentials,
} from "@/convex/deliveryCredentialsCrypto";

const originalCredentialsKey = process.env.DELIVERY_CREDENTIALS_KEY;

afterEach(() => {
  if (originalCredentialsKey === undefined) {
    delete process.env.DELIVERY_CREDENTIALS_KEY;
  } else {
    process.env.DELIVERY_CREDENTIALS_KEY = originalCredentialsKey;
  }
});

describe("delivery credentials crypto", () => {
  it("encrypts and decrypts credentials when DELIVERY_CREDENTIALS_KEY is set", async () => {
    process.env.DELIVERY_CREDENTIALS_KEY = "test-key-for-delivery-credentials";

    const payload = {
      apiKey: "key_123",
      apiToken: "token_123",
      apiSecret: "secret_123",
      accountNumber: "acc_123",
    };

    const encrypted = await encryptDeliveryCredentials(payload);
    const decrypted = await decryptDeliveryCredentials(encrypted);

    expect(decrypted).toEqual(payload);
  });

  it("fails with a clear error when DELIVERY_CREDENTIALS_KEY is missing", async () => {
    delete process.env.DELIVERY_CREDENTIALS_KEY;

    await expect(
      encryptDeliveryCredentials({
        apiKey: "key_123",
      })
    ).rejects.toThrow("Missing DELIVERY_CREDENTIALS_KEY");
  });
});
