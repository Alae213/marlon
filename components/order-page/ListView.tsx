"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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
} from "lucide-react";
import { Badge } from "@/components/core";
import { AnimatedTabs } from "@/components/core/animated-tabs";
import { LockedData } from "@/components/locked-overlay";
import Image from "next/image";
import type { 
  SortField, 
  SortDirection, 
  OrderStatus,
} from "@/lib/orders-types";
import { STATUS_LABELS } from "@/lib/orders-types";
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

// Custom icon components
const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_164_2937)">
      <path d="M2.594 2.59478C3.5215 1.66732 5.01428 1.66732 7.99984 1.66732C10.9854 1.66732 12.4782 1.66732 13.4057 2.59478C14.3332 3.52232 14.3332 5.01512 14.3332 8.00065C14.3332 10.9862 14.3332 12.479 13.4057 13.4065C12.4782 14.334 10.9854 14.334 7.99984 14.334C5.01428 14.334 3.5215 14.334 2.594 13.4065C1.6665 12.479 1.6665 10.9862 1.6665 8.00065C1.6665 5.01512 1.6665 3.52232 2.594 2.59478Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M1.6665 10.334L14.3332 10.334" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M1.6665 5.66602L14.3332 5.66602" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
    <defs>
      <clipPath id="clip0_164_2937">
        <rect width="16" height="16" fill="white" transform="translate(6.99382e-07 16) rotate(-90)"/>
      </clipPath>
    </defs>
  </svg>
);

const KanbanIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2.3999" y="2" width="3.6" height="14" rx="1" fill="currentColor"/>
    <rect x="7.2002" y="2" width="3.6" height="14" rx="1" fill="currentColor"/>
    <rect x="12" y="2" width="3.6" height="14" rx="1" fill="currentColor"/>
  </svg>
);

// Status colors for dropdown
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

const statuses: OrderStatus[] = ["new", "confirmed", "packaged", "shipped", "succeeded", "canceled", "blocked", "router"];

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
  viewMode: "list" | "state";
  onViewModeChange: (mode: "list" | "state") => void;
}

