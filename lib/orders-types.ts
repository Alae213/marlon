/**
 * Order Types for Marlon E-commerce Platform
 */

// Order item in an order
export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string;
  image?: string;
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
  | "hold";

// Sort types
export type SortField = "date" | "total" | "status";
export type SortDirection = "asc" | "desc";

// Status labels for display
export const STATUS_LABELS: Record<OrderStatus, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }> = {
  new: { label: "جديد", variant: "info" },
  confirmed: { label: "مؤكد", variant: "default" },
  packaged: { label: "مُعبأ", variant: "default" },
  shipped: { label: "مُشحن", variant: "warning" },
  succeeded: { label: "مُنجز", variant: "success" },
  canceled: { label: "ملغى", variant: "danger" },
  hold: { label: "معلق", variant: "warning" },
};

// Call outcome labels
export const CALL_OUTCOME_LABELS: Record<CallLog["outcome"], { label: string; icon: string }> = {
  answered: { label: "تم الرد", icon: "✓" },
  no_answer: { label: "لا رد", icon: "✗" },
  wrong_number: { label: "رقم خطأ", icon: "!" },
  refused: { label: "رفض الاستلام", icon: "✗" },
};

// Delivery type labels
export const DELIVERY_TYPE_LABELS: Record<Order["deliveryType"], string> = {
  home_delivery: "توصيل للمنزل",
  office_delivery: "توصيل للمكتب",
  pickup: "استلام من المحل",
};

// Status transition map - what statuses can each status transition to
export const STATUS_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  new: ["confirmed", "canceled", "hold"],
  confirmed: ["packaged", "canceled", "hold"],
  packaged: ["shipped", "canceled"],
  shipped: ["succeeded", "canceled"],
  succeeded: [],
  canceled: ["new"], // Can reopen
  hold: ["new", "confirmed", "canceled"],
};
