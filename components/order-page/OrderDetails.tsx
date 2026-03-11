"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import {
  Phone,
  Package,
  Clock,
  CheckCircle,
  MoreHorizontal,
  ChevronDown,
  X,
  PhoneOff,
  PhoneMissed,
  Home,
  Building2
} from "lucide-react";
import { Button } from "@/components/core";
import { LockedData } from "@/components/locked-overlay";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import type { AdminNote, CallLog, OrderStatus } from "@/lib/orders-types";
import {
  STATUS_LABELS,
  CALL_OUTCOME_LABELS,
} from "@/lib/orders-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrderProduct {
  productId: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  variant?: string;
}

interface AuditTrailEntry {
  id: string;
  timestamp: number;
  action: string;
  details: string;
}

interface CallLogEntry {
  id: string;
  timestamp: number;
  outcome: "answered" | "no_answer" | "wrong_number" | "refused";
  notes?: string;
}

interface OrderDetailsProps {
  order: Doc<"orders"> | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (orderId: string, newStatus: string) => void;
  onAddCallLog: (
    orderId: string,
    outcome: CallLog["outcome"],
    notes?: string,
  ) => Promise<void>;
  onAddAdminNote: (orderId: string, text: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Constants & pure helpers  (defined outside the component – no re-creation)
// ---------------------------------------------------------------------------

const MAX_CALL_SLOTS = 4;

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "DZD",
    minimumFractionDigits: 0,
  }).format(price);
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function formatPhoneSpaced(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/[^\w]/g, "");
  const parts = cleaned.match(/.{1,2}/g);
  return parts ? parts.join(" ") : phone;
}

function callOutcomeBg(outcome?: string): string {
  switch (outcome) {
    case "answered":
      return "bg-[#1bc57d]";
    case "no_answer":
      return "bg-[#fa9a34]";
    case "refused":
      return "bg-[#f44055]";
    case "wrong_number":
      return "bg-[var(--system-400)]";
    default:
      return "bg-[var(--system-200)]";
  }
}

// ---------------------------------------------------------------------------
// CallSlots sub-component
// ---------------------------------------------------------------------------

