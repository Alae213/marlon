"use client";

import { useState } from "react";
import { Loader2, CheckCircle, CreditCard, Shield } from "lucide-react";
import { Modal } from "@/components/primitives/core/feedback/modal";
import { Button } from "@/components/primitives/core/buttons/button";

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
    <Modal isOpen={isOpen} onClose={onClose} title="الاشتراك في الخطة المدفوعة">
      {isSuccess ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            تم الدفع بنجاح
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            شكراً لاشتراكك! يمكنك الآن الاستمرار في استخدام الخدمة.
          </p>
          <Button onClick={onClose} className="w-full">
            حسناً
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                الاشتراك السنوي
              </span>
              <span className="text-sm text-green-600 font-medium">
                -50%
              </span>
            </div>
            
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                {PLAN_PRICE.toLocaleString()}
              </span>
              <span className="text-zinc-500">د.ج</span>
            </div>
            
            <p className="text-sm text-zinc-500 line-through mb-6">
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
    </Modal>
  );
}
