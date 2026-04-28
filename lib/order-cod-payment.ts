import { normalizeOrderStatus, type OrderStatus } from "./order-lifecycle";

export const COD_PAYMENT_STATUSES = [
  "pending_collection",
  "collected",
  "not_collected",
  "reconciliation_pending",
  "reconciled",
] as const;

export type CodPaymentStatus = (typeof COD_PAYMENT_STATUSES)[number];

export const COD_PAYMENT_STATUS_LABELS: Record<CodPaymentStatus, string> = {
  pending_collection: "Pending Collection",
  collected: "Collected",
  not_collected: "Not Collected",
  reconciliation_pending: "Reconciliation Pending",
  reconciled: "Reconciled",
};

const COD_PAYMENT_STATUS_SET = new Set<string>(COD_PAYMENT_STATUSES);

export function isCodPaymentStatus(status: unknown): status is CodPaymentStatus {
  return typeof status === "string" && COD_PAYMENT_STATUS_SET.has(status);
}

export function normalizeCodPaymentStatus(status: unknown): CodPaymentStatus | null {
  return isCodPaymentStatus(status) ? status : null;
}

export function getCodPaymentStatusForOrderStatus(status: unknown): CodPaymentStatus | null {
  const canonicalStatus = normalizeOrderStatus(status);
  if (!canonicalStatus) {
    return null;
  }

  if (canonicalStatus === "delivered") {
    return "collected";
  }

  if (canonicalStatus === "cod_collected") {
    return "collected";
  }

  if (canonicalStatus === "cod_reconciled") {
    return "reconciled";
  }

  if (isCodNotCollectedOrderStatus(canonicalStatus)) {
    return "not_collected";
  }

  return "pending_collection";
}

export function isCodNotCollectedOrderStatus(status: OrderStatus) {
  return (
    status === "cancelled" ||
    status === "blocked" ||
    status === "delivery_failed" ||
    status === "refused" ||
    status === "unreachable" ||
    status === "returned"
  );
}

export function assertCanReconcileCodPayment(status: unknown, codPaymentStatus: unknown) {
  const canonicalStatus = normalizeOrderStatus(status);
  const canonicalCodStatus = normalizeCodPaymentStatus(codPaymentStatus);

  const hasCollectedCod = canonicalCodStatus === "collected";
  const canReconcile =
    (canonicalStatus === "delivered" || canonicalStatus === "cod_collected") &&
    (hasCollectedCod || codPaymentStatus === undefined);

  if (!canReconcile) {
    throw new Error("COD_RECONCILIATION_REQUIRES_COLLECTED_PAYMENT");
  }

  return {
    orderStatus: canonicalStatus,
    codPaymentStatus: canonicalCodStatus,
  };
}