function CallSlotsHover({ callLog }: { callLog: CallLog[] }) {
  const slots: (CallLog | null)[] = Array.from(
    { length: MAX_CALL_SLOTS },
    (_, i) => {
      const relevant = callLog.slice(-MAX_CALL_SLOTS);
      return relevant[i] ?? null;
    },
  );

  return (
    <div className="flex items-end gap-1 h-[22px]">
      {slots.map((call, index) => (
        <HoverCard key={index} openDelay={200} closeDelay={100}>
          <HoverCardTrigger asChild>
            <div
              className={`w-[5px] border-[1px] border-white/8 rounded-[12px] transition-colors cursor-default  ${
                call ? callOutcomeBg(call.outcome) : "bg-white/10"
              }`}
              style={{ height:"100%" }}
            />
          </HoverCardTrigger>
          {call && (
            <HoverCardContent
              side="top"
              align="center"
              sideOffset={8}
              className="w-auto min-w-0 p-0 border-0 bg-transparent shadow-none"
            >
              <div
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white whitespace-nowrap"
                style={{
                  background: "linear-gradient(0deg, #1D1E1F 0%, #353737 100%)",
                }}
              >
                {CALL_OUTCOME_LABELS[call.outcome as CallLog["outcome"]]?.label}
                <span className="text-white/50 ms-1.5">
                  {formatDate(call.timestamp)}
                </span>
              </div>
            </HoverCardContent>
          )}
        </HoverCard>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function OrderDetails({
  order: initialOrder,
  isOpen,
  onClose,
  onStatusChange,
  onAddCallLog,
  onAddAdminNote,
}: OrderDetailsProps) {
  // ── Live Data ─────────────────────────────────────────────────────────────
  const liveOrder = useQuery(
    api.orders.getOrder,
    initialOrder?._id ? { orderId: initialOrder._id as Id<"orders"> } : "skip"
  );
  const order = liveOrder || initialOrder;

  // ── Notes ───────────────────────────────────────────
  const [newNote, setNewNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);

  // ── Audit trail toggle ────────────────────────────────────────────────────
  const [showAuditTrail, setShowAuditTrail] = useState(false);

  // ── Container for Portals ──────────────────────────────────────────────
  const sheetContentRef = useRef<HTMLDivElement>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddCallLog = useCallback(
    async (outcome: CallLog["outcome"]) => {
      if (!order) return;
      await onAddCallLog(order._id, outcome);
    },
    [order, onAddCallLog],
  );

  const handleAddNote = async () => {
    if (!order || !newNote.trim()) return;
    setNoteError(null);
    try {
      await onAddAdminNote(order._id, newNote);
      setNewNote("");
    } catch {
      setNoteError("Failed to save note. Please try again.");
    }
  };

  if (!order) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()} >
      <SheetContent 
        ref={sheetContentRef}
        side="right"
        showCloseButton={false}
        className="overflow-hidden bg-[var(--system-600)] w-full sm:max-w-[420px] h-[calc(100vh-1rem)] flex flex-col outline-none gap-0 rounded-[22px] mx-2 my-2"
      > 

        {/* Header Fixed */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center w-full p-[12px] bg-[#1F1F1Fcf] backdrop-blur-sm border-b border-white/10 overflow-hidden gap-4">
          <div className="flex justify-between items-center w-full">
            <SheetTitle className="text-[var(--system-300)] body-base font-normal">
              #{order.orderNumber}
            </SheetTitle>
            <div className="px-2 py-0.5 rounded-full border border-[var(--blue-200)] text-[var(--blue-200)] text-xs flex items-center gap-1.5 bg-[var(--blue-200)]/10">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--blue-200)] shadow-[0_0_8px_rgba(93,160,219,0.8)]" />
              {STATUS_LABELS[order.status as OrderStatus]?.label ?? order.status}
            </div>
                   </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex flex-col gap-[12px] px-[20px] overflow-y-auto w-full scrollbar-hide pt-[60px] pb-60 flex-1">

              {/* ── Customer Info ────────────────────────────────────────────── */}
              <div className="flex flex-col gap-[8px] p-[14px] rounded-[16px] bg-white/5 ">
                <div className="w-full body-base flex flex-col gap-[12px]">
                   <div className="flex items-center">
                      <span className="min-w-[120px] text-[var(--system-200)]">Full Name</span>
                      <span className="flex-1 text-[var(--system-300)]">
                        <LockedData fallback="***">{order.customerName}</LockedData>
                      </span>
                   </div>
                   <div className="flex items-center">
                      <span className="min-w-[120px] text-[var(--system-200)]">Wilaya</span>
                      <span className="flex-1 text-[var(--system-300)]">
                        <LockedData fallback="***">{order.customerWilaya}</LockedData>
                      </span>
                   </div>
                   <div className="flex items-center">
                      <span className="min-w-[120px] text-[var(--system-200)]">Commune</span>
                      <span className="flex-1 text-[var(--system-300)]">
                        <LockedData fallback="***">{order.customerCommune}</LockedData>
                      </span>
                   </div>
                   <div className="flex items-center">
                      <span className="min-w-[120px] text-[var(--system-200)]">Address</span>
                      <span className="flex-1 text-[var(--system-300)]">
                        <LockedData fallback="***">{order.customerAddress}</LockedData>
                      </span>
                   </div>
                   <div className="flex items-center">
                      <span className="min-w-[120px] text-[var(--system-200)]">Date</span>
                      <span className="flex-1 text-[var(--system-300)]">
                         <LockedData fallback="***">{formatDate(order.createdAt)}</LockedData>
                      </span>
                   </div>
                </div>
              </div>

              <div className="h-px w-full px-[22px]">
                <div className="h-px w-full shrink-0" style={{
                        background: "rgba(242, 242, 242, 0.10)",
                        boxShadow: "0 1px 0 0 rgba(0, 0, 0, 0.40)",
                }} />
              </div>

              {/* ── Products Section ─────────────────────────────────────────── */}
              <div className="flex flex-col gap-[6px] p-[14px] rounded-[16px] bg-white/5">
                 <div className="flex flex-col gap-1.5">
                     {(order.products ?? []).map((item: OrderProduct, idx: number) => (
                       <div key={idx} className="group relative flex flex-row gap-3 items-center p-[6px]">
                          {/* Thumbnail */}
                          <div className="w-[42px] h-[42px] bg-white/5 rounded-[12px] flex-shrink-0 flex items-center justify-center overflow-hidden">
                             {item.image ? (
                                <Image src={item.image} alt={item.name} width={42} height={42} className="w-full h-full object-cover" />
                             ) : (
                                <Package className="w-5 h-5 text-white/30" />
                             )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 flex flex-col gap-[4px]">
                             <h4 className="body-base text-[var(--system-100)]">{item.name}</h4>
                             <div className="flex items-center gap-[4px]">
                                <div className="bg-white/10 border border-white/5 rounded-[12px] px-3 label-xs text-white">
                                   {item.quantity}
                                </div>
                                {item.variant && (
                                   <div className="bg-white/10 border border-white/5 rounded-[12px] px-3 label-xs text-white">
                                      {item.variant}
                                   </div>
                                )}
                             </div>
                          </div>

                          {/* Price */}
                          <div className="relative flex items-center justify-end min-w-[65px]">
                             <span className="text-white font-semibold text-base">
                                {formatPrice(item.price * item.quantity).replace('DZD','').trim()}
                             </span>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="h-px w-full px-[22px]">
                <div className="h-px w-full shrink-0" style={{
                        background: "rgba(242, 242, 242, 0.10)",
                        boxShadow: "0 1px 0 0 rgba(0, 0, 0, 0.40)",
                }} />
              </div>

              {/* ── Totals Section ───────────────────────────────────────────── */}

              <div className="p-[14px] rounded-[16px] border border-white/5 bg-white/5 flex flex-col gap-[8px]">
                 <div className="flex justify-between items-center text-[var(--system-200)] body-base">
                    <span>Subtotal</span>
                    <span className="text-white">{formatPrice(order.subtotal).replace('DZD', '').trim()}</span>
                 </div>
                 <div className="flex justify-between items-center text-[var(--system-200)] body-base">
                    <div className="flex items-center gap-2">
                       <span>Delivery</span>
                       {order.deliveryType && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[8px] bg-white/10 text-[var(--system-100)] text-[10px]">
                             {order.deliveryType === "home" ? (
                                <Building2 className="w-3 h-3" />
                             ) : (
                                <Home className="w-3 h-3" />
                             )}
                             <span className="capitalize">{order.deliveryType}</span>
                          </div>
                       )}
                    </div>
                    <span className="text-white">{formatPrice(order.deliveryCost).replace('DZD', '').trim()}</span>
                 </div>
                 <div className="h-px w-full px-[2px]">
                <div className="h-px w-full shrink-0" style={{
                        background: "rgba(242, 242, 242, 0.10)",
                        boxShadow: "0 1px 0 0 rgba(0, 0, 0, 0.20)",
                }} />
              </div>
                 <div className="flex justify-between items-center text-[var(--system-200)] body-base pt-1">
                    <span>Total Price</span>
                    <span className="text-white">{formatPrice(order.total).replace('DZD', '').trim()}</span>
                 </div>
              </div>
              
              <div className="h-px w-full px-[22px]">
                <div className="h-px w-full shrink-0" style={{
                        background: "rgba(242, 242, 242, 0.10)",
                        boxShadow: "0 1px 0 0 rgba(0, 0, 0, 0.40)",
                }} />
              </div>
              {/* ── Persistent Note Section ─────────────────────────────────── */}
              <div className="p-[14px] rounded-[16px] bg-white/5 border border-white/5 space-y-3 items-end">
                 <div className="flex justify-between items-center">
                    <span className="body-base   text-white/80">Admin Notes</span>
                 </div>
                 
                 {/* Display existing notes */}
                 {(order.adminNotes ?? []).length > 0 && (
                    <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-hide">
                       {(order.adminNotes ?? []).slice().reverse().map((note: AdminNote) => (
                          <div key={note.id} className="p-2 rounded-[12px] bg-white/5 border border-white/10">
                             <p className="text-sm text-white">{note.text}</p>
                             <p className="text-[10px] text-white/40 mt-1">{formatDate(note.timestamp)}</p>
                          </div>
                       ))}
                    </div>
                 )}
                 
                 <textarea
                    value={newNote}
                    onChange={(e) => {
                      setNewNote(e.target.value);
                      setNoteError(null);
                    }}
                    placeholder="Type a private note here..."
                    className="w-full px-3 py-2 border border-[var(--system-500)] bg-white/5 text-white label-xs resize-none rounded-[12px] focus:outline-none focus:border-white/30"
                    rows={3}
                 />
                 {noteError && (
                    <p className="label-xs text-destructive">{noteError}</p>
                 )}
                 <div className="flex justify-end">
                 <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-[10px] w-[100px] text-white border border-white/10 cursor-pointer"
                 >
                    Save Note
                 </button>
                 </div>
              </div>

            </div> {/* End Scrollable Body */}

            {/* ── Fixed Footer Actions ─────────────────────────────────────── */}
            <div className="absolute  bottom-0 left-0 right-0 w-full p-[20px] flex flex-col gap-[10px] z-10 bg-[#1F1F1Fcf] backdrop-blur-sm border-t border-white/10 pt-[12px]">
              
              <div className="flex items-center w-full px-[12px] py-[8px] justify-center rounded-[14px] bg-black/30">
                   <h2 className="text-3xl text-white">
                      <LockedData fallback="*** *** ***">
                        {formatPhoneSpaced(order.customerPhone)}
                      </LockedData>
                   </h2>
                </div>

                 {/* ── Call Logs Section ────────────────────────────────────────── */}
              <div className="px-[8px]">
                 <div className="flex items-center justify-between ">
                     <CallSlotsHover callLog={(order.callLog ?? []).map((c: CallLogEntry) => ({ ...c, outcome: c.outcome as CallLog["outcome"] }))} />
                    
                    <div className="flex gap-2">
                       <button 
                          onClick={() => handleAddCallLog("answered")}
                          className="label-xs h-[26px] py-[4px] px-[8px] rounded-[8px] bg-[#00CF7D] hover:bg-[#00CF7D]/80 text-white flex items-center justify-center gap-[8px] transition-colors cursor-pointer"
                       >
                          <Phone className="w-[14px] h-[14px]" style={{ strokeWidth: 2.5 }} /> Answered
                       </button>
                       <button 
                          onClick={() => handleAddCallLog("no_answer")}
                          className="label-xs h-[26px] py-[4px] px-[8px] rounded-[8px] bg-[#FC9239] hover:bg-[#FC9239]/80 text-white flex items-center justify-center gap-[8px] transition-colors cursor-pointer"
                       >
                          <PhoneMissed className="w-[15px] h-[15px]" style={{ strokeWidth: 2.5 }} />
                       </button>
                       <button 
                          onClick={() => handleAddCallLog("refused")}
                          className="label-xs h-[26px] py-[4px] px-[8px] rounded-[8px] bg-[#E03045] hover:bg-[#E03045]/80 text-white flex items-center justify-center gap-[8px] transition-colors cursor-pointer"
                       >
                          <PhoneOff className="w-[15px] h-[15px]" style={{ strokeWidth: 2.5 }} />
                       </button>
                    </div>
                 </div>
              </div>

              <div className="h-px w-full px-[22px]">
                <div className="h-px w-full shrink-0" style={{
                        background: "rgba(242, 242, 242, 0.10)",
                        boxShadow: "0 1px 0 0 rgba(0, 0, 0, 0.40)",
                }} />
              </div>


              {order.status === "new" && (
                <div className="flex gap-4 w-full">
                  <button
                    onClick={() => onStatusChange(order._id, "confirmed")}
                    className="flex-1 py-4 rounded-[24px] text-[#1bc57d] bg-[#1bc57d]/10 border-2 border-[#1bc57d]/60 hover:bg-[#1bc57d]/20 hover:border-[#1bc57d] font-semibold text-sm flex flex-col items-center justify-center gap-1.5 transition-all outline-none"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#1bc57d] text-[#1bc57d] flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)] relative">
                      {/* Using a custom check to match mockup perfectly */}
                      <svg width="14" height="10" viewBox="0 0 14 10" fill="none" className="text-[#102018] relative z-10">
                        <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    Confirmed
                  </button>
                  <button
                    onClick={() => onStatusChange(order._id, "canceled")}
                    className="flex-1 py-4 rounded-[24px] text-[#f44055] bg-[#f44055]/10 border-2 border-[#f44055]/60 hover:bg-[#f44055]/20 hover:border-[#f44055] font-semibold text-sm flex flex-col items-center justify-center gap-1.5 transition-all outline-none"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#f44055] flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]">
                      <X className="w-5 h-5 text-[#301015]" strokeWidth={3} />
                    </div>
                    Canceled
                  </button>
                </div>
              )}

              {order.status === "confirmed" && (
                <button
                  className="w-full py-4 rounded-[24px] text-[#5da0db] bg-[#5da0db]/10 border-2 border-[#5da0db]/60 hover:bg-[#5da0db]/20 hover:border-[#5da0db] font-semibold text-sm flex flex-col items-center justify-center gap-1.5 transition-all outline-none"
                  onClick={() => onStatusChange(order._id, "packaged")}
                >
                  <Package className="w-6 h-6 mb-1" />
                  Send to delivery company
                </button>
              )}

              {order.status === "packaged" && (
                <button
                  className="w-full py-4 rounded-[24px] text-white bg-white/10 border-2 border-white/60 hover:bg-white/20 hover:border-white font-semibold text-sm flex flex-col items-center justify-center gap-1.5 transition-all outline-none"
                  onClick={() => onStatusChange(order._id, "shipped")}
                >
                  Print label
                </button>
              )}

              {order.status === "shipped" && (
                <div className="flex gap-4 w-full">
                  <button
                    className="flex-1 py-4 rounded-[24px] text-[#1bc57d] bg-[#1bc57d]/10 border-2 border-[#1bc57d]/60 hover:bg-[#1bc57d]/20 hover:border-[#1bc57d] font-semibold text-sm flex flex-col items-center justify-center gap-1.5 transition-all outline-none"
                    onClick={() => onStatusChange(order._id, "succeeded")}
                  >
                    Succeed
                  </button>
                  <button
                    className="flex-1 py-4 rounded-[24px] text-[#fa9a34] bg-[#fa9a34]/10 border-2 border-[#fa9a34]/60 hover:bg-[#fa9a34]/20 hover:border-[#fa9a34] font-semibold text-sm flex flex-col items-center justify-center gap-1.5 transition-all outline-none"
                    onClick={() => onStatusChange(order._id, "router")}
                  >
                    Router
                  </button>
                </div>
              )}

              {order.status === "succeeded" && (
                <p className="body-base text-center text-white/50 py-2">
                  Order completed — no actions available
                </p>
              )}

              {order.status === "router" && (
                <div className="flex gap-4 w-full">
                  <button
                    className="flex-1 py-4 rounded-[24px] text-[#5da0db] bg-[#5da0db]/10 border-2 border-[#5da0db]/60 hover:bg-[#5da0db]/20 hover:border-[#5da0db] font-semibold text-sm flex flex-col items-center justify-center gap-1.5 transition-all outline-none"
                    onClick={() => onStatusChange(order._id, "confirmed")}
                  >
                    Return to Confirmed
                  </button>
                  <button
                    className="flex-1 py-4 rounded-[24px] text-[#f44055] bg-[#f44055]/10 border-2 border-[#f44055]/60 hover:bg-[#f44055]/20 hover:border-[#f44055] font-semibold text-sm flex flex-col items-center justify-center gap-1.5 transition-all outline-none"
                    onClick={() => onStatusChange(order._id, "canceled")}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {order.status === "canceled" && (
                <button
                  className="w-full py-4 rounded-[24px] text-white bg-white/10 border-2 border-white/60 hover:bg-white/20 hover:border-white font-semibold text-sm flex flex-col items-center justify-center gap-1.5 transition-all outline-none"
                  onClick={() => onStatusChange(order._id, "new")}
                >
                  Reopen Order
                </button>
              )}

              {order.status === "blocked" && (
                <button
                  className="w-full py-4 rounded-[24px] text-[#fa9a34] bg-[#fa9a34]/10 border-2 border-[#fa9a34]/60 hover:bg-[#fa9a34]/20 hover:border-[#fa9a34] font-semibold text-sm flex flex-col items-center justify-center gap-1.5 transition-all outline-none"
                  onClick={() => onStatusChange(order._id, "new")}
                >
                  Unblock / Reopen
                </button>
              )}
            </div>

      </SheetContent>
    </Sheet>
  );
}
