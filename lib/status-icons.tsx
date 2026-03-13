/**
 * Status Icons for Order Badges
 * This file must be .tsx since it contains JSX
 */

import { ReactNode } from "react";
import {
  CircleDashed,
  CircleCheckBig,
  PackageCheck,
  Truck,
  Banknote,
  MessageCircleX,
  Ban,
  BanknoteX,
} from "lucide-react";
import type { OrderStatus } from "./orders-types";

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
  confirmed: { 
    label: "Confirmed", 
    icon: <CircleCheckBig className="w-3.5 h-3.5" />,
    bgColor: "#00EEBE20",
    textColor: "#17CFAA",
  },
  packaged: { 
    label: "Packaged", 
    icon: <PackageCheck className="w-3.5 h-3.5" />,
    bgColor: "#FC923920",
    textColor: "#FC9239",
  },
  shipped: { 
    label: "Shipped", 
    icon: <Truck className="w-3.5 h-3.5" />,
    bgColor: "#F164AD20",
    textColor: "#F164AD",
  },
  succeeded: { 
    label: "Succeeded", 
    icon: <Banknote className="w-3.5 h-3.5" />,
    bgColor: "#00CF7D20",
    textColor: "#00CF7D",
  },
  canceled: { 
    label: "Canceled", 
    icon: <MessageCircleX className="w-3.5 h-3.5" />,
    bgColor: "#F0381C20",
    textColor: "#F0381C",
  },
  blocked: { 
    label: "Blocked", 
    icon: <Ban className="w-3.5 h-3.5" />,
    bgColor: "#9E000020",
    textColor: "#9E0000",
  },
  router: { 
    label: "Router", 
    icon: <BanknoteX className="w-3.5 h-3.5" />,
    bgColor: "#CF003720",
    textColor: "#CF0037",
  },
};

// Helper function to get status config
export function getStatusConfig(status: OrderStatus) {
  return STATUS_CONFIG[status];
}
