"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { 
  Search, 
  ArrowUpDown,
  X,
  Filter,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  Zap,
  SlidersHorizontal,
  ChevronsUpDown,
  Truck,
  PackageCheck,
  Loader2,
  FileDown,
} from "lucide-react";
import { Badge } from "@/components/primitives/core/feedback/badge";
import { Button } from "@/components/primitives/core/buttons/button";
import { LockedData } from "@/components/pages/layout/locked-overlay";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/primitives/animate-ui/components/animate/tooltip";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/primitives/ui/hover-card";
import { Checkbox, CheckboxIndicator } from "@/components/primitives/animate-ui/primitives/headless/checkbox";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/primitives/ui/table";
import { SubtleTab, SubtleTabItem } from "@/components/primitives/ui/subtle-tab";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import type { LucideIcon } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { 
  SortField, 
  SortDirection, 
  OrderStatus,
  CallLog,
} from "@/lib/orders-types";
import { STATUS_LABELS, CALL_OUTCOME_LABELS } from "@/lib/orders-types";
import { STATUS_CONFIG } from "@/lib/status-icons";
import { ProductCell } from "../components/ProductCell";
import { cn } from "@/lib/utils";
import { useToast } from "@/contexts/toast-context";

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

const statuses: OrderStatus[] = ["new", "confirmed", "packaged", "shipped", "succeeded", "canceled", "blocked", "router"];

// Max call slots to display
const MAX_CALL_SLOTS = 4;

// Date formatter
const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(timestamp: number): string {
  return DATE_FORMATTER.format(new Date(timestamp));
}

function getCallOutcomeBg(outcome?: string): string {
  switch (outcome) {
    case "answered":
      return "bg-[#0BEEC1]";
    case "no_answer":
      return "bg-[#FFA86B]";
    case "refused":
      return "bg-[#FF5978]";
    default:
      return "bg-[var(--system-200)]";
  }
}

