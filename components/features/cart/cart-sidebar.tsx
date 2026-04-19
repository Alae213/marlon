"use client";

import { Fragment, useState, useMemo } from "react";
import Image from "next/image";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { X, Minus, Plus, Trash2, Loader2, Check } from "lucide-react";
import { useCart, CartItem } from "@/contexts/cart-context";
import { WilayaSelect, CommuneSelect } from "@/components/features/shared/wilaya-select";
import { validateAlgerianPhone, formatPhoneInput } from "@/lib/phone-validation";
import { Sheet, SheetContent, SheetTitle, SheetHeader, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ar-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0,
  }).format(price);
};

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

export function CartSidebar({ isOpen, onClose, storeId }: CartSidebarProps) {
  const { items, updateQuantity, removeItem, total, clearCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [formData, setFormData] = useState<OrderFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Fetch delivery pricing
  const deliveryPricing = useQuery(
    api.stores.getDeliveryPricing,
    storeId ? { storeId: storeId as Id<"stores"> } : "skip"
  );

  // Extract wilaya Arabic name from the selected wilaya string (e.g., "1 - Adrar - أدرار" -> "أدرار")
  const selectedWilayaArabic = useMemo(() => {
    if (!formData.wilaya) return null;
    const parts = formData.wilaya.split(" - ");
    return parts.length >= 3 ? parts[2].trim() : null;
  }, [formData.wilaya]);

  // Extract wilaya number as fallback (e.g., "1 - Adrar - أدرار" -> "1")
  const selectedWilayaNumber = useMemo(() => {
    if (!formData.wilaya) return null;
    const match = formData.wilaya.match(/^(\d+)/);
    return match ? match[1] : null;
  }, [formData.wilaya]);

  // Find pricing with multiple fallback strategies
  const findDeliveryPrice = useMemo(() => {
    if (!deliveryPricing || !formData.wilaya) return null;
    
    // Strategy 1: Match by Arabic name
    if (selectedWilayaArabic) {
      const found = deliveryPricing.find(p => p.wilaya === selectedWilayaArabic);
      if (found) return found;
    }
    
    // Strategy 2: Match by wilaya number (some entries might be saved with number)
    if (selectedWilayaNumber) {
      const found = deliveryPricing.find(p => p.wilaya === selectedWilayaNumber);
      if (found) return found;
    }
    
    return null;
  }, [deliveryPricing, selectedWilayaArabic, selectedWilayaNumber, formData.wilaya]);

  // Get delivery cost - use stored price or default fallback
  const getDeliveryCost = (type: "domicile" | "stopdesk") => {
    const pricing = findDeliveryPrice;
    if (!pricing) {
      // Default fallback prices (same as editor defaults)
      return type === "domicile" ? 600 : 400;
    }
    return type === "domicile" 
      ? (pricing.homeDelivery || 0) 
      : (pricing.officeDelivery || 0);
  };

  // Calculate delivery cost
  const deliveryCost = getDeliveryCost(formData.deliveryType);

  const orderTotal = total + deliveryCost;

  const createOrder = useMutation(api.orders.createOrder);

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  };

  const handleInputChange = (field: keyof OrderFormData, value: string) => {
    // Format phone input
    if (field === "phone") {
      const formatted = formatPhoneInput(value);
      setFormData(prev => ({ ...prev, [field]: formatted }));
      
      // Validate phone
      if (formatted.length > 0) {
        const validation = validateAlgerianPhone(formatted);
        setPhoneError(validation.error || "");
      } else {
        setPhoneError("");
      }
      return;
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitOrder = async () => {
    // Validate phone before submitting
    const phoneValidation = validateAlgerianPhone(formData.phone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || "Invalid phone number");
      return;
    }

    if (!formData.name || !formData.phone || !formData.wilaya) {
      return;
    }

    setIsSubmitting(true);
    try {
      const orderNum = generateOrderNumber();
      
      const products = items.map((item: CartItem) => ({
        productId: item.productId,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        variant: item.variant,
      }));

      await createOrder({
        storeId: storeId as Id<"stores">,
        orderNumber: orderNum,
        customerName: formData.name,
        customerPhone: formData.phone,
        customerWilaya: formData.wilaya,
        customerCommune: formData.commune || undefined,
        customerAddress: formData.address || undefined,
        products,
        subtotal: total,
        deliveryCost: deliveryCost,
        total: orderTotal,
        deliveryType: formData.deliveryType,
      });

      setOrderNumber(orderNum);
      setOrderPlaced(true);
      clearCart();
    } catch (error) {
      console.error("Failed to create order:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

const handleClose = () => {
    setShowCheckout(false);
    setFormData(initialFormData);
    setOrderPlaced(false);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      {/* Success State */}
      {orderPlaced && (
        <SheetContent side="right" showCloseButton={false} className="flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-[#16a34a] rounded-full flex items-center justify-center mb-6">
            <Check className="w-8 h-8 text-white" />
          </div>
          <SheetTitle className="text-title mb-2 text-[var(--sheet-surface-fg)]">
            Order Confirmed!
          </SheetTitle>
          <p className="text-body text-[var(--system-300)] mb-4">
            We will contact you at your phone number to verify your order
          </p>
          <p className="text-body-sm text-[var(--system-300)] mb-8">
            Order Number: <span className="text-body text-[var(--sheet-surface-fg)]">{orderNumber}</span>
          </p>
          <Button
            onClick={handleClose}
            className="w-full h-12 bg-[var(--color-primary)] text-white hover:opacity-80 transition-opacity"
          >
            Continue Shopping
          </Button>
        </SheetContent>
      )}

      {/* Checkout Form */}
      {showCheckout && !orderPlaced && (
        <SheetContent side="right" showCloseButton={false} className="flex flex-col p-0">
          <SheetHeader className="flex items-center justify-between p-4 border-b border-[var(--sheet-surface-border)]">
            <SheetTitle className="text-title text-[var(--sheet-surface-fg)]">
              Checkout
            </SheetTitle>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-[var(--system-700)] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[var(--system-300)]" />
            </button>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
               <label className="text-body-sm mb-1 block text-[var(--sheet-surface-fg)]">
                 Name *
               </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-[var(--system-700)] bg-[var(--system-800)] text-[var(--sheet-surface-fg)] focus:outline-none focus:border-[var(--color-primary)]"
                required
              />
            </div>

            <div>
               <label className="text-body-sm mb-1 block text-[var(--sheet-surface-fg)]">
                 Phone *
               </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className={`w-full px-3 py-2 border bg-[var(--system-800)] text-[var(--sheet-surface-fg)] focus:outline-none focus:border-[var(--color-primary)] ${
                  phoneError ? "border-[var(--color-error)]" : "border-[var(--system-700)]"
                }`}
                placeholder="05XX XXX XXX"
                required
              />
              {phoneError && (
                 <p className="text-caption mt-1 text-[var(--color-error)]">{phoneError}</p>
               )}
            </div>

            <div>
              <WilayaSelect
                value={formData.wilaya}
                onChange={(value) => handleInputChange("wilaya", value)}
                label="Wilaya"
                required
              />
            </div>

            <div>
              <CommuneSelect
                wilayaValue={formData.wilaya}
                value={formData.commune}
                onChange={(value) => handleInputChange("commune", value)}
                label="Commune"
                disabled={!formData.wilaya}
              />
            </div>

            <div>
               <label className="text-body-sm mb-1 block text-[var(--sheet-surface-fg)]">
                 Address
               </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className="w-full px-3 py-2 border border-[var(--system-700)] bg-[var(--system-800)] text-[var(--sheet-surface-fg)] focus:outline-none focus:border-[var(--color-primary)]"
                placeholder={formData.deliveryType === "domicile" ? "Full address for delivery" : "Not required for stopdesk"}
                disabled={formData.deliveryType === "stopdesk"}
              />
            </div>

            <div>
               <label className="text-body-sm mb-1 block text-[var(--sheet-surface-fg)]">
                 Delivery Type
               </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleInputChange("deliveryType", "stopdesk")}
                     className={`text-body-sm flex-1 border px-3 py-2 transition-colors ${
                       formData.deliveryType === "stopdesk"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                      : "border-[var(--system-700)] text-[var(--system-300)] hover:border-[var(--color-primary)]"
                  }`}
                >
                  Stopdesk
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange("deliveryType", "domicile")}
                     className={`text-body-sm flex-1 border px-3 py-2 transition-colors ${
                       formData.deliveryType === "domicile"
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                      : "border-[var(--system-700)] text-[var(--system-300)] hover:border-[var(--color-primary)]"
                  }`}
                >
                  Domicile
                </button>
              </div>
            </div>
          </div>

          <SheetFooter className="p-4 border-t border-[var(--sheet-surface-border)] bg-[var(--sheet-surface-bg)]">
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                 <span className="text-body-sm text-[var(--system-300)]">Subtotal</span>
                 <span className="text-body text-[var(--sheet-surface-fg)]">{formatPrice(total)}</span>
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-body-sm text-[var(--system-300)]">Delivery</span>
                 <span className="text-body text-[var(--sheet-surface-fg)]">{formatPrice(deliveryCost)}</span>
               </div>
               <div className="flex items-center justify-between pt-2 border-t border-[var(--system-700)]">
                 <span className="text-body text-[var(--sheet-surface-fg)]">Total</span>
                 <span className="text-title text-[var(--sheet-surface-fg)]">
                   {formatPrice(orderTotal)}
                 </span>
              </div>
            </div>
            <Button
              onClick={handleSubmitOrder}
              disabled={isSubmitting || !formData.name || !formData.phone || !formData.wilaya}
              className="w-full h-12 bg-[var(--color-primary)] text-white hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Place Order"
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      )}

      {/* Cart View */}
      {!showCheckout && !orderPlaced && (
        <SheetContent side="right" showCloseButton={false} className="flex flex-col p-0">
          <SheetHeader className="flex items-center justify-between p-4 border-b border-[var(--sheet-surface-border)]">
            <SheetTitle className="text-title text-[var(--sheet-surface-fg)] tracking-title-arabic" lang="ar">
              سلة المشتريات
            </SheetTitle>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-[var(--system-700)] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[var(--system-300)]" />
            </button>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                 <p className="text-body text-[var(--system-300)] tracking-title-arabic" lang="ar">سلة المشتريات فارغة</p>
               </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 border border-[var(--system-700)] rounded-xl"
                >
                  {item.image && (
                    <div className="w-20 h-20 bg-[var(--system-700)] flex-shrink-0 overflow-hidden relative rounded-lg">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                     <h3 className="text-body text-[var(--sheet-surface-fg)] truncate">
                       {item.name}
                     </h3>
                     {item.variant && (
                       <p className="text-body-sm text-[var(--system-300)]">{item.variant}</p>
                     )}
                     <p className="text-body mt-1 text-[var(--sheet-surface-fg)]">
                       {formatPrice(item.price)}
                     </p>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 border border-[var(--system-700)] flex items-center justify-center hover:bg-[var(--system-700)] transition-colors rounded-lg"
                      >
                        <Minus className="w-3.5 h-3.5 text-[var(--system-300)]" />
                      </button>
                       <span className="text-body w-8 text-center text-[var(--sheet-surface-fg)]">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 border border-[var(--system-700)] flex items-center justify-center hover:bg-[var(--system-700)] transition-colors rounded-lg"
                      >
                        <Plus className="w-3.5 h-3.5 text-[var(--system-300)]" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-8 h-8 flex items-center justify-center text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors me-auto rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <SheetFooter className="p-4 border-t border-[var(--system-700)] bg-[var(--sheet-surface-bg)]">
              <div className="flex items-center justify-between mb-4">
                 <span className="text-body tracking-title-arabic text-[var(--system-300)]" lang="ar">المجموع</span>
                 <span className="text-title text-[var(--sheet-surface-fg)]">
                   {formatPrice(total)}
                 </span>
              </div>
              <Button
                onClick={() => setShowCheckout(true)}
                className="w-full h-12 bg-[var(--color-primary)] text-white hover:opacity-80 transition-opacity"
              >
                إتمام الطلب
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      )}
    </Sheet>
  );
}
