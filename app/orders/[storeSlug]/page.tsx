"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { Loader2 } from "lucide-react";
import { BottomNavigation } from "@/components/primitives/core/layout/bottom-navigation";
import { OrdersSurface } from "@/components/pages/orders/components/OrdersSurface";
import { useBilling, BillingProvider } from "@/contexts/billing-context";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import {
  useUser,
  UserButton,
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import type { SortField, SortDirection, CallLog } from "@/lib/orders-types";
import { RealtimeProvider } from "@/contexts/realtime-context";
import { OrderDetails } from "@/components/pages/orders/views";

const ORDER_STATE_VIEW_ENABLED = false;

function OrdersContent({
  storeId,
  storeSlug,
}: {
  storeId: string;
  storeSlug: string;
}) {
  const { user, isLoaded } = useUser();
  const { 
    todayOrderCount, 
    maxDailyOrders, 
    ordersRemaining,
    isLocked,
    isOverflow,
  } = useBilling();

  // View mode state
  const [viewMode, setViewMode] = useState<"list" | "state">("list");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Filter state
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Selection state
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Status dropdown state
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<{
    [key: string]: boolean;
  }>({});

  const [selectedOrder, setSelectedOrder] = useState<Doc<"orders"> | null>(
    null,
  );

  const orders = useQuery(
    api.orders.getOrders,
    storeId && isLoaded ? { storeId: storeId as Id<"stores"> } : "skip",
  );

  const updateOrderStatus = useMutation(api.orders.updateOrderStatus);
  const addCallLogMutation = useMutation(api.orders.addCallLog);
  const upsertAdminNoteMutation = useMutation(api.orders.upsertAdminNote);

  const handleStatusChange = useCallback(
    async (orderId: string, newStatus: string) => {
      try {
        await updateOrderStatus({
          orderId: orderId as Id<"orders">,
          status: newStatus,
        });

        // Update local state if selected
        if (selectedOrder?._id === orderId) {
          setSelectedOrder({
            ...selectedOrder,
            status: newStatus,
            updatedAt: Date.now(),
          });
        }
      } catch (error) {
        console.error("Failed to update status:", error);
      }
    },
    [selectedOrder, updateOrderStatus],
  );

  const handleAddCallLog = useCallback(
    async (orderId: string, outcome: CallLog["outcome"], notes?: string) => {
      try {
        await addCallLogMutation({
          orderId: orderId as Id<"orders">,
          outcome,
          notes,
        });

        // Update local state if this is the selected order
        if (selectedOrder?._id === orderId) {
          setSelectedOrder({
            ...selectedOrder,
            callLog: [
              ...(selectedOrder.callLog || []),
              {
                id: `call_${Date.now()}`,
                timestamp: Date.now(),
                outcome: outcome as CallLog["outcome"],
                notes,
              },
            ],
          });
        }
      } catch (error) {
        console.error("Failed to add call log:", error);
      }
    },
    [selectedOrder, addCallLogMutation],
  );

  const handleUpsertAdminNote = useCallback(
    async (orderId: string, text: string) => {
      try {
        await upsertAdminNoteMutation({
          orderId: orderId as Id<"orders">,
          text,
        });

        // Update local state if this is the selected order
        if (selectedOrder?._id === orderId) {
          const trimmed = text.trim();
          setSelectedOrder({
            ...selectedOrder,
            adminNoteText: trimmed,
            adminNoteUpdatedAt: Date.now(),
            adminNoteUpdatedBy: user?.id || "unknown",
          });
        }
      } catch (error) {
        console.error("Failed to add admin note:", error);
      }
    },
    [selectedOrder, user, upsertAdminNoteMutation],
  );

  const isOrdersLoading = orders === undefined;
  const ordersData = orders ?? [];

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleOrderSelect = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
    setSelectAll(newSelected.size === ordersData.length);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedOrders(new Set(ordersData.map((o) => o._id)));
    } else {
      setSelectedOrders(new Set());
    }
  };

  const handleStatusDropdownToggle = (orderId: string, open: boolean) => {
    setStatusDropdownOpen((prev) => ({ ...prev, [orderId]: open }));
  };

  const handleClearSelection = () => {
    setSelectedOrders(new Set());
    setSelectAll(false);
  };

  const handleViewModeChange = useCallback((nextMode: "list" | "state") => {
    if (nextMode === "state" && !ORDER_STATE_VIEW_ENABLED) {
      return;
    }

    setViewMode(nextMode);
  }, []);

  const usagePercentage = Math.min((todayOrderCount / maxDailyOrders) * 100, 100);
  const isAtLimit = isLocked || isOverflow;
  const activeViewMode = ORDER_STATE_VIEW_ENABLED ? viewMode : "list";

  // Calculate time until midnight Algeria time (UTC+1)
  const getTimeUntilReset = () => {
    const now = new Date();
    const algiersOffset = 1 * 60 * 60 * 1000; // UTC+1
    
    // Get current Algeria time
    const nowAlgiers = new Date(now.getTime() + algiersOffset);
    const currentHour = nowAlgiers.getHours();
    const currentMinute = nowAlgiers.getMinutes();
    
    // Calculate minutes until midnight Algeria (24:00 = 0:00 next day)
    const minutesUntilMidnight = (24 - currentHour) * 60 - currentMinute;
    
    const hours = Math.floor(minutesUntilMidnight / 60);
    const minutes = minutesUntilMidnight % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (!isLoaded) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[var(--system-50)]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--system-600)]" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-screen w-full bg-[var(--system-50)]">
       {/* Header */}
      <div className="sticky top-0 z-20 w-full bg-[var(--system-50)] px-[12px] py-3">
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center">
            <Image src="/Logo-text.svg" alt="Marlon Logo" width={118} height={36} className="h-[10px] w-auto" />
          </Link>
        </div>
        
        {/* Usage Progress Bar + User Avatar */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-[var(--system-100)] rounded-full px-3 py-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                  <div className="w-16 h-2 bg-[var(--system-200)] rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        isAtLimit 
                          ? "bg-red-500" 
                          : usagePercentage > 80 
                            ? "bg-amber-500" 
                            : "bg-[#00853f]"
                      }`}
                      style={{ width: `${usagePercentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-[var(--system-600)]">
                    {todayOrderCount}/{maxDailyOrders}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {isAtLimit ? "Daily limit reached" : `Resets ${getTimeUntilReset()} left`}
              </TooltipContent>
            </Tooltip>
          </div>
          <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
        </div>
      </div>
        <div className="mt-3 sm:hidden">
          <div className="rounded-full border border-[var(--system-200)] bg-white px-3 py-2 shadow-[var(--shadow-sm)]">
            <div className="mb-2 flex items-center justify-between gap-3 text-caption">
              <span className="font-medium text-[var(--system-600)]">
                {isAtLimit ? "Limit reached" : `Resets ${getTimeUntilReset()} left`}
              </span>
              <span className={isAtLimit ? "text-[var(--color-error)]" : "text-[var(--system-400)]"}>
                {todayOrderCount}/{maxDailyOrders}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--system-200)]">
              <div
                className={`h-full rounded-full transition-all ${
                  isAtLimit
                    ? "bg-red-500"
                    : usagePercentage > 80
                      ? "bg-amber-500"
                      : "bg-[#00853f]"
                }`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto h-full max-w-6xl px-3 pb-28 sm:px-4 sm:pb-32">
        

        {/* Page Title */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-modal text-bold">My Orders</h1>
          </div>
        </div>

        {/* Content based on view mode */}
        <OrdersSurface
          isOrdersLoading={isOrdersLoading}
          viewMode={activeViewMode}
          onViewModeChange={handleViewModeChange}
          isStateViewEnabled={ORDER_STATE_VIEW_ENABLED}
          listViewProps={{
            orders: ordersData,
            selectedOrders,
            selectAll,
            onSelectAll: handleSelectAll,
            onOrderSelect: handleOrderSelect,
            onClearSelection: handleClearSelection,
            onStatusChange: handleStatusChange,
            onStatusDropdownToggle: handleStatusDropdownToggle,
            statusDropdownOpen,
            searchQuery,
            onSearchQueryChange: setSearchQuery,
            isSearchOpen,
            onSearchOpenChange: setIsSearchOpen,
            sortField,
            sortDirection,
            onSort: handleSort,
            onSortDirectionChange: setSortDirection,
            onOrderClick: setSelectedOrder,
            storeSlug,
          }}
        />

        {/* Order Detail SlideOver */}
        <OrderDetails
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
          onAddCallLog={handleAddCallLog}
          onUpsertAdminNote={handleUpsertAdminNote}
          storeSlug={storeSlug}
        />

        <BottomNavigation storeSlug={storeSlug} currentPage="orders" />
      </div>
      </div>
    </TooltipProvider>
  );
}

export default function OrdersPage() {
  const params = useParams();
  const storeSlug = params?.storeSlug as string;

  const store = useQuery(
    api.stores.getStoreBySlug,
    storeSlug ? { slug: storeSlug } : "skip",
  );

  const storeId = store?._id as Id<"stores"> | undefined;

  if (!store && storeSlug) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-[--system-gray-900]" />
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-[--system-gray-6] border border-[--system-gray-4] p-12 text-center">
          <p className="text-[--system-gray-600]">Store not found</p>
        </div>
      </div>
    );
  }

  return (
    <BillingProvider storeSlug={storeSlug} storeId={storeId}>
      <RealtimeProvider storeId={storeId}>
        <SignedIn>
          <OrdersContent storeId={storeId} storeSlug={storeSlug} />
        </SignedIn>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </RealtimeProvider>
    </BillingProvider>
  );
}
