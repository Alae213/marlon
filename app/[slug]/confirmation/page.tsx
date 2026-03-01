"use client";

import Link from "next/link";
import { CheckCircle, ShoppingBag, ArrowRight } from "lucide-react";

export default function OrderConfirmationPage() {
  const orderId = "ORD-" + Math.random().toString(36).substring(2, 8).toUpperCase();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
          تم استلام طلبك بنجاح
        </h1>
        
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          شكراً لطلبك! سنقوم بالاتصال بك قريباً لتأكيد الطلب
        </p>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShoppingBag className="w-5 h-5 text-zinc-400" />
            <span className="text-sm text-zinc-500">رقم الطلب</span>
          </div>
          <p className="text-2xl font-mono font-bold text-[#00853f]">
            {orderId}
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/marlon"
            className="w-full h-12 bg-[#00853f] text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-[#007537] transition-colors"
          >
            متابعة التسوق
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
