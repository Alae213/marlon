"use client";

import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import type { OrderStatus } from "@/lib/orders-types";
import { STATUS_LABELS } from "@/lib/orders-types";

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, setIsOpen]);

  const statuses: OrderStatus[] = ["new", "confirmed", "packaged", "shipped", "succeeded", "canceled", "blocked", "hold"];
  
  const statusColors: Record<OrderStatus, { dot: string; bg: string }> = {
    new: { dot: "bg-blue-500", bg: "bg-blue-500/10" },
    confirmed: { dot: "bg-gray-500", bg: "bg-gray-500/10" },
    packaged: { dot: "bg-gray-500", bg: "bg-gray-500/10" },
    shipped: { dot: "bg-yellow-500", bg: "bg-yellow-500/10" },
    succeeded: { dot: "bg-green-500", bg: "bg-green-500/10" },
    canceled: { dot: "bg-red-500", bg: "bg-red-500/10" },
    blocked: { dot: "bg-red-500", bg: "bg-red-500/10" },
    hold: { dot: "bg-yellow-500", bg: "bg-yellow-500/10" },
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full mt-1 left-0 z-[100] w-48 bg-white dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#404040] shadow-lg rounded-md overflow-hidden isolate"
    >
      {statuses.map((status) => (
        <button
          key={status}
          onClick={() => {
            onStatusChange(status);
            setIsOpen(false);
          }}
          className={`w-full px-3 py-2 text-start text-sm flex items-center gap-2 hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-colors ${
            currentStatus === status ? "bg-[#f5f5f5] dark:bg-[#262626]" : ""
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${statusColors[status].dot}`} />
          <span className="flex-1">{STATUS_LABELS[status]?.label || status}</span>
          {currentStatus === status && <Check className="w-3.5 h-3.5" />}
        </button>
      ))}
    </div>
  );
}
