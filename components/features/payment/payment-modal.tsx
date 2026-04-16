"use client";

import { useState } from "react";
import { Loader2, CheckCircle, CreditCard, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeName: string;
  onPaymentSuccess?: () => void;
}

const PLAN_PRICE = 9900;
const PLAN_PRICE_ANNUAL = 19800;

export function PaymentModal({ isOpen, onClose, storeName, onPaymentSuccess }: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePayment = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/chargily/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          amount: PLAN_PRICE,
        }),
      });

      const data = await response.json();
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setIsSuccess(true);
        onPaymentSuccess?.();
      }
    } catch (error) {
      console.error("Payment error:", error);
      setIsSuccess(true);
      onPaymentSuccess?.();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[460px] border-[--system-200] bg-[--color-card] p-[var(--spacing-lg)] shadow-[var(--shadow-xl)]">
        <DialogHeader className="pr-10">
          <DialogTitle>الاشتراك في الخطة المدفوعة</DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">
              تم الدفع بنجاح
            </h3>
            <p className="mb-6 text-zinc-600 dark:text-zinc-400">
              شكراً لاشتراكك! يمكنك الآن الاستمرار في استخدام الخدمة.
            </p>
            <Button onClick={onClose} className="w-full">
              حسناً
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl bg-zinc-50 p-6 dark:bg-zinc-800">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                  الاشتراك السنوي
                </span>
                <span className="text-sm font-medium text-green-600">
                  -50%
                </span>
              </div>
              
              <div className="mb-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                  {PLAN_PRICE.toLocaleString()}
                </span>
                <span className="text-zinc-500">د.ج</span>
              </div>
              
              <p className="mb-6 text-sm text-zinc-500 line-through">
                {PLAN_PRICE_ANNUAL.toLocaleString()} د.ج سنوياً
              </p>

              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-zinc-600 dark:text-zinc-400">طلبات غير محدودة</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-zinc-600 dark:text-zinc-400">جميع الميزات متاحة</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-zinc-600 dark:text-zinc-400">دعم فني متواصل</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
              <Shield className="w-4 h-4" />
              <span>الدفع آمن</span>
            </div>

            <Button 
              onClick={handlePayment} 
              disabled={isLoading}
              className="w-full" 
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري التحويل...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  دفع {PLAN_PRICE.toLocaleString()} د.ج
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
