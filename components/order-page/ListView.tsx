"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { 
  Search, 
  ChevronDown, 
  ChevronUp,
  ArrowUpDown,
  Settings,
  Archive,
  X,
  Check,
  List,
  LayoutGrid,
} from "lucide-react";
import { Badge } from "@/components/core";
import { LockedData } from "@/components/locked-overlay";
import Image from "next/image";
import type { 
  SortField, 
  SortDirection, 
  OrderStatus,
} from "@/lib/orders-types";
import { STATUS_LABELS } from "@/lib/orders-types";
import { StatusDropdown } from "./StatusDropdown";
import { ProductCell } from "./ProductCell";

// Relative time helper
export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return "just now";
  if (minutes < 60) return `about ${minutes}m ago`;
  if (hours < 24) return `about ${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(new Date(timestamp));
}

// Sort icon component
function SortIcon({ field, sortField, sortDirection }: { field: SortField; sortField: SortField; sortDirection: SortDirection }) {
  if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />;
  return sortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />;
}

interface ListViewProps {
  orders: Doc<"orders">[];
  selectedOrders: Set<string>;
  selectAll: boolean;
  onSelectAll: (checked: boolean) => void;
  onOrderSelect: (orderId: string) => void;
  onStatusChange: (orderId: string, newStatus: string) => void;
  onStatusDropdownToggle: (orderId: string, open: boolean) => void;
  statusDropdownOpen: { [key: string]: boolean };
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  isSearchOpen: boolean;
  onSearchOpenChange: (open: boolean) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onOrderClick: (order: Doc<"orders">) => void;
}

export function ListView({
  orders,
  selectedOrders,
  selectAll,
  onSelectAll,
  onOrderSelect,
  onStatusChange,
  onStatusDropdownToggle,
  statusDropdownOpen,
  searchQuery,
  onSearchQueryChange,
  isSearchOpen,
  onSearchOpenChange,
  sortField,
  sortDirection,
  onSort,
  onOrderClick,
}: ListViewProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Update currentTime every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Handle search input focus
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Handle escape to close search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isSearchOpen) {
        onSearchOpenChange(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, onSearchOpenChange]);

  // Handle click outside search
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isSearchOpen && searchButtonRef.current && !searchButtonRef.current.contains(event.target as Node)) {
        const searchContainer = document.getElementById('search-container');
        if (searchContainer && !searchContainer.contains(event.target as Node)) {
          onSearchOpenChange(false);
        }
      }
    }
    
    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen, onSearchOpenChange]);

  const dayMs = 86400000;

  const filteredOrders = useMemo(() => {
    let filtered = [...orders];
    
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerPhone.includes(searchQuery)
      );
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "date":
          comparison = a.createdAt - b.createdAt;
          break;
        case "total":
          comparison = a.total - b.total;
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [orders, searchQuery, sortField, sortDirection, currentTime, dayMs]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleSelectAll = (checked: boolean) => {
    onSelectAll(checked);
    if (checked) {
      // Note: filteredOrders is passed from parent, we need to handle this there
    } else {
      // Clear selection
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-1">
        {/* Search */}
        <div id="search-container" className="relative">
          {isSearchOpen ? (
            <div className="flex items-center">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="Search orders..."
                className="w-48 h-8 px-3 pe-8 bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#404040] text-[#171717] dark:text-[#fafafa] placeholder:text-[#a3a3a3] text-sm focus:outline-none focus:border-[#171717] dark:focus:border-[#fafafa]"
              />
              <button
                onClick={() => onSearchOpenChange(false)}
                className="absolute end-2 text-[#737373] hover:text-[#171717] dark:hover:text-[#fafafa]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              ref={searchButtonRef}
              onClick={() => onSearchOpenChange(true)}
              className="p-2 text-[#737373] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#f5f5f5] dark:hover:bg-[#262626] rounded-md transition-colors"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort */}
        <button
          onClick={() => onSort(sortField)}
          className="p-2 text-[#737373] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#f5f5f5] dark:hover:bg-[#262626] rounded-md transition-colors"
          title="Sort"
        >
          <ArrowUpDown className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          className="p-2 text-[#737373] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#f5f5f5] dark:hover:bg-[#262626] rounded-md transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Archive */}
        <button
          className="p-2 text-[#737373] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#f5f5f5] dark:hover:bg-[#262626] rounded-md transition-colors"
          title="Archive"
        >
          <Archive className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] overflow-visible">
        <div className="overflow-x-visible">
          <table className="w-full">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-[#e5e5e5] dark:border-[#262626] text-start">
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-[#e5e5e5] dark:border-[#404040]"
                  />
                </th>
                <th className="px-3 py-2 text-sm font-normal text-[#737373]">Customer</th>
                <th className="px-3 py-2 text-sm font-normal text-[#737373]">Product</th>
                <th 
                  className="px-3 py-2 text-sm font-normal text-[#737373] cursor-pointer hover:text-[#171717] dark:hover:text-[#fafafa]"
                  onClick={() => onSort("status")}
                >
                  <div className="flex items-center gap-1">
                    State
                    <SortIcon field="status" sortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-sm font-normal text-[#737373] cursor-pointer hover:text-[#171717] dark:hover:text-[#fafafa]"
                  onClick={() => onSort("total")}
                >
                  <div className="flex items-center gap-1">
                    Total
                    <SortIcon field="total" sortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-sm font-normal text-[#737373] cursor-pointer hover:text-[#171717] dark:hover:text-[#fafafa]"
                  onClick={() => onSort("date")}
                >
                  <div className="flex items-center gap-1">
                    Date
                    <SortIcon field="date" sortField={sortField} sortDirection={sortDirection} />
                  </div>
                </th>
              </tr>
            </thead>
            {/* Table Body */}
            <tbody className="divide-y divide-[#e5e5e5] dark:divide-[#262626]">
              {filteredOrders.map((order) => (
                <tr 
                  key={order._id}
                  className={`hover:bg-[#f5f5f5] dark:hover:bg-[#171717]/50 transition-colors cursor-pointer ${
                    selectedOrders.has(order._id) ? "bg-[#f5f5f5] dark:bg-[#262626]" : ""
                  }`}
                  onClick={() => onOrderClick(order)}
                >
                  {/* Checkbox */}
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedOrders.has(order._id)}
                      onChange={() => onOrderSelect(order._id)}
                      className="w-4 h-4 rounded border-[#e5e5e5] dark:border-[#404040]"
                    />
                  </td>
                  {/* Customer */}
                  <td className="px-3 py-3">
                    <div>
                      <LockedData fallback="***">
                        <p className="font-normal text-[#171717] dark:text-[#fafafa]">
                          {order.customerName}
                        </p>
                        <p className="text-sm text-[#737373]">
                          {order.customerPhone}
                        </p>
                      </LockedData>
                    </div>
                  </td>
                  {/* Product */}
                  <td className="px-3 py-3">
                    <ProductCell items={order.products || []} />
                  </td>
                  {/* State */}
                  <td className="px-3 py-3 relative z-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onStatusDropdownToggle(order._id, !statusDropdownOpen[order._id])}
                      className="relative"
                    >
                      <Badge variant={STATUS_LABELS[order.status as OrderStatus]?.variant || "default"}>
                        {STATUS_LABELS[order.status as OrderStatus]?.label || order.status}
                      </Badge>
                    </button>
                    <StatusDropdown
                      currentStatus={order.status}
                      onStatusChange={(status) => onStatusChange(order._id, status)}
                      isOpen={!!statusDropdownOpen[order._id]}
                      setIsOpen={(open) => onStatusDropdownToggle(order._id, open)}
                    />
                  </td>
                  {/* Total */}
                  <td className="px-3 py-3 font-normal text-[#171717] dark:text-[#fafafa]">
                    {formatPrice(order.total)}
                  </td>
                  {/* Date */}
                  <td className="px-3 py-3 text-sm text-[#737373]">
                    {getRelativeTime(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-[#737373]">No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
}
