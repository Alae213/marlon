/**
 * Status Icons for Order Badges
 * This file must be .tsx since it contains JSX
 */

import { ReactNode } from "react";
import {
  Ban,
  Banknote,
  BanknoteX,
  CircleDashed,
  CircleCheckBig,
  CircleX,
  Clock,
  HandCoins,
  HelpCircle,
  MapPinned,
  PackageCheck,
  PhoneOff,
  Truck,
} from "lucide-react";
import type { OrderStatus } from "./orders-types";
import { normalizeOrderStatus } from "./order-lifecycle";

// Status config with hardcoded hex colors
export const STATUS_CONFIG: Record<OrderStatus, {
  label: string;
  icon: ReactNode;
  bgColor: string;
  textColor: string;
}> = {
  new: {
    label: "New",
    icon: <CircleDashed className="w-3.5 h-3.5" />,
    bgColor: "#0066FE20",
    textColor: "#0066FE",
  },
  awaiting_confirmation: {
    label: "Awaiting Confirmation",
    icon: <Clock className="w-3.5 h-3.5" />,
    bgColor: "#FC923920",
    textColor: "#FC9239",
  },
  confirmed: {
    label: "Confirmed",
    icon: <CircleCheckBig className="w-3.5 h-3.5" />,
    bgColor: "#00EEBE20",
    textColor: "#17CFAA",
  },
  dispatch_ready: {
    label: "Ready to Dispatch",
    icon: <PackageCheck className="w-3.5 h-3.5" />,
    bgColor: "#FC923920",
    textColor: "#FC9239",
  },
  dispatched: {
    label: "Dispatched",
    icon: <Truck className="w-3.5 h-3.5" />,
    bgColor: "#F164AD20",
    textColor: "#F164AD",
  },
  in_transit: {
    label: "In Transit",
    icon: <MapPinned className="w-3.5 h-3.5" />,
    bgColor: "#7C3AED20",
    textColor: "#7C3AED",
  },
  delivered: {
    label: "Delivered",
    icon: <Banknote className="w-3.5 h-3.5" />,
    bgColor: "#00CF7D20",
    textColor: "#00CF7D",
  },
  cod_collected: {
    label: "COD Collected",
    icon: <HandCoins className="w-3.5 h-3.5" />,
    bgColor: "#00CF7D20",
    textColor: "#00CF7D",
  },
  cod_reconciled: {
    label: "COD Reconciled",
    icon: <CircleCheckBig className="w-3.5 h-3.5" />,
    bgColor: "#00853F20",
    textColor: "#00853F",
  },
  cancelled: {
    label: "Cancelled",
    icon: <CircleX className="w-3.5 h-3.5" />,
    bgColor: "#F0381C20",
    textColor: "#F0381C",
  },
  blocked: {
    label: "Blocked",
    icon: <Ban className="w-3.5 h-3.5" />,
    bgColor: "#9E000020",
    textColor: "#9E0000",
  },
  delivery_failed: {
    label: "Delivery Failed",
    icon: <PhoneOff className="w-3.5 h-3.5" />,
    bgColor: "#CF003720",
    textColor: "#CF0037",
  },
  refused: {
    label: "Refused",
    icon: <BanknoteX className="w-3.5 h-3.5" />,
    bgColor: "#CF003720",
    textColor: "#CF0037",
  },
  unreachable: {
    label: "Unreachable",
    icon: <HelpCircle className="w-3.5 h-3.5" />,
    bgColor: "#FC923920",
    textColor: "#FC9239",
  },
  returned: {
    label: "Returned",
    icon: <BanknoteX className="w-3.5 h-3.5" />,
    bgColor: "#CF003720",
    textColor: "#CF0037",
  },
};

// Helper function to get status config
export function getStatusConfig(status: string) {
  const canonical = normalizeOrderStatus(status);
  return canonical ? STATUS_CONFIG[canonical] : undefined;
}
