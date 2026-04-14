"use client";

import type { ReactElement } from "react";
import { Check } from "lucide-react";
import type { OrderStatus } from "@/lib/orders-types";
import { STATUS_LABELS } from "@/lib/orders-types";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";

interface StatusDropdownProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  trigger?: ReactElement;
}

export function StatusDropdown({ 
  currentStatus, 
  onStatusChange,
  isOpen,
  setIsOpen,
  trigger,
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
    <Menu open={isOpen} onOpenChange={setIsOpen}>
      <MenuTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="inline-flex"
            aria-label="Open status menu"
          />
        )}
      </MenuTrigger>
      <MenuContent
        align="start"
        sideOffset={4}
        className="min-w-[180px] rounded-[14px] border border-[var(--system-100)] bg-[var(--system-50)] p-1 text-[var(--system-600)] shadow-[var(--shadow-md)]"
      >
        {statuses.map((status) => (
          <MenuItem
            key={status}
            onSelect={() => {
              onStatusChange(status);
              setIsOpen(false);
            }}
            className="px-3 py-2 text-sm flex items-center gap-2 rounded-[12px] cursor-pointer hover:bg-black/5 focus:bg-black/5"
          >
            <span className={`w-2 h-2 rounded-[12px] ${statusColors[status].dot}`} />
            <span className="flex-1">{STATUS_LABELS[status]?.label || status}</span>
            {currentStatus === status && <Check className="w-3.5 h-3.5" />}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}
