"use client";

import { createContext, useContext, useState, useMemo, ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type BillingState = "active" | "overflow_locked" | "unlock_pending" | "archived";

interface BillingContextType {
  billingState: BillingState;
  todayOrderCount: number;
  maxDailyOrders: number;
  ordersRemaining: number;
  daysRemaining: number | null;
  isLocked: boolean;
  isOverflow: boolean;
  compatibilityMode: "legacy_trial" | "canonical";
  openPaymentModal: () => void;
  closePaymentModal: () => void;
  isPaymentModalOpen: boolean;
  storeId?: Id<"stores">;
  storeSlug?: string;
  priceDzd: number;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

const CANONICAL_MAX_DAILY_ORDERS = 5;
const CANONICAL_PRICE_DZD = 2000;

export function BillingProvider({ 
  children, 
  storeSlug,
  storeId
}: { 
  children: ReactNode;
  storeSlug?: string;
  storeId?: Id<"stores">;
}) {
  const canonicalStatus = useQuery(
    api.canonicalBilling.getStoreBillingStatusCanonical,
    storeId ? { storeId } : "skip"
  );

  const legacyStore = useQuery(
    api.stores.getStore,
    storeId ? { storeId } : "skip"
  );

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const contextValue = useMemo(() => {
    if (canonicalStatus && storeId) {
      return {
        billingState: canonicalStatus.billingState,
        todayOrderCount: canonicalStatus.todayOrderCount,
        maxDailyOrders: canonicalStatus.maxDailyOrders,
        ordersRemaining: canonicalStatus.ordersRemaining,
        daysRemaining: canonicalStatus.daysRemaining,
        isLocked: canonicalStatus.isLocked,
        isOverflow: canonicalStatus.isOverflow,
        compatibilityMode: canonicalStatus.compatibilityMode,
        openPaymentModal: () => setIsPaymentModalOpen(true),
        closePaymentModal: () => setIsPaymentModalOpen(false),
        isPaymentModalOpen,
        storeId,
        storeSlug,
        priceDzd: canonicalStatus.priceDzd,
      };
    }

    const now = Date.now();
    const subscription = (legacyStore?.subscription as string) || "trial";
    const orderCount = legacyStore?.orderCount ?? 0;
    const firstOrderAt = legacyStore?.firstOrderAt;
    const paidUntil = legacyStore?.paidUntil;

    let daysRemaining: number | null = null;
    if (firstOrderAt) {
      const trialEndTime = firstOrderAt + (30 * 24 * 60 * 60 * 1000);
      daysRemaining = Math.max(0, Math.ceil((trialEndTime - now) / (1000 * 60 * 60 * 24)));
    } else if (paidUntil && subscription === "active") {
      daysRemaining = Math.max(0, Math.ceil((paidUntil - now) / (1000 * 60 * 60 * 24)));
    }

    const isLocked = subscription === "locked" || 
      (subscription === "trial" && daysRemaining !== null && daysRemaining <= 0) ||
      (subscription === "trial" && orderCount >= CANONICAL_MAX_DAILY_ORDERS);

    const legacyBillingState: BillingState = subscription === "locked" 
      ? "overflow_locked" 
      : subscription === "active" 
        ? "active" 
        : "unlock_pending";

    return {
      billingState: legacyBillingState,
      todayOrderCount: orderCount,
      maxDailyOrders: CANONICAL_MAX_DAILY_ORDERS,
      ordersRemaining: Math.max(0, CANONICAL_MAX_DAILY_ORDERS - orderCount),
      daysRemaining,
      isLocked,
      isOverflow: false,
      compatibilityMode: "legacy_trial" as const,
      openPaymentModal: () => setIsPaymentModalOpen(true),
      closePaymentModal: () => setIsPaymentModalOpen(false),
      isPaymentModalOpen,
      storeId,
      storeSlug,
      priceDzd: CANONICAL_PRICE_DZD,
    };
  }, [canonicalStatus, legacyStore, storeId, storeSlug, isPaymentModalOpen]);

  return (
    <BillingContext.Provider value={contextValue}>
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
