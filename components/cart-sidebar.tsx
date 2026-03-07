"use client";

import { Fragment, useState } from "react";
import Image from "next/image";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { X, Minus, Plus, Trash2, Loader2, Check } from "lucide-react";
import { useCart, CartItem } from "@/contexts/cart-context";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  storeSlug: string;
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

export function CartSidebar({ isOpen, onClose, storeId, storeSlug }: CartSidebarProps) {
  const { items, updateQuantity, removeItem, total, clearCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [formData, setFormData] = useState<OrderFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const createOrder = useMutation(api.orders.createOrder);

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  };

  const handleInputChange = (field: keyof OrderFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitOrder = async () => {
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
        deliveryCost: 0,
        total,
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

  if (!isOpen) return null;

  // Success state
  if (orderPlaced) {
    return (
      <Fragment>
        <div 
          className="fixed inset-0 z-50 bg-black/30"
          onClick={handleClose}
        />
        <div className="fixed inset-y-0 end-0 z-50 w-full max-w-md bg-card shadow-xl animate-in slide-in-from-end duration-300 overflow-hidden flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-[#16a34a] rounded-full flex items-center justify-center mb-6">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-normal text-foreground mb-2">
              Order Confirmed!
            </h2>
            <p className="text-muted-foreground mb-4">
              We will contact you at your phone number to verify your order
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Order Number: <span className="font-medium">{orderNumber}</span>
            </p>
            <button
              onClick={handleClose}
              className="w-full h-12 bg-primary text-primary-foreground font-normal hover:opacity-80 transition-opacity"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </Fragment>
    );
  }

  // Checkout form
  if (showCheckout) {
    return (
      <Fragment>
        <div 
          className="fixed inset-0 z-50 bg-black/30"
          onClick={handleClose}
        />
        <div className="fixed inset-y-0 end-0 z-50 w-full max-w-md bg-card shadow-xl animate-in slide-in-from-end duration-300 overflow-hidden flex flex-col">
          <div className="sticky top-0 flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-sm">
            <h2 className="text-lg font-normal text-foreground">
              Checkout
            </h2>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <label className="block text-sm font-normal text-foreground mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background text-foreground focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-normal text-foreground mb-1">
                Phone *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background text-foreground focus:outline-none focus:border-primary"
                placeholder="05XX XXX XXX"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-normal text-foreground mb-1">
                Wilaya *
              </label>
              <input
                type="text"
                value={formData.wilaya}
                onChange={(e) => handleInputChange("wilaya", e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background text-foreground focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-normal text-foreground mb-1">
                Commune
              </label>
              <input
                type="text"
                value={formData.commune}
                onChange={(e) => handleInputChange("commune", e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-normal text-foreground mb-1">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background text-foreground focus:outline-none focus:border-primary"
                placeholder={formData.deliveryType === "domicile" ? "Full address for delivery" : "Not required for stopdesk"}
                disabled={formData.deliveryType === "stopdesk"}
              />
            </div>

            <div>
              <label className="block text-sm font-normal text-foreground mb-1">
                Delivery Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleInputChange("deliveryType", "stopdesk")}
                  className={`flex-1 py-2 px-3 border transition-colors ${
                    formData.deliveryType === "stopdesk"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input text-muted-foreground hover:border-primary"
                  }`}
                >
                  Stopdesk
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange("deliveryType", "domicile")}
                  className={`flex-1 py-2 px-3 border transition-colors ${
                    formData.deliveryType === "domicile"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input text-muted-foreground hover:border-primary"
                  }`}
                >
                  Domicile
                </button>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 p-4 border-t border-border bg-card/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-muted-foreground">Total</span>
              <span className="text-xl font-normal text-foreground">
                {formatPrice(total)}
              </span>
            </div>
            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting || !formData.name || !formData.phone || !formData.wilaya}
              className="w-full h-12 bg-primary text-primary-foreground font-normal hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Place Order"
              )}
            </button>
          </div>
        </div>
      </Fragment>
    );
  }

  // Cart view
  return (
    <Fragment>
      <div 
        className="fixed inset-0 z-50 bg-black/30"
        onClick={handleClose}
      />
      <div className="fixed inset-y-0 end-0 z-50 w-full max-w-md bg-card shadow-xl animate-in slide-in-from-end duration-300 overflow-hidden flex flex-col">
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-sm">
          <h2 className="text-lg font-normal text-foreground">
            سلة المشتريات
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-muted-foreground mb-4">سلة المشتريات فارغة</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 border border-border"
              >
                {item.image && (
                  <div className="w-20 h-20 bg-muted flex-shrink-0 overflow-hidden relative">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-normal text-foreground truncate">
                    {item.name}
                  </h3>
                  {item.variant && (
                    <p className="text-sm text-muted-foreground">{item.variant}</p>
                  )}
                  <p className="text-foreground font-normal mt-1">
                    {formatPrice(item.price)}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 border border-input flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-normal">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 border border-input flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-8 h-8 flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors me-auto"
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
          <div className="sticky bottom-0 p-4 border-t border-border bg-card/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-muted-foreground">المجموع</span>
              <span className="text-xl font-normal text-foreground">
                {formatPrice(total)}
              </span>
            </div>
            <button
              onClick={() => setShowCheckout(true)}
              className="w-full h-12 bg-primary text-primary-foreground font-normal hover:opacity-80 transition-opacity"
            >
              إتمام الطلب
            </button>
          </div>
        )}
      </div>
    </Fragment>
  );
}
