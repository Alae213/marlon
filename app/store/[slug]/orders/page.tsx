"use client";

import { useState, useMemo } from "react";
import { 
  Search, 
  Download, 
  ChevronDown, 
  ChevronUp,
  Phone,
  PhoneOff,
  User,
  MapPin,
  Package,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowUpDown,
  MessageSquare
} from "lucide-react";
import { SlideOver, Badge, Button } from "@/components/core";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  variant?: string;
}

interface CallLog {
  id: string;
  timestamp: number;
  outcome: "answered" | "no_answer" | "wrong_number" | "refused";
  notes?: string;
}

interface AuditEntry {
  id: string;
  timestamp: number;
  action: string;
  details: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerWilaya: string;
  customerCommune: string;
  customerAddress: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCost: number;
  total: number;
  status: "new" | "confirmed" | "packaged" | "shipped" | "succeeded" | "canceled" | "blocked" | "hold";
  deliveryType: "home" | "office" | "stop_desk";
  trackingNumber?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  callLog: CallLog[];
  auditTrail: AuditEntry[];
}

const MOCK_ORDERS: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-001",
    customerName: "أحمد محمد",
    customerPhone: "0551 23 45 67",
    customerWilaya: "الجزائر",
    customerCommune: "الجزائر الوسطى",
    customerAddress: "شارع جديد، عمارة 5، شقة 12",
    items: [
      { id: "1", name: "سماعة بلوتوث", quantity: 1, price: 2500, variant: "أسود" },
      { id: "2", name: "كفر حماية", quantity: 2, price: 1000, variant: "شفاف" },
    ],
    subtotal: 4500,
    deliveryCost: 0,
    total: 4500,
    status: "new",
    deliveryType: "home",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    callLog: [],
    auditTrail: [
      { id: "1", timestamp: Date.now(), action: "created", details: "تم إنشاء الطلب" },
    ],
  },
  {
    id: "2",
    orderNumber: "ORD-002",
    customerName: "سارة علي",
    customerPhone: "0661 98 76 54",
    customerWilaya: "وهران",
    customerCommune: "وهران",
    customerAddress: "حي الصباح، رقم 15",
    items: [
      { id: "3", name: "ساعة ذكية", quantity: 1, price: 3200 },
    ],
    subtotal: 3200,
    deliveryCost: 500,
    total: 3700,
    status: "confirmed",
    deliveryType: "office",
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 43200000,
    callLog: [
      { id: "1", timestamp: Date.now() - 43200000, outcome: "answered", notes: "أكد العميل الطلب" },
    ],
    auditTrail: [
      { id: "1", timestamp: Date.now() - 86400000, action: "created", details: "تم إنشاء الطلب" },
      { id: "2", timestamp: Date.now() - 43200000, action: "status_change", details: "تم تأكيد الطلب" },
    ],
  },
  {
    id: "3",
    orderNumber: "ORD-003",
    customerName: "كريم يوسف",
    customerPhone: "0770 11 22 33",
    customerWilaya: "قسنطينة",
    customerCommune: "قسنطينة",
    customerAddress: "الطريق الوطني رقم 5",
    items: [
      { id: "4", name: "لابتوب", quantity: 1, price: 6800 },
    ],
    subtotal: 6800,
    deliveryCost: 600,
    total: 7400,
    status: "shipped",
    deliveryType: "home",
    trackingNumber: "ZR-2024-001234",
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 86400000,
    callLog: [],
    auditTrail: [
      { id: "1", timestamp: Date.now() - 172800000, action: "created", details: "تم إنشاء الطلب" },
      { id: "2", timestamp: Date.now() - 129600000, action: "status_change", details: "تم تأكيد الطلب" },
      { id: "3", timestamp: Date.now() - 86400000, action: "status_change", details: "تم الشحن" },
    ],
  },
  {
    id: "4",
    orderNumber: "ORD-004",
    customerName: "فاطمة الزهراء",
    customerPhone: "0698 44 55 66",
    customerWilaya: "باتنة",
    customerCommune: "باتنة",
    customerAddress: "حي الشهيد، بلوك ب",
    items: [
      { id: "5", name: "keyboard ميكانيكي", quantity: 1, price: 4500, variant: "أحمر" },
    ],
    subtotal: 4500,
    deliveryCost: 450,
    total: 4950,
    status: "packaged",
    deliveryType: "stop_desk",
    createdAt: Date.now() - 259200000,
    updatedAt: Date.now() - 172800000,
    callLog: [],
    auditTrail: [],
  },
  {
    id: "5",
    orderNumber: "ORD-005",
    customerName: "ياسين bouteldja",
    customerPhone: "0555 77 88 99",
    customerWilaya: "تيبازة",
    customerCommune: "تيارت",
    customerAddress: "شارع الاستقلال",
    items: [
      { id: "6", name: "ماوس لاسلكي", quantity: 2, price: 1500 },
    ],
    subtotal: 3000,
    deliveryCost: 400,
    total: 3400,
    status: "succeeded",
    deliveryType: "home",
    trackingNumber: "YL-2024-005678",
    createdAt: Date.now() - 432000000,
    updatedAt: Date.now() - 259200000,
    callLog: [],
    auditTrail: [],
  },
];

