"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getStoreBySlug } from "@/lib/locked-store-cleanup";

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
  initialStatus = "trial",
  initialOrderCount = 0,
  trialEndsAt,
  storeSlug
}: { 
  children: ReactNode;
  initialStatus?: StoreStatus;
  initialOrderCount?: number;
  trialEndsAt?: number;
  storeSlug?: string;
}) {
  const [storeStatus, setStoreStatus] = useState<StoreStatus>(initialStatus);
  const [orderCount, setOrderCount] = useState(initialOrderCount);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  // Load store data from localStorage
  useEffect(() => {
    if (storeSlug) {
      const savedStore = localStorage.getItem(`marlon_stores_${storeSlug}`);
      if (savedStore) {
        const store = JSON.parse(savedStore);
        if (store.subscription) {
          setStoreStatus(store.subscription);
        }
        if (store.orderCount !== undefined) {
          setOrderCount(store.orderCount);
        }
      }
    }
  }, [storeSlug]);

  // Calculate days remaining based on firstOrderAt for trial stores
  const savedStore = storeSlug ? localStorage.getItem(`marlon_stores_${storeSlug}`) : null;
  let daysRemaining: number | null = null;
  
  if (savedStore) {
    const store = JSON.parse(savedStore);
    if (store.firstOrderAt && store.subscription === "trial") {
      const trialEndTime = store.firstOrderAt + (TRIAL_DAYS * 24 * 60 * 60 * 1000);
      daysRemaining = Math.max(0, Math.ceil((trialEndTime - Date.now()) / (1000 * 60 * 60 * 24)));
    }
  } else if (trialEndsAt) {
    daysRemaining = trialEndsAt 
      ? Math.max(0, Math.ceil((trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;
  }

  // Lock condition per PRD:
  // - Store is locked when subscription = 'locked' explicitly
  // - OR trial window has expired (30 days passed)
  // - OR order count exceeds 50 in trial window
  const isLocked = storeStatus === "locked" || 
    (storeStatus === "trial" && daysRemaining !== null && daysRemaining <= 0) ||
    (storeStatus === "trial" && orderCount >= FREE_ORDER_LIMIT);

  useEffect(() => {
    if (initialStatus === "trial" && trialEndsAt) {
      if (trialEndsAt < Date.now()) {
        setStoreStatus("locked");
      }
    }
  }, [initialStatus, trialEndsAt]);

  const openPaymentModal = () => setIsPaymentModalOpen(true);
  const closePaymentModal = () => setIsPaymentModalOpen(false);

  return (
    <BillingContext.Provider
      value={{
        storeStatus,
        orderCount,
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
