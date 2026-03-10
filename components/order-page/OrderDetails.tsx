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
  MoreHorizontal,
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
  
  // Customer note inline
  const [showCustomerNote, setShowCustomerNote] = useState(false);
  const [customerNoteText, setCustomerNoteText] = useState("");

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

  const handleAddCustomerNote = async () => {
    if (!order || !customerNoteText.trim()) return;
    await onAddAdminNote(order._id, customerNoteText);
    setCustomerNoteText("");
    setShowCustomerNote(false);
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

          <div className="grid grid-cols-1 gap-4">
            {/* Customer - Phone Priority */}
            <div className="p-4 bg-[var(--system-100)]">
              <div className="flex items-center gap-2 text-[var(--system-400)] mb-2">
                <User className="w-4 h-4" />
                <span className="text-sm">Customer</span>
              </div>
              {/* Phone - Large and prominent */}
              <LockedData fallback="***">
                <p className="text-2xl font-semibold text-[var(--system-600)] mb-2">
                  {order.customerPhone}
                </p>
                <p className="font-normal text-[var(--system-600)]">{order.customerName}</p>
              </LockedData>
              
              {/* Inline Add Note */}
              {showCustomerNote ? (
                <div className="mt-3 pt-3 border-t border-[var(--system-200)]">
                  <textarea
                    value={customerNoteText}
                    onChange={(e) => setCustomerNoteText(e.target.value)}
                    placeholder="Add a note..."
                    className="w-full px-3 py-2 border border-[var(--system-200)] bg-white dark:bg-[#0a0a0a] text-sm resize-none rounded-lg"
                    rows={2}
                  />
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" onClick={() => setShowCustomerNote(false)}>Cancel</Button>
                    <Button size="sm" onClick={() => {
                      if (customerNoteText.trim()) {
                        handleAddCustomerNote();
                      }
                      setShowCustomerNote(false);
                    }}>Save</Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomerNote(true)}
                  className="mt-3 pt-3 border-t border-[var(--system-200)] text-sm text-[var(--system-400)] hover:text-[var(--system-600)] transition-colors"
                >
                  + Add note
                </button>
              )}
            </div>

            {/* Address - Separate section */}
            <div className="p-4 bg-[var(--system-100)]">
              <div className="flex items-center gap-2 text-[var(--system-400)] mb-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Address</span>
              </div>
              <LockedData fallback="***">
                <p className="text-sm text-[var(--system-600)]">{order.customerWilaya}</p>
                <p className="text-sm text-[var(--system-400)]">{order.customerCommune}</p>
              </LockedData>
            </div>
          </div>

          <div className="p-4 bg-[var(--system-100)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-[var(--system-400)]">
                <Package className="w-4 h-4" />
                <span className="text-sm">Products</span>
              </div>
              <button className="text-sm text-[var(--info)] hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add product
              </button>
            </div>
            <div className="space-y-2">
              {(order.products || []).map((item, idx: number) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-3 p-2 hover:bg-[var(--system-200)] dark:hover:bg-[#262626] rounded-lg group transition-colors"
                >
                  {/* Thumbnail placeholder */}
                  <div className="w-12 h-12 bg-[var(--system-200)] dark:bg-[var(--system-400)] rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-[var(--system-400)]" />
                    )}
                  </div>
                  
                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-normal text-[var(--system-600)] truncate">{item.name}</p>
                    {item.variant && (
                      <p className="text-sm text-[var(--system-400)]">{item.variant}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <button 
                        className="text-xs text-[var(--system-400)] hover:text-[var(--system-600)]"
                      >
                        Qty: {item.quantity}
                      </button>
                    </div>
                  </div>
                  
                  {/* Price */}
                  <p className="font-normal text-[var(--system-600)]">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                  
                  {/* 3-dots menu */}
                  <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-[var(--system-200)] dark:hover:bg-[var(--system-400)] rounded transition-all">
                    <MoreHorizontal className="w-4 h-4 text-[var(--system-400)]" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--system-200)] dark:border-[var(--system-400)] space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--system-400)]">Subtotal:</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--system-400)]">Delivery:</span>
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

          {/* Call Logs - Always Visible */}
          <div className="p-4 bg-[var(--system-100)]">
            <h3 className="font-normal text-[var(--system-600)] mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Call Logs
            </h3>
            
            {/* 4 slots for call attempts */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {(order.callLog?.slice(-4) || []).map((call, index) => {
                const bgColor = call?.outcome === "answered" ? "bg-green-500" : 
                               call?.outcome === "no_answer" ? "bg-yellow-500" : 
                               call?.outcome === "refused" ? "bg-red-500" : 
                               call?.outcome === "wrong_number" ? "bg-gray-500" :
                               "bg-[var(--system-200)]";
                const outcomeLabel = call ? CALL_OUTCOME_LABELS[call.outcome as CallLog["outcome"]]?.label : "";
                return (
                  <div 
                    key={index}
                    className={`h-2 rounded-full ${bgColor} transition-colors`}
                    title={call ? `${outcomeLabel} - ${formatDate(call.timestamp)}` : `Attempt ${index + 1}`}
                  />
                );
              })}
            </div>
            
            {/* Scrollable list on hover */}
            {order.callLog && order.callLog.length > 0 && (
              <div className="max-h-24 overflow-y-auto mb-3 space-y-1">
                {order.callLog.slice().reverse().map((call, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className={`w-2 h-2 rounded-full ${
                      call.outcome === "answered" ? "bg-green-500" : 
                      call.outcome === "no_answer" ? "bg-yellow-500" : 
                      call.outcome === "refused" ? "bg-red-500" : "bg-gray-500"
                    }`} />
                    <span className="text-[var(--system-400)]">{CALL_OUTCOME_LABELS[call.outcome as CallLog["outcome"]]?.label}</span>
                    <span className="text-[var(--system-300)] ms-auto">{formatDate(call.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Call action buttons */}
            <div className="flex gap-2">
              {(["answered", "no_answer", "refused"] as const).map((outcome) => (
                <Button
                  key={outcome}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setCallOutcome(outcome);
                    handleAddCallLog();
                  }}
                >
                  {CALL_OUTCOME_LABELS[outcome]?.label}
                </Button>
              ))}
            </div>
          </div>

          {/* State-based Actions */}
          <div className="p-4 bg-[var(--system-100)]">
            <h3 className="font-normal text-[var(--system-600)] mb-3">Actions</h3>
            
            {order.status === "new" && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  className="h-16 text-lg"
                  onClick={() => onStatusChange(order._id, "confirmed")}
                >
                  Confirm
                </Button>
                <Button
                  variant="danger"
                  className="h-16 text-lg"
                  onClick={() => onStatusChange(order._id, "canceled")}
                >
                  Cancel
                </Button>
              </div>
            )}
            
            {order.status === "confirmed" && (
              <Button
                className="w-full h-16 text-lg"
                onClick={() => onStatusChange(order._id, "packaged")}
              >
                Send to delivery company
              </Button>
            )}
            
            {order.status === "packaged" && (
              <Button
                className="w-full h-16 text-lg"
                onClick={() => onStatusChange(order._id, "shipped")}
              >
                Print label
              </Button>
            )}
            
            {order.status === "shipped" && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  className="h-16 text-lg"
                  onClick={() => onStatusChange(order._id, "succeeded")}
                >
                  Succeed
                </Button>
                <Button
                  variant="outline"
                  className="h-16 text-lg"
                  onClick={() => onStatusChange(order._id, "router")}
                >
                  Router
                </Button>
              </div>
            )}
            
            {order.status === "succeeded" && (
              <p className="text-center text-[var(--system-400)] py-4">Order completed - no actions available</p>
            )}
            
            {order.status === "router" && (
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => onStatusChange(order._id, "confirmed")}
                >
                  Return to Confirmed
                </Button>
                <Button
                  variant="danger"
                  className="w-full"
                  onClick={() => onStatusChange(order._id, "canceled")}
                >
                  Cancel
                </Button>
              </div>
            )}
            
            {order.status === "canceled" && (
              <Button
                className="w-full"
                onClick={() => onStatusChange(order._id, "new")}
              >
                Reopen Order
              </Button>
            )}
            
            {order.status === "blocked" && (
              <Button
                className="w-full"
                onClick={() => onStatusChange(order._id, "new")}
              >
                Unblock / Reopen
              </Button>
            )}
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
