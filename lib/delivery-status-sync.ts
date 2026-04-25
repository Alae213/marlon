import { type OrderStatus } from "./order-lifecycle";

export const DELIVERY_PROVIDER_SHIPMENT_STATUSES = [
  "pending",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "delivery_failed",
  "refused",
  "unreachable",
  "returned",
] as const;

export type DeliveryProviderShipmentStatus = (typeof DELIVERY_PROVIDER_SHIPMENT_STATUSES)[number];

const PROVIDER_STATUS_TO_ORDER_STATUS: Record<string, OrderStatus> = {
  pending: "dispatched",
  en_attente: "dispatched",
  created: "dispatched",
  accepted: "dispatched",
  ready: "dispatched",
  picked_up: "in_transit",
  pickedup: "in_transit",
  picked: "in_transit",
  collectee: "in_transit",
  collected: "in_transit",
  in_transit: "in_transit",
  transit: "in_transit",
  en_cours: "in_transit",
  out_for_delivery: "in_transit",
  en_livraison: "in_transit",
  delivered: "delivered",
  livree: "delivered",
  failed: "delivery_failed",
  delivery_failed: "delivery_failed",
  echouee: "delivery_failed",
  unreachable: "unreachable",
  refused: "refused",
  rejected: "refused",
  returned: "returned",
  return: "returned",
  retour: "returned",
  rts: "returned",
};

function normalizeProviderStatusKey(status: unknown): string | null {
  if (typeof status !== "string") {
    return null;
  }

  const normalized = status
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  return normalized || null;
}

export function mapDeliveryProviderStatusToOrderStatus(status: unknown): OrderStatus | null {
  const key = normalizeProviderStatusKey(status);
  if (!key) {
    return null;
  }

  return PROVIDER_STATUS_TO_ORDER_STATUS[key] ?? null;
}
