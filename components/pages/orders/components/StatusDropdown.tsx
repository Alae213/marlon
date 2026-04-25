"use client";

import type { ReactElement } from "react";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  getMerchantTransitionsForOrder,
  getOrderStatusLabel,
  normalizeOrderStatus,
} from "@/lib/orders-types";
import { getStatusConfig } from "@/lib/status-icons";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";

interface StatusDropdownProps {
  currentStatus: string;
  order?: Doc<"orders">;
  onStatusChange: (status: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  trigger?: ReactElement;
}

export function StatusDropdown({ 
  currentStatus, 
  order,
  onStatusChange,
  isOpen,
  setIsOpen,
  trigger,
}: StatusDropdownProps) {
  const canonicalStatus = normalizeOrderStatus(currentStatus);
  const statuses = getMerchantTransitionsForOrder(currentStatus, order, "merchant");

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
        {statuses.length === 0 ? (
          <MenuItem
            disabled
            className="px-3 py-2 text-sm text-[var(--system-400)] rounded-[12px]"
          >
            No merchant actions
          </MenuItem>
        ) : statuses.map((status) => {
          const statusConfig = getStatusConfig(status);

          return (
          <MenuItem
            key={status}
            onSelect={() => {
              onStatusChange(status);
              setIsOpen(false);
            }}
            className="px-3 py-2 text-sm flex items-center gap-2 rounded-[12px] cursor-pointer hover:bg-black/5 focus:bg-black/5"
          >
            <span
              className="h-2 w-2 rounded-[12px]"
              style={{ backgroundColor: statusConfig?.textColor || "var(--system-400)" }}
            />
            <span className="flex-1">{statusConfig?.label || getOrderStatusLabel(status)}</span>
          </MenuItem>
          );
        })}
        {canonicalStatus === null ? (
          <MenuItem
            disabled
            className="px-3 py-2 text-sm text-[var(--system-400)] rounded-[12px]"
          >
            Unknown current status
          </MenuItem>
        ) : null}
      </MenuContent>
    </Menu>
  );
}
