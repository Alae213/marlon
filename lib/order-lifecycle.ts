export const ORDER_STATUSES = [
  "new",
  "awaiting_confirmation",
  "confirmed",
  "cancelled",
  "blocked",
  "dispatch_ready",
  "dispatched",
  "in_transit",
  "delivered",
  "delivery_failed",
  "refused",
  "unreachable",
  "returned",
  "cod_collected",
  "cod_reconciled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const LEGACY_ORDER_STATUS_MAP = {
  new: "new",
  confirmed: "confirmed",
  packaged: "dispatch_ready",
  shipped: "in_transit",
  succeeded: "delivered",
  canceled: "cancelled",
  cancelled: "cancelled",
  blocked: "blocked",
  router: "returned",
} as const satisfies Record<string, OrderStatus>;

export type LegacyOrderStatus = keyof typeof LEGACY_ORDER_STATUS_MAP;
export type OrderTransitionActor = "merchant" | "provider" | "system";

export type OrderStatusVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info";

export const ORDER_STATUS_LABELS: Record<
  OrderStatus,
  { label: string; variant: OrderStatusVariant }
> = {
  new: { label: "Needs Call", variant: "info" },
  awaiting_confirmation: { label: "Awaiting Confirmation", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
  blocked: { label: "Blocked", variant: "danger" },
  dispatch_ready: { label: "Ready to Dispatch", variant: "warning" },
  dispatched: { label: "Provider Accepted", variant: "info" },
  in_transit: { label: "With Courier", variant: "info" },
  delivered: { label: "Delivered", variant: "success" },
  delivery_failed: { label: "Provider Failed", variant: "danger" },
  refused: { label: "Customer Refused", variant: "danger" },
  unreachable: { label: "Customer Unreachable", variant: "warning" },
  returned: { label: "Returned", variant: "danger" },
  cod_collected: { label: "COD Collected", variant: "success" },
  cod_reconciled: { label: "COD Reconciled", variant: "success" },
};

export const ORDER_STATUS_TRANSITIONS: Record<
  OrderTransitionActor,
  Partial<Record<OrderStatus, readonly OrderStatus[]>>
> = {
  merchant: {
    new: ["awaiting_confirmation", "confirmed", "cancelled", "blocked"],
    awaiting_confirmation: ["confirmed", "cancelled", "blocked", "refused", "unreachable"],
    confirmed: ["cancelled", "blocked"],
    dispatch_ready: ["cancelled"],
    delivery_failed: ["awaiting_confirmation", "returned"],
    unreachable: ["awaiting_confirmation", "returned"],
    refused: ["awaiting_confirmation", "cancelled"],
    returned: ["awaiting_confirmation", "cancelled"],
    cancelled: ["new"],
    blocked: ["new"],
  },
  provider: {
    dispatch_ready: ["dispatched"],
    dispatched: ["in_transit", "delivered", "delivery_failed", "refused", "unreachable", "returned"],
    in_transit: ["delivered", "delivery_failed", "refused", "unreachable", "returned"],
    delivery_failed: ["in_transit", "returned"],
    unreachable: ["in_transit", "returned"],
    refused: ["returned"],
  },
  system: {
    new: ["awaiting_confirmation", "confirmed", "cancelled", "blocked", "refused", "unreachable"],
    awaiting_confirmation: ["confirmed", "cancelled", "blocked", "refused", "unreachable"],
    confirmed: ["dispatch_ready", "dispatched", "cancelled", "blocked"],
    dispatch_ready: ["dispatched", "cancelled"],
    dispatched: ["in_transit", "delivered", "delivery_failed", "refused", "unreachable", "returned"],
    in_transit: ["delivered", "delivery_failed", "refused", "unreachable", "returned"],
    delivery_failed: ["awaiting_confirmation", "in_transit", "returned"],
    unreachable: ["awaiting_confirmation", "in_transit", "returned"],
    refused: ["returned"],
    returned: ["awaiting_confirmation", "cancelled"],
    cancelled: ["new"],
    blocked: ["new"],
    delivered: ["cod_collected"],
    cod_collected: ["cod_reconciled"],
  },
};

const ORDER_STATUS_SET = new Set<string>(ORDER_STATUSES);

export function isOrderStatus(status: unknown): status is OrderStatus {
  return typeof status === "string" && ORDER_STATUS_SET.has(status);
}

export function normalizeOrderStatus(status: unknown): OrderStatus | null {
  if (isOrderStatus(status)) {
    return status;
  }

  if (typeof status !== "string") {
    return null;
  }

  return LEGACY_ORDER_STATUS_MAP[status as LegacyOrderStatus] ?? null;
}

export function getOrderStatusLabel(status: unknown): string {
  const canonical = normalizeOrderStatus(status);
  if (!canonical) {
    return typeof status === "string" ? status : "Unknown";
  }
  return ORDER_STATUS_LABELS[canonical].label;
}

export function getAllowedOrderStatusTransitions(
  status: unknown,
  actor: OrderTransitionActor = "merchant"
): OrderStatus[] {
  const canonical = normalizeOrderStatus(status);
  if (!canonical) {
    return [];
  }
  return [...(ORDER_STATUS_TRANSITIONS[actor][canonical] ?? [])];
}

export function canTransitionOrderStatus(
  fromStatus: unknown,
  toStatus: unknown,
  actor: OrderTransitionActor = "merchant"
): boolean {
  const from = normalizeOrderStatus(fromStatus);
  const to = normalizeOrderStatus(toStatus);
  if (!from || !to || !isOrderStatus(toStatus)) {
    return false;
  }
  return getAllowedOrderStatusTransitions(from, actor).includes(to);
}

export function assertOrderStatusTransition(
  fromStatus: unknown,
  toStatus: unknown,
  actor: OrderTransitionActor = "merchant"
) {
  const from = normalizeOrderStatus(fromStatus);
  if (!from) {
    throw new Error(`Unknown current order status: ${String(fromStatus)}`);
  }

  if (!isOrderStatus(toStatus)) {
    throw new Error(`Unknown target order status: ${String(toStatus)}`);
  }

  if (!canTransitionOrderStatus(from, toStatus, actor)) {
    throw new Error(`Invalid order status transition: ${from} -> ${toStatus}`);
  }

  return {
    fromStatus: from,
    toStatus,
    actor,
  };
}
