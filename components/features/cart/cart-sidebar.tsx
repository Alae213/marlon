"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Check, Loader2, Minus, Plus, Trash2, X } from "lucide-react";
import { useCart, type CartItem } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { WilayaSelect, CommuneSelect } from "@/components/features/shared/wilaya-select";
import { formatPhoneInput, validateAlgerianPhone } from "@/lib/phone-validation";
import { createPublicCheckoutIdempotencyKey } from "@/lib/public-checkout-client";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  storeSlug?: string;
}

type DeliveryType = "stopdesk" | "domicile";

interface OrderFormData {
  name: string;
  phone: string;
  wilaya: string;
  commune: string;
  address: string;
  deliveryType: DeliveryType;
}

const initialFormData: OrderFormData = {
  name: "",
  phone: "",
  wilaya: "",
  commune: "",
  address: "",
  deliveryType: "stopdesk",
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("ar-DZ", {
    style: "currency",
    currency: "DZD",
    minimumFractionDigits: 0,
  }).format(price);
};

function getWilayaLookupParts(wilaya: string) {
  const parts = wilaya.split(" - ").map((part) => part.trim()).filter(Boolean);
  const numberMatch = wilaya.match(/^(\d+)/);
  return new Set([wilaya.trim(), ...parts, numberMatch?.[1]].filter(Boolean) as string[]);
}

