export type PublicOrderErrorCode =
  | "PUBLIC_ORDER_INVALID_STORE"
  | "PUBLIC_ORDER_INVALID_IDEMPOTENCY_KEY"
  | "PUBLIC_ORDER_MISSING_FIELDS"
  | "PUBLIC_ORDER_INVALID_PHONE"
  | "PUBLIC_ORDER_INVALID_PRODUCT"
  | "PUBLIC_ORDER_STORE_VELOCITY_LIMIT"
  | "PUBLIC_ORDER_PHONE_VELOCITY_LIMIT"
  | "PUBLIC_ORDER_DUPLICATE_RECENT"
  | "PUBLIC_CHECKOUT_INVALID_ATTEMPT"
  | "PUBLIC_CHECKOUT_INVALID_ATTEMPT_KEY"
  | "PUBLIC_CHECKOUT_INVALID_STORE"
  | "PUBLIC_CHECKOUT_ATTEMPT_STORE_MISMATCH"
  | "PUBLIC_ORDER_MALFORMED_PAYLOAD"
  | "PUBLIC_ORDER_CONVEX_NOT_CONFIGURED"
  | "PUBLIC_ORDER_UNAVAILABLE";

export type DeliveryActionCode =
  | "DELIVERY_NOT_CONFIGURED"
  | "DELIVERY_CREDENTIALS_MISSING"
  | "DELIVERY_PROVIDER_UNSUPPORTED"
  | "DELIVERY_NOT_CONFIRMED"
  | "DELIVERY_PROVIDER_REJECTED"
  | "DELIVERY_PROVIDER_UNAVAILABLE"
  | "DELIVERY_TRACKING_MISSING"
  | "DELIVERY_AUTH_REQUIRED"
  | "DELIVERY_RATE_LIMITED"
  | "DELIVERY_BAD_REQUEST"
  | "DELIVERY_FORBIDDEN"
  | "DELIVERY_ORDER_NOT_FOUND";

export type OrderStatusFeedbackCode =
  | "ORDER_CONFIRMATION_REQUIRES_ANSWERED_CALL"
  | "ORDER_INVALID_TRANSITION"
  | "ORDER_UNKNOWN_STATUS"
  | "ORDER_STATUS_UPDATE_FAILED";

export type ActionHint = {
  label: string;
  href: string;
};

export type DeliveryActionResponse = {
  success: boolean;
  error?: string;
  code?: DeliveryActionCode;
  action?: ActionHint;
};

export const PUBLIC_ORDER_ERROR_MESSAGES: Record<PublicOrderErrorCode, string> = {
  PUBLIC_ORDER_INVALID_STORE: "Store not found.",
  PUBLIC_ORDER_INVALID_IDEMPOTENCY_KEY: "Checkout session expired. Please try again.",
  PUBLIC_ORDER_MISSING_FIELDS: "Please fill in the required checkout fields.",
  PUBLIC_ORDER_INVALID_PHONE: "Invalid phone number.",
  PUBLIC_ORDER_INVALID_PRODUCT: "Invalid product selection.",
  PUBLIC_ORDER_STORE_VELOCITY_LIMIT: "Too many orders for this store. Please try again later.",
  PUBLIC_ORDER_PHONE_VELOCITY_LIMIT: "Too many recent orders for this phone number.",
  PUBLIC_ORDER_DUPLICATE_RECENT: "A similar recent order already exists.",
  PUBLIC_CHECKOUT_INVALID_ATTEMPT: "Checkout session expired. Please try again.",
  PUBLIC_CHECKOUT_INVALID_ATTEMPT_KEY: "Checkout session expired. Please try again.",
  PUBLIC_CHECKOUT_INVALID_STORE: "Store not found.",
  PUBLIC_CHECKOUT_ATTEMPT_STORE_MISMATCH: "Checkout session does not match this store. Please try again.",
  PUBLIC_ORDER_MALFORMED_PAYLOAD: "Malformed order payload.",
  PUBLIC_ORDER_CONVEX_NOT_CONFIGURED: "Order service is not configured.",
  PUBLIC_ORDER_UNAVAILABLE: "Order service is temporarily unavailable. Please try again.",
};

