"use client";

import { useState } from "react";
import { Search, Filter, Download } from "lucide-react";

const MOCK_ORDERS = [
  {
    id: "1",
    orderNumber: "ORD-001",
    customerName: "أحمد محمد",
    customerPhone: "0551 23 45 67",
    customerWilaya: "الجزائر",
    total: 4500,
    status: "new",
    createdAt: Date.now(),
  },
  {
    id: "2",
    orderNumber: "ORD-002",
    customerName: "سارة علي",
    customerPhone: "0661 98 76 54",
    customerWilaya: "وهران",
    total: 3200,
    status: "confirmed",
    createdAt: Date.now() - 86400000,
  },
  {
    id: "3",
    orderNumber: "ORD-003",
    customerName: "كريم يوسف",
    customerPhone: "0770 11 22 33",
    customerWilaya: "قسنطينة",
    total: 6800,
    status: "shipped",
    createdAt: Date.now() - 172800000,
  },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: "جديد", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  confirmed: { label: "مؤكد", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  packaged: { label: "مُعبأ", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  shipped: { label: "مُشحن", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" },
  succeeded: { label: "مُنجز", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  canceled: { label: "ملغى", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orders] = useState(MOCK_ORDERS);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('ar-DZ', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(timestamp));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">الطلبات</h1>
        <button className="flex items-center gap-2 px-5 py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-xl font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
          <Download className="w-5 h-5" />
          تصدير
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث برقم الطلب أو اسم العميل..."
                className="w-full h-11 ps-12 pe-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#00853f] focus:border-transparent transition-all"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#00853f] focus:border-transparent transition-all"
            >
              <option value="all">جميع الحالات</option>
              <option value="new">جديد</option>
              <option value="confirmed">مؤكد</option>
              <option value="packaged">مُعبأ</option>
              <option value="shipped">مُشحن</option>
              <option value="succeeded">مُنجز</option>
              <option value="canceled">ملغى</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-start">
                <th className="px-4 py-3 text-sm font-medium text-zinc-500">الطلب</th>
                <th className="px-4 py-3 text-sm font-medium text-zinc-500">العميل</th>
                <th className="px-4 py-3 text-sm font-medium text-zinc-500">الولاية</th>
                <th className="px-4 py-3 text-sm font-medium text-zinc-500">المجموع</th>
                <th className="px-4 py-3 text-sm font-medium text-zinc-500">الحالة</th>
                <th className="px-4 py-3 text-sm font-medium text-zinc-500">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredOrders.map((order) => (
                <tr 
                  key={order.id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-4">
                    <span className="font-mono text-sm font-medium text-[#00853f]">
                      {order.orderNumber}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">
                        {order.customerName}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {order.customerPhone}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-zinc-600 dark:text-zinc-400">
                    {order.customerWilaya}
                  </td>
                  <td className="px-4 py-4 font-medium text-zinc-900 dark:text-zinc-50">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${STATUS_LABELS[order.status]?.color || "bg-zinc-100 text-zinc-700"}`}>
                      {STATUS_LABELS[order.status]?.label || order.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-zinc-500">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-zinc-500">لا توجد طلبات مطابقة</p>
          </div>
        )}
      </div>
    </div>
  );
}
