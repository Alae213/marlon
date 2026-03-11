"use client";

import { Check } from "lucide-react";
import type { OrderStatus } from "@/lib/orders-types";
import { STATUS_LABELS } from "@/lib/orders-types";
import { Dropdown, DropdownItem } from "@/components/core/dropdown";

interface StatusDropdownProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function StatusDropdown({ 
  currentStatus, 
  onStatusChange,
  isOpen,
  setIsOpen
}: StatusDropdownProps) {
  const statuses: OrderStatus[] = ["new", "confirmed", "packaged", "shipped", "succeeded", "canceled", "blocked", "router"];
  
  const statusColors: Record<OrderStatus, { dot: string }> = {
    new: { dot: "bg-blue-500" },
    confirmed: { dot: "bg-gray-500" },
    packaged: { dot: "bg-gray-500" },
    shipped: { dot: "bg-yellow-500" },
    succeeded: { dot: "bg-green-500" },
    canceled: { dot: "bg-red-500" },
    blocked: { dot: "bg-red-500" },
    router: { dot: "bg-yellow-500" },
  };

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <span className="cursor-pointer">
          {/* This is rendered by the parent component */}
        </span>
      }
      placement="bottom-start"
    >
      {statuses.map((status) => (
        <DropdownItem
          key={status}
          onClick={() => {
            onStatusChange(status);
            setIsOpen(false);
          }}
        >
          <span className={`w-2 h-2 rounded-[12px] ${statusColors[status].dot}`} />
          <span className="flex-1">{STATUS_LABELS[status]?.label || status}</span>
          {currentStatus === status && <Check className="w-3.5 h-3.5" />}
        </DropdownItem>
      ))}
    </Dropdown>
  );
}
