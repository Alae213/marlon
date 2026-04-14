type DeliveryCredentialsPayload = {
  apiKey?: string;
  apiToken?: string;
  apiSecret?: string;
  accountNumber?: string;
};

export type EncryptedDeliveryCredentials = {
  ciphertextHex: string;
  ivHex: string;
};

const AES_ALGO = "AES-GCM";
const IV_LENGTH_BYTES = 12;
const UTF8_ENCODER = new TextEncoder();
const UTF8_DECODER = new TextDecoder();

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array {
  if (!hex || hex.length % 2 !== 0) {
    throw new Error("Invalid encrypted credential payload.");
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

async function getAesKey(): Promise<CryptoKey> {
  const secret = process.env.DELIVERY_CREDENTIALS_KEY;
  if (!secret) {
    throw new Error(
      "Missing DELIVERY_CREDENTIALS_KEY. Set this environment variable to encrypt/decrypt delivery credentials."
    );
  }

  const secretBytes = UTF8_ENCODER.encode(secret);
  const digest = await crypto.subtle.digest("SHA-256", secretBytes);

  return crypto.subtle.importKey(
    "raw",
    digest,
    { name: AES_ALGO, length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const view = bytes.buffer;
  if (view instanceof ArrayBuffer) {
    return view.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  }

  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

export async function encryptDeliveryCredentials(
  payload: DeliveryCredentialsPayload
): Promise<EncryptedDeliveryCredentials> {
  const key = await getAesKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
  const plaintext = UTF8_ENCODER.encode(JSON.stringify(payload));

  const encrypted = await crypto.subtle.encrypt(
    { name: AES_ALGO, iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(plaintext)
  );

  return {
    ciphertextHex: bytesToHex(new Uint8Array(encrypted)),
    ivHex: bytesToHex(iv),
  };
}

export async function decryptDeliveryCredentials(
  encrypted: EncryptedDeliveryCredentials
): Promise<DeliveryCredentialsPayload> {
  const key = await getAesKey();
  const iv = hexToBytes(encrypted.ivHex);
  const ciphertext = hexToBytes(encrypted.ciphertextHex);

  const decrypted = await crypto.subtle.decrypt(
    { name: AES_ALGO, iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(ciphertext)
  );

  const parsed = JSON.parse(UTF8_DECODER.decode(decrypted)) as DeliveryCredentialsPayload;

  return {
    apiKey: parsed.apiKey ?? "",
    apiToken: parsed.apiToken ?? "",
    apiSecret: parsed.apiSecret ?? "",
    accountNumber: parsed.accountNumber ?? "",
  };
}
