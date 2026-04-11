"use client";

import { useState, useCallback, useMemo } from "react";
import Image from "next/image";
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
import { Button } from "@/components/primitives/core/buttons/button";
import { LockedData } from "@/components/pages/layout/locked-overlay";
import { Sheet, SheetContent, SheetTitle } from "@/components/primitives/ui/sheet";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/primitives/ui/hover-card";
import type { AdminNote, CallLog, OrderStatus } from "@/lib/orders-types";
import {
  STATUS_LABELS,
  CALL_OUTCOME_LABELS,
} from "@/lib/orders-types";

interface OrderProductItem {
  productId: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  variant?: string;
}

interface AdminNoteItem {
  id: string;
  text: string;
  timestamp: number;
  merchantId: string;
}
import { STATUS_CONFIG } from "@/lib/status-icons";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants & Pure Helpers
// ---------------------------------------------------------------------------

const MAX_CALL_SLOTS = 4;

const PRICE_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "DZD",
  minimumFractionDigits: 0,
});

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatPrice(price: number): string {
  return PRICE_FORMATTER.format(price).replace('DZD', '').trim();
}

function formatDate(timestamp: number): string {
  return DATE_FORMATTER.format(new Date(timestamp));
}

function formatPhoneSpaced(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/[^\w]/g, "");
  const parts = cleaned.match(/.{1,2}/g);
  return parts ? parts.join(" ") : phone;
}

