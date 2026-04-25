"use client";

import { useState } from "react";
import { Truck, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useParams } from "next/navigation";
import { normalizeOrderStatus } from "@/lib/orders-types";

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
  storeId?: string;
  storeSlug?: string;
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
  storeId,
  storeSlug,
  onSuccess,
}: DeliveryActionProps) {
  const params = useParams<{ storeSlug?: string }>();
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
          storeId,
          storeSlug: storeSlug ?? params?.storeSlug,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult("success");
        onSuccess?.(data.trackingNumber);
      } else {
        setResult("error");
        setErrorMessage(data.error || "ÙØ´Ù„ Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø·Ù„Ø¨");
      }
    } catch {
      setResult("error");
      setErrorMessage("Ø­Ø¯Ø« Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ø§Ù„Ø®Ø§Ø¯Ù…");
    } finally {
      setIsLoading(false);
    }
  };

  const canonicalStatus = normalizeOrderStatus(currentStatus);
  const isShipped =
    canonicalStatus === "dispatched" ||
    canonicalStatus === "in_transit" ||
    canonicalStatus === "delivered" ||
    Boolean(trackingNumber);
  const canShip = canonicalStatus === "confirmed";

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
        Ø¥Ø±Ø³Ø§Ù„ Ù„Ù„ØªÙˆØµÙŠÙ„
      </Button>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) setResult(null);
        }}
      >
      <DialogContent className="max-w-[480px] border-[--system-200] bg-[--color-card] p-6 shadow-[var(--shadow-xl)]">
          <DialogHeader className="pr-10">
            <DialogTitle>Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø·Ù„Ø¨ Ù„Ù„ØªÙˆØµÙŠÙ„</DialogTitle>
            <DialogDescription>Ø·Ù„Ø¨ {orderNumber}</DialogDescription>
          </DialogHeader>

          {result === "success" ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">
                ØªÙ… Ø§Ù„Ø¥Ø±Ø³Ø§Ù„ Ø¨Ù†Ø¬Ø§Ø­
              </h3>
              <p className="mb-4 text-zinc-600 dark:text-zinc-400">
                ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø·Ù„Ø¨ Ù„Ø´Ø±ÙƒØ© Ø§Ù„ØªÙˆØµÙŠÙ„ Ø¨Ù†Ø¬Ø§Ø­.
              </p>
              <Button onClick={() => setIsOpen(false)} className="w-full">
                Ø­Ø³Ù†Ø§Ù‹
              </Button>
            </div>
          ) : result === "error" ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">
                ÙØ´Ù„ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„
              </h3>
              <p className="mb-4 text-zinc-600 dark:text-zinc-400">
                {errorMessage}
              </p>
              <Button onClick={() => setIsOpen(false)} className="w-full">
                Ø¥ØºÙ„Ø§Ù‚
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800">
                <p className="text-sm text-zinc-500">Ø§Ù„Ù…Ø³ØªÙ„Ù…</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{customerName}</p>
                <p className="text-sm text-zinc-500">{customerPhone}</p>
              </div>
              
              <div className="space-y-2 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800">
                <p className="text-sm text-zinc-500">Ø§Ù„Ø¹Ù†ÙˆØ§Ù†</p>
                <p className="text-sm text-zinc-900 dark:text-zinc-50">
                  {customerWilaya} - {customerCommune}
                </p>
                <p className="text-sm text-zinc-500">{customerAddress}</p>
              </div>

              <div className="space-y-2 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800">
                <p className="text-sm text-zinc-500">Ø§Ù„Ù…Ø¨Ù„Øº Ø§Ù„Ù…Ø·Ù„ÙˆØ¨</p>
                <p className="font-bold text-[#00853f]">{total.toLocaleString()} Ø¯.Ø¬</p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  Ø¥Ù„ØºØ§Ø¡
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„...
                    </>
                  ) : (
                    <>
                      <Truck className="w-4 h-4" />
                      Ø¥Ø±Ø³Ø§Ù„
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
