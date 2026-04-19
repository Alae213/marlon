"use client";

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  Shield,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/primitives/core/feedback/badge";
import { PaymentModal } from "@/components/features/payment/payment-modal";
import { useBilling } from "@/contexts/billing-context";

const metricCardClass =
  "rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950";
const panelCardClass =
  "rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950";

export function BillingSection({ storeName = "My Store" }: { storeName?: string }) {
  const {
    billingState,
    todayOrderCount,
    maxDailyOrders,
    ordersRemaining,
    daysRemaining,
    openPaymentModal,
    isPaymentModalOpen,
    closePaymentModal,
    storeId,
    priceDzd,
  } = useBilling();

  const isActive = billingState === "active";
  const isLockedState = billingState === "overflow_locked";
  const usagePercentage = Math.min((todayOrderCount / maxDailyOrders) * 100, 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-title text-[var(--system-700)]">Subscription & Billing</h2>
        <Badge variant={isActive ? "success" : isLockedState ? "danger" : "warning"}>
          {isActive ? "Active" : isLockedState ? "Limited" : "5 orders/day"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className={metricCardClass}>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-micro-label text-[var(--system-400)]">Period</span>
          </div>
          <p className="text-title text-[var(--system-700)]">
            {isActive
              ? daysRemaining
                ? `${daysRemaining} day${daysRemaining > 1 ? "s" : ""}`
                : "1 month"
              : isLockedState
                ? "Limit exceeded"
                : `${ordersRemaining} left today`}
          </p>
        </div>

        <div className={metricCardClass}>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-micro-label text-[var(--system-400)]">Orders</span>
          </div>
          <p className="text-title text-[var(--system-700)]">{`${todayOrderCount} / ${maxDailyOrders}`}</p>
        </div>

        <div className={metricCardClass}>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
              <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-micro-label text-[var(--system-400)]">Price</span>
          </div>
          <p className="text-title text-[var(--system-700)]">
            {isActive ? `${priceDzd.toLocaleString()} DZD` : "Free - 5 orders/day"}
          </p>
        </div>
      </div>

      {!isActive && (
        <div className={panelCardClass}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-body text-[var(--system-700)]">Daily Order Usage</span>
            <span className="text-body-sm text-[var(--system-400)]">{Math.round(usagePercentage)}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={`h-full rounded-full transition-all ${
                isLockedState ? "bg-red-500" : usagePercentage > 80 ? "bg-amber-500" : "bg-[#00853f]"
              }`}
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
          <p className="text-body-sm mt-3 text-[var(--system-400)]">
            {isLockedState
              ? `You've exceeded the ${maxDailyOrders} order limit. Subscribe to unlock all orders.`
              : `${ordersRemaining} orders remaining today. Subscribe for unlimited orders.`}
          </p>
        </div>
      )}

      {(isLockedState || !isActive) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-title mb-1 text-[var(--system-700)]">
                {isLockedState ? "Your store is temporarily limited" : "Upgrade now"}
              </h3>
              <p className="text-body-sm mb-4 text-[var(--system-500)] dark:text-zinc-400">
                {isLockedState
                  ? "You've exceeded the free daily order limit. Subscribe to unlock all orders."
                  : "Subscribe for unlimited orders and prevent daily limits."}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={openPaymentModal}
                  className="text-body-sm rounded-xl bg-[#00853f] px-6 py-2.5 text-white transition-colors hover:bg-[#007537]"
                >
                  {`Monthly - ${priceDzd.toLocaleString()} DZD`}
                </button>
                <div className="text-body-sm flex items-center gap-1 text-[var(--system-400)]">
                  <Shield className="h-4 w-4" />
                  <span>Secure payment</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isActive && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-title mb-1 text-[var(--system-700)]">Active - Paid subscription</h3>
              <p className="text-body-sm text-[var(--system-500)] dark:text-zinc-400">
                {daysRemaining
                  ? `${daysRemaining} day${daysRemaining > 1 ? "s" : ""} left in your subscription`
                  : "You have full access to all features. Thank you!"}
              </p>
            </div>
          </div>
        </div>
      )}

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={closePaymentModal}
        storeId={storeId}
        storeName={storeName}
      />
    </div>
  );
}
