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
  ChevronsUpDown,
  Truck,
  PackageCheck,
  Loader2,
  FileDown,
  CheckCircle2,
  Info,
  RotateCw,
  Settings,
} from "lucide-react";
import { Badge } from "@/components/primitives/core/feedback/badge";
import { Button } from "@/components/ui/button";
import { LockedData } from "@/components/pages/layout/locked-overlay";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Checkbox, CheckboxIndicator } from "@/components/ui/checkbox";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { 
  SortField, 
  SortDirection, 
  OrderStatus,
  CallLog,
} from "@/lib/orders-types";
import {
  CALL_OUTCOME_LABELS,
  ORDER_STATUSES,
  STATUS_LABELS,
  getAllowedOrderStatusTransitions,
  getMerchantTransitionsForOrder,
  getOrderStatusLabel,
  hasAnsweredCallEvidence,
  normalizeOrderStatus,
  normalizeOrderRiskFlags,
  shouldPromptUnreachableAfterNoAnswer,
} from "@/lib/orders-types";
import { getStatusConfig } from "@/lib/status-icons";
import { ProductCell } from "../components/ProductCell";
import { OrderMobileCard } from "../components/OrderMobileCard";
import { OrderViewToggle } from "../components/OrderViewToggle";
import { getDeliveryProviderDisplay } from "@/lib/order-delivery-display";
import type { DeliveryActionResponse } from "@/lib/order-action-feedback";
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

const statuses: OrderStatus[] = [...ORDER_STATUSES];
const ROW_STATUS_BLOCKLIST = new Set<OrderStatus>(["dispatch_ready", "dispatched"]);

function getCanonicalOrderStatus(status: string): OrderStatus | null {
  return normalizeOrderStatus(status);
}

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
    case "wrong_number":
      return "bg-[var(--system-400)]";
    default:
      return "bg-[var(--system-200)]";
  }
}

function isOrderReadyForDispatch(order: Doc<"orders">): boolean {
  return getCanonicalOrderStatus(order.status) === "confirmed";
}

function getLatestActivityHint(order: Doc<"orders">): string {
  const timeline = Array.isArray(order.timeline) ? order.timeline : [];
  const callLog = Array.isArray(order.callLog) ? (order.callLog as CallLog[]) : [];
  const latestTimeline = timeline.at(-1);
  const latestCall = callLog.at(-1);

  if (latestCall && (!latestTimeline || latestCall.timestamp >= latestTimeline.timestamp)) {
    const label = CALL_OUTCOME_LABELS[latestCall.outcome]?.label || latestCall.outcome;
    return `Latest: ${label} call`;
  }

  if (latestTimeline?.note) {
    return latestTimeline.note;
  }

  if (latestTimeline?.status) {
    return `Latest: ${getOrderStatusLabel(latestTimeline.status)}`;
  }

  return "No activity yet";
}

function getDispatchBody(order: Doc<"orders">, storeSlug?: string) {
  return {
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
  };
}

