"use client";

import { Lock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBilling } from "@/contexts/billing-context";

interface LockedOverlayProps {
  children: React.ReactNode;
  showOverlay?: boolean;
}

export function LockedOverlay({ children, showOverlay = true }: LockedOverlayProps) {
  const { isLocked, openPaymentModal, billingState, todayOrderCount, maxDailyOrders, daysRemaining, compatibilityMode } = useBilling();

  if (!isLocked || !showOverlay) {
    return <>{children}</>;
  }

  const isCanonical = compatibilityMode === "canonical";
  const isTrialExpired = !isCanonical && billingState === "unlock_pending" && daysRemaining !== null && daysRemaining <= 0;
  const displayMaxOrders = isCanonical ? maxDailyOrders : 50;
  const priceDzd = 2000;

  return (
    <div className="relative">
      <div className="filter blur-sm pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-4 z-[var(--z-overlay)]">
        <div className="bg-[var(--system-50)] dark:bg-[var(--system-800)] rounded-3xl border border-[var(--system-200)] dark:border-[var(--system-700)] p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-[var(--color-error-bg)] rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-[var(--color-error)]" />
          </div>
          
          <h2 className="text-xl font-bold text-[var(--system-700)] dark:text-[var(--system-100)] mb-2">
            {isCanonical 
              ? "Daily limit reached"
              : isTrialExpired 
                ? "Trial expired"
                : "Limit reached"
            }
          </h2>
          
          <p className="text-[var(--system-500)] dark:text-[var(--system-300)] mb-6">
            {isCanonical 
              ? `You've used ${todayOrderCount} of ${maxDailyOrders} free orders today. Subscribe to continue.`
              : isTrialExpired 
                ? "Your free trial has ended. Subscribe to continue."
                : `You've used ${todayOrderCount} of ${displayMaxOrders} free orders. Subscribe to continue.`
            }
          </p>

          <div className="bg-[var(--system-100)] dark:bg-[var(--system-700)] rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-[#00853f]">
              <CreditCard className="w-5 h-5" />
              <span className="font-medium">{isCanonical ? "Monthly" : "Annual"}</span>
            </div>
            <p className="text-3xl font-bold text-[var(--system-700)] dark:text-[var(--system-100)] mt-2">
              {priceDzd.toLocaleString()} <span className="text-sm font-normal text-[var(--system-400)]">DZD</span>
            </p>
            <p className="text-sm text-[var(--system-400)] mt-1">
              {isCanonical ? "per month" : "instead of 19,800 DZD"}
            </p>
          </div>

          <Button onClick={openPaymentModal} className="w-full" size="lg">
            Subscribe now
          </Button>
          
          <p className="text-xs text-[var(--system-400)] mt-4">
            Secure payment via Chargily
          </p>
        </div>
      </div>
    </div>
  );
}

interface LockedDataProps {
  children: React.ReactNode;
  fallback?: string;
}

export function LockedData({ children, fallback = "***" }: LockedDataProps) {
  const { isLocked, isOverflow, compatibilityMode } = useBilling();

  if (compatibilityMode === "canonical" && isOverflow) {
    return <span className="select-none">{fallback}</span>;
  }

  if (isLocked) {
    return <span className="select-none">{fallback}</span>;
  }

  return <>{children}</>;
}

export function LockedButton({ children }: { children: React.ReactNode }) {
  const { isLocked, isOverflow, compatibilityMode } = useBilling();

  if (compatibilityMode === "canonical" && isOverflow) {
    return null;
  }

  if (isLocked) {
    return null;
  }

  return <>{children}</>;
}