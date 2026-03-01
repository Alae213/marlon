"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

const FREE_ORDER_LIMIT = 30;
const TRIAL_DAYS = 14;

export function BillingProvider({ 
  children, 
  initialStatus = "trial",
  initialOrderCount = 0,
  trialEndsAt 
}: { 
  children: ReactNode;
  initialStatus?: StoreStatus;
  initialOrderCount?: number;
  trialEndsAt?: number;
}) {
  const [storeStatus, setStoreStatus] = useState<StoreStatus>(initialStatus);
  const [orderCount, setOrderCount] = useState(initialOrderCount);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const daysRemaining = trialEndsAt 
    ? Math.max(0, Math.ceil((trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

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
