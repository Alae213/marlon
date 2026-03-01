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
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 end-0 z-50 w-full max-w-md bg-white dark:bg-zinc-900 shadow-2xl animate-in slide-in-from-end duration-300 overflow-hidden flex flex-col">
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            سلة المشتريات
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-zinc-500 mb-4">سلة المشتريات فارغة</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700"
              >
                {item.image && (
                  <div className="w-20 h-20 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-50 truncate">
                    {item.name}
                  </h3>
                  {item.variant && (
                    <p className="text-sm text-zinc-500">{item.variant}</p>
                  )}
                  <p className="text-[#00853f] font-bold mt-1">
                    {formatPrice(item.price)}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors me-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="sticky bottom-0 p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-zinc-600 dark:text-zinc-400">المجموع</span>
              <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {formatPrice(total)}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-full h-12 bg-[#00853f] text-white rounded-xl font-medium hover:bg-[#007537] transition-colors"
            >
              إتمام الطلب
            </button>
          </div>
        )}
      </div>
    </Fragment>
  );
}
