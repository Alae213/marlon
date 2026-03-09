"use client";

import { useState } from "react";
import { Doc } from "@/convex/_generated/dataModel";
import { 
  Phone,
  User,
  MapPin,
  Package,
  Truck,
  Clock,
  CheckCircle,
  MessageSquare,
  FileText,
  Plus,
} from "lucide-react";
import { SlideOver, Badge, Button } from "@/components/core";
import { LockedData } from "@/components/locked-overlay";
import type { 
  CallLog,
  Order,
  OrderStatus,
  AdminNote
} from "@/lib/orders-types";
import { 
  STATUS_LABELS, 
  CALL_OUTCOME_LABELS, 
  STATUS_TRANSITIONS,
  DELIVERY_TYPE_LABELS 
} from "@/lib/orders-types";

interface OrderDetailsProps {
  order: Doc<"orders"> | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (orderId: string, newStatus: string) => void;
  onAddCallLog: (orderId: string, outcome: CallLog["outcome"], notes?: string) => Promise<void>;
  onAddAdminNote: (orderId: string, text: string) => Promise<void>;
  userId?: string;
}

export function OrderDetails({
  order,
  isOpen,
  onClose,
  onStatusChange,
  onAddCallLog,
  onAddAdminNote,
  userId,
}: OrderDetailsProps) {
  const [callOutcome, setCallOutcome] = useState<CallLog["outcome"] | null>(null);
  const [callNotes, setCallNotes] = useState("");
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [showAddNote, setShowAddNote] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(timestamp));
  };

  const handleAddCallLog = async () => {
    if (!order || !callOutcome) return;
    await onAddCallLog(order._id, callOutcome, callNotes || undefined);
    setCallOutcome(null);
    setCallNotes("");
  };

  const handleAddAdminNote = async () => {
    if (!order || !newNote.trim()) return;
    await onAddAdminNote(order._id, newNote);
    setNewNote("");
    setShowAddNote(false);
  };

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      title={`Order ${order?.orderNumber}`}
    >
      {order && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Badge variant={STATUS_LABELS[order.status as OrderStatus]?.variant || "default"}>
              {STATUS_LABELS[order.status as OrderStatus]?.label || order.status}
            </Badge>
            <span className="text-sm text-[#737373]">{formatDate(order.createdAt)}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#fafafa] dark:bg-[#171717]">
              <div className="flex items-center gap-2 text-[#737373] mb-2">
                <User className="w-4 h-4" />
                <span className="text-sm">Customer</span>
              </div>
              <LockedData fallback="***">
                <p className="font-normal text-[#171717] dark:text-[#fafafa]">{order.customerName}</p>
                <p className="text-sm text-[#737373]">{order.customerPhone}</p>
              </LockedData>
            </div>
            <div className="p-4 bg-[#fafafa] dark:bg-[#171717]">
              <div className="flex items-center gap-2 text-[#737373] mb-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Address</span>
              </div>
              <LockedData fallback="***">
                <p className="text-sm text-[#171717] dark:text-[#fafafa]">{order.customerWilaya}</p>
                <p className="text-sm text-[#737373]">{order.customerCommune}</p>
              </LockedData>
            </div>
          </div>

          <div className="p-4 bg-[#fafafa] dark:bg-[#171717]">
            <div className="flex items-center gap-2 text-[#737373] mb-3">
              <Package className="w-4 h-4" />
              <span className="text-sm">Products</span>
            </div>
            <div className="space-y-3">
              {(order.products || []).map((item, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <p className="font-normal text-[#171717] dark:text-[#fafafa]">{item.name}</p>
                    {item.variant && (
                      <p className="text-sm text-[#737373]">{item.variant} x {item.quantity}</p>
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
                <span className="text-[#737373]">Subtotal:</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#737373]">Delivery:</span>
                <span>{formatPrice(order.deliveryCost)}</span>
              </div>
              <div className="flex justify-between font-normal">
                <span>Total:</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#fafafa] dark:bg-[#171717]">
            <div className="flex items-center gap-2 text-[#737373] mb-3">
              <Truck className="w-4 h-4" />
              <span className="text-sm">Delivery Info</span>
            </div>
            <p className="text-sm text-[#171717] dark:text-[#fafafa]">
              {DELIVERY_TYPE_LABELS[order.deliveryType as Order["deliveryType"]] || order.deliveryType}
            </p>
            {order.trackingNumber && (
              <p className="text-sm text-[#737373] mt-1">
                Tracking: <span className="font-mono">{order.trackingNumber}</span>
              </p>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="font-normal text-[#171717] dark:text-[#fafafa] flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Call Log
              <span className="text-sm font-normal text-[#737373]">({order.callLog?.length || 0})</span>
            </h3>
            {order.callLog && order.callLog.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {(order.callLog || []).map((call) => (
                  <div key={call.id} className="p-3 bg-[#fafafa] dark:bg-[#171717] flex items-start gap-3">
                    <span className={call.outcome === "answered" ? "text-[#16a34a]" : "text-[#dc2626]"}>
                      {CALL_OUTCOME_LABELS[call.outcome as CallLog["outcome"]]?.icon}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-normal text-[#171717] dark:text-[#fafafa]">
                        {CALL_OUTCOME_LABELS[call.outcome as CallLog["outcome"]]?.label}
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
              <p className="text-sm text-[#737373]">No calls recorded</p>
            )}
            
            <div className="p-4 border border-[#e5e5e5] dark:border-[#404040]">
              <p className="text-sm font-normal text-[#171717] dark:text-[#fafafa] mb-3">Record Call</p>
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
                placeholder="Notes (optional)..."
                className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#404040] bg-white dark:bg-[#171717] text-sm resize-none"
                rows={2}
              />
              <Button
                onClick={handleAddCallLog}
                disabled={!callOutcome}
                className="w-full mt-3"
                size="sm"
              >
                Record Call
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-normal text-[#171717] dark:text-[#fafafa]">Actions</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddNote(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Note
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAuditTrail(!showAuditTrail)}
              >
                <FileText className="w-3.5 h-3.5" />
                Change Log
              </Button>
            </div>
          </div>

          {showAddNote && (
            <div className="p-4 border border-[#e5e5e5] dark:border-[#404040] bg-[#fafafa] dark:bg-[#171717]">
              <p className="text-sm font-normal text-[#171717] dark:text-[#fafafa] mb-3">Add Note</p>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Private note (not visible to customer)..."
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
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddAdminNote}
                  disabled={!newNote.trim()}
                  className="flex-1"
                >
                  Save
                </Button>
              </div>
            </div>
          )}

          {order.adminNotes && order.adminNotes.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-normal text-[#171717] dark:text-[#fafafa] flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Notes ({(order.adminNotes || []).length})
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {(order.adminNotes || []).slice().reverse().map((note: AdminNote) => (
                  <div key={note.id} className="p-3 bg-[#fef3c7] dark:bg-[#78350f] border border-[#fcd34d] dark:border-[#92400e]">
                    <p className="text-sm text-[#171717] dark:text-[#fafafa]">{note.text}</p>
                    <p className="text-xs text-[#a3a3a3] mt-1">{formatDate(note.timestamp)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showAuditTrail && order.auditTrail && order.auditTrail.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-normal text-[#171717] dark:text-[#fafafa] flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Change Log
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {(order.auditTrail || []).slice().reverse().map((entry) => (
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
            <h3 className="font-normal text-[#171717] dark:text-[#fafafa]">Change Status</h3>
            <div className="flex flex-wrap gap-2">
              {(STATUS_TRANSITIONS[order.status as OrderStatus] || []).map((status) => (
                <Button
                  key={status}
                  onClick={() => onStatusChange(order._id, status)}
                  variant={status === "canceled" ? "danger" : "primary"}
                  size="sm"
                >
                  {status === "confirmed" && "Confirm"}
                  {status === "packaged" && "Package"}
                  {status === "shipped" && "Ship"}
                  {status === "succeeded" && "Complete"}
                  {status === "canceled" && "Cancel"}
                  {status === "router" && "Router"}
                  {status === "blocked" && "Block"}
                  {status === "new" && "Reopen"}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </SlideOver>
  );
}
