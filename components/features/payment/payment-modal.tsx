"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle, CreditCard, Shield } from "lucide-react";

import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId?: Id<"stores">;
  storeName: string;
  onPaymentSuccess?: () => void;
}

const CANONICAL_PRICE_DZD = 2000;

export function PaymentModal({
  isOpen,
  onClose,
  storeId,
  storeName,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canonicalAmount = useQuery(api.canonicalBilling.getCanonicalPaymentAmount);
  const priceDzd = canonicalAmount?.amountDzd ?? CANONICAL_PRICE_DZD;
  const periodDays = canonicalAmount?.periodDays ?? 30;

  const handlePayment = async () => {
    if (!storeId) {
      setErrorMessage("Could not identify store for payment.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const response = await fetch("/api/chargily/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not start payment now.");
      }
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setIsSuccess(true);
        onPaymentSuccess?.();
      }
    } catch (error) {
      console.error("Payment error:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Could not start payment now.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[460px] border-[--system-200] bg-[--color-card] p-[var(--spacing-lg)] shadow-[var(--shadow-xl)]">
        <DialogHeader className="pr-10">
          <DialogTitle>
            Unlock Orders - Monthly
          </DialogTitle>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{storeName}</p>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Payment successful
            </h3>
            <p className="mb-6 text-zinc-600 dark:text-zinc-400">
              Thanks for subscribing! You can now continue using the service.
            </p>
            <Button onClick={onClose} className="w-full">
              OK
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl bg-zinc-50 p-6 dark:bg-zinc-800">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                  Monthly subscription
                </span>
              </div>
              
              <div className="mb-4 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                  {priceDzd.toLocaleString()}
                </span>
                <span className="text-zinc-500">DZD</span>
              </div>

              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Unlimited orders for {periodDays} days
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-zinc-600 dark:text-zinc-400">All features included</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-zinc-600 dark:text-zinc-400">Priority support</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
              <Shield className="w-4 h-4" />
              <span>Secure payment</span>
            </div>

            {errorMessage ? (
              <p className="text-center text-sm text-red-600 dark:text-red-400">
                {errorMessage}
              </p>
            ) : null}

            <Button 
              onClick={handlePayment} 
              disabled={isLoading}
              className="w-full" 
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Subscribe now
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}