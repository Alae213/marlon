"use client";

import { createContext, useContext, useState, useMemo, ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type StoreStatus = "trial" | "active" | "locked";

interface BillingContextType {
  storeStatus: StoreStatus;
  orderCount: number;
  orderLimit: number;
  daysRemaining: number | null;
  isLocked: boolean;
  openPaymentModal: () => void;
  closePaymentModal: () => void;
  isPaymentModalOpen: boolean;
  storeSlug?: string;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

const FREE_ORDER_LIMIT = 50; // PRD specifies 50 orders before lock
const TRIAL_DAYS = 30; // PRD specifies 30-day rolling window

export function BillingProvider({ 
  children, 
  storeSlug,
  storeId
}: { 
  children: ReactNode;
  storeSlug?: string;
  storeId?: Id<"stores">;
}) {
  // Fetch store data from Convex
  const store = useQuery(
    api.stores.getStore,
    storeId ? { storeId } : "skip"
  );

  // Use store values directly; fall back to defaults when store is not yet loaded
  const storeStatus = (store?.subscription as StoreStatus) || "trial";
  const currentOrderCount = store?.orderCount ?? 0;
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Calculate days remaining based on firstOrderAt for trial stores
  const now = useState(() => Date.now())[0];
  
  const daysRemaining = useMemo(() => {
    let result: number | null = null;
    
    if (store?.firstOrderAt && store.subscription === "trial") {
      const trialEndTime = store.firstOrderAt + (TRIAL_DAYS * 24 * 60 * 60 * 1000);
      result = Math.max(0, Math.ceil((trialEndTime - now) / (1000 * 60 * 60 * 24)));
    } else if (store?.paidUntil && store.subscription === "active") {
      result = Math.max(0, Math.ceil((store.paidUntil - now) / (1000 * 60 * 60 * 24)));
    }
    
    return result;
  }, [store?.firstOrderAt, store?.paidUntil, store?.subscription, now]);

  // Lock condition per PRD:
  // - Store is locked when subscription = 'locked' explicitly
  // - OR trial window has expired (30 days passed)
  // - OR order count exceeds 50 in trial window
  const isLocked = storeStatus === "locked" || 
    (storeStatus === "trial" && daysRemaining !== null && daysRemaining <= 0) ||
    (storeStatus === "trial" && currentOrderCount >= FREE_ORDER_LIMIT);

  const openPaymentModal = () => setIsPaymentModalOpen(true);
  const closePaymentModal = () => setIsPaymentModalOpen(false);

  return (
    <BillingContext.Provider
      value={{
        storeStatus,
        orderCount: currentOrderCount,
        orderLimit: FREE_ORDER_LIMIT,
        daysRemaining,
        isLocked,
        openPaymentModal,
        closePaymentModal,
        isPaymentModalOpen,
        storeSlug,
      }}
    >
      {children}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error("useBilling must be used within a BillingProvider");
  }
  return context;
}
