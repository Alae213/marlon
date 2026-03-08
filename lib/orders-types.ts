/**
 * Order Types for Marlon E-commerce Platform
 */

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
  outcome: "answered" | "no_answer" | "wrong_number" | "refused";
  notes?: string;
}

// Admin note (internal only, not visible to customers)
export interface AdminNote {
  id: string;
  text: string;
  timestamp: number;
  merchantId: string;
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
  deliveryType: "home_delivery" | "office_delivery" | "pickup";
  trackingNumber?: string;
  callLog: CallLog[];
  adminNotes?: AdminNote[];
  auditTrail: AuditTrailEntry[];
}

// Order status types
export type OrderStatus = 
  | "new" 
  | "confirmed" 
  | "packaged" 
  | "shipped" 
  | "succeeded" 
  | "canceled" 
  | "blocked"
  | "hold";

// Sort types
export type SortField = "date" | "total" | "status";
export type SortDirection = "asc" | "desc";

// Status labels for display
export const STATUS_LABELS: Record<OrderStatus, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }> = {
  new: { label: "New", variant: "info" },
  confirmed: { label: "Confirmed", variant: "default" },
  packaged: { label: "Packaged", variant: "default" },
  shipped: { label: "Shipped", variant: "warning" },
  succeeded: { label: "Succeeded", variant: "success" },
  canceled: { label: "Canceled", variant: "danger" },
  blocked: { label: "Blocked", variant: "danger" },
  hold: { label: "On Hold", variant: "warning" },
};

// Call outcome labels
export const CALL_OUTCOME_LABELS: Record<CallLog["outcome"], { label: string; icon: string }> = {
  answered: { label: "Answered", icon: "✓" },
  no_answer: { label: "No Answer", icon: "✗" },
  wrong_number: { label: "Wrong Number", icon: "!" },
  refused: { label: "Refused", icon: "✗" },
};

// Delivery type labels
export const DELIVERY_TYPE_LABELS: Record<Order["deliveryType"], string> = {
  home_delivery: "Home Delivery",
  office_delivery: "Office Delivery",
  pickup: "Pickup",
};

// Status transition map - what statuses can each status transition to
export const STATUS_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  new: ["confirmed", "canceled", "blocked", "hold"],
  confirmed: ["packaged", "canceled", "blocked", "hold"],
  packaged: ["shipped", "canceled"],
  shipped: ["succeeded", "canceled"],
  succeeded: [],
  canceled: ["new"], // Can reopen
  blocked: ["new"], // Can reopen
  hold: ["new", "confirmed", "canceled"],
};
