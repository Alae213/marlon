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
  Filter,
  Trash2,
  AlertTriangle,
  ArrowRightLeft,
} from "lucide-react";
import { Badge } from "@/components/core";
import { Button } from "@/components/core/button";
import { AnimatedTabs } from "@/components/core/animated-tabs";
import { LockedData } from "@/components/locked-overlay";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/animate-ui/components/animate/tooltip";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
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

// Highlight search match
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  
  if (index === -1) return text;
  
  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </>
  );
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
  onClearSelection: () => void;
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
  onSortDirectionChange: (direction: SortDirection) => void;
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
  onClearSelection,
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
  onSortDirectionChange,
  onOrderClick,
  viewMode,
  onViewModeChange,
}: ListViewProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  
  // Sort dropdown state
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  
  // Filter dropdown state
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  
  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Delete mutation
  const deleteOrder = useMutation(api.orders.deleteOrder);

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

  // Handle click outside sort dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
    }
    
    if (sortDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sortDropdownOpen]);

  // Handle click outside filter dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setFilterDropdownOpen(false);
      }
    }
    
    if (filterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterDropdownOpen]);

  const filteredOrders = useMemo(() => {
    let filtered = [...orders];
    
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerPhone.includes(searchQuery)
      );
    }
    
    if (activeFilter !== "all") {
      filtered = filtered.filter(order => order.status === activeFilter);
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
  }, [orders, searchQuery, sortField, sortDirection, activeFilter, currentTime]);

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

  const handleBulkDelete = async (orderIds: string[]) => {
    try {
      for (const orderId of orderIds) {
        await deleteOrder({ orderId: orderId as Id<"orders"> });
      }
      // Clear selection after successful delete
      onClearSelection();
    } catch (error) {
      console.error("Failed to delete orders:", error);
    }
  };

  return (
    <TooltipProvider>
    <div className="w-full h-full flex flex-col gap-3 relative">
      {/* Bulk Action Toolbar */}
      {selectedOrders.size > 0 && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-[var(--system-600)] text-white px-4 py-3 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-4">
            <span className="body-base font-medium">{selectedOrders.size} selected</span>
            <div className="flex items-center gap-2">
              {statuses.map((status) => {
                const count = orders.filter(o => selectedOrders.has(o._id) && o.status === status).length;
                if (count === 0) return null;
                return (
                  <span key={status} className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded">
                    <span className={`w-2 h-2 rounded-full ${statusColors[status].dot}`} />
                    {count}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
            <button
              onClick={() => onClearSelection()}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className={`flex items-center justify-between gap-1 ${selectedOrders.size > 0 ? 'pt-12' : ''}`}>
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
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  ref={searchButtonRef}
                  onClick={() => onSearchOpenChange(true)}
                  className="p-2 text-[var(--system-300)] hover:text-[var(--system-600)] hover:bg-[var(--system-100)] rounded-lg transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Search orders</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Filter Dropdown */}
        <div className="relative" ref={filterDropdownRef}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  activeFilter !== "all"
                    ? "bg-[var(--system-200)] text-[var(--system-600)]"
                    : "text-[var(--system-300)] hover:text-[var(--system-600)] hover:bg-[var(--system-100)]"
                }`}
              >
                <Filter className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Filter by status</TooltipContent>
          </Tooltip>
          
          {filterDropdownOpen && (
            <div className="absolute top-full mt-1 right-0 z-[9999] min-w-[180px] bg-white dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#404040] shadow-lg rounded-lg overflow-hidden py-1">
              <div className="px-3 py-2 text-xs text-[var(--system-400)] uppercase tracking-wide">Filter By State</div>
              <button
                onClick={() => {
                  setActiveFilter("all");
                  setFilterDropdownOpen(false);
                }}
                className={`w-full px-3 py-2 text-start body-base flex items-center justify-between hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-colors ${
                  activeFilter === "all" ? "bg-[#f5f5f5] dark:bg-[#262626]" : ""
                }`}
              >
                <span className="text-[var(--system-600)]">All</span>
                <span className="text-xs text-[var(--system-400)]">{orders.length}</span>
                {activeFilter === "all" && <Check className="w-3.5 h-3.5" />}
              </button>
              {statuses.map((status) => {
                const count = orders.filter(o => o.status === status).length;
                return (
                  <button
                    key={status}
                    onClick={() => {
                      setActiveFilter(status);
                      setFilterDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-start body-base flex items-center justify-between hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-colors ${
                      activeFilter === status ? "bg-[#f5f5f5] dark:bg-[#262626]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${statusColors[status].dot}`} />
                      <span className="text-[var(--system-600)]">{STATUS_LABELS[status]?.label || status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--system-400)]">{count}</span>
                      {activeFilter === status && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="relative" ref={sortDropdownRef}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  sortField !== "date" || sortDirection !== "desc"
                    ? "bg-[var(--system-200)] text-[var(--system-600)]"
                    : "text-[var(--system-300)] hover:text-[var(--system-600)] hover:bg-[var(--system-100)]"
                }`}
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Sort orders</TooltipContent>
          </Tooltip>
          
          {sortDropdownOpen && (
            <div className="absolute top-full mt-1 right-0 z-[9999] min-w-[180px] bg-white dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#404040] shadow-lg rounded-lg overflow-hidden py-1">
              <div className="px-3 py-2 text-xs text-[var(--system-400)] uppercase tracking-wide">Sort By</div>
              {[
                { id: "date", direction: "desc", label: "Newest first" },
                { id: "date", direction: "asc", label: "Oldest first" },
                { id: "total", direction: "desc", label: "Highest value first" },
                { id: "total", direction: "asc", label: "Lowest value first" },
              ].map((option) => (
                <button
                  key={`${option.id}-${option.direction}`}
                  onClick={() => {
                    onSort(option.id as SortField);
                    onSortDirectionChange(option.direction as SortDirection);
                    setSortDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-start body-base flex items-center justify-between hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-colors ${
                    sortField === option.id && 
                    ((option.id === "date" && sortDirection === (option.direction as SortDirection)) ||
                     (option.id === "total" && sortDirection === (option.direction as SortDirection)))
                      ? "bg-[#f5f5f5] dark:bg-[#262626]" : ""
                  }`}
                >
                  <span className="text-[var(--system-600)]">{option.label}</span>
                  {sortField === option.id && sortDirection === option.direction && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Settings */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="p-2 text-[var(--system-300)] hover:text-[var(--system-600)] hover:bg-[var(--system-100)] rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>

        {/* Archive - Blocked Orders */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="p-2 text-[var(--system-300)] hover:text-[var(--system-600)] hover:bg-[var(--system-100)] rounded-lg transition-colors relative"
              onClick={() => {
                setActiveFilter("blocked");
                setFilterDropdownOpen(false);
              }}
            >
              <Archive className="w-4 h-4" />
              {orders.filter(o => o.status === "blocked").length > 0 && (
                <span className="absolute -top-1 -end-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {orders.filter(o => o.status === "blocked").length}
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>Blocked orders</TooltipContent>
        </Tooltip>

        {/* Archive - Router Orders */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="p-2 text-[var(--system-300)] hover:text-[var(--system-600)] hover:bg-[var(--system-100)] rounded-lg transition-colors relative"
              onClick={() => {
                setActiveFilter("router");
                setFilterDropdownOpen(false);
              }}
            >
              <ArrowRightLeft className="w-4 h-4" />
              {orders.filter(o => o.status === "router").length > 0 && (
                <span className="absolute -top-1 -end-1 bg-yellow-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {orders.filter(o => o.status === "router").length}
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>Router orders</TooltipContent>
        </Tooltip>
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
                      {highlightMatch(order.customerName, searchQuery)}
                    </p>
                    <p className="body-base text-[var(--system-300)]">
                      {highlightMatch(order.customerPhone, searchQuery)}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div 
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div 
              className="w-[360px] bg-[var(--system-100)] rounded-[48px] p-[20px] flex flex-col gap-[12px] items-start"
              style={{ boxShadow: "var(--shadow-xl-shadow)" }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="headline-2xl text-[var(--system-600)]">Delete Orders</h2>
              </div>
              <p className="text-[var(--system-500)] body-base">
                Are you sure you want to delete {selectedOrders.size} order(s)? This action cannot be undone.
              </p>
              <div className="flex gap-2 w-full mt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={async () => {
                    await handleBulkDelete(Array.from(selectedOrders));
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
    </TooltipProvider>
  );
}