export function CartSidebar({ isOpen, onClose, storeId, storeSlug }: CartSidebarProps) {
  const { items, updateQuantity, removeItem, total, clearCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [formData, setFormData] = useState<OrderFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [orderError, setOrderError] = useState("");
  const [checkoutIdempotencyKey, setCheckoutIdempotencyKey] = useState(
    () => createPublicCheckoutIdempotencyKey()
  );

  const deliveryPricing = useQuery(
    api.stores.getDeliveryPricing,
    storeId ? { storeId: storeId as Id<"stores"> } : "skip"
  );

  const deliveryCost = useMemo(() => {
    const lookupParts = getWilayaLookupParts(formData.wilaya);
    const pricing = deliveryPricing?.find((entry) => lookupParts.has(entry.wilaya));
    if (!pricing) {
      return formData.deliveryType === "domicile" ? 600 : 400;
    }
    return formData.deliveryType === "domicile"
      ? (pricing.homeDelivery ?? 0)
      : (pricing.officeDelivery ?? 0);
  }, [deliveryPricing, formData.deliveryType, formData.wilaya]);

  const orderTotal = total + deliveryCost;

  const handleInputChange = (field: keyof OrderFormData, value: string) => {
    if (field === "phone") {
      const formatted = formatPhoneInput(value);
      setFormData((prev) => ({ ...prev, phone: formatted }));
      setPhoneError(formatted ? validateAlgerianPhone(formatted).error || "" : "");
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetCheckout = () => {
    setShowCheckout(false);
    setFormData(initialFormData);
    setOrderPlaced(false);
    setPhoneError("");
    setOrderError("");
    setCheckoutIdempotencyKey(createPublicCheckoutIdempotencyKey());
  };

  const handleClose = () => {
    resetCheckout();
    onClose();
  };

  const openCheckout = () => {
    setOrderError("");
    setCheckoutIdempotencyKey(createPublicCheckoutIdempotencyKey());
    setShowCheckout(true);
  };

  const handleSubmitOrder = async () => {
    setOrderError("");
    const phoneValidation = validateAlgerianPhone(formData.phone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || "Invalid phone number");
      return;
    }

    if (!formData.name || !formData.phone || !formData.wilaya) {
      return;
    }

    if (!storeSlug) {
      setOrderError("Store checkout is not ready. Please refresh and try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": checkoutIdempotencyKey,
        },
        body: JSON.stringify({
          storeSlug,
          idempotencyKey: checkoutIdempotencyKey,
          customerName: formData.name,
          customerPhone: formData.phone,
          customerWilaya: formData.wilaya,
          customerCommune: formData.commune || undefined,
          customerAddress: formData.address || undefined,
          deliveryType: formData.deliveryType,
          products: items.map((item: CartItem) => ({
            productId: item.productId,
            quantity: item.quantity,
            variant: item.variant,
          })),
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Failed to create order.");
      }

      setOrderNumber(data.orderNumber);
      setOrderPlaced(true);
      setCheckoutIdempotencyKey(createPublicCheckoutIdempotencyKey());
      clearCart();
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : "Failed to create order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      {orderPlaced ? (
        <SheetContent side="right" showCloseButton={false} className="flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#16a34a]">
            <Check className="h-8 w-8 text-white" />
          </div>
          <SheetTitle className="mb-2 text-title text-[var(--sheet-surface-fg)]">
            Order Confirmed!
          </SheetTitle>
          <p className="mb-4 text-body text-[var(--system-300)]">
            We will contact you to verify your order.
          </p>
          <p className="mb-8 text-body-sm text-[var(--system-300)]">
            Order Number: <span className="text-body text-[var(--sheet-surface-fg)]">{orderNumber}</span>
          </p>
          <Button onClick={handleClose} className="h-12 w-full bg-[var(--color-primary)] text-white hover:opacity-80">
            Continue Shopping
          </Button>
        </SheetContent>
      ) : null}

      {showCheckout && !orderPlaced ? (
        <SheetContent side="right" showCloseButton={false} className="flex flex-col p-0">
          <SheetHeader className="flex items-center justify-between border-b border-[var(--sheet-surface-border)] p-4">
            <SheetTitle className="text-title text-[var(--sheet-surface-fg)]">Checkout</SheetTitle>
            <button onClick={handleClose} className="rounded-lg p-1 transition-colors hover:bg-[var(--system-700)]">
              <X className="h-5 w-5 text-[var(--system-300)]" />
            </button>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <div>
              <label className="mb-1 block text-body-sm text-[var(--sheet-surface-fg)]">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(event) => handleInputChange("name", event.target.value)}
                className="w-full rounded-lg border border-[var(--system-700)] bg-[var(--system-800)] px-3 py-2 text-[var(--sheet-surface-fg)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-body-sm text-[var(--sheet-surface-fg)]">Phone *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(event) => handleInputChange("phone", event.target.value)}
                className={`w-full rounded-lg border bg-[var(--system-800)] px-3 py-2 text-[var(--sheet-surface-fg)] focus:border-[var(--color-primary)] focus:outline-none ${
                  phoneError ? "border-[var(--color-error)]" : "border-[var(--system-700)]"
                }`}
                placeholder="05XX XXX XXX"
              />
              {phoneError ? <p className="mt-1 text-caption text-[var(--color-error)]">{phoneError}</p> : null}
            </div>

            <WilayaSelect
              value={formData.wilaya}
              onChange={(value) => handleInputChange("wilaya", value)}
              label="Wilaya"
              required
            />
            <CommuneSelect
              wilayaValue={formData.wilaya}
              value={formData.commune}
              onChange={(value) => handleInputChange("commune", value)}
              label="Commune"
              disabled={!formData.wilaya}
            />

            <div>
              <label className="mb-1 block text-body-sm text-[var(--sheet-surface-fg)]">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(event) => handleInputChange("address", event.target.value)}
                disabled={formData.deliveryType === "stopdesk"}
                placeholder={formData.deliveryType === "domicile" ? "Full address for delivery" : "Not required for stopdesk"}
                className="w-full rounded-lg border border-[var(--system-700)] bg-[var(--system-800)] px-3 py-2 text-[var(--sheet-surface-fg)] focus:border-[var(--color-primary)] focus:outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="mb-1 block text-body-sm text-[var(--sheet-surface-fg)]">Delivery Type</label>
              <div className="flex gap-2">
                {(["stopdesk", "domicile"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleInputChange("deliveryType", type)}
                    className={`flex-1 border px-3 py-2 text-body-sm transition-colors ${
                      formData.deliveryType === type
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        : "border-[var(--system-700)] bg-[var(--system-800)] text-[var(--system-300)] hover:border-[var(--color-primary)]"
                    }`}
                  >
                    {type === "stopdesk" ? "Stopdesk" : "Domicile"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <SheetFooter className="border-t border-[var(--sheet-surface-border)] bg-[var(--sheet-surface-bg)] p-4">
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-[var(--system-300)]">Subtotal</span>
                <span className="text-body text-[var(--sheet-surface-fg)]">{formatPrice(total)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-[var(--system-300)]">Delivery</span>
                <span className="text-body text-[var(--sheet-surface-fg)]">{formatPrice(deliveryCost)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-[var(--system-700)] pt-2">
                <span className="text-body text-[var(--sheet-surface-fg)]">Total</span>
                <span className="text-title text-[var(--sheet-surface-fg)]">{formatPrice(orderTotal)}</span>
              </div>
            </div>
            {orderError ? <p className="mb-3 text-caption text-[var(--color-error)]" role="alert">{orderError}</p> : null}
            <Button
              onClick={handleSubmitOrder}
              disabled={isSubmitting || !formData.name || !formData.phone || !formData.wilaya}
              className="flex h-12 w-full items-center justify-center gap-2 bg-[var(--color-primary)] text-white hover:opacity-80 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Place Order"
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      ) : null}

      {!showCheckout && !orderPlaced ? (
        <SheetContent side="right" showCloseButton={false} className="flex flex-col p-0">
          <SheetHeader className="flex items-center justify-between border-b border-[var(--sheet-surface-border)] p-4">
            <SheetTitle className="text-title text-[var(--sheet-surface-fg)]">Cart</SheetTitle>
            <button onClick={handleClose} className="rounded-lg p-1 transition-colors hover:bg-[var(--system-700)]">
              <X className="h-5 w-5 text-[var(--system-300)]" />
            </button>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <p className="text-body text-[var(--system-300)]">Your cart is empty</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex gap-4 rounded-xl border border-[var(--system-700)] p-4">
                  {item.image ? (
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--system-700)]">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-body text-[var(--sheet-surface-fg)]">{item.name}</h3>
                    {item.variant ? <p className="text-body-sm text-[var(--system-300)]">{item.variant}</p> : null}
                    <p className="mt-1 text-body text-[var(--sheet-surface-fg)]">{formatPrice(item.price)}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--system-700)] transition-colors hover:bg-[var(--system-700)]"
                      >
                        <Minus className="h-3.5 w-3.5 text-[var(--system-300)]" />
                      </button>
                      <span className="w-8 text-center text-body text-[var(--sheet-surface-fg)]">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--system-700)] transition-colors hover:bg-[var(--system-700)]"
                      >
                        <Plus className="h-3.5 w-3.5 text-[var(--system-300)]" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="me-auto flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-error)] transition-colors hover:bg-[var(--color-error)]/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {items.length > 0 ? (
            <SheetFooter className="border-t border-[var(--system-700)] bg-[var(--sheet-surface-bg)] p-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-body text-[var(--system-300)]">Subtotal</span>
                <span className="text-title text-[var(--sheet-surface-fg)]">{formatPrice(total)}</span>
              </div>
              <Button onClick={openCheckout} className="h-12 w-full bg-[var(--color-primary)] text-white hover:opacity-80">
                Checkout
              </Button>
            </SheetFooter>
          ) : null}
        </SheetContent>
      ) : null}
    </Sheet>
  );
}