// CallSlotsHover Component - same design as OrderDetails
function CallSlotsHover({ callLog }: { callLog: CallLog[] }) {
  const slots = useMemo(() => {
    const relevant = callLog.slice(-MAX_CALL_SLOTS);
    return Array.from({ length: MAX_CALL_SLOTS }, (_, i) => relevant[i] ?? null);
  }, [callLog]);

  const hasCalls = callLog.length > 0;

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div className="flex items-end gap-0.5 h-[18px] cursor-pointer">
          {slots.map((call, index) => (
            <div
              key={index}
              className={cn(
                "w-[5px] h-full border border-black/8 rounded-full transition-colors",
                call ? getCallOutcomeBg(call.outcome) : "bg-black/10"
              )}
            />
          ))}
        </div>
      </HoverCardTrigger>
      {hasCalls && (
        <HoverCardContent
          side="top"
          align="start"
          sideOffset={8}
          className="w-auto min-w-0 p-0 border-0 bg-transparent shadow-none"
        >
          <div
            className="px-3 py-2 rounded-lg text-xs text-white whitespace-nowrap"
            style={{
              background: "linear-gradient(0deg, #1D1E1F 0%, #353737 100%)",
            }}
          >
            <div className="text-[var(--system-200)] text-[10px] mb-1.5 font-medium">
              Call History
            </div>
            {callLog.slice().map((call, idx) => (
              <div key={call.id} className="flex items-center gap-2 py-0.5">
                <span className="text-[var(--system-300)] text-[10px] w-4">
                  #{idx + 1}
                </span>
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    getCallOutcomeBg(call.outcome)
                  )}
                />
                <span className="text-white/90">
                  {CALL_OUTCOME_LABELS[call.outcome]?.label || call.outcome}
                </span>
                <span className="text-white/40 text-[10px]">
                  {formatDate(call.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </HoverCardContent>
      )}
    </HoverCard>
  );
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
  storeSlug?: string;
}

// Status Dropdown Component
function StatusCell({ 
  status, 
  isOpen, 
  onToggle, 
  onStatusChange,
  callLog,
}: { 
  status: string; 
  isOpen: boolean; 
  onToggle: (open: boolean) => void;
  onStatusChange: (status: string) => void;
  callLog?: CallLog[];
}) {
  const statusConfig = STATUS_CONFIG[status as OrderStatus];
  const statusLabel = STATUS_LABELS[status as OrderStatus];

  return (
    <Menu open={isOpen} onOpenChange={onToggle}>
      <div className="relative w-full">
        <div className="flex flex-row items-center justify-between">
          <MenuTrigger asChild>
            <button
              type="button"
              className="cursor-pointer flex flex-row items-center gap-2 p-1 hover:bg-black/5 rounded-[12px]"
            >
              <Badge
                bgColor={statusConfig?.bgColor}
                textColor={statusConfig?.textColor}
                icon={statusConfig?.icon}
              >
                {statusConfig?.label || statusLabel?.label || status}
              </Badge>
            </button>
          </MenuTrigger>

          {/* Call Log Slots */}
          {callLog && callLog.length > -1 && <CallSlotsHover callLog={callLog} />}
        </div>

        <MenuContent
          align="start"
          sideOffset={-32}
          className="min-w-[180px] rounded-[14px] border border-[var(--system-100)] bg-[var(--system-50)] p-1 text-[var(--system-600)] shadow-[var(--shadow-md)]"
        >
          <MenuRadioGroup value={status} onValueChange={onStatusChange}>
            {statuses.map((s) => {
              const sConfig = STATUS_CONFIG[s]
              return (
                <MenuRadioItem key={s} value={s} className="rounded-[12px] py-1.5 pl-8">
                  <span
                    className="overflow-hidden inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-[10px] shadow-[var(--shadow-badge)]"
                    style={{
                      backgroundColor: sConfig?.bgColor || "#6b728015",
                      color: sConfig?.textColor || "#ffffff01",
                    }}
                  >
                    {sConfig?.icon}
                    {sConfig?.label || s}
                  </span>
                </MenuRadioItem>
              )
            })}
          </MenuRadioGroup>
        </MenuContent>
      </div>
    </Menu>
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
  storeSlug,
}: ListViewProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const [, setCurrentTime] = useState(() => Date.now());
  
  // Sort dropdown state
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  
  // Filter dropdown state
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  
  // Date filter state
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [activeDateFilter, setActiveDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  
  // Settings dropdown state
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  
  // Hidden statuses state (persisted in localStorage)
  const [hiddenStatuses, setHiddenStatuses] = useState<Set<OrderStatus>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("marlon-hidden-statuses");
      if (saved) {
        try {
          return new Set(JSON.parse(saved));
        } catch {
          return new Set();
        }
      }
    }
    return new Set();
  });
  
  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Delete mutation
  const bulkDeleteOrders = useMutation(api.orders.bulkDeleteOrders);

  // Toast notifications
  const { showToast } = useToast();

  // Dispatch All state
  const [isDispatchingAll, setIsDispatchingAll] = useState(false);
  
  // Bulk dispatch selected state
  const [isBulkDispatching, setIsBulkDispatching] = useState(false);

  // Delivery quick stats
  const readyToDispatchCount = useMemo(() => {
    return orders.filter((o) => o.status === "confirmed").length;
  }, [orders]);

  const courierStatusSummary = useMemo(() => {
    const summary = { dispatched: 0, pending: 0 };
    for (const order of orders) {
      if (order.deliveryProvider && order.trackingNumber) {
        summary.dispatched++;
      } else if (order.status === "confirmed") {
        summary.pending++;
      }
    }
    return summary;
  }, [orders]);

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
    
    // Filter by hidden statuses
    filtered = filtered.filter(order => !hiddenStatuses.has(order.status as OrderStatus));
    
    // Filter by date
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayMs = startOfToday.getTime();
    
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfWeekMs = startOfWeek.getTime();
    
    const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);
    const startOfMonthMs = startOfMonth.getTime();
    
    if (activeDateFilter === "today") {
      filtered = filtered.filter(order => order.createdAt >= startOfTodayMs);
    } else if (activeDateFilter === "week") {
      filtered = filtered.filter(order => order.createdAt >= startOfWeekMs);
    } else if (activeDateFilter === "month") {
      filtered = filtered.filter(order => order.createdAt >= startOfMonthMs);
    }
    
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
  }, [orders, searchQuery, sortField, sortDirection, activeFilter, hiddenStatuses, activeDateFilter]);

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
      await bulkDeleteOrders({ orderIds: orderIds as Id<"orders">[] });
      // Clear selection after successful delete
      onClearSelection();
    } catch (error) {
      console.error("Failed to delete orders:", error);
    }
  };

  const handleDispatchAll = useCallback(async () => {
    if (isDispatchingAll) return;
    
    const confirmedOrders = orders.filter((o) => o.status === "confirmed");
    if (confirmedOrders.length === 0) return;
    
    setIsDispatchingAll(true);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const order of confirmedOrders) {
      try {
        const response = await fetch("/api/delivery/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order._id,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            customerWilaya: order.customerWilaya,
            customerCommune: order.customerCommune,
            customerAddress: order.customerAddress,
            products: order.products,
            total: order.total,
            provider: order.deliveryProvider || "zr_express",
            storeSlug,
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          await onStatusChange(order._id, "packaged");
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }
    
    setIsDispatchingAll(false);
    
    if (successCount > 0 && failCount > 0) {
      showToast(`${successCount} dispatched, ${failCount} failed`, "info");
    } else if (successCount > 0) {
      showToast(`${successCount} orders dispatched`, "success");
    } else {
      showToast("Failed to dispatch orders", "error");
    }
  }, [orders, isDispatchingAll, onStatusChange, storeSlug, showToast]);

  const handleBulkDispatch = useCallback(async () => {
    if (isBulkDispatching) return;
    
    const confirmedSelectedIds = orders
      .filter((o) => selectedOrders.has(o._id) && o.status === "confirmed")
      .map((o) => o._id);
    
    if (confirmedSelectedIds.length === 0) return;
    
    setIsBulkDispatching(true);
    
    let successCount = 0;
    let failCount = 0;
    const failedIds: string[] = [];
    
    for (const orderId of confirmedSelectedIds) {
      const order = orders.find((o) => o._id === orderId);
      if (!order) continue;
      
      try {
        const response = await fetch("/api/delivery/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order._id,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            customerWilaya: order.customerWilaya,
            customerCommune: order.customerCommune,
            customerAddress: order.customerAddress,
            products: order.products,
            total: order.total,
            provider: order.deliveryProvider || "zr_express",
            storeSlug,
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          await onStatusChange(order._id, "packaged");
          successCount++;
        } else {
          failCount++;
          failedIds.push(orderId);
        }
      } catch {
        failCount++;
        failedIds.push(orderId);
      }
    }
    
    setIsBulkDispatching(false);
    
    if (successCount > 0 && failCount > 0) {
      showToast(`${successCount} dispatched, ${failCount} failed`, "info");
    } else if (successCount > 0) {
      showToast(`${successCount} orders dispatched`, "success");
    } else {
      showToast("Failed to dispatch orders", "error");
    }
  }, [orders, selectedOrders, isBulkDispatching, onStatusChange, storeSlug, showToast]);

  // Export to CSV
  const handleExportCSV = useCallback((exportAll: boolean) => {
    const ordersToExport = exportAll 
      ? filteredOrders 
      : orders.filter((o) => selectedOrders.has(o._id));
    
    if (ordersToExport.length === 0) {
      showToast("No orders to export", "info");
      return;
    }

    // Build CSV content
    const headers = [
      "Order Number",
      "Customer Name",
      "Phone",
      "Wilaya",
      "Commune",
      "Address",
      "Status",
      "Total (DZD)",
      "Delivery Provider",
      "Tracking Number",
      "Created At",
    ];
    
    const rows = ordersToExport.map((order) => [
      order.orderNumber,
      order.customerName,
      order.customerPhone,
      order.customerWilaya || "",
      order.customerCommune || "",
      order.customerAddress || "",
      order.status,
      order.total.toString(),
      order.deliveryProvider || "",
      order.trackingNumber || "",
      new Date(order.createdAt).toLocaleString("en-US"),
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => 
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");
    
    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orders-export-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast(`Exported ${ordersToExport.length} orders`, "success");
  }, [filteredOrders, orders, selectedOrders, showToast]);

  // Toggle hidden status and persist to localStorage
  const toggleHiddenStatus = (status: OrderStatus) => {
    setHiddenStatuses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      localStorage.setItem("marlon-hidden-statuses", JSON.stringify([...newSet]));
      return newSet;
    });
  };

  // Pre-compute selected orders by status for bulk toolbar
  const selectedOrdersByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const status of statuses) {
      counts[status] = 0;
    }
    for (const order of orders) {
      if (selectedOrders.has(order._id)) {
        const orderStatus = order.status as OrderStatus;
        if (counts[orderStatus] !== undefined) {
          counts[orderStatus]++;
        }
      }
    }
    return counts;
  }, [orders, selectedOrders]);

  return (
    <TooltipProvider>
    <div className="w-full h-full flex flex-col gap-3 relative">


      {/* Bulk Action Toolbar */}
      {selectedOrders.size > 0 && (
        <div className="absolute -top-1 left-1 z-50 bg-[var(--system-50)] border border-[var(--system-100)] rounded-[14px] text-[var(--system-600)] py-1 px-2 flex items-center justify-between">
          <div className="flex items-center gap-1 ">
            <span className="body-base text-[var(--system-500)] mr-2 ">{selectedOrders.size} selected</span>
            <div className="flex items-center gap-1.5">
              {statuses.map((status) => {
                const count = selectedOrdersByStatus[status];
                if (count === 0) return null;
                const sConfig = STATUS_CONFIG[status];
                return (
                  <span 
                    key={status}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] lable-xs font-medium"
                    style={{ 
                      backgroundColor: sConfig?.bgColor || '#6b7280',
                      color: sConfig?.textColor || '#ffffff',
                    }}
                  >
                    {sConfig?.icon}
                    {count}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedOrdersByStatus.confirmed > 0 && (
              <button
                onClick={handleBulkDispatch}
                disabled={isBulkDispatching}
                className="ml-2 cursor-pointer px-2 py-1 rounded-md bg-[var(--blue-300)] text-white text-xs font-medium hover:bg-[var(--blue-400)] transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBulkDispatching ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <PackageCheck className="w-3 h-3" />
                )}
                {isBulkDispatching ? "Dispatching..." : "Dispatch Selected"}
              </button>
            )}
            <button
              className="cursor-pointer p-2 rounded-md transition-colors text-red-500 hover:bg-red-500/20"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-1">
        {/* View Toggle */}
        <SubtleTab
          selectedIndex={viewMode === "list" ? 0 : 1}
          onSelect={(index) => onViewModeChange(index === 0 ? "list" : "state")}
        >
          <SubtleTabItem index={0} icon={ListIcon as unknown as LucideIcon} label="List" />
           {/*<SubtleTabItem index={1} icon={KanbanIcon as unknown as LucideIcon} label="By State" />*/}
        </SubtleTab>
        
        <div className="flex items-center gap-1">
        
        {/* Date Filter Dropdown */}
        <Menu open={dateFilterOpen} onOpenChange={setDateFilterOpen}>
          <MenuTrigger asChild>
            <button
              type="button"
              className={`cursor-pointer h-8 px-3 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                activeDateFilter !== "all"
                  ? "bg-[var(--blue-300)]/20 text-[var(--blue-300)]"
                  : "text-[var(--system-300)] hover:text-[var(--system-600)] hover:bg-[var(--system-100)]"
              }`}
            >
              <span>
                {activeDateFilter === "all"
                  ? "All"
                  : activeDateFilter === "today"
                    ? "Today"
                    : activeDateFilter === "week"
                      ? "Last Week"
                      : "This Month"}
              </span>
              <ChevronsUpDown className="w-4 h-4" />
            </button>
          </MenuTrigger>

          <MenuContent
            align="end"
            sideOffset={-32}
            className="min-w-[180px] rounded-[14px] border border-[var(--system-100)] bg-[var(--system-50)] p-1 text-[var(--system-600)] shadow-[var(--shadow-md)]"
          >
            <MenuLabel>Filter By Date</MenuLabel>
            <MenuRadioGroup
              value={activeDateFilter}
              onValueChange={(value) => setActiveDateFilter(value as typeof activeDateFilter)}
            >
              {[
                { id: "all", label: "All" },
                { id: "today", label: "Today (24h)" },
                { id: "week", label: "This Week (7 days)" },
                { id: "month", label: "This Month" },
              ].map((option) => (
                <MenuRadioItem
                  key={option.id}
                  value={option.id}
                  className="w-full justify-between rounded-[12px]"
                >
                  <span className="text-[var(--system-600)]">{option.label}</span>
                </MenuRadioItem>
              ))}
            </MenuRadioGroup>
          </MenuContent>
        </Menu>

        {/* Filter Dropdown */}
          <Menu open={filterDropdownOpen} onOpenChange={setFilterDropdownOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <MenuTrigger asChild>
                  <button
                    type="button"
                    className={`cursor-pointer h-8 px-3 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                      activeFilter !== "all"
                        ? "bg-[var(--blue-300)]/20 text-[var(--blue-300)]"
                        : "text-[var(--system-300)] hover:text-[var(--system-600)] hover:bg-[var(--system-100)]"
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    <span>
                      {activeFilter === "all" 
                        ? "Filter" 
                        : activeFilter === "confirmed" 
                          ? `Ready (${readyToDispatchCount})`
                          : STATUS_CONFIG[activeFilter as OrderStatus]?.label || activeFilter}
                    </span>
                  </button>
                </MenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Filter by status</TooltipContent>
            </Tooltip>

          <MenuContent
            align="end"
            sideOffset={-32}
            className="min-w-[240px] rounded-[14px] border border-[var(--system-100)] bg-[var(--system-50)] p-1 text-[var(--system-600)] shadow-[var(--shadow-md)]"
          >
            <MenuLabel>Filter By State</MenuLabel>
            <MenuRadioGroup value={activeFilter} onValueChange={setActiveFilter}>
              <MenuRadioItem value="all" className="w-full justify-between rounded-[12px]">
                <span className="text-[var(--system-600)]">All</span>
                <span className="label-xs text-[var(--system-400)]">{orders.length}</span>
              </MenuRadioItem>
              {readyToDispatchCount > 0 && (
                <MenuRadioItem 
                  value="confirmed" 
                  className="w-full justify-between rounded-[12px]"
                >
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 label-xs rounded-[8px] bg-[var(--blue-300)]/20 text-[var(--blue-300)] font-medium">
                    <PackageCheck className="w-3 h-3" />
                    Ready to Dispatch
                  </span>
                  <span className="label-xs text-[var(--blue-300)] font-medium">{readyToDispatchCount}</span>
                </MenuRadioItem>
              )}
              {statuses.map((status) => {
                const sConfig = STATUS_CONFIG[status]
                const count = orders.filter((o) => o.status === status).length

                return (
                  <MenuRadioItem
                    key={status}
                    value={status}
                    className="w-full justify-between rounded-[12px]"
                  >
                    <span
                      className="overflow-hidden rounded-[8px] inline-flex items-center gap-1.5 px-2 py-1 label-xs shadow-[var(--shadow-badge)]"
                      style={{
                        backgroundColor: sConfig?.bgColor || "#6b7280",
                        color: sConfig?.textColor || "#ffffff",
                      }}
                    >
                      {sConfig?.icon}
                      {sConfig?.label || status}
                    </span>
                    <span className="label-xs text-[var(--system-400)]">{count}</span>
                  </MenuRadioItem>
                )
              })}
            </MenuRadioGroup>

            <MenuSeparator />
            <MenuLabel>Hide States</MenuLabel>
            {statuses.map((status) => {
              const sConfig = STATUS_CONFIG[status]
              const isHidden = hiddenStatuses.has(status)

              return (
                <MenuCheckboxItem
                  key={status}
                  checked={isHidden}
                  onCheckedChange={() => toggleHiddenStatus(status)}
                  onSelect={(e) => e.preventDefault()}
                  className="rounded-[12px]"
                >
                  {isHidden ? (
                    <EyeOff className="h-4 w-4 text-[var(--system-400)]" />
                  ) : (
                    <Eye className="h-4 w-4 text-[var(--system-400)]" />
                  )}
                  <span className="text-[var(--system-600)]">{sConfig?.label || status}</span>
                </MenuCheckboxItem>
              )
            })}
          </MenuContent>
        </Menu>

        {/* Sort Dropdown */}
        <Menu open={sortDropdownOpen} onOpenChange={setSortDropdownOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <MenuTrigger asChild>
                <button
                  type="button"
                  className={`cursor-pointer p-2 rounded-lg transition-colors ${
                    sortField !== "date" || sortDirection !== "desc"
                      ? "bg-[var(--blue-300)]/20 text-[var(--blue-300)]"
                      : "text-[var(--system-300)] hover:text-[var(--system-600)] hover:bg-[var(--system-100)]"
                  }`}
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </MenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Sort orders</TooltipContent>
          </Tooltip>

          <MenuContent
            align="end"
            sideOffset={-32}
            className="min-w-[220px] rounded-[14px] border border-[var(--system-100)] bg-[var(--system-50)] p-1 text-[var(--system-600)] shadow-[var(--shadow-md)]"
          >
            <MenuLabel>Sort By</MenuLabel>
            <MenuRadioGroup
              value={`${sortField}:${sortDirection}`}
              onValueChange={(value) => {
                const [field, direction] = value.split(":")
                onSort(field as SortField)
                onSortDirectionChange(direction as SortDirection)
              }}
            >
              {[
                { id: "date", direction: "desc", label: "Newest first" },
                { id: "date", direction: "asc", label: "Oldest first" },
                { id: "total", direction: "desc", label: "Highest value first" },
                { id: "total", direction: "asc", label: "Lowest value first" },
              ].map((option) => (
                <MenuRadioItem
                  key={`${option.id}-${option.direction}`}
                  value={`${option.id}:${option.direction}`}
                  className="w-full justify-between rounded-[12px]"
                >
                  <span className="text-[var(--system-600)]">{option.label}</span>
                </MenuRadioItem>
              ))}
            </MenuRadioGroup>
          </MenuContent>
        </Menu>

          {/* Search */}
          <div id="search-container" className="relative">
          {isSearchOpen ? (
            <div className="flex items-center">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                className="w-48 h-8 px-3 pe-8 bg-white border border-[#e5e5e5] text-[var(--system-600)] placeholder:text-[var(--system-300)] text-sm focus:outline-none focus:border-[var(--system-200)] rounded-lg"
              />
              <button
                onClick={() => onSearchOpenChange(false)}
                className="cursor-pointer absolute end-2 text-[var(--system-300)] hover:text-[var(--system-600)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative group">
              <button
                ref={searchButtonRef}
                onClick={() => onSearchOpenChange(true)}
                className="cursor-pointer p-2 text-[var(--system-300)] hover:text-[var(--system-600)] hover:bg-[var(--system-100)] rounded-lg transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>  

        {/* Delivery Integration Quick Actions */}
        {readyToDispatchCount > 0 ? (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--blue-300)]/10 border border-[var(--blue-300)]/30">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[var(--blue-300)]" />
                  <span className="text-sm font-medium text-[var(--blue-300)]">
                    {readyToDispatchCount} ready
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {courierStatusSummary.pending} orders ready to dispatch
              </TooltipContent>
            </Tooltip>
            <button
              onClick={handleDispatchAll}
              disabled={isDispatchingAll}
              className="cursor-pointer px-2 py-1 rounded-md bg-[var(--blue-300)] text-white text-xs font-medium hover:bg-[var(--blue-400)] transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDispatchingAll ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <PackageCheck className="w-3 h-3" />
              )}
              {isDispatchingAll ? "Dispatching..." : "Dispatch All"}
            </button>
          </div>
        ) : courierStatusSummary.dispatched > 0 ? (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--system-100)] border border-[var(--system-200)]">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[var(--system-400)]" />
                  <span className="text-sm text-[var(--system-400)]">
                    {courierStatusSummary.dispatched} dispatched
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {courierStatusSummary.dispatched} orders with tracking
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="cursor-pointer p-2 text-[var(--system-300)] hover:text-[var(--system-600)] hover:bg-[var(--system-100)] rounded-lg transition-colors"
              >
                <Zap className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Delivery Integration</TooltipContent>
          </Tooltip>
        )}

        {/* Settings Dropdown (Placeholder) */}
        <Menu open={settingsDropdownOpen} onOpenChange={setSettingsDropdownOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <MenuTrigger asChild>
                <button
                  type="button"
                  className="cursor-pointer p-2 text-[var(--system-300)] hover:text-[var(--system-600)] hover:bg-[var(--system-100)] rounded-lg transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              </MenuTrigger>
            </TooltipTrigger>
            <TooltipContent>More</TooltipContent>
          </Tooltip>

          <MenuContent
            align="end"
            sideOffset={-32}
            className="min-w-[180px] rounded-[14px] border border-[var(--system-100)] bg-[var(--system-50)] p-1 text-[var(--system-600)] shadow-[var(--shadow-md)]"
          >
            <MenuLabel className="px-2 py-1 text-xs text-[var(--system-400)]">Export</MenuLabel>
            {selectedOrders.size > 0 ? (
              <MenuItem 
                onSelect={() => {
                  setSettingsDropdownOpen(false);
                  handleExportCSV(false);
                }} 
                className="rounded-[12px]"
              >
                <FileDown className="w-4 h-4 text-[var(--system-400)]" />
                <span className="text-[var(--system-600)]">Export Selected ({selectedOrders.size})</span>
              </MenuItem>
            ) : null}
            <MenuItem 
              onSelect={() => {
                setSettingsDropdownOpen(false);
                handleExportCSV(true);
              }} 
              className="rounded-[12px]"
            >
              <FileDown className="w-4 h-4 text-[var(--system-400)]" />
              <span className="text-[var(--system-600)]">Export All ({filteredOrders.length})</span>
            </MenuItem>
          </MenuContent>
        </Menu>

        
        </div>
      </div>

      {/* Table */}
      <div className="overflow-visible">
        <Table className="table-fixed">
          <colgroup>
            <col style={{ width: "48px" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "14%" }} />
          </colgroup>
          <TableHeader>
            <tr className="bg-[var(--system-200)]/60 rounded-[12px]">
              <th className="rounded-l-[12px] px-3 py-[10px] text-left">
                <Checkbox
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="cursor-pointer w-4 h-4 rounded bg-[var(--system-200)] data-[checked]:bg-[var(--blue-300)] hover:border-[var(--system-400)]"
                >
                  <CheckboxIndicator className="text-white w-3 h-3" />
                </Checkbox>
              </th>
              <th className="px-3 py-[10px] text-left  text-[var(--system-600)]">Customer</th>
              <th className="px-3 py-[10px] text-left text-[var(--system-600)]">Product</th>
              <th className="px-3 py-[10px] text-left  text-[var(--system-600)]">State</th>
              <th className="px-3 py-[10px] text-left  text-[var(--system-600)]">Total</th>
              <th className="px-3 py-[10px] text-left text-[var(--system-600)]">Delivery</th>
              <th className="rounded-r-[12px] px-3 py-[10px] text-left text-[var(--system-600)]">Date</th>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order, index) => (
              <TableRow
                key={order._id}
                index={index}
                className={`cursor-pointer ${
                  selectedOrders.has(order._id) ? "bg-[var(--system-100)] rounded-[16px]" : ""
                }`}
                onClick={() => onOrderClick(order)}
              >
                <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedOrders.has(order._id)}
                    onChange={() => onOrderSelect(order._id)}
                    className="cursor-pointer w-4 h-4 rounded bg-[var(--system-200)]/40 hover:bg-[var(--system-300)] data-[checked]:bg-[var(--blue-300)] data-[checked]:border-[var(--blue-300)]"
                  >
                    <CheckboxIndicator className="text-white w-3 h-3" />
                  </Checkbox>
                </TableCell>
                <TableCell className="py-3">
                  <LockedData fallback="***">
                    <p className="body-base text-[var(--system-600)]">
                      {highlightMatch(order.customerName, searchQuery)}
                    </p>
                    <p className="body-base text-[var(--system-300)]">
                      {highlightMatch(order.customerPhone, searchQuery)}
                    </p>
                  </LockedData>
                </TableCell>
                <TableCell className="py-3">
                  <ProductCell items={order.products || []} />
                </TableCell>
                <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                  <StatusCell
                    status={order.status}
                    isOpen={!!statusDropdownOpen[order._id]}
                    onToggle={(open) => onStatusDropdownToggle(order._id, open)}
                    onStatusChange={(newStatus) => onStatusChange(order._id, newStatus)}
                    callLog={(order.callLog as CallLog[]) || []}
                  />
                </TableCell>
                <TableCell className="py-3 text-[var(--system-600)]">
                  {formatPrice(order.total)}
                </TableCell>
                <TableCell className="py-3">
                  {order.deliveryProvider ? (
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[var(--blue-300)]" />
                      <span className="text-xs text-[var(--system-600)]">
                        {order.deliveryProvider}
                      </span>
                      <span className="text-[var(--system-300)] text-[10px]">
                        {order.trackingNumber || "—"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[var(--system-300)] text-xs">—</span>
                  )}
                </TableCell>
                <TableCell className="py-3 text-[var(--system-300)]">
                  {getRelativeTime(order.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredOrders.length === 0 && (
          <div className="p-12 text-center text-[var(--system-300)]">
            No orders found
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(false)}>
        <DialogContent className="max-w-[360px] border-[--system-200] bg-[--color-card] p-[var(--spacing-lg)] shadow-[var(--shadow-xl)]">
          <DialogHeader className="pr-10">
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <DialogTitle>Delete Orders</DialogTitle>
            </div>
            <DialogDescription>
              Are you sure you want to delete {selectedOrders.size} order(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
