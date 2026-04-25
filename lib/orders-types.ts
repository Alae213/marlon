/**
 * Order Types for Marlon E-commerce Platform
 */

// Order status icons are managed in status-icons.tsx
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
  ORDER_STATUSES,
  type OrderStatus,
} from "./order-lifecycle";
import type { CodPaymentStatus } from "./order-cod-payment";
import type { CallOutcome, OrderRiskFlag } from "./order-confirmation";

export type { OrderStatus, OrderTransitionActor } from "./order-lifecycle";
export type { CodPaymentStatus } from "./order-cod-payment";
export type { CallOutcome, OrderRiskFlag } from "./order-confirmation";
export {
  ORDER_STATUSES,
  normalizeOrderStatus,
  getOrderStatusLabel,
  getAllowedOrderStatusTransitions,
  canTransitionOrderStatus,
  assertOrderStatusTransition,
} from "./order-lifecycle";
export {
  COD_PAYMENT_STATUSES,
  COD_PAYMENT_STATUS_LABELS,
  assertCanReconcileCodPayment,
  getCodPaymentStatusForOrderStatus,
  isCodPaymentStatus,
  normalizeCodPaymentStatus,
} from "./order-cod-payment";
export {
  CALL_OUTCOMES,
  CALL_OUTCOME_LABELS,
  NO_ANSWER_UNREACHABLE_THRESHOLD,
  ORDER_RISK_FLAGS,
  ORDER_RISK_FLAG_LABELS,
  getCallOutcomeLifecycleTransition,
  getMerchantTransitionsForOrder,
  hasAnsweredCallEvidence,
  normalizeOrderRiskFlags,
} from "./order-confirmation";

// Order item in an order
export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  variant?: string;
}

// Call log entry for orders
export interface CallLog {
  id: string;
  timestamp: number;
  outcome: CallOutcome;
  notes?: string;
}

// Audit trail entry
export interface AuditTrailEntry {
  id: string;
  timestamp: number;
  action: "status_change" | "call" | "admin_note" | "created";
  details: string;
}

// Full Order type
export interface Order {
  id: string;
  orderNumber: string;
  createdAt: number;
  updatedAt?: number;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  customerWilaya: string;
  customerCommune: string;
  customerAddress?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCost: number;
  total: number;
  codPaymentStatus?: CodPaymentStatus;
  deliveryType: "home_delivery" | "office_delivery" | "pickup";
  trackingNumber?: string;
  callLog: CallLog[];
  adminNoteText?: string;
  adminNoteUpdatedAt?: number;
  adminNoteUpdatedBy?: string;
  riskFlags?: OrderRiskFlag[];
  auditTrail: AuditTrailEntry[];
}

// Sort types
export type SortField = "date" | "total" | "status";
export type SortDirection = "asc" | "desc";

// Status labels for display (without icons - icons are in status-icons.tsx)
export const STATUS_LABELS = ORDER_STATUS_LABELS;

// Delivery type labels
export const DELIVERY_TYPE_LABELS: Record<Order["deliveryType"], string> = {
  home_delivery: "Home Delivery",
  office_delivery: "Office Delivery",
  pickup: "Pickup",
};

// Status transition map - what statuses can each status transition to
export const STATUS_TRANSITIONS = ORDER_STATUS_TRANSITIONS.merchant;
export const statuses = [...ORDER_STATUSES];
