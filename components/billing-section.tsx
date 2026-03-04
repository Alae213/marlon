"use client";

import { useState } from "react";
import { 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Shield
} from "lucide-react";
import { Badge, Card, CardContent } from "@/components/core";
import { useBilling } from "@/contexts/billing-context";
import { PaymentModal } from "@/components/payment-modal";

export function BillingSection({ storeName = "متجري" }: { storeName?: string }) {
  const { 
    storeStatus, 
    orderCount, 
    orderLimit, 
    daysRemaining, 
    isLocked,
    openPaymentModal,
    isPaymentModalOpen,
    closePaymentModal
  } = useBilling();

  const isTrial = storeStatus === "trial";
  const isActive = storeStatus === "active";
  const isOrderLimitReached = orderCount >= orderLimit;

  const usagePercentage = Math.min((orderCount / orderLimit) * 100, 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          الاشتراك والفوترة
        </h2>
        <Badge variant={isActive ? "success" : isLocked ? "danger" : "warning"}>
          {isActive ? "نشط" : isLocked ? "مقفل" : "تجربة"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm text-zinc-500">الفترة</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {isActive ? "سنة واحدة" : isTrial ? `${daysRemaining || 0} يوم` : "منتهي"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm text-zinc-500">الطلبات</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {orderCount} / {orderLimit}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm text-zinc-500">السعر</span>
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {isActive ? "9,900 د.ج" : "مجاني"}
            </p>
          </CardContent>
        </Card>
      </div>

      {!isActive && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                استخدام الفترة التجريبية
              </span>
              <span className="text-sm text-zinc-500">
                {Math.round(usagePercentage)}%
              </span>
            </div>
            <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  isOrderLimitReached 
                    ? "bg-red-500" 
                    : usagePercentage > 80 
                      ? "bg-amber-500" 
                      : "bg-[#00853f]"
                }`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
            {isTrial && (
              <p className="text-sm text-zinc-500 mt-3">
                {isOrderLimitReached 
                  ? `لقد استخدمت جميع ${orderLimit} طلب المتاحة في الفترة التجريبية`
                  : `لديك ${orderLimit - orderCount} طلب متبقي في الفترة التجريبية`
                }
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {(isTrial || isLocked) && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-zinc-900 dark:text-zinc-50 mb-1">
                {isLocked ? "تم إيقاف متجرك مؤقتاً" : "قم بالترقية الآن"}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                {isLocked 
                  ? "تم reached الحد الأقصى للطلبات المجانية. قم بالاشتراك للاستمرار."
                  : "فترة التجربة المجانية تنتهي قريباً. قم بالاشتراك للحصول على ميزات غير محدودة."
                }
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={openPaymentModal}
                  className="px-6 py-2.5 bg-[#00853f] text-white rounded-xl font-medium hover:bg-[#007537] transition-colors"
                >
                  اشتراك سنوي - 9,900 د.ج
                </button>
                <div className="flex items-center gap-1 text-sm text-zinc-500">
                  <Shield className="w-4 h-4" />
                  <span>دفع آمن</span>
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
                نشط - اشتراك مدفوع
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                لديك إمكانية الوصول إلى جميع الميزات. شكراً لثقتكم بنا!
              </p>
            </div>
          </div>
        </div>
      )}

      <PaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={closePaymentModal}
        storeName={storeName}
      />
    </div>
  );
}
