"use client";
import { 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Shield
} from "lucide-react";
import { Badge } from "@/components/primitives/core/feedback/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useBilling } from "@/contexts/billing-context";
import { PaymentModal } from "@/components/features/payment/payment-modal";

export function BillingSection({ storeName = "My Store" }: { storeName?: string }) {
  const { 
    billingState,
    todayOrderCount, 
    maxDailyOrders, 
    ordersRemaining,
    daysRemaining, 
    isLocked,
    isOverflow,
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Subscription & Billing
        </h2>
        <Badge variant={isActive ? "success" : isLockedState ? "danger" : "warning"}>
          {isActive ? "Active" : isLockedState ? "Limited" : "5 orders/day"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm text-zinc-500">Period</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {isActive 
                ? (daysRemaining ? `${daysRemaining} day${daysRemaining > 1 ? 's' : ''}` : "1 month")
                : isLockedState 
                  ? "Limit exceeded"
                  : `${ordersRemaining} left today`
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm text-zinc-500">Orders</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {`${todayOrderCount} / ${maxDailyOrders}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm text-zinc-500">Price</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {isActive 
                ? `${priceDzd.toLocaleString()} DZD` 
                : "Free - 5 orders/day"
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {!isActive && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                Daily Order Usage
              </span>
              <span className="text-sm text-zinc-500">
                {Math.round(usagePercentage)}%
              </span>
            </div>
            <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  isLockedState 
                    ? "bg-red-500" 
                    : usagePercentage > 80 
                      ? "bg-amber-500" 
                      : "bg-[#00853f]"
                }`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
            <p className="text-sm text-zinc-500 mt-3">
              {isLockedState 
                ? `You've exceeded the ${maxDailyOrders} order limit. Subscribe to unlock all orders.`
                : `${ordersRemaining} orders remaining today. Subscribe for unlimited orders.`
              }
            </p>
          </CardContent>
        </Card>
      )}

      {(isLockedState || !isActive) && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
              <div className="flex-1">
                <h3 className="font-medium text-zinc-900 dark:text-zinc-50 mb-1">
                  {isLockedState ? "Your store is temporarily limited" : "Upgrade now"}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  {isLockedState 
                    ? "You've exceeded the free daily order limit. Subscribe to unlock all orders."
                    : "Subscribe for unlimited orders and prevent daily limits."
                  }
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={openPaymentModal}
                    className="px-6 py-2.5 bg-[#00853f] text-white rounded-xl font-medium hover:bg-[#007537] transition-colors"
                  >
                    {`Monthly - ${priceDzd.toLocaleString()} DZD`}
                  </button>
                  <div className="flex items-center gap-1 text-sm text-zinc-500">
                    <Shield className="w-4 h-4" />
                    <span>Secure payment</span>
                  </div>
                </div>
              </div>
          </div>
        </div>
      )}

      {isActive && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-medium text-zinc-900 dark:text-zinc-50 mb-1">
                Active - Paid subscription
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {daysRemaining 
                  ? `${daysRemaining} day${daysRemaining > 1 ? 's' : ''} left in your subscription`
                  : "You have full access to all features. Thank you!"
                }
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