function getCallOutcomeBg(outcome?: string): string {
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
// Sub-components
// ---------------------------------------------------------------------------

function CallSlotsHover({ callLog }: { callLog: CallLog[] }) {
  const slots = useMemo(() => {
    const relevant = callLog.slice(-MAX_CALL_SLOTS);
    return Array.from({ length: MAX_CALL_SLOTS }, (_, i) => relevant[i] ?? null);
  }, [callLog]);

  const hasCalls = callLog.length > 0;

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div className="flex items-end gap-1 h-[22px] cursor-pointer">
          {slots.map((call, index) => (
            <div
              key={index}
              className={cn(
                "w-[5px] h-full border border-white/8 rounded-full transition-colors",
                call ? getCallOutcomeBg(call.outcome) : "bg-white/10"
              )}
            />
          ))}
        </div>
      </HoverCardTrigger>
      {hasCalls && (
        <HoverCardContent
          side="top"
          align="start"
          sideOffset={8}
          className="w-auto min-w-0 p-0 border-0 bg-transparent shadow-none"
        >
          <div
            className="px-3 py-2 rounded-lg text-xs text-white whitespace-nowrap"
            style={{
              background: "linear-gradient(0deg, #1D1E1F 0%, #353737 100%)",
            }}
          >
            <div className="text-[var(--system-200)] text-[10px] mb-1.5 font-medium">
              Call History
            </div>
            {callLog.slice().map((call, idx) => (
              <div key={call.id} className="flex items-center gap-2 py-0.5">
                <span className="text-[var(--system-300)] text-[10px] w-4">
                  #{idx + 1}
                </span>
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    getCallOutcomeBg(call.outcome)
                  )}
                />
                <span className="text-white/90">
                  {CALL_OUTCOME_LABELS[call.outcome]?.label || call.outcome}
                </span>
                <span className="text-white/40 text-[10px]">
                  {formatDate(call.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </HoverCardContent>
      )}
    </HoverCard>
  );
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
// Main Component
// ---------------------------------------------------------------------------

export function OrderDetails({
  order,
  isOpen,
  onClose,
  onStatusChange,
  onAddCallLog,
  onAddAdminNote,
}: OrderDetailsProps) {
  // ── Data ────────────────────────────────────────────────────────────────
  // Use order prop directly - parent updates local state after mutations
  
  const [newNote, setNewNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleAddCallLog = useCallback(
    async (outcome: CallLog["outcome"]) => {
      if (!order) return;
      try {
        await onAddCallLog(order._id, outcome);
      } catch (error) {
        console.error("Failed to add call log:", error);
      }
    },
    [order, onAddCallLog],
  );

  const handleAddNote = async () => {
    if (!order || !newNote.trim() || isSavingNote) return;
    setNoteError(null);
    setIsSavingNote(true);
    try {
      await onAddAdminNote(order._id, newNote);
      setNewNote("");
    } catch {
      setNoteError("Failed to save note. Please try again.");
    } finally {
      setIsSavingNote(false);
    }
  };

  if (!order) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()} >
      <SheetContent 
        side="right"
        showCloseButton={false}
        className="overflow-hidden bg-[var(--system-600)] w-full sm:max-w-[420px] h-[calc(100vh-1rem)] flex flex-col outline-none gap-0 rounded-2xl mx-2 my-2 p-0 border-none"
      > 
        {/* Header - Sticky using Flex */}
        <div className="flex items-center justify-between w-full p-4 bg-[var(--system-600)]/80 backdrop-blur-md border-b border-white/10 z-20">
          <SheetTitle className="text-[var(--system-300)] body-base font-normal">
            #{order.orderNumber}
          </SheetTitle>
          {(() => {
            const statusConfig = STATUS_CONFIG[order.status as OrderStatus];
            return (
              <span 
                className="overflow-hidden rounded-[10px] inline-flex items-center gap-1.5 px-2 py-1 label-xs shadow-[var(--shadow-badge)]"
                style={{ 
                  backgroundColor: statusConfig?.bgColor || '#6b728028',
                  color: statusConfig?.textColor || '#ffffff33',
                }}
              >
                {statusConfig?.icon}
                {statusConfig?.label || order.status}
              </span>
            );
          })()}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-2 p-5">
          {/* Customer Section */}
          <section className="flex flex-col gap-2 p-3.5 rounded-2xl bg-white/5 border border-white/5">
            <div className="space-y-3 body-base">
              {[
                { label: "Full Name", value: order.customerName },
                { label: "Wilaya", value: order.customerWilaya },
                { label: "Commune", value: order.customerCommune },
                { label: "Address", value: order.customerAddress },
                { label: "Date", value: formatDate(order.createdAt) },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center">
                  <span className="min-w-[100px] text-[var(--system-200)] text-sm">{item.label}</span>
                  <span className="flex-1 text-[var(--system-300)] text-sm truncate">
                    <LockedData fallback="***">{item.value}</LockedData>
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="h-px w-full px-[22px]">
                <div className="h-px w-full shrink-0" style={{
                        background: "rgba(242, 242, 242, 0.10)",
                        boxShadow: "0 1px 0 0 rgba(0, 0, 0, 0.40)",
                }} />
              </div>

          {/* Products Section */}
          <section className="flex flex-col gap-2 p-3.5 rounded-2xl bg-white/5 border border-white/5">
            <div className="space-y-3">
              {(order.products ?? []).map((item: OrderProductItem, idx: number) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/10">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} width={40} height={40} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-white/30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="body-base text-[var(--system-100)] text-sm truncate">{item.name}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="bg-white/10 rounded-md px-2 py-0.5 text-[10px] text-white">
                        Qty: {item.quantity}
                      </span>
                      {item.variant && (
                        <span className="bg-white/10 rounded-md px-2 py-0.5 text-[10px] text-white truncate max-w-[100px]">
                          {item.variant}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-white font-medium text-sm">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="h-px w-full px-[22px]">
                <div className="h-px w-full shrink-0" style={{
                        background: "rgba(242, 242, 242, 0.10)",
                        boxShadow: "0 1px 0 0 rgba(0, 0, 0, 0.40)",
                }} />
              </div>

          {/* Totals Section */}
          <section className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
            <div className="flex justify-between items-center text-[var(--system-200)] text-sm">
              <span>Subtotal</span>
              <span className="text-white">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-[var(--system-200)] text-sm">
              <div className="flex items-center gap-2">
                <span>Delivery</span>
                {order.deliveryType && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/10 text-[var(--system-100)] text-[10px]">
                    {order.deliveryType === "home" ? <Home className="w-2.5 h-2.5" /> : <Building2 className="w-2.5 h-2.5" />}
                    <span className="capitalize">{order.deliveryType}</span>
                  </span>
                )}
              </div>
              <span className="text-white">{formatPrice(order.deliveryCost)}</span>
            </div>
            <div className="h-px bg-white/10 my-1" />
            <div className="flex justify-between items-center text-white font-semibold text-base">
              <span>Total Price</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </section>

          <div className="h-px w-full px-[22px]">
                <div className="h-px w-full shrink-0" style={{
                        background: "rgba(242, 242, 242, 0.10)",
                        boxShadow: "0 1px 0 0 rgba(0, 0, 0, 0.40)",
                }} />
              </div>

          {/* Admin Notes Section */}
          <section className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
            <h3 className="text-sm font-medium text-white/80">Admin Notes</h3>
            
            {(order.adminNotes ?? []).length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
                {(order.adminNotes ?? []).slice().reverse().map((note: AdminNoteItem) => (
                  <div key={note.id} className="p-2.5 rounded-xl bg-[var(--note-bg)] border border-[var(--note-border)] ">
                    <p className="text-sm text-[var(--note-text)]">{note.text}</p>
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
              className="w-full px-3 py-2 bg-black/20 text-white text-sm resize-none rounded-xl border border-white/10 focus:outline-none focus:border-white/30 transition-colors"
              rows={3}
            />
            {noteError && <p className="text-xs text-destructive">{noteError}</p>}
            
            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAddNote}
                disabled={!newNote.trim() || isSavingNote}
                className="bg-white/10 hover:bg-white/20 text-white border-white/10 h-8 px-4"
              >
                {isSavingNote ? "Saving..." : "Save Note"}
              </Button>
            </div>
          </section>
        </div>

        {/* Footer - Sticky using Flex */}
        <footer className="p-5 flex flex-col gap-3 bg-[var(--system-600)]/80 backdrop-blur-md border-t border-white/10 z-20">
          {/* Phone Number Display */}
          <div className="flex items-center justify-center py-3 rounded-2xl bg-black/40 border border-white/5">
            <h2 className="text-2xl font-bold text-white tracking-wider">
              <LockedData fallback="*** *** ***">
                {formatPhoneSpaced(order.customerPhone)}
              </LockedData>
            </h2>
          </div>

          {/* Call Controls */}
          <div className="flex items-center justify-between px-1">
            <CallSlotsHover callLog={(order.callLog ?? []) as CallLog[]} />
            <div className="flex gap-2">
              <CallButton 
                outcome="answered" 
                icon={<Phone className="w-3.5 h-3.5" />} 
                label="Answered"
                bg="bg-[#1bc57d]"
                onClick={() => handleAddCallLog("answered")}
              />
              <CallButton 
                outcome="no_answer" 
                icon={<PhoneMissed className="w-4 h-4" />} 
                bg="bg-[#fa9a34]"
                onClick={() => handleAddCallLog("no_answer")}
              />
              <CallButton 
                outcome="refused" 
                icon={<PhoneOff className="w-4 h-4" />} 
                bg="bg-[#f44055]"
                onClick={() => handleAddCallLog("refused")}
              />
            </div>
          </div>

          <div className="h-px w-full px-[22px]">
                <div className="h-px w-full shrink-0" style={{
                        background: "rgba(242, 242, 242, 0.10)",
                        boxShadow: "0 1px 0 0 rgba(0, 0, 0, 0.40)",
                }} />
              </div>

          {/* Status Actions */}
          <div className="w-full">
            <StatusActionButtons status={order.status as OrderStatus} orderId={order._id} onStatusChange={onStatusChange} />
          </div>
        </footer>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Helper Components (Local)
// ---------------------------------------------------------------------------


function CallButton({ outcome, icon, label, bg, onClick }: { 
  outcome: string, icon: React.ReactNode, label?: string, bg: string, onClick: () => void 
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "text-[10px] font-medium h-7 px-3 rounded-lg text-white flex items-center justify-center gap-1.5 transition-all hover:opacity-90 active:scale-95 cursor-pointer",
        bg
      )}
    >
      {icon} {label}
    </button>
  );
}

function StatusActionButtons({ status, orderId, onStatusChange }: { 
  status: OrderStatus, orderId: string, onStatusChange: (id: string, s: string) => void 
}) {
  switch (status) {
    case "new":
      return (
        <div className="flex gap-3 w-full">
          <ActionButton
            label="Confirm"
            targetStatus="confirmed"
            icon={<CheckCircle className="w-5 h-5" />}
            onClick={() => onStatusChange(orderId, "confirmed")}
          />
          <ActionButton
            label="Cancel"
            targetStatus="canceled"
            icon={<X className="w-5 h-5" />}
            onClick={() => onStatusChange(orderId, "canceled")}
          />
        </div>
      );
    case "confirmed":
      return (
        <ActionButton
          label="Send to delivery company"
          targetStatus="packaged"
          icon={<Package className="w-5 h-5" />}
          onClick={() => onStatusChange(orderId, "packaged")}
        />
      );
    case "packaged":
      return (
        <ActionButton
          label="Print label"
          targetStatus="shipped"
          icon={<Package className="w-5 h-5" />}
          onClick={() => onStatusChange(orderId, "shipped")}
        />
      );
    case "shipped":
      return (
        <div className="flex gap-3 w-full">
          <ActionButton
            label="Succeed"
            targetStatus="succeeded"
            icon={<CheckCircle className="w-5 h-5" />}
            onClick={() => onStatusChange(orderId, "succeeded")}
          />
          <ActionButton
            label="Return (Router)"
            targetStatus="router"
            icon={<Package className="w-5 h-5" />}
            onClick={() => onStatusChange(orderId, "router")}
          />
        </div>
      );
    case "succeeded":
      return <p className="text-center text-white/40 text-sm py-2">Order completed</p>;
    case "router":
      return (
        <div className="flex gap-3 w-full">
          <ActionButton
            label="Return to Confirmed"
            targetStatus="confirmed"
            icon={<CheckCircle className="w-5 h-5" />}
            onClick={() => onStatusChange(orderId, "confirmed")}
          />
          <ActionButton
            label="Cancel Order"
            targetStatus="canceled"
            icon={<X className="w-5 h-5" />}
            onClick={() => onStatusChange(orderId, "canceled")}
          />
        </div>
      );
    case "canceled":
    case "blocked":
      return (
        <ActionButton
          label="Reopen Order"
          targetStatus="new"
          icon={<CheckCircle className="w-5 h-5" />}
          onClick={() => onStatusChange(orderId, "new")}
        />
      );
    default:
      return null;
  }
}

function ActionButton({ label, targetStatus, icon, onClick }: {
  label: string, targetStatus: OrderStatus, icon?: React.ReactNode, onClick: () => void
}) {
  const statusConfig = STATUS_CONFIG[targetStatus];
  
  if (!statusConfig) {
    // Fallback styling if status config not found
    return (
      <button
        onClick={onClick}
        className="flex-1 py-3.5 rounded-2xl border-2 font-semibold text-sm flex flex-col items-center justify-center gap-1.5 transition-all outline-none cursor-pointer bg-white/10 border-white/30 text-white hover:bg-white/20"
      >
        {icon && <div className="p-1">{icon}</div>}
        {label}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex-1 py-3.5 rounded-2xl border-2 font-semibold text-sm flex flex-col items-center justify-center gap-1.5 transition-all outline-none cursor-pointer overflow-hidden"
      style={{
        backgroundColor: statusConfig.bgColor,
        borderColor: statusConfig.textColor + '40', // Add opacity to border
        color: statusConfig.textColor,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = statusConfig.textColor + '20'; // Darker on hover
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = statusConfig.bgColor;
      }}
    >
      {icon && <div className="p-1" style={{ color: statusConfig.textColor }}>{icon}</div>}
      {label}
    </button>
  );
}
