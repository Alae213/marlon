export function createPublicCheckoutIdempotencyKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

type PublicCheckoutAttemptProduct = {
  productId: string;
  quantity: number;
  variant?: string;
};

type PublicCheckoutAttemptPayload = {
  storeSlug?: string;
  attemptKey: string;
  products?: PublicCheckoutAttemptProduct[];
  customerPhone?: string;
  customerWilaya?: string;
  recoverySource?: string;
};

async function updatePublicCheckoutAttempt(
  action: "start" | "abandon" | "recover",
  payload: PublicCheckoutAttemptPayload,
) {
  if (!payload.storeSlug) return null;

  const response = await fetch("/api/checkout-attempts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });

  if (!response.ok) return null;
  return await response.json().catch(() => null);
}

export function startPublicCheckoutAttempt(payload: PublicCheckoutAttemptPayload) {
  return updatePublicCheckoutAttempt("start", payload);
}

export function abandonPublicCheckoutAttempt(payload: PublicCheckoutAttemptPayload) {
  return updatePublicCheckoutAttempt("abandon", payload);
}

export function recoverPublicCheckoutAttempt(payload: PublicCheckoutAttemptPayload) {
  return updatePublicCheckoutAttempt("recover", payload);
}