const STATUS_LABELS: Record<string, { label: string; variant: "info" | "warning" | "success" | "danger" | "default" }> = {
  new: { label: "جديد", variant: "info" },
  confirmed: { label: "مؤكد", variant: "warning" },
  packaged: { label: "مُعبأ", variant: "default" },
  shipped: { label: "مُشحن", variant: "info" },
  succeeded: { label: "مُنجز", variant: "success" },
  canceled: { label: "ملغى", variant: "danger" },
  blocked: { label: "محجوب", variant: "danger" },
  hold: { label: "معلق", variant: "warning" },
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  new: ["confirmed", "canceled", "hold"],
  confirmed: ["packaged", "canceled", "hold"],
  packaged: ["shipped", "canceled", "hold"],
  shipped: ["succeeded", "canceled", "hold"],
  succeeded: [],
  canceled: [],
  blocked: ["new"],
  hold: ["new", "canceled"],
};

const DELIVERY_TYPE_LABELS: Record<string, string> = {
  home: "توصيل للمنزل",
  office: "توصيل للمكتب",
  stop_desk: "نقطة استلام",
};

const CALL_OUTCOME_LABELS: Record<CallLog["outcome"], { label: string; icon: React.ReactNode }> = {
  answered: { label: "تم الرد", icon: <Phone className="w-4 h-4" /> },
  no_answer: { label: "لا رد", icon: <PhoneOff className="w-4 h-4" /> },
  wrong_number: { label: "رقم خطأ", icon: <AlertCircle className="w-4 h-4" /> },
  refused: { label: "رفض", icon: <XCircle className="w-4 h-4" /> },
};

