"use client";

import { useState } from "react";
import { Truck, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button, Modal } from "@/components/core";

interface DeliveryActionProps {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerWilaya: string;
  customerCommune: string;
  customerAddress: string;
  products: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  currentStatus: string;
  trackingNumber?: string;
  deliveryProvider?: "zr_express" | "yalidine";
  onSuccess?: (trackingNumber: string) => void;
}

export function DeliveryAction({
  orderId,
  orderNumber,
  customerName,
  customerPhone,
  customerWilaya,
  customerCommune,
  customerAddress,
  products,
  total,
  currentStatus,
  trackingNumber,
  deliveryProvider,
  onSuccess,
}: DeliveryActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSend = async () => {
    setIsLoading(true);
    setResult(null);
    setErrorMessage("");

    try {
      const response = await fetch("/api/delivery/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          orderNumber,
          customerName,
          customerPhone,
          customerWilaya,
          customerCommune,
          customerAddress,
          products,
          total,
          provider: deliveryProvider || "zr_express",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult("success");
        onSuccess?.(data.trackingNumber);
      } else {
        setResult("error");
        setErrorMessage(data.error || "فشل إرسال الطلب");
      }
    } catch (_error) {
      setResult("error");
      setErrorMessage("حدث خطأ في الاتصال بالخادم");
    } finally {
      setIsLoading(false);
    }
  };

  const isShipped = currentStatus === "shipped" || trackingNumber;
  const canShip = currentStatus === "packaged" || currentStatus === "confirmed";

  if (isShipped) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <Truck className="w-4 h-4" />
        <span className="text-sm font-mono">{trackingNumber}</span>
      </div>
    );
  }

  if (!canShip) {
    return null;
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <Truck className="w-4 h-4" />
        إرسال للتوصيل
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setResult(null);
        }}
        title="إرسال الطلب للتوصيل"
        description={`طلب ${orderNumber}`}
      >
        {result === "success" ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
              تم الإرسال بنجاح
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              تم إرسال الطلب لشركة التوصيل بنجاح.
            </p>
            <Button onClick={() => setIsOpen(false)} className="w-full">
              حسناً
            </Button>
          </div>
        ) : result === "error" ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
              فشل الإرسال
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              {errorMessage}
            </p>
            <Button onClick={() => setIsOpen(false)} className="w-full">
              إغلاق
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 space-y-2">
              <p className="text-sm text-zinc-500">المستلم</p>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">{customerName}</p>
              <p className="text-sm text-zinc-500">{customerPhone}</p>
            </div>
            
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 space-y-2">
              <p className="text-sm text-zinc-500">العنوان</p>
              <p className="text-sm text-zinc-900 dark:text-zinc-50">
                {customerWilaya} - {customerCommune}
              </p>
              <p className="text-sm text-zinc-500">{customerAddress}</p>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 space-y-2">
              <p className="text-sm text-zinc-500">المبلغ المطلوب</p>
              <p className="font-bold text-[#00853f]">{total.toLocaleString()} د.ج</p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleSend}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4" />
                    إرسال
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
