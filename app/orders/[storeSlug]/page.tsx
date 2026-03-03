"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { 
  Search, 
  Download, 
  ChevronDown, 
  ChevronUp,
  Phone,
  User,
  MapPin,
  Package,
  Truck,
  Clock,
  CheckCircle,
  ArrowUpDown,
  MessageSquare,
  FileText,
  Plus,
  Loader2,
  ArrowLeft,
  Home
} from "lucide-react";
import { SlideOver, Badge, Button } from "@/components/core";
import { LockedData } from "@/components/locked-overlay";
import { useBilling, BillingProvider } from "@/contexts/billing-context";
import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import type { 
  SortField, 
  SortDirection, 
  Order, 
  CallLog, 
  AdminNote 
} from "@/lib/orders-types";
import { 
  STATUS_LABELS, 
  CALL_OUTCOME_LABELS, 
  STATUS_TRANSITIONS,
  DELIVERY_TYPE_LABELS 
} from "@/lib/orders-types";
import { RealtimeProvider } from "@/contexts/realtime-context";

function OrdersContent({ storeId, storeSlug }: { storeId: string; storeSlug: string }) {
  const { user } = useUser();
  const { isLocked } = useBilling();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [callOutcome, setCallOutcome] = useState<CallLog["outcome"] | null>(null);
  const [callNotes, setCallNotes] = useState("");
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [showAddNote, setShowAddNote] = useState(false);

  const orders = useQuery(
    api.orders.getOrders,
    storeId ? { storeId: storeId as Id<"stores"> } : "skip"
  );

  const updateOrderStatus = useMutation(api.orders.updateOrderStatus);
  const addCallLogMutation = useMutation(api.orders.addCallLog);
  const addAdminNoteMutation = useMutation(api.orders.addAdminNote);
  const cleanupLockedOrders = useMutation(api.stores.cleanupLockedStoreOrders);

  useEffect(() => {
    // Clean up orders from locked stores older than 20 days
    cleanupLockedOrders({});
  }, [cleanupLockedOrders]);

  const ordersData = orders || [];

  const filteredOrders = useMemo(() => {
    let filtered = [...ordersData];
    
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerPhone.includes(searchQuery)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (dateFilter !== "all") {
      const now = Date.now();
      const dayMs = 86400000;
      filtered = filtered.filter(order => {
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

    filtered.sort((a, b) => {
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

    return filtered;
  }, [ordersData, searchQuery, statusFilter, dateFilter, sortField, sortDirection]);

  const newOrdersCount = ordersData.filter(o => o.status === "new").length;

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

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedOrder) return;
    
    try {
      await updateOrderStatus({
        orderId: selectedOrder._id as any,
        status: newStatus,
      });
      
      setSelectedOrder({
        ...selectedOrder,
        status: newStatus as any,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleAddCallLog = async () => {
    if (!selectedOrder || !callOutcome) return;
    
    try {
      await addCallLogMutation({
        orderId: selectedOrder._id as any,
        outcome: callOutcome,
        notes: callNotes || undefined,
      });
      
      setSelectedOrder({
        ...selectedOrder,
        callLog: [...(selectedOrder.callLog || []), {
          id: `call_${Date.now()}`,
          timestamp: Date.now(),
          outcome: callOutcome,
          notes: callNotes || undefined,
        }],
      });
      
      setCallOutcome(null);
      setCallNotes("");
    } catch (error) {
      console.error("Failed to add call log:", error);
    }
  };

  const handleAddAdminNote = async () => {
    if (!selectedOrder || !newNote.trim()) return;
    
    try {
      await addAdminNoteMutation({
        orderId: selectedOrder._id as any,
        text: newNote,
        merchantId: user?.id || "unknown",
      });
      
      setSelectedOrder({
        ...selectedOrder,
        adminNotes: [...(selectedOrder.adminNotes || []), {
          id: `note_${Date.now()}`,
          text: newNote,
          timestamp: Date.now(),
          merchantId: user?.id || "unknown",
        }],
      });
      
      setNewNote("");
      setShowAddNote(false);
    } catch (error) {
      console.error("Failed to add admin note:", error);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />;
    return sortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with Logo, Back Button, and User Profile */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#e5e5e5] dark:border-[#262626]">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-[#f5f5f5] dark:hover:bg-[#171717] rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#525252] dark:text-[#d4d4d4]" />
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#171717] dark:bg-[#fafafa] rounded-full flex items-center justify-center">
              <Home className="w-4 h-4 text-white dark:text-[#171717]" />
            </div>
            <span className="font-medium text-[#171717] dark:text-[#fafafa]">متجري</span>
          </Link>
        </div>
        <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
      </div>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-normal text-[#171717] dark:text-[#fafafa]">الطلبات</h1>
          {newOrdersCount > 0 && (
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-[#dc2626] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#dc2626]"></span>
            </span>
          )}
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-[#e5e5e5] dark:border-[#404040] text-[#525252] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] transition-colors text-sm">
          <Download className="w-4 h-4" />
          تصدير
        </button>
      </div>

      <div className="bg-white dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] overflow-hidden">
        <div className="p-4 border-b border-[#e5e5e5] dark:border-[#262626]">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3a3a3]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث برقم الطلب أو اسم العميل..."
                className="w-full h-11 ps-11 pe-4 bg-[#fafafa] dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#404040] text-[#171717] dark:text-[#fafafa] placeholder:text-[#a3a3a3] focus:outline-none focus:border-[#171717] dark:focus:border-[#fafafa] transition-colors"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 px-4 bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#404040] text-[#171717] dark:text-[#fafafa] focus:outline-none focus:border-[#171717] dark:focus:border-[#fafafa] transition-colors text-sm"
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
              className="h-11 px-4 bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#404040] text-[#171717] dark:text-[#fafafa] focus:outline-none focus:border-[#171717] dark:focus:border-[#fafafa] transition-colors text-sm"
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
              <tr className="border-b border-[#e5e5e5] dark:border-[#262626] text-start">
                <th className="px-4 py-3 text-sm font-normal text-[#737373]">الطلب</th>
                <th className="px-4 py-3 text-sm font-normal text-[#737373]">العميل</th>
                <th className="px-4 py-3 text-sm font-normal text-[#737373]">الولاية</th>
                <th className="px-4 py-3 text-sm font-normal text-[#737373]">المجموع</th>
                <th 
                  className="px-4 py-3 text-sm font-normal text-[#737373] cursor-pointer hover:text-[#171717] dark:hover:text-[#fafafa] transition-colors"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center gap-1">
                    الحالة
                    <SortIcon field="status" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-sm font-normal text-[#737373] cursor-pointer hover:text-[#171717] dark:hover:text-[#fafafa] transition-colors"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center gap-1">
                    التاريخ
                    <SortIcon field="date" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5] dark:divide-[#262626]">
              {filteredOrders.map((order) => (
                <tr 
                  key={order._id}
                  className="hover:bg-[#f5f5f5] dark:hover:bg-[#171717]/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <td className="px-4 py-4">
                    <span className="font-mono text-sm font-normal text-[#171717] dark:text-[#fafafa]">
                      {order.orderNumber}
                    </span>
                    {order.status === "new" && (
                      <span className="ms-2 inline-flex h-2 w-2 rounded-full bg-[#2563eb]"></span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <LockedData fallback="***">
                        <p className="font-normal text-[#171717] dark:text-[#fafafa]">
                          {order.customerName}
                        </p>
                        <p className="text-sm text-[#737373]">
                          {order.customerPhone}
                        </p>
                      </LockedData>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[#525252] dark:text-[#a3a3a3]">
                    <LockedData fallback="***">
                      {order.customerWilaya}
                    </LockedData>
                  </td>
                  <td className="px-4 py-4 font-normal text-[#171717] dark:text-[#fafafa]">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={(STATUS_LABELS as any)[order.status]?.variant || "default"}>
                      {(STATUS_LABELS as any)[order.status]?.label || order.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#737373]">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-[#737373]">لا توجد طلبات مطابقة</p>
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
              <Badge variant={(STATUS_LABELS as any)[selectedOrder.status]?.variant || "default"}>
                {(STATUS_LABELS as any)[selectedOrder.status]?.label || selectedOrder.status}
              </Badge>
              <span className="text-sm text-[#737373]">{formatDate(selectedOrder.createdAt)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#fafafa] dark:bg-[#171717]">
                <div className="flex items-center gap-2 text-[#737373] mb-2">
                  <User className="w-4 h-4" />
                  <span className="text-sm">العميل</span>
                </div>
                <LockedData fallback="***">
                  <p className="font-normal text-[#171717] dark:text-[#fafafa]">{selectedOrder.customerName}</p>
                  <p className="text-sm text-[#737373]">{selectedOrder.customerPhone}</p>
                </LockedData>
              </div>
              <div className="p-4 bg-[#fafafa] dark:bg-[#171717]">
                <div className="flex items-center gap-2 text-[#737373] mb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">العنوان</span>
                </div>
                <LockedData fallback="***">
                  <p className="text-sm text-[#171717] dark:text-[#fafafa]">{selectedOrder.customerWilaya}</p>
                  <p className="text-sm text-[#737373]">{selectedOrder.customerCommune}</p>
                </LockedData>
              </div>
            </div>

            <div className="p-4 bg-[#fafafa] dark:bg-[#171717]">
              <div className="flex items-center gap-2 text-[#737373] mb-3">
                <Package className="w-4 h-4" />
                <span className="text-sm">المنتجات</span>
              </div>
              <div className="space-y-3">
                {(selectedOrder.products || []).map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div>
                      <p className="font-normal text-[#171717] dark:text-[#fafafa]">{item.name}</p>
                      {item.variant && (
                        <p className="text-sm text-[#737373]">{item.variant} × {item.quantity}</p>
                      )}
                    </div>
                    <p className="font-normal text-[#171717] dark:text-[#fafafa]">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-[#e5e5e5] dark:border-[#404040] space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#737373]">المجموع:</span>
                  <span>{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#737373]">التوصيل:</span>
                  <span>{formatPrice(selectedOrder.deliveryCost)}</span>
                </div>
                <div className="flex justify-between font-normal">
                  <span>الإجمالي:</span>
                  <span>{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#fafafa] dark:bg-[#171717]">
              <div className="flex items-center gap-2 text-[#737373] mb-3">
                <Truck className="w-4 h-4" />
                <span className="text-sm">معلومات التوصيل</span>
              </div>
              <p className="text-sm text-[#171717] dark:text-[#fafafa]">
                {(DELIVERY_TYPE_LABELS as any)[selectedOrder.deliveryType] || selectedOrder.deliveryType}
              </p>
              {selectedOrder.trackingNumber && (
                <p className="text-sm text-[#737373] mt-1">
                  رقم التتبع: <span className="font-mono">{selectedOrder.trackingNumber}</span>
                </p>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="font-normal text-[#171717] dark:text-[#fafafa] flex items-center gap-2">
                <Phone className="w-4 h-4" />
                سجل المكالمات
                <span className="text-sm font-normal text-[#737373]">({selectedOrder.callLog?.length || 0})</span>
              </h3>
              {selectedOrder.callLog && selectedOrder.callLog.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(selectedOrder.callLog || []).map((call: any) => (
                    <div key={call.id} className="p-3 bg-[#fafafa] dark:bg-[#171717] flex items-start gap-3">
                      <span className={call.outcome === "answered" ? "text-[#16a34a]" : "text-[#dc2626]"}>
                        {(CALL_OUTCOME_LABELS as any)[call.outcome]?.icon}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-normal text-[#171717] dark:text-[#fafafa]">
                          {(CALL_OUTCOME_LABELS as any)[call.outcome]?.label}
                        </p>
                        {call.notes && (
                          <p className="text-xs text-[#737373]">{call.notes}</p>
                        )}
                        <p className="text-xs text-[#a3a3a3]">{formatDate(call.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#737373]">لا توجد مكالمات مسجلة</p>
              )}
              
              <div className="p-4 border border-[#e5e5e5] dark:border-[#404040]">
                <p className="text-sm font-normal text-[#171717] dark:text-[#fafafa] mb-3">تسجيل مكالمة</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(["answered", "no_answer", "wrong_number", "refused"] as const).map((outcome) => (
                    <button
                      key={outcome}
                      onClick={() => setCallOutcome(outcome)}
                      className={`px-3 py-1.5 text-sm transition-colors ${
                        callOutcome === outcome
                          ? "bg-[#171717] text-white"
                          : "bg-[#f5f5f5] dark:bg-[#262626] text-[#525252] dark:text-[#a3a3a3] hover:bg-[#e5e5e5] dark:hover:bg-[#404040]"
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
                  className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#404040] bg-white dark:bg-[#171717] text-sm resize-none"
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

            <div className="space-y-3">
              <h3 className="font-normal text-[#171717] dark:text-[#fafafa]">الإجراءات</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddNote(true)}
                >
                  <Plus className="w-3.5 h-3.5" />
                  إضافة ملاحظة
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAuditTrail(!showAuditTrail)}
                >
                  <FileText className="w-3.5 h-3.5" />
                  سجل التغييرات
                </Button>
              </div>
            </div>

            {showAddNote && (
              <div className="p-4 border border-[#e5e5e5] dark:border-[#404040] bg-[#fafafa] dark:bg-[#171717]">
                <p className="text-sm font-normal text-[#171717] dark:text-[#fafafa] mb-3">إضافة ملاحظة</p>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="ملاحظة خاصة (لا تظهر للعميل)..."
                  className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#404040] bg-white dark:bg-[#0a0a0a] text-sm resize-none"
                  rows={3}
                />
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddNote(false)}
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddAdminNote}
                    disabled={!newNote.trim()}
                    className="flex-1"
                  >
                    حفظ
                  </Button>
                </div>
              </div>
            )}

            {selectedOrder.adminNotes && selectedOrder.adminNotes.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-normal text-[#171717] dark:text-[#fafafa] flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  الملاحظات ({(selectedOrder.adminNotes || []).length})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(selectedOrder.adminNotes || []).slice().reverse().map((note: any) => (
                    <div key={note.id} className="p-3 bg-[#fef3c7] dark:bg-[#78350f] border border-[#fcd34d] dark:border-[#92400e]">
                      <p className="text-sm text-[#171717] dark:text-[#fafafa]">{note.text}</p>
                      <p className="text-xs text-[#a3a3a3] mt-1">{formatDate(note.timestamp)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showAuditTrail && selectedOrder.auditTrail && selectedOrder.auditTrail.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-normal text-[#171717] dark:text-[#fafafa] flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  سجل التغييرات
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(selectedOrder.auditTrail || []).slice().reverse().map((entry: any) => (
                    <div key={entry.id} className="flex items-start gap-3 text-sm">
                      <CheckCircle className="w-4 h-4 text-[#a3a3a3] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[#171717] dark:text-[#fafafa]">{entry.details}</p>
                        <p className="text-xs text-[#a3a3a3]">{formatDate(entry.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="font-normal text-[#171717] dark:text-[#fafafa]">تغيير الحالة</h3>
              <div className="flex flex-wrap gap-2">
                {((STATUS_TRANSITIONS as any)[selectedOrder.status] || []).map((status: any) => (
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

      {/* Fixed Bottom Navigation - 200px centered */}
      <div className="fixed bottom-4 start-1/2 -translate-x-1/2 bg-white dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] rounded-full px-6 py-2 flex justify-around items-center z-40 shadow-lg w-[200px]">
        <Link
          href={`/editor/${storeSlug}`}
          className="flex flex-col items-center gap-1 text-[#a3a3a3] dark:text-[#525252] hover:text-[#171717] dark:hover:text-[#fafafa]"
        >
          <Package className="w-5 h-5" />
          <span className="text-xs">المنتجات</span>
        </Link>
        <div
          className="flex flex-col items-center gap-1 text-[#171717] dark:text-[#fafafa]"
        >
          <Truck className="w-5 h-5" />
          <span className="text-xs">الطلبات</span>
        </div>
      </div>
      
      {/* Add padding bottom to avoid content being hidden behind fixed nav */}
      <div className="h-20"></div>
    </div>
  );
}

export default function OrdersPage() {
  const params = useParams();
  const storeSlug = params?.storeSlug as string;
  
  const store = useQuery(
    api.stores.getStoreBySlug,
    storeSlug ? { slug: storeSlug } : "skip"
  );
  
  const storeId = store?._id as string | undefined;
  
  if (!store && storeSlug) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-[#171717] dark:text-[#fafafa]" />
      </div>
    );
  }
  
  if (!storeId) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] p-12 text-center">
          <p className="text-[#737373]">المتجر غير موجود</p>
        </div>
      </div>
    );
  }
  
  return (
    <BillingProvider storeSlug={storeSlug} storeId={storeId}>
      <RealtimeProvider storeId={storeId}>
        <OrdersContent storeId={storeId} storeSlug={storeSlug} />
      </RealtimeProvider>
    </BillingProvider>
  );
}
