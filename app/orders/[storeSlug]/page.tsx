"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { Loader2 } from "lucide-react";
import { BottomNavigation } from "@/components/core/bottom-navigation";
import { AnimatedTabContent } from "@/components/core/animated-tabs";
import { useBilling, BillingProvider } from "@/contexts/billing-context";
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
import { ListView, KanbanView, OrderDetails } from "@/components/order-page";

function OrdersContent({
  storeId,
  storeSlug,
}: {
  storeId: string;
  storeSlug: string;
}) {
  const { user, isLoaded } = useUser();
  useBilling();

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
  const addAdminNoteMutation = useMutation(api.orders.addAdminNote);

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

  const handleAddAdminNote = useCallback(
    async (orderId: string, text: string) => {
      try {
        await addAdminNoteMutation({
          orderId: orderId as Id<"orders">,
          text,
        });

        // Update local state if this is the selected order
        if (selectedOrder?._id === orderId) {
          setSelectedOrder({
            ...selectedOrder,
            adminNotes: [
              ...(selectedOrder.adminNotes || []),
              {
                id: crypto.randomUUID(),
                text,
                timestamp: Date.now(),
                merchantId: user?.id || "unknown",
              },
            ],
          });
        }
      } catch (error) {
        console.error("Failed to add admin note:", error);
      }
    },
    [selectedOrder, user, addAdminNoteMutation],
  );

  if (!isLoaded) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[var(--system-50)]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--system-600)]" />
      </div>
    );
  }

  const ordersData = orders || [];
  const newOrdersCount = ordersData.filter((o) => o.status === "new").length;

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

  return (
    <div className="h-screen w-full bg-[var(--system-50)]">
       {/* Header */}
      <div className="sticky top-0 px-[12px] w-full flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center">
            <Image src="/Logo-text.svg" alt="Marlon Logo" width={118} height={36} className="h-[10px] w-auto" />
          </Link>
        </div>
        <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
      </div>
      <div className="max-w-6xl mx-auto h-full">
        

        {/* Page Title */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="headline-2xl">My Orders</h1>
          </div>
        </div>

        {/* Content based on view mode */}
        <AnimatedTabContent active={viewMode === "list"}>
          <ListView
            orders={ordersData}
            selectedOrders={selectedOrders}
            selectAll={selectAll}
            onSelectAll={handleSelectAll}
            onOrderSelect={handleOrderSelect}
            onClearSelection={handleClearSelection}
            onStatusChange={handleStatusChange}
            onStatusDropdownToggle={handleStatusDropdownToggle}
            statusDropdownOpen={statusDropdownOpen}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            isSearchOpen={isSearchOpen}
            onSearchOpenChange={setIsSearchOpen}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onSortDirectionChange={setSortDirection}
            onOrderClick={setSelectedOrder}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </AnimatedTabContent>

        <AnimatedTabContent active={viewMode === "state"}>
          <KanbanView viewMode={viewMode} onViewModeChange={setViewMode} />
        </AnimatedTabContent>

        {/* Order Detail SlideOver */}
        <OrderDetails
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
          onAddCallLog={handleAddCallLog}
          onAddAdminNote={handleAddAdminNote}
        />

        <BottomNavigation storeSlug={storeSlug} currentPage="orders" />
      </div>
    </div>
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
        <Loader2 className="w-6 h-6 animate-spin text-[#171717] dark:text-[#fafafa]" />
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] p-12 text-center">
          <p className="text-[#737373]">Store not found</p>
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
