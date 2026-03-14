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
  Eye,
  EyeOff,
  Zap,
  SlidersHorizontal,
  ChevronsUpDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/core";
import { Button } from "@/components/core/button";
import { LockedData } from "@/components/locked-overlay";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/animate-ui/components/animate/tooltip";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Checkbox, CheckboxIndicator } from "@/components/animate-ui/primitives/headless/checkbox";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { SubtleTab, SubtleTabItem } from "@/components/ui/subtle-tab";
import type { LucideIcon } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import type { 
  SortField, 
  SortDirection, 
  OrderStatus,
  CallLog,
} from "@/lib/orders-types";
import { STATUS_LABELS, CALL_OUTCOME_LABELS } from "@/lib/orders-types";
import { STATUS_CONFIG } from "@/lib/status-icons";
import { ProductCell } from "./ProductCell";
import { cn } from "@/lib/utils";

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
  onStatusChange,
  callLog,
}: { 
  orderId: string; 
  status: string; 
  isOpen: boolean; 
  onToggle: (open: boolean) => void;
  onStatusChange: (status: string) => void;
  callLog?: CallLog[];
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

  const statusConfig = STATUS_CONFIG[status as OrderStatus];
  const statusLabel = STATUS_LABELS[status as OrderStatus];

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="flex flex-row items-center justify-between">
        <button
          onClick={() => onToggle(!isOpen)}
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
        
        {/* Call Log Slots */}
        {callLog && callLog.length > -1 && (
          <CallSlotsHover callLog={callLog} />
        )}
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full -mt-8 -left-1 z-[9999] min-w-[180px] bg-[var(--system-50)] border border-[var(--system-100)] rounded-[14px] overflow-hidden p-1"
          >
            {statuses.map((s) => {
              const sConfig = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => {
                    onStatusChange(s);
                    onToggle(false);
                  }}
                  className={`w-full p-1 text-start flex items-center gap-2 rounded-[12px] cursor-pointer hover:bg-black/5 transition-opacity ${
                    status === s ? "bg-black/0" : ""
                  }`}
                >
                  <span 
                    className="overflow-hidden inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-[10px] shadow-[var(--shadow-badge)]"
                    style={{ 
                      backgroundColor: sConfig?.bgColor || '#6b728015',
                      color: sConfig?.textColor || '#ffffff01',
                    }}
                  >
                    {sConfig?.icon}
                    {sConfig?.label || s}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
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
  
  // Date filter state
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [activeDateFilter, setActiveDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const dateFilterRef = useRef<HTMLDivElement>(null);
  
  // Settings dropdown state
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);
  
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

  // Handle click outside date filter dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dateFilterRef.current && !dateFilterRef.current.contains(event.target as Node)) {
        setDateFilterOpen(false);
      }
    }
    
    if (dateFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dateFilterOpen]);

  // Handle click outside settings dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target as Node)) {
        setSettingsDropdownOpen(false);
      }
    }
    
    if (settingsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [settingsDropdownOpen]);

  const filteredOrders = useMemo(() => {
    let filtered = [...orders];
    
    // Filter by hidden statuses
    filtered = filtered.filter(order => !hiddenStatuses.has(order.status as OrderStatus));
    
    // Filter by date
    const now = Date.now();
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
  }, [orders, searchQuery, sortField, sortDirection, activeFilter, currentTime, hiddenStatuses, activeDateFilter]);

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
            <button
              className="ml-2 cursor-pointer p-2 rounded-lg transition-colors text-red-500 hover:bg-red-500/20"
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
          <SubtleTabItem index={1} icon={KanbanIcon as unknown as LucideIcon} label="By State" />
        </SubtleTab>
        
        <div className="flex items-center gap-1">
        
        {/* Date Filter Dropdown */}
        <div className="relative" ref={dateFilterRef}>
          <button
            onClick={() => setDateFilterOpen(!dateFilterOpen)}
            className={`cursor-pointer h-8 px-3 rounded-lg transition-colors flex items-center gap-2 text-sm ${
              activeDateFilter !== "all"
                ? "bg-[var(--blue-300)]/20 text-[var(--blue-300)]"
                : "text-[var(--system-300)] hover:text-[var(--system-600)] hover:bg-[var(--system-100)]"
            }`}
          >
            <span>
              {activeDateFilter === "all" ? "All" : 
               activeDateFilter === "today" ? "Today" :
               activeDateFilter === "week" ? "Last Week" : "This Month"}
            </span>
            <ChevronsUpDown className="w-4 h-4" /> 
          </button>
          
          {dateFilterOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full -mt-8 -right-1 z-[9999] min-w-[180px] bg-[var(--system-50)] border border-[var(--system-100)] rounded-[14px] overflow-hidden p-1"
            >
              <div className="px-3 py-2 label-xs text-[var(--system-400)]">Filter By Date</div>
              {[
                { id: "all", label: "All" },
                { id: "today", label: "Today (24h)" },
                { id: "week", label: "This Week (7 days)" },
                { id: "month", label: "This Month" },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setActiveDateFilter(option.id as typeof activeDateFilter);
                    setDateFilterOpen(false);
                  }}
                  className={`w-full py-1.5 px-3 justify-between text-start flex items-center gap-2 rounded-[12px] cursor-pointer hover:bg-black/5 transition-opacity ${
                    activeDateFilter === option.id ? "bg-black/5" : ""
                  }`}
                >
                  <span className="text-[var(--system-600)]">{option.label}</span>
                  {activeDateFilter === option.id && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Filter Dropdown */}
        <div className="relative" ref={filterDropdownRef}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                className={`cursor-pointer p-2 rounded-lg transition-colors ${
                  activeFilter !== "all"
                    ? "bg-[var(--blue-300)]/20 text-[var(--blue-300)]"
                    : "text-[var(--system-300)] hover:text-[var(--system-600)] hover:bg-[var(--system-100)]"
                }`}
              >
                <Filter className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Filter by status</TooltipContent>
          </Tooltip>
          
          {filterDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full -mt-8 -right-1 z-[9999] min-w-[200px] bg-[var(--system-50)] border border-[var(--system-100)] rounded-[14px] overflow-hidden p-1"
            >
              <div className="px-3 py-2 label-xs text-[var(--system-400)]">Filter By State</div>
              {statuses.map((status) => {
                const sConfig = STATUS_CONFIG[status];
                const count = orders.filter(o => o.status === status).length;
                const isHidden = hiddenStatuses.has(status);
                
                return (
                  <div key={status} className="flex items-center ">
                    <button
                      onClick={() => {
                        setFilterDropdownOpen(false);
                      }}
                      className={`flex-1 px-3 py-1 text-start body-base flex items-center justify-between transition-colors ${
                        activeFilter === status ? "bg-[#f5f5f5]" : ""
                      }`}
                    >
                      <span 
                        className="overflow-hidden rounded-[8px] inline-flex items-center gap-1.5 px-2 py-1 label-xs shadow-[var(--shadow-badge)]"
                        style={{ 
                          backgroundColor: sConfig?.bgColor || '#6b7280',
                          color: sConfig?.textColor || '#ffffff',
                        }}
                      >
                        {sConfig?.icon}
                        {sConfig?.label || status}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="label-xs text-[var(--system-400)]">{count}</span>
                        {activeFilter === status && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                    {/* Eye toggle button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleHiddenStatus(status);
                      }}
                      className="cursor-pointer p-2 hover:bg-[var(--system-100)] transition-colors rounded-[8px]"
                      title={isHidden ? "Show this state" : "Hide this state"}
                    >
                      {isHidden ? (
                        <EyeOff className="w-4 h-4 text-[var(--system-400)]" />
                      ) : (
                        <Eye className="w-4 h-4 text-[var(--system-400)]" />
                      )}
                    </button>
                  </div>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="relative" ref={sortDropdownRef}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className={`cursor-pointer p-2 rounded-lg transition-colors ${
                  sortField !== "date" || sortDirection !== "desc"
                    ? "bg-[var(--blue-300)]/20 text-[var(--blue-300)]"
                    : "text-[var(--system-300)] hover:text-[var(--system-600)] hover:bg-[var(--system-100)]"
                }`}
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Sort orders</TooltipContent>
          </Tooltip>
          
          {sortDropdownOpen && (
            <div className="absolute top-full -mt-8 -right-1 z-[9999] min-w-[200px] bg-[var(--system-50)] border border-[var(--system-100)] rounded-[14px] overflow-hidden p-1">
              <div className="px-3 py-2 label-xs text-[var(--system-400)]">Sort By</div>
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
                  className={`w-full py-1 px-2 justify-between text-start flex items-center gap-2 rounded-[12px] cursor-pointer hover:bg-black/5 transition-opacity ${
                    sortField === option.id && 
                    ((option.id === "date" && sortDirection === (option.direction as SortDirection)) ||
                     (option.id === "total" && sortDirection === (option.direction as SortDirection)))
                      ? "bg-black/5" : ""
                  }`}
                >
                  <span className="text-[var(--system-600)]">{option.label}</span>
                  {sortField === option.id && sortDirection === option.direction && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

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

        {/*Integration (Placeholder) */}
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

        {/* Settings Dropdown (Placeholder) */}
        <div className="relative" ref={settingsDropdownRef}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setSettingsDropdownOpen(!settingsDropdownOpen)}
                className="cursor-pointer p-2 text-[var(--system-300)] hover:text-[var(--system-600)] hover:bg-[var(--system-100)] rounded-lg transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>More</TooltipContent>
          </Tooltip>
          
          {settingsDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full -mt-8 -right-1 z-[9999] min-w-[180px] bg-[var(--system-50)] border border-[var(--system-100)] rounded-[14px] overflow-hidden p-1"
            >
              <button
                onClick={() => setSettingsDropdownOpen(false)}
                className="w-full py-2 px-3 text-start flex items-center gap-2 rounded-[12px] cursor-pointer hover:bg-black/5 transition-colors"
              >
                <EyeOff className="w-4 h-4 text-[var(--system-400)]" />
                <span className="text-[var(--system-600)]">Black List</span>
              </button>
              <button
                onClick={() => setSettingsDropdownOpen(false)}
                className="w-full py-2 px-3 text-start flex items-center gap-2 rounded-[12px] cursor-pointer hover:bg-black/5 transition-colors"
              >
                <ArrowRightLeft className="w-4 h-4 text-[var(--system-400)]" />
                <span className="text-[var(--system-600)]">Delivery Costs</span>
              </button>
            </motion.div>
          )}
        </div>

        
        </div>
      </div>

      {/* Table */}
      <div className="overflow-visible">
        <Table className="table-fixed">
          <colgroup>
            <col style={{ width: "48px" }} />
            <col style={{ width: "25%" }} />
            <col style={{ width: "16.7%" }} />
            <col style={{ width: "16.7%" }} />
            <col style={{ width: "16.7%" }} />
            <col style={{ width: "16.7%" }} />
          </colgroup>
          <TableHeader>
            <tr className="bg-[var(--system-100)] rounded-[12px]">
              <th className="rounded-l-[12px] px-3 py-[10px] text-left">
                <Checkbox
                  checked={selectAll}
                  onChange={(checked) => handleSelectAll(checked === true)}
                  className="cursor-pointer w-4 h-4 rounded bg-[var(--system-200)] data-[checked]:bg-[var(--blue-300)] hover:border-[var(--system-400)]"
                >
                  <CheckboxIndicator className="text-white w-3 h-3" />
                </Checkbox>
              </th>
              <th className="px-3 py-[10px] text-left body-base text-[var(--system-600)]">Customer</th>
              <th className="px-3 py-[10px] text-left body-base text-[var(--system-600)]">Product</th>
              <th className="px-3 py-[10px] text-left body-base text-[var(--system-600)]">State</th>
              <th className="px-3 py-[10px] text-left body-base text-[var(--system-600)]">Total</th>
              <th className="rounded-r-[12px] px-3 py-[10px] text-left body-base text-[var(--system-600)]">Date</th>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order, index) => (
              <TableRow
                key={order._id}
                index={index}
                className={`cursor-pointer ${
                  selectedOrders.has(order._id) ? "bg-[var(--system-100)]" : ""
                }`}
                onClick={() => onOrderClick(order)}
              >
                <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedOrders.has(order._id)}
                    onChange={() => onOrderSelect(order._id)}
                    className="cursor-pointer w-4 h-4 rounded bg-[var(--system-200)]/40 hover:bg-[var(--system-200)] data-[checked]:bg-[var(--blue-300)] data-[checked]:border-[var(--blue-300)]"
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
                    orderId={order._id}
                    status={order.status}
                    isOpen={!!statusDropdownOpen[order._id]}
                    onToggle={(open) => onStatusDropdownToggle(order._id, open)}
                    onStatusChange={(newStatus) => onStatusChange(order._id, newStatus)}
                    callLog={(order.callLog as CallLog[]) || []}
                  />
                </TableCell>
                <TableCell className="py-3 body-base text-[var(--system-600)]">
                  {formatPrice(order.total)}
                </TableCell>
                <TableCell className="py-3 body-base text-[var(--system-300)]">
                  {getRelativeTime(order.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

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