// CallSlotsHover Component - same design as OrderDetails
function CallSlotsHover({ callLog }: { callLog: CallLog[] }) {
  const slots = useMemo(() => {
    const relevant = callLog.slice(-MAX_CALL_SLOTS);
    return Array.from({ length: MAX_CALL_SLOTS }, (_, i) => relevant[i] ?? null);
  }, [callLog]);

  const hasCalls = callLog.length > 0;
  const triggerLabel = hasCalls ? "Call history" : "No calls yet";

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          aria-label={triggerLabel}
          className="flex h-[18px] cursor-pointer items-end gap-0.5 rounded-md bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/40"
        >
          {slots.map((call, index) => (
            <div
              key={index}
              className={cn(
                "w-[5px] h-full border border-black/8 rounded-full transition-colors",
                call ? getCallOutcomeBg(call.outcome) : "bg-black/10"
              )}
            />
          ))}
        </button>
      </HoverCardTrigger>
      {hasCalls && (
        <HoverCardContent
          side="top"
          align="start"
          sideOffset={8}
          className="w-auto min-w-0 p-0 border-0 bg-transparent shadow-none"
        >
          <div
            className="whitespace-nowrap rounded-lg px-3 py-2 text-white"
            style={{
              background: "linear-gradient(0deg, #1D1E1F 0%, #353737 100%)",
            }}
          >
            <div className="text-micro-label mb-1.5 font-medium text-[var(--system-200)]">
              Call History
            </div>
            {callLog.slice().map((call, idx) => (
              <div key={call.id} className="flex items-center gap-2 py-0.5">
                <span className="text-caption w-4 font-medium text-[var(--system-300)]">
                  #{idx + 1}
                </span>
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    getCallOutcomeBg(call.outcome)
                  )}
                />
                <span className="text-body-sm font-medium text-white/90">
                  {CALL_OUTCOME_LABELS[call.outcome]?.label || call.outcome}
                </span>
                <span className="text-caption font-medium text-white/40">
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
  onSelectAll: (checked: boolean, visibleOrderIds?: string[]) => void;
  onOrderSelect: (orderId: string) => void;
  onClearSelection: () => void;
  onStatusChange: (orderId: string, newStatus: string, note?: string) => void;
  onStatusDropdownToggle: (dropdownKey: string, open: boolean) => void;
  statusDropdownOpenKey: string | null;
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
  isStateViewEnabled: boolean;
  updatingOrderIds?: Set<string>;
  storeSlug?: string;
}

// Status Dropdown Component
function StatusCell({ 
  order,
  status, 
  isOpen, 
  onToggle, 
  onStatusChange,
  onIntegratedDispatch,
  onManualDispatch,
  isUpdating = false,
  callLog,
  showCallSlots = true,
  feedback,
}: { 
  order?: Doc<"orders">;
  status: string; 
  isOpen: boolean; 
  onToggle: (open: boolean) => void;
  onStatusChange: (status: string) => void;
  onIntegratedDispatch?: () => void;
  onManualDispatch?: () => void;
  isUpdating?: boolean;
  callLog?: CallLog[];
  showCallSlots?: boolean;
  feedback?: { type: "success" | "error"; message: string } | null;
}) {
  const canonicalStatus = getCanonicalOrderStatus(status);
  const statusConfig = getStatusConfig(status);
  const statusLabel = canonicalStatus ? STATUS_LABELS[canonicalStatus] : undefined;
  const rawStatusOptions = getAllowedOrderStatusTransitions(status, "merchant").filter(
    (nextStatus) => !ROW_STATUS_BLOCKLIST.has(nextStatus)
  );
  const statusOptions = getMerchantTransitionsForOrder(status, order, "merchant").filter(
    (nextStatus) => !ROW_STATUS_BLOCKLIST.has(nextStatus) && nextStatus !== "blocked"
  );
  const confirmDisabledReason =
    canonicalStatus === "awaiting_confirmation" || canonicalStatus === "new"
      ? null 
      : rawStatusOptions.includes("confirmed") && !hasAnsweredCallEvidence(order)
      ? "Confirm requires an answered call"
      : null;
  const riskFlags = normalizeOrderRiskFlags(order?.riskFlags);
  const needsUnreachablePrompt = shouldPromptUnreachableAfterNoAnswer(order);
  const activityHint = order ? getLatestActivityHint(order) : null;
  const canDispatch = canonicalStatus === "confirmed" || canonicalStatus === "dispatch_ready";

  const requestStatusChange = (nextStatus: OrderStatus) => {
    onToggle(false);
    onStatusChange(nextStatus);
  };

  const requestDispatchAction = (action?: () => void) => {
    onToggle(false);
    action?.();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={onToggle} modal={false}>
      <div className="relative w-full min-w-0">
        <div
          className={cn(
            "flex flex-row items-start gap-2",
            showCallSlots ? "justify-between" : "justify-start",
          )}
        >
          <div className="min-w-0">
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={isUpdating}
                aria-busy={isUpdating}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
                className={cn(
                  "group flex min-h-10 cursor-pointer flex-row items-center gap-2 rounded-[12px] p-1 text-left transition-[background-color,transform] hover:bg-black/5 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100",
                  feedback?.type === "success" && "bg-emerald-50",
                  feedback?.type === "error" && "bg-red-50",
                )}
              >
                <Badge
                  bgColor={statusConfig?.bgColor}
                  textColor={statusConfig?.textColor}
                  icon={isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : statusConfig?.icon}
                >
                  {isUpdating ? "Updating..." : statusConfig?.label || statusLabel?.label || status}
                </Badge>
              </button>
            </DropdownMenuTrigger>
            <div className="mt-1 max-w-[180px] space-y-1">
              {riskFlags.length > 0 && (
                <p className="text-caption font-medium text-[#FC9239]">Risk warning: {riskFlags.length} flag{riskFlags.length === 1 ? "" : "s"}</p>
              )}
            </div>
          </div>

          {/* Call Log Slots */}
          {showCallSlots && callLog && callLog.length > -1 ? (
            <CallSlotsHover callLog={callLog} />
          ) : null}
        </div>

        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className="min-w-[180px] max-h-[300px] overflow-y-auto rounded-[14px] bg-[var(--system-600)]/80 p-1 text-[var(--system-100)] backdrop-blur-xl"
        >
          {statusOptions.length === 0 ? (
            <DropdownMenuItem disabled className="rounded-[12px] py-1.5 text-[var(--system-400)]">
              {isUpdating ? "Updating..." : "No merchant actions"}
            </DropdownMenuItem>
          ) : statusOptions.map((s) => {
            const sConfig = getStatusConfig(s);
            return (
              <DropdownMenuItem
                key={s}
                disabled={isUpdating}
                onSelect={(event) => {
                  event.preventDefault();
                  if (!isUpdating) requestStatusChange(s);
                }}
                className="rounded-[12px] py-1.5"
              >
                <span
                  className="text-caption font-medium overflow-hidden inline-flex items-center gap-1.5 rounded-[10px] px-2 py-1 shadow-[var(--shadow-sm)]"
                  style={{
                    backgroundColor: sConfig?.bgColor || "#6b728015",
                    color: sConfig?.textColor || "#6b7280",
                  }}
                >
                  {sConfig?.icon}
                  {sConfig?.label || getOrderStatusLabel(s)}
                </span>
              </DropdownMenuItem>
            );
          })}
          {confirmDisabledReason && (
            <DropdownMenuItem disabled className="rounded-[12px] py-1.5 text-[var(--system-100)]">
              <Info className="h-4 w-4" />
              <span>{confirmDisabledReason}</span>
            </DropdownMenuItem>
          )}
          {canDispatch && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={isUpdating}
                onSelect={(event) => {
                  event.preventDefault();
                  requestDispatchAction(onIntegratedDispatch);
                }}
                className="rounded-[12px]"
              >
                <Truck className="h-4 w-4 text-[var(--color-primary)]" />
                <span>Send to courier</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={isUpdating}
                onSelect={(event) => {
                  event.preventDefault();
                  requestDispatchAction(onManualDispatch);
                }}
                className="rounded-[12px]"
              >
                <PackageCheck className="h-4 w-4 text-[var(--system-100)]" />
                <span>Manual dispatch</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </div>
    </DropdownMenu>
  );
}

function SelectedStatusSummary({ counts }: { counts: Record<string, number> }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {statuses.map((status) => {
        const count = counts[status];
        if (count === 0) return null;

        const statusConfig = getStatusConfig(status);
        return (
          <span
            key={status}
            className="text-micro-label font-medium inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px]"
            style={{
              backgroundColor: statusConfig?.bgColor || "#6b7280",
              color: statusConfig?.textColor || "#ffffff",
            }}
          >
            {statusConfig?.icon}
            {count}
          </span>
        );
      })}
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
  statusDropdownOpenKey,
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
  isStateViewEnabled,
  updatingOrderIds = new Set<string>(),
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
  const manualDispatchOrder = useMutation(api.orders.markOrderManuallyDispatched);
  const recordSyncAttempt = useMutation(api.orders.recordOrderSyncAttempt);

  // Toast notifications
  const { showToast } = useToast();

  // Dispatch All state
  const [isDispatchingAll, setIsDispatchingAll] = useState(false);
  
  // Bulk dispatch selected state
  const [isBulkDispatching, setIsBulkDispatching] = useState(false);
  const [rowFeedback, setRowFeedback] = useState<Record<string, { type: "success" | "error"; message: string }>>({});
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; retry: number } | null>(null);
  const [syncResults, setSyncResults] = useState<Array<{
    orderId: string;
    orderNumber: string;
    status: "success" | "failed" | "skipped";
    message: string;
    attempts: number;
  }>>([]);

  // Delivery quick stats
  const readyToDispatchCount = useMemo(() => {
    return orders.filter(isOrderReadyForDispatch).length;
  }, [orders]);

  const courierStatusSummary = useMemo(() => {
    const summary = { dispatched: 0, pending: 0 };
    for (const order of orders) {
      if (order.deliveryProvider && order.trackingNumber) {
        summary.dispatched++;
      } else if (isOrderReadyForDispatch(order)) {
        summary.pending++;
      }
    }
    return summary;
  }, [orders]);

  const setTemporaryRowFeedback = useCallback((
    orderId: string,
    feedback: { type: "success" | "error"; message: string }
  ) => {
    setRowFeedback((prev) => ({ ...prev, [orderId]: feedback }));
    window.setTimeout(() => {
      setRowFeedback((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    }, feedback.type === "success" ? 2500 : 6000);
  }, []);

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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const closeOpenStatusDropdown = () => {
      if (statusDropdownOpenKey) {
        onStatusDropdownToggle(statusDropdownOpenKey, false);
      }
    };

    mediaQuery.addEventListener("change", closeOpenStatusDropdown);
    return () => mediaQuery.removeEventListener("change", closeOpenStatusDropdown);
  }, [onStatusDropdownToggle, statusDropdownOpenKey]);

  const filteredOrders = useMemo(() => {
    let filtered = [...orders];
    
    // Filter by hidden statuses
    filtered = filtered.filter((order) => {
      const canonicalStatus = getCanonicalOrderStatus(order.status);
      return !canonicalStatus || !hiddenStatuses.has(canonicalStatus);
    });
    
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
      filtered = filtered.filter((order) => getCanonicalOrderStatus(order.status) === activeFilter);
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

  const visibleOrderIds = useMemo(() => filteredOrders.map((order) => order._id), [filteredOrders]);
  const allVisibleSelected =
    visibleOrderIds.length > 0 && visibleOrderIds.every((orderId) => selectedOrders.has(orderId));
  const selectedVisibleCount = visibleOrderIds.filter((orderId) => selectedOrders.has(orderId)).length;
  const hasActiveFilters =
    activeFilter !== "all" ||
    activeDateFilter !== "all" ||
    searchQuery.trim().length > 0 ||
    hiddenStatuses.size > 0;

  const clearFilters = () => {
    setActiveFilter("all");
    setActiveDateFilter("all");
    onSearchQueryChange("");
    setHiddenStatuses(new Set());
    if (typeof window !== "undefined") {
      localStorage.setItem("marlon-hidden-statuses", JSON.stringify([]));
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleSelectAll = (checked: boolean) => {
    onSelectAll(checked, visibleOrderIds);
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

  const dispatchOrderToCourier = useCallback(async (order: Doc<"orders">) => {
    const response = await fetch("/api/delivery/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(getDispatchBody(order, storeSlug)),
    });

    const data = (await response.json().catch(() => null)) as DeliveryActionResponse | null;
    if (!data?.success) {
      throw new Error(data?.error || "Courier dispatch failed");
    }

    return data;
  }, [storeSlug]);

  const runCourierSync = useCallback(async (
    targetOrders: Doc<"orders">[],
    options: { mode: "all" | "selected" | "single"; title?: string }
  ) => {
    const eligibleOrders = targetOrders.filter(isOrderReadyForDispatch);
    const skippedOrders = targetOrders.filter((order) => !isOrderReadyForDispatch(order));
    const total = eligibleOrders.length;
    const results: Array<{
      orderId: string;
      orderNumber: string;
      status: "success" | "failed" | "skipped";
      message: string;
      attempts: number;
    }> = skippedOrders.map((order) => ({
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: "skipped",
      message: "Only confirmed orders can be sent to courier.",
      attempts: 0,
    }));

    setSyncModalOpen(true);
    setSyncResults(results);

    for (const order of skippedOrders) {
      await recordSyncAttempt({
        orderId: order._id,
        outcome: "skipped",
        note: "Courier sync skipped: only confirmed orders can be dispatched.",
        source: `orders.tableSync.${options.mode}`,
      }).catch(() => undefined);
    }

    if (eligibleOrders.length === 0) {
      setSyncProgress(null);
      showToast("No confirmed orders ready for courier sync", "info");
      return results;
    }

    const workingResults = [...results];
    for (let index = 0; index < eligibleOrders.length; index += 1) {
      const order = eligibleOrders[index];
      let dispatched = false;
      let lastMessage = "Courier dispatch failed";
      let attempts = 0;

      for (let retry = 0; retry < 3 && !dispatched; retry += 1) {
        attempts = retry + 1;
        setSyncProgress({ current: index + 1, total, retry });
        await recordSyncAttempt({
          orderId: order._id,
          outcome: "attempted",
          note: retry > 0 ? `Courier sync retry ${retry + 1}/3 started.` : "Courier sync started.",
          source: `orders.tableSync.${options.mode}`,
        }).catch(() => undefined);

        try {
          await dispatchOrderToCourier(order);
          dispatched = true;
          workingResults.push({
            orderId: order._id,
            orderNumber: order.orderNumber,
            status: "success",
            message: retry > 0 ? `Dispatched after retry ${retry}` : "Sent to courier",
            attempts,
          });
          setTemporaryRowFeedback(order._id, { type: "success", message: "Sent to courier" });
        } catch (error) {
          lastMessage = error instanceof Error ? error.message : "Courier dispatch failed";
          if (retry === 2) {
            workingResults.push({
              orderId: order._id,
              orderNumber: order.orderNumber,
              status: "failed",
              message: lastMessage,
              attempts,
            });
            setTemporaryRowFeedback(order._id, { type: "error", message: "Retry failed" });
            await recordSyncAttempt({
              orderId: order._id,
              outcome: "failed",
              note: `Courier sync failed after 3 attempts: ${lastMessage}`,
              source: `orders.tableSync.${options.mode}`,
            }).catch(() => undefined);
          }
        }
      }

      setSyncResults([...workingResults]);
    }

    setSyncProgress(null);
    const successCount = workingResults.filter((result) => result.status === "success").length;
    const failCount = workingResults.filter((result) => result.status === "failed").length;
    const skippedCount = workingResults.filter((result) => result.status === "skipped").length;

    if (failCount > 0) {
      showToast(`${successCount} synced, ${failCount} failed, ${skippedCount} skipped`, "error");
    } else {
      showToast(`${successCount} confirmed orders synced`, "success");
    }

    return workingResults;
  }, [dispatchOrderToCourier, recordSyncAttempt, setTemporaryRowFeedback, showToast]);

  const handleDispatchAll = useCallback(async () => {
    if (isDispatchingAll) return;
    setIsDispatchingAll(true);
    try {
      await runCourierSync(orders, { mode: "all" });
    } finally {
      setIsDispatchingAll(false);
    }
  }, [orders, isDispatchingAll, runCourierSync]);

  const handleDispatchSingle = useCallback(async (order: Doc<"orders">) => {
    await runCourierSync([order], { mode: "single" });
  }, [runCourierSync]);

  const handleManualDispatch = useCallback(async (order: Doc<"orders">) => {
    try {
      await manualDispatchOrder({
        orderId: order._id,
        note: "Manual dispatch recorded from orders table.",
      });
      setTemporaryRowFeedback(order._id, { type: "success", message: "Manual dispatch recorded" });
      showToast("Manual dispatch recorded", "success");
    } catch (error) {
      setTemporaryRowFeedback(order._id, {
        type: "error",
        message: error instanceof Error ? error.message : "Manual dispatch failed",
      });
      showToast("Manual dispatch failed. The order state was preserved.", "error");
    }
  }, [manualDispatchOrder, setTemporaryRowFeedback, showToast]);

  const handleBulkDispatch = useCallback(async () => {
    if (isBulkDispatching) return;
    const selectedReadyOrders = orders.filter((order) => selectedOrders.has(order._id));
    setIsBulkDispatching(true);
    try {
      await runCourierSync(selectedReadyOrders, { mode: "selected" });
    } finally {
      setIsBulkDispatching(false);
    }
  }, [orders, selectedOrders, isBulkDispatching, runCourierSync]);

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
      order.customerName === "معلومات محمية" ? "معلومات محمية" : order.customerName,
      order.customerPhone === "معلومات محمية" ? "معلومات محمية" : order.customerPhone,
      order.customerWilaya === "معلومات محمية" ? "معلومات محمية" : (order.customerWilaya || ""),
      order.customerCommune === "معلومات محمية" ? "معلومات محمية" : (order.customerCommune || ""),
      order.customerAddress === "معلومات محمية" ? "معلومات محمية" : (order.customerAddress || ""),
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
        const orderStatus = getCanonicalOrderStatus(order.status);
        if (orderStatus && counts[orderStatus] !== undefined) {
          counts[orderStatus]++;
        }
      }
    }
    return counts;
  }, [orders, selectedOrders]);

  const selectedDispatchableCount = useMemo(() => {
    return orders.filter((order) => selectedOrders.has(order._id) && isOrderReadyForDispatch(order)).length;
  }, [orders, selectedOrders]);

  return (
    <TooltipProvider>
    <div className="w-full h-full flex flex-col gap-3 relative">

      {/* Bulk Action Toolbar - Fixed Bottom */}
      {selectedOrders.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--system-200)] bg-white p-4 shadow-lg">
          <div className="mx-auto max-w-7xl">
            <div className="hidden md:flex items-center justify-between rounded-[14px] border border-[var(--system-100)] bg-[var(--system-50)] px-3 py-2 text-[var(--system-600)] shadow-[var(--shadow-sm)] w-fit">
              <div className="flex items-center gap-1">
                <span className="text-body font-medium text-[var(--system-500)]">{selectedOrders.size} selected ({selectedVisibleCount} visible)</span>
                <SelectedStatusSummary counts={selectedOrdersByStatus} />
              </div>
              <div className="flex items-center gap-2">
                {selectedDispatchableCount > 0 && (
                  <button
                    onClick={handleBulkDispatch}
                    disabled={isBulkDispatching}
                    className="text-caption font-medium ml-2 flex cursor-pointer items-center gap-1 rounded-md bg-[var(--color-primary)] px-2 py-1 text-white transition-colors hover:bg-[var(--color-primary-blue-dark)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isBulkDispatching ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <PackageCheck className="w-3 h-3" />
                    )}
                    {isBulkDispatching ? "Syncing..." : `Sync Selected (${selectedDispatchableCount})`}
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

            <div className="md:hidden rounded-[14px] border border-[var(--system-100)] bg-[var(--system-50)] px-3 py-3 text-[var(--system-600)] w-fit">
              <div className="flex flex-col gap-3">
                <div className="space-y-2">
                  <span className="text-body font-medium text-[var(--system-500)]">{selectedOrders.size} selected</span>
                  <SelectedStatusSummary counts={selectedOrdersByStatus} />
                </div>
                <div className="flex items-center gap-2">
                  {selectedDispatchableCount > 0 && (
                    <button
                      onClick={handleBulkDispatch}
                      disabled={isBulkDispatching}
                      className="text-caption font-medium flex-1 cursor-pointer rounded-md bg-[var(--color-primary)] px-3 py-2 text-white transition-colors hover:bg-[var(--color-primary-blue-dark)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isBulkDispatching ? "Syncing..." : `Sync Selected (${selectedDispatchableCount})`}
                    </button>
                  )}
                  <button
                    className="cursor-pointer rounded-md p-2 text-red-500 transition-colors hover:bg-red-500/20"
                    onClick={() => setShowDeleteConfirm(true)}
                    aria-label="Delete selected orders"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <OrderViewToggle
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          isStateViewEnabled={isStateViewEnabled}
        />
        
        <div className="flex flex-wrap items-center gap-1">
        
        {/* Date Filter Dropdown */}
        <DropdownMenu open={dateFilterOpen} onOpenChange={setDateFilterOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`text-body-sm font-medium flex h-8 cursor-pointer items-center gap-2 rounded-lg px-3 transition-colors ${
                activeDateFilter !== "all"
                  ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)]"
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
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={-32}
            className="min-w-[180px] rounded-[14px] border border-[var(--system-100)] bg-[var(--system-50)] p-1 text-[var(--system-600)] shadow-[var(--shadow-md)]"
          >
            <DropdownMenuLabel>Filter By Date</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={activeDateFilter}
              onValueChange={(value) => setActiveDateFilter(value as typeof activeDateFilter)}
            >
              {[
                { id: "all", label: "All" },
                { id: "today", label: "Today (24h)" },
                { id: "week", label: "This Week (7 days)" },
                { id: "month", label: "This Month" },
              ].map((option) => (
                <DropdownMenuRadioItem
                  key={option.id}
                  value={option.id}
                  className="w-full justify-between rounded-[12px]"
                >
                  <span className="text-[var(--system-600)]">{option.label}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Filter Dropdown */}
          <DropdownMenu open={filterDropdownOpen} onOpenChange={setFilterDropdownOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={`text-body-sm font-medium flex h-8 cursor-pointer items-center gap-2 rounded-lg px-3 transition-colors ${
                      activeFilter !== "all"
                        ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)]"
                        : "text-[var(--system-300)] hover:text-[var(--system-600)] hover:bg-[var(--system-100)]"
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    <span>
                      {activeFilter === "all" 
                        ? "Filter" 
                        : activeFilter === "confirmed" 
                          ? `Ready (${readyToDispatchCount})`
                          : getStatusConfig(activeFilter)?.label || activeFilter}
                    </span>
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Filter by status</TooltipContent>
            </Tooltip>

          <DropdownMenuContent
            align="end"
            sideOffset={-32}
            className="min-w-[240px] rounded-[14px] border border-[var(--system-100)] bg-[var(--system-50)] p-1 text-[var(--system-600)] shadow-[var(--shadow-md)]"
          >
            <DropdownMenuLabel>Filter By State</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={activeFilter} onValueChange={setActiveFilter}>
              <DropdownMenuRadioItem value="all" className="w-full justify-between rounded-[12px]">
                <span className="text-[var(--system-600)]">All</span>
                <span className="text-micro-label font-medium text-[var(--system-400)]">{orders.length}</span>
              </DropdownMenuRadioItem>
              {readyToDispatchCount > 0 && (
                <DropdownMenuRadioItem 
                  value="confirmed" 
                  className="w-full justify-between rounded-[12px]"
                >
                  <span className="text-micro-label font-medium inline-flex items-center gap-1.5 rounded-[8px] bg-[var(--color-primary)]/20 px-2 py-1 text-[var(--color-primary)]">
                    <PackageCheck className="w-3 h-3" />
                    Ready to Dispatch
                  </span>
                  <span className="text-micro-label font-medium text-[var(--color-primary)]">{readyToDispatchCount}</span>
                </DropdownMenuRadioItem>
              )}
              {statuses.map((status) => {
                const sConfig = getStatusConfig(status)
                const count = orders.filter((o) => getCanonicalOrderStatus(o.status) === status).length
                if (count === 0 || (status === "confirmed" && readyToDispatchCount > 0)) {
                  return null;
                }

                return (
                  <DropdownMenuRadioItem
                    key={status}
                    value={status}
                    className="w-full justify-between rounded-[12px]"
                  >
                    <span
                      className="text-micro-label font-medium overflow-hidden rounded-[8px] inline-flex items-center gap-1.5 px-2 py-1 shadow-[var(--shadow-sm)]"
                      style={{
                        backgroundColor: sConfig?.bgColor || "#6b7280",
                        color: sConfig?.textColor || "#ffffff",
                      }}
                    >
                      {sConfig?.icon}
                      {sConfig?.label || status}
                    </span>
                    <span className="text-micro-label font-medium text-[var(--system-400)]">{count}</span>
                  </DropdownMenuRadioItem>
                )
              })}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort Dropdown */}
        <DropdownMenu open={sortDropdownOpen} onOpenChange={setSortDropdownOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`cursor-pointer p-2 rounded-lg transition-colors ${
                    sortField !== "date" || sortDirection !== "desc"
                      ? "bg-[var(--color-primary)]/20 text-[var(--color-primary)]"
                      : "text-[var(--system-300)] hover:text-[var(--system-600)] hover:bg-[var(--system-100)]"
                  }`}
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Sort orders</TooltipContent>
          </Tooltip>

          <DropdownMenuContent
            align="end"
            sideOffset={-32}
            className="min-w-[220px] rounded-[14px] border border-[var(--system-100)] bg-[var(--system-50)] p-1 text-[var(--system-600)] shadow-[var(--shadow-md)]"
          >
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            <DropdownMenuRadioGroup
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
                <DropdownMenuRadioItem
                  key={`${option.id}-${option.direction}`}
                  value={`${option.id}:${option.direction}`}
                  className="w-full justify-between rounded-[12px]"
                >
                  <span className="text-[var(--system-600)]">{option.label}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

          {/* Search */}
          <div
            id="search-container"
            className={cn(
              "relative order-last w-full sm:order-none",
              isSearchOpen ? "sm:w-[192px]" : "sm:w-auto",
            )}
          >
          {isSearchOpen ? (
            <div className="flex items-center">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                className="text-body-sm font-medium h-8 w-full rounded-lg border border-[#e5e5e5] bg-white px-3 pe-8 text-[var(--system-600)] placeholder:text-[var(--system-300)] focus:border-[var(--system-200)] focus:outline-none sm:w-48"
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
          <div className="flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-2 py-1 sm:w-auto sm:justify-start">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[var(--color-primary)]" />
                  <span className="text-body-sm font-medium text-[var(--color-primary)]">
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
              className="text-caption font-medium flex cursor-pointer items-center gap-1 rounded-md bg-[var(--color-primary)] px-2 py-1 text-white transition-colors hover:bg-[var(--color-primary-blue-dark)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDispatchingAll ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <PackageCheck className="w-3 h-3" />
              )}
                  {isDispatchingAll ? "Syncing..." : "Sync Confirmed"}
            </button>
          </div>
        ) : courierStatusSummary.dispatched > 0 ? (
          <div className="flex w-full items-center gap-1.5 rounded-lg border border-[var(--system-200)] bg-[var(--system-100)] px-2 py-1 sm:w-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[var(--system-400)]" />
                  <span className="text-body-sm text-[var(--system-400)]">
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

        {/* Settings Dropdown */}
        <DropdownMenu open={settingsDropdownOpen} onOpenChange={setSettingsDropdownOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="cursor-pointer p-2 text-[var(--system-300)] hover:text-[var(--system-600)] hover:bg-[var(--system-100)] rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>More</TooltipContent>
          </Tooltip>

          <DropdownMenuContent
            align="end"
            sideOffset={-32}
            className="min-w-[180px] rounded-[14px] border border-[var(--system-100)] bg-[var(--system-50)] p-1 text-[var(--system-600)] shadow-[var(--shadow-md)]"
          >
            <DropdownMenuLabel className="text-micro-label px-2 py-1 text-[var(--system-400)]">Export</DropdownMenuLabel>
            {selectedOrders.size > 0 ? (
              <DropdownMenuItem 
                onSelect={() => {
                  setSettingsDropdownOpen(false);
                  handleExportCSV(false);
                }} 
                className="rounded-[12px]"
              >
                <FileDown className="w-4 h-4 text-[var(--system-400)]" />
                <span className="text-[var(--system-600)]">Export Selected ({selectedOrders.size})</span>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem 
              onSelect={() => {
                setSettingsDropdownOpen(false);
                handleExportCSV(true);
              }} 
              className="rounded-[12px]"
            >
              <FileDown className="w-4 h-4 text-[var(--system-400)]" />
              <span className="text-[var(--system-600)]">Export All ({filteredOrders.length})</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-micro-label px-2 py-1 text-[var(--system-400)]">Hidden States</DropdownMenuLabel>
            {statuses.map((status) => {
              const sConfig = getStatusConfig(status);
              const isHidden = hiddenStatuses.has(status);

              return (
                <DropdownMenuCheckboxItem
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
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        
        </div>
      </div>

      {/* Table */}
      <div className="space-y-3">
        <div className="grid gap-3 md:hidden">
          {filteredOrders.map((order) => {
            const statusDropdownKey = `mobile:${order._id}`;

            return (
              <OrderMobileCard
                key={order._id}
                order={order}
                isSelected={selectedOrders.has(order._id)}
                searchQuery={searchQuery}
                onOrderClick={onOrderClick}
                onOrderSelect={onOrderSelect}
                statusControl={
                  <StatusCell
                    order={order}
                    status={order.status}
                    isOpen={statusDropdownOpenKey === statusDropdownKey}
                    onToggle={(open) => onStatusDropdownToggle(statusDropdownKey, open)}
                    onStatusChange={(newStatus) => onStatusChange(order._id, newStatus)}
                    onIntegratedDispatch={() => handleDispatchSingle(order)}
                    onManualDispatch={() => handleManualDispatch(order)}
                    isUpdating={updatingOrderIds.has(order._id)}
                    callLog={(order.callLog as CallLog[]) || []}
                    feedback={rowFeedback[order._id] ?? null}
                  />
                }
              />
            );
          })}
        </div>

        <div className="hidden overflow-visible md:block mb-[120px]">
          <Table className="table-fixed">
          <colgroup>
            <col style={{ width: "48px" }} />
            <col style={{ width: "17%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>
          <TableHeader>
            <tr className="bg-[var(--system-200)]/50 rounded-[12px]">
              <th className="rounded-l-[12px] px-3 py-[10px] text-left">
                <Checkbox
                  checked={allVisibleSelected || selectAll}
                  onChange={handleSelectAll}
                >
                  <CheckboxIndicator className="text-white w-3 h-3" />
                </Checkbox>
              </th>
              <th className="px-3 py-[10px] text-left text-body-sm font-medium text-[var(--system-600)]">Customer</th>
              <th className="px-3 py-[10px] text-left text-body-sm font-medium text-[var(--system-600)]">Product</th>
              <th className="px-3 py-[10px] text-left text-body-sm font-medium text-[var(--system-600)]">State</th>
              <th className="px-3 py-[10px] text-center text-body-sm font-medium text-[var(--system-600)]">Call</th>
              <th className="px-3 py-[10px] text-left text-body-sm font-medium text-[var(--system-600)]">Total</th>
              <th className="px-3 py-[10px] text-left text-body-sm font-medium text-[var(--system-600)]">Delivery</th>
              <th className="rounded-r-[12px] px-3 py-[10px] text-left text-body-sm font-medium text-[var(--system-600)]">Date</th>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order, index) => {
              const delivery = getDeliveryProviderDisplay(order.deliveryProvider, order.trackingNumber);
              const callLog = (order.callLog as CallLog[]) || [];
              const statusDropdownKey = `desktop:${order._id}`;

              return (
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
                  >
                    <CheckboxIndicator className="text-white w-3 h-3" />
                  </Checkbox>
                </TableCell>
                <TableCell className="py-3">
                  <LockedData fallback="***">
                    <p className="text-body text-[var(--system-600)]">
                      {highlightMatch(order.customerName, searchQuery)}
                    </p>
                    <p className="text-body text-[var(--system-300)]">
                      {highlightMatch(order.customerPhone, searchQuery)}
                    </p>
                  </LockedData>
                </TableCell>
                <TableCell className="py-3">
                  <ProductCell items={order.products || []} />
                </TableCell>
                <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                  <StatusCell
                    order={order}
                    status={order.status}
                    isOpen={statusDropdownOpenKey === statusDropdownKey}
                    onToggle={(open) => onStatusDropdownToggle(statusDropdownKey, open)}
                    onStatusChange={(newStatus) => onStatusChange(order._id, newStatus)}
                    onIntegratedDispatch={() => handleDispatchSingle(order)}
                    onManualDispatch={() => handleManualDispatch(order)}
                    isUpdating={updatingOrderIds.has(order._id)}
                    callLog={callLog}
                    showCallSlots={false}
                    feedback={rowFeedback[order._id] ?? null}
                  />
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex justify-center">
                    <CallSlotsHover callLog={callLog} />
                  </div>
                </TableCell>
                <TableCell className="py-3 text-[var(--system-600)]">
                  {formatPrice(order.total)}
                </TableCell>
                <TableCell className="py-3">
                  {order.deliveryProvider ? (
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                      <span className="text-caption text-[var(--system-600)]">
                        {delivery.label}
                      </span>
                       <span className="text-caption text-[var(--system-300)]">
                        {order.trackingNumber || "—"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-caption text-[var(--system-300)]">—</span>
                  )}
                </TableCell>
                <TableCell className="py-3 text-[var(--system-300)]">
                  {getRelativeTime(order.createdAt)}
                </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          </Table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="rounded-[14px] bg-white p-12 text-center">
            <p className="text-body text-[var(--system-600)]">
              {hasActiveFilters ? "No visible orders match these filters" : "No orders yet"}
            </p>
            <p className="mt-1 text-body-sm text-[var(--system-300)]">
              {hasActiveFilters ? "Clear filters to return to the full order list." : "New checkout orders will appear here."}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-[var(--system-100)] px-3 text-caption text-[var(--system-600)] hover:bg-[var(--system-200)]"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Courier Sync Results Modal */}
      <Dialog open={syncModalOpen} onOpenChange={setSyncModalOpen}>
        <DialogContent className="max-w-[520px] border-[--system-200] bg-[--color-card] p-6 shadow-[var(--shadow-xl)]">
          <DialogHeader>
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-full bg-[var(--color-primary)]/10 p-3">
                <RotateCw className={cn("h-5 w-5 text-[var(--color-primary)]", syncProgress && "animate-spin")} />
              </div>
              <div>
                <DialogTitle>Courier Sync</DialogTitle>
                <DialogDescription>
                  Confirmed orders are sent to the courier with up to 3 automatic retries.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {syncProgress && (
            <div className="rounded-xl bg-[var(--system-100)] px-3 py-2 text-body-sm text-[var(--system-600)]">
              Syncing {syncProgress.current}/{syncProgress.total}
              {syncProgress.retry > 0 ? ` - retry ${syncProgress.retry + 1}/3` : ""}
            </div>
          )}
          <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
            {syncResults.length === 0 ? (
              <p className="py-6 text-center text-body-sm text-[var(--system-300)]">Preparing sync...</p>
            ) : (
              syncResults.map((result) => (
                <div key={`${result.orderId}-${result.status}`} className="rounded-xl border border-[var(--system-100)] bg-white px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-body-sm text-[var(--system-700)]">#{result.orderNumber}</p>
                      <p className="truncate text-caption text-[var(--system-400)]">{result.message}</p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-caption",
                        result.status === "success" && "bg-emerald-50 text-emerald-700",
                        result.status === "failed" && "bg-red-50 text-red-700",
                        result.status === "skipped" && "bg-[var(--system-100)] text-[var(--system-500)]",
                      )}
                    >
                      {result.status === "success" ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                      {result.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSyncModalOpen(false)}>Close</Button>
            {syncResults.some((result) => result.status === "failed") && (
              <Button
                onClick={() => {
                  const failedIds = new Set(syncResults.filter((result) => result.status === "failed").map((result) => result.orderId));
                  const failedOrders = orders.filter((order) => failedIds.has(order._id));
                  void runCourierSync(failedOrders, { mode: "selected" });
                }}
              >
                Retry failed
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(false)}>
      <DialogContent className="max-w-[360px] border-[--system-200] bg-[--color-card] p-6 shadow-[var(--shadow-xl)]">
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
