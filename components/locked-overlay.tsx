"use client";

import { Lock, CreditCard, X } from "lucide-react";
import { Button } from "@/components/core";
import { useBilling } from "@/contexts/billing-context";

interface LockedOverlayProps {
  children: React.ReactNode;
  showOverlay?: boolean;
}

export function LockedOverlay({ children, showOverlay = true }: LockedOverlayProps) {
  const { isLocked, openPaymentModal, storeStatus, orderCount, orderLimit, daysRemaining } = useBilling();

  if (!isLocked || !showOverlay) {
    return <>{children}</>;
  }

  const isTrialExpired = storeStatus === "trial" && daysRemaining !== null && daysRemaining <= 0;
  const isOrderLimitReached = storeStatus === "trial" && orderCount >= orderLimit;

  return (
    <div className="relative">
      <div className="filter blur-sm pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            {isTrialExpired ? "انتهت فترة التجربة" : "تم reached الحد الأقصى"}
          </h2>
          
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            {isTrialExpired 
              ? `انتهت فترة التجربة المجانية. يرجى الاشتراك للاستمرار في استخدام الخدمة.`
              : `لقد استخدمت ${orderCount} طلب من ${orderLimit} طلب مجانية. يرجى الاشتراك للاستمرار.`
            }
          </p>

          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-[#00853f]">
              <CreditCard className="w-5 h-5" />
              <span className="font-medium">اشتراك سنوي</span>
            </div>
            <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mt-2">
              9,900 <span className="text-sm font-normal text-zinc-500">د.ج</span>
            </p>
            <p className="text-sm text-zinc-500 mt-1">
              بدلاً من 19,800 د.ج
            </p>
          </div>

          <Button onClick={openPaymentModal} className="w-full" size="lg">
            اشتراك الآن
          </Button>
          
          <p className="text-xs text-zinc-400 mt-4">
           الدفع عبر Chargily - آمن وموثوق
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
  const { isLocked } = useBilling();

  if (isLocked) {
    return <span className="select-none">{fallback}</span>;
  }

  return <>{children}</>;
}

export function LockedButton({ children }: { children: React.ReactNode }) {
  const { isLocked } = useBilling();

  if (isLocked) {
    return null;
  }

  return <>{children}</>;
}