// Status Dropdown Component
function StatusCell({ 
  orderId, 
  status, 
  isOpen, 
  onToggle, 
  onStatusChange 
}: { 
  orderId: string; 
  status: string; 
  isOpen: boolean; 
  onToggle: (open: boolean) => void;
  onStatusChange: (status: string) => void;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onToggle(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => onToggle(!isOpen)}
        className="cursor-pointer"
      >
        <Badge variant={STATUS_LABELS[status as OrderStatus]?.variant || "default"}>
          {STATUS_LABELS[status as OrderStatus]?.label || status}
        </Badge>
      </button>
      
      {isOpen && (
        <div className="absolute top-full mt-1 left-0 z-[9999] min-w-[160px] bg-white dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#404040] shadow-lg rounded-lg overflow-hidden py-1">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => {
                onStatusChange(s);
                onToggle(false);
              }}
              className={`w-full px-3 py-2 text-start body-base flex items-center gap-2 hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-colors ${
                status === s ? "bg-[#f5f5f5] dark:bg-[#262626]" : ""
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${statusColors[s].dot}`} />
              <span className="flex-1 text-[var(--system-600)]">{STATUS_LABELS[s]?.label || s}</span>
              {status === s && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
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
  viewMode,
  onViewModeChange,
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
  }, [orders, searchQuery, sortField, sortDirection, currentTime]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleSelectAll = (checked: boolean) => {
    onSelectAll(checked);
  };

  return (
    <div className="w-full h-full flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-1">
        {/* View Toggle */}
        <AnimatedTabs
          tabs={[
            { id: "list", label: "List", icon: <ListIcon /> },
            { id: "state", label: "By State", icon: <KanbanIcon /> },
          ]}
          activeTab={viewMode}
          onChange={(tabId) => onViewModeChange(tabId as "list" | "state")}
        />
        
        <div className="flex items-center gap-1">
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
                className="w-48 h-8 px-3 pe-8 bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#404040] text-[var(--system-600)] placeholder:text-[var(--system-300)] text-sm focus:outline-none focus:border-[var(--system-600)] rounded-lg"
              />
              <button
                onClick={() => onSearchOpenChange(false)}
                className="absolute end-2 text-[var(--system-300)] hover:text-[var(--system-600)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              ref={searchButtonRef}
              onClick={() => onSearchOpenChange(true)}
              className="p-2 text-[var(--system-300)] hover:text-[var(--system-600)] hover:bg-[var(--system-100)] rounded-lg transition-colors"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort */}
        <button
          onClick={() => onSort(sortField)}
          className="p-2 text-[var(--system-300)] hover:text-[var(--system-600)] hover:bg-[var(--system-100)] rounded-lg transition-colors"
          title="Sort"
        >
          <ArrowUpDown className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          className="p-2 text-[var(--system-300)] hover:text-[var(--system-600)] hover:bg-[var(--system-100)] rounded-lg transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Archive */}
        <button
          className="p-2 text-[var(--system-300)] hover:text-[var(--system-600)] hover:bg-[var(--system-100)] rounded-lg transition-colors"
          title="Archive"
        >
          <Archive className="w-4 h-4" />
        </button>
        </div>
      </div>

      {/* Table */}
      <div className=" rounded-xl overflow-visible ">
        {/* Table Header - with rounded top corners */}
        <div className="bg-[var(--system-100)] rounded-xl">
          <div className="grid grid-cols-12 gap-0">
            {/* Checkbox */}
            <div className="col-span-1 px-3 py-3">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--system-200)]"
              />
            </div>
            {/* Customer */}
            <div className="col-span-3 px-3 py-3 body-base text-[var(--system-600)]">Customer</div>
            {/* Product */}
            <div className="col-span-3 px-3 py-3 body-base text-[var(--system-600)]">Product</div>
            {/* State */}
            <div className="col-span-2 px-3 py-3 body-base text-[var(--system-600)] cursor-pointer" onClick={() => onSort("status")}>
              <div className="flex items-center gap-1">
                State
                <SortIcon field="status" sortField={sortField} sortDirection={sortDirection} />
              </div>
            </div>
            {/* Total */}
            <div className="col-span-2 px-3 py-3 body-base text-[var(--system-600)] cursor-pointer" onClick={() => onSort("total")}>
              <div className="flex items-center gap-1">
                Total
                <SortIcon field="total" sortField={sortField} sortDirection={sortDirection} />
              </div>
            </div>
            {/* Date */}
            <div className="col-span-1 px-3 py-3 body-base text-[var(--system-600)] cursor-pointer" onClick={() => onSort("date")}>
              <div className="flex items-center gap-1">
                Date
                <SortIcon field="date" sortField={sortField} sortDirection={sortDirection} />
              </div>
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y-0">
          {filteredOrders.map((order, index) => (
            <div 
              key={order._id}
              className={`grid grid-cols-12 gap-0 hover:bg-[#f5f5f5] dark:hover:bg-[#171717]/50 transition-colors cursor-pointer ${
                selectedOrders.has(order._id) ? "bg-[#f5f5f5] dark:bg-[#262626]" : ""
              } ${index === filteredOrders.length - 1 ? 'rounded-b-xl' : ''}`}
              onClick={() => onOrderClick(order)}
            >
              {/* Checkbox */}
              <div className="col-span-1 px-3 py-3 flex items-center" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedOrders.has(order._id)}
                  onChange={() => onOrderSelect(order._id)}
                  className="w-4 h-4 rounded border-[#e5e5e5] dark:border-[#404040]"
                />
              </div>
              {/* Customer */}
              <div className="col-span-3 px-3 py-3 flex items-center">
                <div>
                  <LockedData fallback="***">
                    <p className="body-base text-[var(--system-600)]">
                      {order.customerName}
                    </p>
                    <p className="body-base text-[var(--system-300)]">
                      {order.customerPhone}
                    </p>
                  </LockedData>
                </div>
              </div>
              {/* Product */}
              <div className="col-span-3 px-3 py-3 flex items-center">
                <ProductCell items={order.products || []} />
              </div>
              {/* State */}
              <div className="col-span-2 px-3 py-3 flex items-center" onClick={(e) => e.stopPropagation()}>
                <StatusCell
                  orderId={order._id}
                  status={order.status}
                  isOpen={!!statusDropdownOpen[order._id]}
                  onToggle={(open) => onStatusDropdownToggle(order._id, open)}
                  onStatusChange={(newStatus) => onStatusChange(order._id, newStatus)}
                />
              </div>
              {/* Total */}
              <div className="col-span-2 px-3 py-3 flex items-center body-base text-[var(--system-600)]">
                {formatPrice(order.total)}
              </div>
              {/* Date */}
              <div className="col-span-1 px-3 py-3 flex items-center body-base text-[var(--system-300)]">
                {getRelativeTime(order.createdAt)}
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="p-12 text-center body-base text-[var(--system-300)]">
            No orders found
          </div>
        )}
      </div>
    </div>
  );
}