export const DELIVERY_ACTION_MESSAGES: Record<DeliveryActionCode, string> = {
  DELIVERY_NOT_CONFIGURED: "No supported delivery provider is configured for this store.",
  DELIVERY_CREDENTIALS_MISSING: "Delivery credentials are missing for this store.",
  DELIVERY_PROVIDER_UNSUPPORTED: "This delivery provider is not integrated yet.",
  DELIVERY_NOT_CONFIRMED: "Order must be confirmed before dispatch.",
  DELIVERY_PROVIDER_REJECTED: "Delivery provider rejected the order.",
  DELIVERY_PROVIDER_UNAVAILABLE: "Delivery provider is temporarily unavailable. Please try again.",
  DELIVERY_TRACKING_MISSING: "Delivery provider accepted the request but did not return a tracking number.",
  DELIVERY_AUTH_REQUIRED: "Please sign in again before dispatching orders.",
  DELIVERY_RATE_LIMITED: "Too many dispatch requests. Please wait and try again.",
  DELIVERY_BAD_REQUEST: "Delivery request is missing required information.",
  DELIVERY_FORBIDDEN: "You do not have access to dispatch this order.",
  DELIVERY_ORDER_NOT_FOUND: "Order not found.",
};

export const ORDER_STATUS_FEEDBACK_MESSAGES: Record<OrderStatusFeedbackCode, string> = {
  ORDER_CONFIRMATION_REQUIRES_ANSWERED_CALL: "Add an answered call before confirming this order.",
  ORDER_INVALID_TRANSITION: "This status change is not allowed from the current order state.",
  ORDER_UNKNOWN_STATUS: "This order has an unknown status. Refresh before changing it.",
  ORDER_STATUS_UPDATE_FAILED: "Could not update order status. Please try again.",
};

export function getPublicOrderErrorMessage(code: PublicOrderErrorCode) {
  return PUBLIC_ORDER_ERROR_MESSAGES[code] ?? PUBLIC_ORDER_ERROR_MESSAGES.PUBLIC_ORDER_UNAVAILABLE;
}

export function getDeliveryActionMessage(code: DeliveryActionCode) {
  return DELIVERY_ACTION_MESSAGES[code] ?? DELIVERY_ACTION_MESSAGES.DELIVERY_PROVIDER_UNAVAILABLE;
}

export function getOrderStatusFeedbackMessage(code: OrderStatusFeedbackCode) {
  return ORDER_STATUS_FEEDBACK_MESSAGES[code] ?? ORDER_STATUS_FEEDBACK_MESSAGES.ORDER_STATUS_UPDATE_FAILED;
}

export function getPublicOrderCodeFromError(error: unknown): PublicOrderErrorCode {
  const message = error instanceof Error ? error.message : String(error);
  for (const code of Object.keys(PUBLIC_ORDER_ERROR_MESSAGES) as PublicOrderErrorCode[]) {
    if (message.includes(code)) {
      return code;
    }
  }
  if (
    message.includes("products") &&
    (message.includes("productId") ||
      message.includes('table "products"') ||
      message.includes("Invalid ID") ||
      message.includes("ArgumentValidationError"))
  ) {
    return "PUBLIC_ORDER_INVALID_PRODUCT";
  }
  return "PUBLIC_ORDER_UNAVAILABLE";
}

export function isDeliveryAuthRuntimeError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("auth() was called") ||
    message.includes("clerkMiddleware") ||
    message.includes("auth-middleware") ||
    message.includes("Clerk can't detect usage")
  );
}

export function getOrderStatusFeedbackCode(error: unknown): OrderStatusFeedbackCode {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("ORDER_CONFIRMATION_REQUIRES_ANSWERED_CALL")) {
    return "ORDER_CONFIRMATION_REQUIRES_ANSWERED_CALL";
  }
  if (message.includes("Invalid order status transition")) {
    return "ORDER_INVALID_TRANSITION";
  }
  if (message.includes("Unknown current order status") || message.includes("Unknown target order status")) {
    return "ORDER_UNKNOWN_STATUS";
  }
  return "ORDER_STATUS_UPDATE_FAILED";
}

export function isLikelyProviderAvailabilityError(error: string | undefined) {
  if (!error) return false;
  const normalized = error.toLowerCase();
  return (
    normalized.includes("fetch failed") ||
    normalized.includes("network") ||
    normalized.includes("timeout") ||
    normalized.includes("econn") ||
    normalized.includes("enotfound") ||
    normalized.includes("etimedout")
  );
}
