"use client";

import { Fragment, ReactNode } from "react";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/cart-context";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ar-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0,
  }).format(price);
};

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { items, updateQuantity, removeItem, total } = useCart();

  if (!isOpen) return null;

  return (
    <Fragment>
      <div 
        className="fixed inset-0 z-50 bg-black/30"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 end-0 z-50 w-full max-w-md bg-white dark:bg-[#0a0a0a] shadow-2xl animate-in slide-in-from-end duration-300 overflow-hidden flex flex-col">
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-[#e5e5e5] dark:border-[#262626] bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-sm">
          <h2 className="text-lg font-normal text-[#171717] dark:text-[#fafafa]">
            سلة المشتريات
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#f5f5f5] dark:hover:bg-[#171717] transition-colors"
          >
            <X className="w-5 h-5 text-[#737373]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-[#737373] mb-4">سلة المشتريات فارغة</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 border border-[#e5e5e5] dark:border-[#262626]"
              >
                {item.image && (
                  <div className="w-20 h-20 bg-[#f5f5f5] dark:bg-[#171717] flex-shrink-0 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-normal text-[#171717] dark:text-[#fafafa] truncate">
                    {item.name}
                  </h3>
                  {item.variant && (
                    <p className="text-sm text-[#737373]">{item.variant}</p>
                  )}
                  <p className="text-[#171717] dark:text-[#fafafa] font-normal mt-1">
                    {formatPrice(item.price)}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 border border-[#e5e5e5] dark:border-[#404040] flex items-center justify-center hover:bg-[#f5f5f5] dark:hover:bg-[#171717] transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-normal">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 border border-[#e5e5e5] dark:border-[#404040] flex items-center justify-center hover:bg-[#f5f5f5] dark:hover:bg-[#171717] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-8 h-8 flex items-center justify-center text-[#dc2626] hover:bg-[#fee2e2] dark:hover:bg-[#7f1d1d]/20 transition-colors me-auto"
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
          <div className="sticky bottom-0 p-4 border-t border-[#e5e5e5] dark:border-[#262626] bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[#737373]">المجموع</span>
              <span className="text-xl font-normal text-[#171717] dark:text-[#fafafa]">
                {formatPrice(total)}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-full h-12 bg-[#171717] dark:bg-[#fafafa] text-white dark:text-[#171717] font-normal hover:opacity-80 transition-opacity"
            >
              إتمام الطلب
            </button>
          </div>
        )}
      </div>
    </Fragment>
  );
}