type SortField = "date" | "total" | "status";
type SortDirection = "asc" | "desc";

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [callOutcome, setCallOutcome] = useState<CallLog["outcome"] | null>(null);
  const [callNotes, setCallNotes] = useState("");

  const filteredOrders = useMemo(() => {
    let orders = [...MOCK_ORDERS];
    
    const matchesSearch = 
      searchQuery === "" ||
      orders.some(order => 
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerPhone.includes(searchQuery)
      );
    
    if (!matchesSearch) {
      orders = orders.filter(order =>
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerPhone.includes(searchQuery)
      );
    }

    if (statusFilter !== "all") {
      orders = orders.filter(order => order.status === statusFilter);
    }

    if (dateFilter !== "all") {
      const now = Date.now();
      const dayMs = 86400000;
      orders = orders.filter(order => {
        switch (dateFilter) {
          case "today":
            return order.createdAt > now - dayMs;
          case "week":
            return order.createdAt > now - (dayMs * 7);
          case "month":
            return order.createdAt > now - (dayMs * 30);
          default:
            return true;
        }
      });
    }

    orders.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "date":
          comparison = a.createdAt - b.createdAt;
          break;
        case "total":
          comparison = a.total - b.total;
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return orders;
  }, [searchQuery, statusFilter, dateFilter, sortField, sortDirection]);

  const newOrdersCount = MOCK_ORDERS.filter(o => o.status === "new").length;

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (!selectedOrder) return;
    setSelectedOrder({
      ...selectedOrder,
      status: newStatus as Order["status"],
      updatedAt: Date.now(),
      auditTrail: [
        ...selectedOrder.auditTrail,
        {
          id: String(Date.now()),
          timestamp: Date.now(),
          action: "status_change",
          details: `تم تغيير الحالة إلى ${STATUS_LABELS[newStatus]?.label || newStatus}`,
        },
      ],
    });
  };

  const handleAddCallLog = () => {
    if (!selectedOrder || !callOutcome) return;
    const newCallLog: CallLog = {
      id: String(Date.now()),
      timestamp: Date.now(),
      outcome: callOutcome,
      notes: callNotes || undefined,
    };
    setSelectedOrder({
      ...selectedOrder,
      callLog: [...selectedOrder.callLog, newCallLog],
      auditTrail: [
        ...selectedOrder.auditTrail,
        {
          id: String(Date.now()),
          timestamp: Date.now(),
          action: "call",
          details: `مكالمة: ${CALL_OUTCOME_LABELS[callOutcome].label}${callNotes ? ` - ${callNotes}` : ""}`,
        },
      ],
    });
    setCallOutcome(null);
    setCallNotes("");
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 opacity-30" />;
    return sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">الطلبات</h1>
          {newOrdersCount > 0 && (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-xl font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
          <Download className="w-5 h-5" />
          تصدير
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px] relative">
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
              <option value="hold">معلق</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#00853f] focus:border-transparent transition-all"
            >
              <option value="all">جميع التواريخ</option>
              <option value="today">اليوم</option>
              <option value="week">هذا الأسبوع</option>
              <option value="month">هذا الشهر</option>
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
                <th 
                  className="px-4 py-3 text-sm font-medium text-zinc-500 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center gap-1">
                    الحالة
                    <SortIcon field="status" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-sm font-medium text-zinc-500 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center gap-1">
                    التاريخ
                    <SortIcon field="date" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredOrders.map((order) => (
                <tr 
                  key={order.id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <td className="px-4 py-4">
                    <span className="font-mono text-sm font-medium text-[#00853f]">
                      {order.orderNumber}
                    </span>
                    {order.status === "new" && (
                      <span className="ms-2 inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
                    )}
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
                    <Badge variant={STATUS_LABELS[order.status]?.variant || "default"}>
                      {STATUS_LABELS[order.status]?.label || order.status}
                    </Badge>
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

      <SlideOver
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`طلب ${selectedOrder?.orderNumber}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Badge variant={STATUS_LABELS[selectedOrder.status]?.variant || "default"}>
                {STATUS_LABELS[selectedOrder.status]?.label || selectedOrder.status}
              </Badge>
              <span className="text-sm text-zinc-500">{formatDate(selectedOrder.createdAt)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800">
                <div className="flex items-center gap-2 text-zinc-500 mb-2">
                  <User className="w-4 h-4" />
                  <span className="text-sm">العميل</span>
                </div>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{selectedOrder.customerName}</p>
                <p className="text-sm text-zinc-500">{selectedOrder.customerPhone}</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800">
                <div className="flex items-center gap-2 text-zinc-500 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">العنوان</span>
                </div>
                <p className="text-sm text-zinc-900 dark:text-zinc-50">{selectedOrder.customerWilaya}</p>
                <p className="text-sm text-zinc-500">{selectedOrder.customerCommune}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800">
              <div className="flex items-center gap-2 text-zinc-500 mb-3">
                <Package className="w-4 h-4" />
                <span className="text-sm">المنتجات</span>
              </div>
              <div className="space-y-3">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">{item.name}</p>
                      {item.variant && (
                        <p className="text-sm text-zinc-500">{item.variant} × {item.quantity}</p>
                      )}
                    </div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">المجموع:</span>
                  <span>{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">التوصيل:</span>
                  <span>{formatPrice(selectedOrder.deliveryCost)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>الإجمالي:</span>
                  <span>{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800">
              <div className="flex items-center gap-2 text-zinc-500 mb-3">
                <Truck className="w-4 h-4" />
                <span className="text-sm">معلومات التوصيل</span>
              </div>
              <p className="text-sm text-zinc-900 dark:text-zinc-50">
                {DELIVERY_TYPE_LABELS[selectedOrder.deliveryType]}
              </p>
              {selectedOrder.trackingNumber && (
                <p className="text-sm text-zinc-500 mt-1">
                  رقم التتبع: <span className="font-mono">{selectedOrder.trackingNumber}</span>
                </p>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                سجل المكالمات
                <span className="text-sm font-normal text-zinc-500">({selectedOrder.callLog.length})</span>
              </h3>
              {selectedOrder.callLog.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedOrder.callLog.map((call) => (
                    <div key={call.id} className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-start gap-3">
                      <span className={call.outcome === "answered" ? "text-green-500" : "text-red-500"}>
                        {CALL_OUTCOME_LABELS[call.outcome].icon}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {CALL_OUTCOME_LABELS[call.outcome].label}
                        </p>
                        {call.notes && (
                          <p className="text-xs text-zinc-500">{call.notes}</p>
                        )}
                        <p className="text-xs text-zinc-400">{formatDate(call.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">لا توجد مكالمات مسجلة</p>
              )}
              
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 mb-3">تسجيل مكالمة</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(["answered", "no_answer", "wrong_number", "refused"] as const).map((outcome) => (
                    <button
                      key={outcome}
                      onClick={() => setCallOutcome(outcome)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        callOutcome === outcome
                          ? "bg-[#00853f] text-white"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {CALL_OUTCOME_LABELS[outcome].label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="ملاحظات (اختياري)..."
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none"
                  rows={2}
                />
                <Button
                  onClick={handleAddCallLog}
                  disabled={!callOutcome}
                  className="w-full mt-3"
                  size="sm"
                >
                  تسجيل المكالمة
                </Button>
              </div>
            </div>

            {selectedOrder.auditTrail.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  سجل التغييرات
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedOrder.auditTrail.slice().reverse().map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3 text-sm">
                      <CheckCircle className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-zinc-900 dark:text-zinc-50">{entry.details}</p>
                        <p className="text-xs text-zinc-400">{formatDate(entry.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="font-medium text-zinc-900 dark:text-zinc-50">الإجراءات</h3>
              <div className="flex flex-wrap gap-2">
                {STATUS_TRANSITIONS[selectedOrder.status]?.map((status) => (
                  <Button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    variant={status === "canceled" ? "danger" : "primary"}
                    size="sm"
                  >
                    {status === "confirmed" && "تأكيد"}
                    {status === "packaged" && "تعبيئة"}
                    {status === "shipped" && "شحن"}
                    {status === "succeeded" && "تسليم"}
                    {status === "canceled" && "إلغاء"}
                    {status === "hold" && "تعليق"}
                    {status === "new" && "إعادة فتح"}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
}
