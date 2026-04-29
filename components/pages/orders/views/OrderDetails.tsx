"use client";

import { useState, useCallback, useMemo, useEffect, useId } from "react";
import type { ReactNode, KeyboardEvent } from "react";
import Image from "next/image";
import { Doc } from "@/convex/_generated/dataModel";
import {
  Phone,
  Package,
  CheckCircle,
  CircleAlert,
  X,
  PhoneOff,
  PhoneMissed,
  Home,
  Building2,
  Truck,
  ExternalLink,
  Clipboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LockedData } from "@/components/pages/layout/locked-overlay";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { useToast } from "@/contexts/toast-context";
import type { CallLog, CallOutcome, OrderStatus } from "@/lib/orders-types";
import {
  CALL_OUTCOME_LABELS,
  COD_PAYMENT_STATUS_LABELS,
  ORDER_RISK_FLAG_LABELS,
  getMerchantTransitionsForOrder,
  getCodPaymentStatusForOrderStatus,
  getOrderStatusLabel,
  normalizeOrderStatus,
  normalizeCodPaymentStatus,
  normalizeOrderRiskFlags,
} from "@/lib/orders-types";
import {
  getDeliveryProviderDisplay,
  getDeliveryTypeDisplay,
} from "@/lib/order-delivery-display";
import type { DeliveryActionResponse } from "@/lib/order-action-feedback";

interface OrderProductItem {
  productId: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  variant?: string;
}
import { getStatusConfig } from "@/lib/status-icons";
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

  const raw = String(phone).trim();
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");
  if (!digits) return raw;

  const parts = digits.match(/.{1,2}/g);
  const grouped = parts ? parts.join(" ") : digits;
  return hasPlus ? `+${grouped}` : grouped;
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

type NormalizedCallLogItem = {
  id: string;
  outcome?: string;
  timestamp?: number;
  notes?: string;
};

function normalizeCallLog(callLog: unknown): NormalizedCallLogItem[] {
  if (!Array.isArray(callLog)) return [];

  return callLog
    .map((item, idx): NormalizedCallLogItem | null => {
      if (!item || typeof item !== "object") {
        return { id: `call-${idx}` };
      }

      const obj = item as Record<string, unknown>;
      const rawId = obj.id ?? obj._id;
      const id =
        typeof rawId === "string" && rawId
          ? rawId
          : typeof rawId === "number"
            ? String(rawId)
            : undefined;

      const outcome = typeof obj.outcome === "string" ? obj.outcome : undefined;
      const timestamp =
        typeof obj.timestamp === "number"
          ? obj.timestamp
          : typeof obj.createdAt === "number"
            ? obj.createdAt
            : undefined;

      const fallbackId = `call-${timestamp ?? "na"}-${idx}`;
      return {
        id: id ?? fallbackId,
        outcome,
        timestamp,
        notes: typeof obj.notes === "string" ? obj.notes : undefined,
      };
    })
    .filter((item): item is NormalizedCallLogItem => Boolean(item));
}

type NormalizedTimelineItem = {
  id: string;
  status: string;
  timestamp: number;
  note?: string;
};

function normalizeTimeline(timeline: unknown): NormalizedTimelineItem[] {
  if (!Array.isArray(timeline)) return [];

  return timeline
    .map((item, idx): NormalizedTimelineItem | null => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const status = typeof obj.status === "string" ? obj.status : undefined;
      const timestamp = typeof obj.timestamp === "number" ? obj.timestamp : undefined;
      if (!status || typeof timestamp !== "number") return null;

      return {
        id: `${status}-${timestamp}-${idx}`,
        status,
        timestamp,
        note: typeof obj.note === "string" ? obj.note : undefined,
      };
    })
    .filter((item): item is NormalizedTimelineItem => Boolean(item));
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CallSlotsHover({ callLog }: { callLog: NormalizedCallLogItem[] }) {
  const [isPointerInside, setIsPointerInside] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isToggled, setIsToggled] = useState(false);

  const slots = useMemo(() => {
    const relevant = callLog.slice(-MAX_CALL_SLOTS);
    return Array.from({ length: MAX_CALL_SLOTS }, (_, i) => relevant[i] ?? null);
  }, [callLog]);

  const hasCalls = callLog.length > 0;
  const open = hasCalls && (isPointerInside || isFocused || isToggled);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsToggled((v) => !v);
      return;
    }
    if (e.key === "Escape") {
      setIsToggled(false);
    }
  }, []);

  const triggerLabel = hasCalls ? "Call history" : "Call history (no calls)";

  return (
    <HoverCard
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setIsToggled(false);
      }}
      openDelay={200}
      closeDelay={100}
    >
      <HoverCardTrigger asChild>
        <button
          type="button"
          aria-label={triggerLabel}
          aria-expanded={open}
          onPointerEnter={() => setIsPointerInside(true)}
          onPointerLeave={() => setIsPointerInside(false)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            setIsToggled(false);
          }}
          onKeyDown={handleKeyDown}
          className="flex items-end gap-1 h-[22px] cursor-pointer bg-transparent border-0 p-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          {slots.map((call, index) => (
            <div
              key={index}
              className={cn(
                "w-[5px] h-full border border-white/8 rounded-full transition-colors motion-reduce:transition-none",
                call ? getCallOutcomeBg(call.outcome) : "bg-white/10"
              )}
            />
          ))}
        </button>
      </HoverCardTrigger>
      {hasCalls && (
        <HoverCardContent
          side="top"
          align="start"
          sideOffset={8}
          className="w-auto min-w-0 p-0 border-0 bg-transparent shadow-none"
        >
          <div
            className="whitespace-nowrap rounded-lg px-3 py-2 text-white"
            style={{
              background: "linear-gradient(0deg, #1D1E1F 0%, #353737 100%)",
            }}
          >
            <div className="text-micro-label mb-1.5 text-[var(--system-200)]">
              Call History
            </div>
            {callLog.slice().map((call, idx) => (
              <div key={call.id} className="flex items-center gap-2 py-0.5">
                <span className="text-caption w-4 text-[var(--system-300)]">
                  #{idx + 1}
                </span>
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    getCallOutcomeBg(call.outcome)
                  )}
                />
                <span className="text-body-sm text-white/90">
                  {call.outcome
                    ? CALL_OUTCOME_LABELS[call.outcome as CallLog["outcome"]]?.label || call.outcome
                    : "Unknown"}
                </span>
                <span className="text-caption text-white/40">
                  {typeof call.timestamp === "number" ? formatDate(call.timestamp) : "Unknown time"}
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
  onStatusChange: (orderId: string, newStatus: string, note?: string) => void;
  onAddCallLog: (
    orderId: string,
    outcome: CallLog["outcome"],
    notes?: string,
  ) => Promise<void>;
  onUpsertAdminNote: (orderId: string, text: string) => Promise<void>;
  isStatusUpdating?: boolean;
  storeSlug?: string;
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
  onUpsertAdminNote,
  isStatusUpdating = false,
  storeSlug,
}: OrderDetailsProps) {
  // ── Data ────────────────────────────────────────────────────────────────
  // Use order prop directly - parent updates local state after mutations
  
  const currentAdminNoteText = typeof order?.adminNoteText === "string" ? order.adminNoteText : "";
  const currentAdminNoteUpdatedAt = typeof order?.adminNoteUpdatedAt === "number" ? order.adminNoteUpdatedAt : undefined;

  const [adminNoteDraft, setAdminNoteDraft] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const noteTextareaId = useId();
  const noteErrorId = useId();
  const callNoteTextareaId = useId();

  const [callNoteDraft, setCallNoteDraft] = useState("");
  const [callLogError, setCallLogError] = useState<string | null>(null);
  const [isSavingCallLog, setIsSavingCallLog] = useState(false);

  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [dispatchAction, setDispatchAction] = useState<DeliveryActionResponse["action"] | null>(null);
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  const { showToast } = useToast();

  const resetNoteState = useCallback((nextDraft: string) => {
    setAdminNoteDraft(nextDraft);
    setIsSavingNote(false);
    setNoteError(null);
  }, []);

  // ── Dispatch Handler ─────────────────────────────────────────────────────

  const handleDispatch = useCallback(async () => {
    if (!order || isDispatching) return;
    setDispatchError(null);
    setDispatchAction(null);
    setIsDispatching(true);

    try {
      const response = await fetch("/api/delivery/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order._id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerWilaya: order.customerWilaya,
          customerCommune: order.customerCommune,
          customerAddress: order.customerAddress,
          products: order.products,
          total: order.total,
          provider: order.deliveryProvider || "zr_express",
          storeSlug,
        }),
      });

      const data = (await response.json().catch(() => null)) as DeliveryActionResponse | null;

      if (data?.success) {
        showToast("Order dispatched", "success");
      } else {
        setDispatchError(data?.error || "Delivery provider is temporarily unavailable. Please try again.");
        setDispatchAction(data?.action ?? null);
      }
    } catch {
      setDispatchError("Failed to dispatch order. Please try again.");
      setDispatchAction(null);
    } finally {
      setIsDispatching(false);
    }
  }, [order, isDispatching, showToast, storeSlug]);

  // ── Copy Order Info Handler ───────────────────────────────────────────────

  const handleCopyOrderInfo = useCallback(async () => {
    if (!order) return;
    
    const infoText = `Name: ${order.customerName || ""}
Phone: ${order.customerPhone || ""}
Address: ${order.customerAddress || ""}, ${order.customerCommune || ""}, ${order.customerWilaya || ""}`;

    try {
      await navigator.clipboard.writeText(infoText);
      setCopiedFeedback(true);
      showToast("Copied!", "success");
      setTimeout(() => setCopiedFeedback(false), 2000);
    } catch {
      showToast("Failed to copy", "error");
    }
  }, [order, showToast]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleAddCallLog = useCallback(
    async (outcome: CallOutcome) => {
      if (!order || isSavingCallLog) return;
      setCallLogError(null);
      setIsSavingCallLog(true);
      try {
        const note = callNoteDraft.trim();
        await onAddCallLog(order._id, outcome, note || undefined);
        setCallNoteDraft("");
      } catch {
        setCallLogError("Failed to save call log. Please try again.");
      } finally {
        setIsSavingCallLog(false);
      }
    },
    [order, onAddCallLog, isSavingCallLog, callNoteDraft],
  );

  const hasAdminNoteChanged = adminNoteDraft.trim() !== currentAdminNoteText.trim();

  const handleSaveAdminNote = useCallback(async () => {
    if (!order || isSavingNote || !hasAdminNoteChanged) return;
    setNoteError(null);
    setIsSavingNote(true);
    try {
      await onUpsertAdminNote(order._id, adminNoteDraft);
    } catch {
      setNoteError("Failed to save note. Please try again.");
    } finally {
      setIsSavingNote(false);
    }
  }, [order, isSavingNote, hasAdminNoteChanged, onUpsertAdminNote, adminNoteDraft]);

  useEffect(() => {
    if (!isOpen) resetNoteState("");
  }, [isOpen, resetNoteState]);

  useEffect(() => {
    if (order?._id) resetNoteState(currentAdminNoteText);
  }, [order?._id, currentAdminNoteText, resetNoteState]);

  useEffect(() => {
    if (!isOpen) {
      setCallLogError(null);
      setIsSavingCallLog(false);
      setCallNoteDraft("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (order?._id) {
      setCallLogError(null);
      setIsSavingCallLog(false);
      setCallNoteDraft("");
    }
  }, [order?._id]);

  const normalizedCallLog = useMemo(() => normalizeCallLog(order?.callLog), [order?.callLog]);
  const timelineItems = useMemo(() => normalizeTimeline(order?.timeline).reverse(), [order?.timeline]);
  const riskFlags = useMemo(() => normalizeOrderRiskFlags(order?.riskFlags), [order?.riskFlags]);
  const deliveryTypeDisplay = getDeliveryTypeDisplay(order?.deliveryType);
  const deliveryProviderDisplay = getDeliveryProviderDisplay(
    order?.deliveryProvider,
    order?.trackingNumber,
  );

  if (!order) return null;

  const canonicalStatus = normalizeOrderStatus(order.status);
  const codPaymentStatus =
    normalizeCodPaymentStatus(order.codPaymentStatus) ||
    getCodPaymentStatusForOrderStatus(order.status);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()} >
      <SheetContent 
        side="right"
        showCloseButton={false}
        className="overflow-hidden bg-[var(--system-600)] w-full  sm:max-w-[420px] h-[calc(100vh-1rem)] flex flex-col outline-none gap-0 rounded-2xl mx-2 my-2 p-0 border-none shadow-[var(--shadow-xl-shadow)]"
      > 
        {/* Header - Sticky using Flex */}
        <div className="flex items-center justify-between w-full p-4 bg-[var(--system-600)] border-b border-white/10">
          <SheetTitle className="text-body text-[var(--system-300)]">
            #{order.orderNumber}
          </SheetTitle>
          <div className="flex items-center gap-2">
            {(() => {
              const statusConfig = getStatusConfig(order.status);
              return (
                <span 
                  className="text-micro-label overflow-hidden rounded-[10px] inline-flex items-center gap-1.5 px-2 py-1 shadow-[var(--shadow-badge)]"
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
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-2 p-5">
          {/* Products Section */}
          <section className="flex flex-col gap-2 p-3 pr-5 rounded-2xl bg-white/5 border border-white/5">
            <div className="space-y-3">
              {(order.products ?? []).map((item: OrderProductItem, idx: number) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/5 rounded-md p-1 flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/10">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} width={40} height={40} className="w-full h-full object-cover rounded-sm" />
                    ) : (
                      <Package className="w-5 h-5 text-white/30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                     <h4 className="text-body truncate text-[var(--system-100)]">{item.name}</h4>
                    <div className="flex items-center gap-1">
                       <span className="text-caption rounded-md bg-white/10 px-2 py-0.5 text-white">
                        Qty: {item.quantity}
                      </span>
                      {item.variant && (
                         <span className="text-caption max-w-[100px] truncate rounded-md bg-white/10 px-2 py-0.5 text-white">
                          {item.variant}
                        </span>
                      )}
                    </div>
                  </div>
                   <div className="text-body text-white font-bold">
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

          {/* Customer Section */}
          <section className="flex flex-col gap-2 p-3.5 rounded-2xl bg-white/5 border border-white/5">
            
            <div className="space-y-3 text-body">
              {[
                { label: "Full Name", value: order.customerName },
                { label: "Wilaya", value: order.customerWilaya },
                { label: "Commune", value: order.customerCommune },
                ...(order.customerAddress ? [{ label: "Address", value: order.customerAddress }] : []),
                { label: "Date", value: formatDate(order.createdAt) },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center">
                  <span className="text-body-sm min-w-[100px] text-[var(--system-200)]">{item.label}</span>
                  <span className="text-body-sm flex-1 truncate text-[var(--system-300)]">
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

          {riskFlags.length > 0 && (
            <section className="flex flex-col gap-2 p-3.5 rounded-2xl border border-[#FC9239]/25 bg-[#FC9239]/10">
              <div className="flex items-center gap-2 text-[#FC9239]">
                <CircleAlert className="h-4 w-4" />
                <span className="text-body-sm">Risk flags</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {riskFlags.map((flag) => (
                  <span
                    key={flag}
                    className="text-caption rounded-md border border-[#FC9239]/25 bg-black/10 px-2 py-1 text-[#FC9239]"
                  >
                    {ORDER_RISK_FLAG_LABELS[flag]}
                  </span>
                ))}
              </div>
            </section>
          )}

          

          

          {/* Totals Section */}
          <section className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
            <div className="text-body-sm flex items-center justify-between text-[var(--system-200)]">
              <span>Subtotal</span>
              <span className="text-white">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="text-body-sm flex items-center justify-between text-[var(--system-200)]">
              <div className="flex items-center gap-2">
                <span>Delivery</span>
                {deliveryTypeDisplay.label && (
                  <span className="text-caption flex items-center gap-1 rounded-md bg-white/10 px-1.5 py-0.5 text-[var(--system-100)]">
                    {deliveryTypeDisplay.icon === "home" ? (
                      <Home className="w-2.5 h-2.5" />
                    ) : deliveryTypeDisplay.icon === "building" ? (
                      <Building2 className="w-2.5 h-2.5" />
                    ) : null}
                    <span>{deliveryTypeDisplay.label}</span>
                  </span>
                )}
              </div>
              <span className="text-white">{formatPrice(order.deliveryCost)}</span>
            </div>
            <div className="h-px bg-white/10 my-1" />
            <div className="text-body flex items-center justify-between text-white">
              <span>Total Price</span>
              <span>{formatPrice(order.total)}</span>
            </div>
            {codPaymentStatus && (
              <div className="text-body-sm flex items-center justify-between text-[var(--system-200)]">
                <span>COD</span>
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-white">
                  {COD_PAYMENT_STATUS_LABELS[codPaymentStatus]}
                </span>
              </div>
            )}
          </section>

          <div className="h-px w-full px-[22px]">
                <div className="h-px w-full shrink-0" style={{
                        background: "rgba(242, 242, 242, 0.10)",
                        boxShadow: "0 1px 0 0 rgba(0, 0, 0, 0.40)",
                }} />
              </div>

          {/* Tracking Info Section - shown after dispatch */}
          {order.deliveryProvider && (canonicalStatus === "dispatch_ready" || canonicalStatus === "dispatched" || canonicalStatus === "in_transit") && (
            <section className="p-3.5 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 space-y-2">
              <div className="flex items-center gap-2 text-[var(--primary)]">
                <Truck className="w-4 h-4" />
                <span className="text-body text-[var(--primary)]">Delivery Info</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-caption text-white/50">Provider</span>
                  <span className="text-body-sm text-white">
                    {deliveryProviderDisplay.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-caption text-white/50">Tracking #</span>
                  <span className="text-body-sm text-white">{order.trackingNumber || "No tracking provided"}</span>
                </div>
                {deliveryProviderDisplay.trackingUrl ? (
                  <a 
                    href={deliveryProviderDisplay.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-caption mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-white transition-opacity hover:opacity-90"
                  >
                    Track Package
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : null}
              </div>
</section>
          )}

          <section className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-body text-white/80">Admin Note</h3>
              {typeof currentAdminNoteUpdatedAt === "number" && (
                <span className="text-caption text-white/40">Last updated: {formatDate(currentAdminNoteUpdatedAt)}</span>
              )}
            </div>

            <label htmlFor={noteTextareaId} className="sr-only">
              Add an admin note
            </label>
            <textarea
              id={noteTextareaId}
              value={adminNoteDraft}
              onChange={(e) => {
                setAdminNoteDraft(e.target.value);
                setNoteError(null);
              }}
              placeholder="Type a private note here..."
               className="text-body w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white transition-colors focus:border-white/30 focus:outline-none motion-reduce:transition-none"
              rows={3}
              aria-invalid={Boolean(noteError)}
              aria-describedby={noteError ? noteErrorId : undefined}
            />
            {noteError && (
               <p id={noteErrorId} className="text-caption text-destructive">
                 {noteError}
               </p>
            )}
            
            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleSaveAdminNote}
                disabled={!hasAdminNoteChanged || isSavingNote}
                className="bg-white/10 hover:bg-white/20 text-white border-white/10 h-8 px-4"
              >
                {isSavingNote ? "Saving..." : "Save Note"}
              </Button>
            </div>
          </section>

          {(timelineItems.length > 0 || normalizedCallLog.length > 0 || currentAdminNoteText) && (
            <section className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
              <h3 className="text-body text-white/80">Activity</h3>
              <div className="space-y-2">
                {timelineItems.map((item) => (
                  <div key={item.id} className="rounded-lg bg-black/15 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-body-sm text-white">
                        {getOrderStatusLabel(item.status)}
                      </span>
                      <span className="text-caption shrink-0 text-white/35">
                        {formatDate(item.timestamp)}
                      </span>
                    </div>
                    {item.note && (
                      <p className="text-caption mt-1 text-white/50">{item.note}</p>
                    )}
                  </div>
                ))}
                {normalizedCallLog
                  .filter((call) => call.notes)
                  .reverse()
                  .map((call) => (
                    <div key={`note-${call.id}`} className="rounded-lg bg-black/15 px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-body-sm text-white">
                          {call.outcome
                            ? CALL_OUTCOME_LABELS[call.outcome as CallLog["outcome"]]?.label || call.outcome
                            : "Call"}
                        </span>
                        <span className="text-caption shrink-0 text-white/35">
                          {typeof call.timestamp === "number" ? formatDate(call.timestamp) : ""}
                        </span>
                      </div>
                      <p className="text-caption mt-1 text-white/50">{call.notes}</p>
                    </div>
                  ))}
                {currentAdminNoteText && (
                  <div className="rounded-lg bg-black/15 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-body-sm text-white">Admin note</span>
                      {typeof currentAdminNoteUpdatedAt === "number" && (
                        <span className="text-caption shrink-0 text-white/35">
                          {formatDate(currentAdminNoteUpdatedAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-caption mt-1 text-white/50">{currentAdminNoteText}</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Footer - Sticky using Flex */}
        <footer className="p-5 flex flex-col gap-3 bg-[var(--system-600)] border-t border-white/10">
          {/* Phone Number Display */}
          <div className="flex items-center justify-center py-3 rounded-2xl bg-black/40 border border-white/5">
             <h2 className="text-title text-white tracking-title-arabic" lang="ar">
               <LockedData fallback="*** *** ***">
                 {formatPhoneSpaced(order.customerPhone)}
               </LockedData>
            </h2>
          </div>

          {/* Call Controls */}
           <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
             <CallSlotsHover callLog={normalizedCallLog} />
             <div className="flex flex-wrap gap-2">
               <CallButton 
                 outcome="answered" 
                 icon={<Phone aria-hidden="true" className="w-3.5 h-3.5" />} 
                 label="Answered"
                 bg="bg-[#1bc57d]"
                 onClick={() => handleAddCallLog("answered")}
                 disabled={isSavingCallLog}
               />
               <CallButton 
                 outcome="no_answer" 
                 icon={<PhoneMissed aria-hidden="true" className="w-4 h-4" />} 
                 label="No Answer"
                 bg="bg-[#fa9a34]"
                 onClick={() => handleAddCallLog("no_answer")}
                 disabled={isSavingCallLog}
               />
               <CallButton
                 outcome="wrong_number"
                 icon={<CircleAlert aria-hidden="true" className="w-4 h-4" />}
                 label="Wrong Number"
                 bg="bg-[var(--system-400)]"
                 onClick={() => handleAddCallLog("wrong_number")}
                 disabled={isSavingCallLog}
               />
               <CallButton 
                 outcome="refused" 
                 icon={<PhoneOff aria-hidden="true" className="w-4 h-4" />} 
                 label="Refused"
                 bg="bg-[#f44055]"
                 onClick={() => handleAddCallLog("refused")}
                 disabled={isSavingCallLog}
               />
             </div>
           </div>

           {callLogError && (
              <p className="text-caption text-center text-destructive" role="alert">
                {callLogError}
              </p>
           )}

          <div className="h-px w-full px-[22px]">
                <div className="h-px w-full shrink-0" style={{
                        background: "rgba(242, 242, 242, 0.10)",
                        boxShadow: "0 1px 0 0 rgba(0, 0, 0, 0.40)",
                }} />
              </div>

          {/* Status Actions */}
          <div className="w-full">
            <StatusActionButtons
              status={order.status}
              order={order}
              orderId={order._id}
              onStatusChange={onStatusChange}
              onDispatch={handleDispatch}
              isDispatching={isDispatching}
              isStatusUpdating={isStatusUpdating}
              dispatchError={dispatchError}
              dispatchAction={dispatchAction}
            />
          </div>
        </footer>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Helper Components (Local)
// ---------------------------------------------------------------------------


function CallButton({
  outcome,
  icon,
  label,
  bg,
  onClick,
  disabled,
}: {
  outcome: string;
  icon: ReactNode;
  label?: string;
  bg: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const ariaLabel = label || CALL_OUTCOME_LABELS[outcome as CallLog["outcome"]]?.label || outcome;
  return (
    <button 
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn(
        "text-caption flex h-7 items-center justify-center gap-1.5 rounded-lg px-3 text-white transition-all motion-reduce:transition-none motion-reduce:active:scale-100",
        disabled
          ? "opacity-60 cursor-not-allowed"
          : "hover:opacity-90 active:scale-95 cursor-pointer",
        bg
      )}
    >
      {icon} {label}
    </button>
  );
}

function StatusActionButtons({
  status,
  order,
  orderId,
  onStatusChange,
  onDispatch,
  isDispatching,
  isStatusUpdating,
  dispatchError,
  dispatchAction,
}: {
  status: string,
  order: Doc<"orders">,
  orderId: string,
  onStatusChange: (id: string, s: string) => void,
  onDispatch?: () => void,
  isDispatching?: boolean,
  isStatusUpdating?: boolean,
  dispatchError?: string | null,
  dispatchAction?: DeliveryActionResponse["action"] | null,
}) {
  const canonicalStatus = normalizeOrderStatus(status);
  const allowedTransitions = getMerchantTransitionsForOrder(status, order, "merchant");
  const renderTransitionActionButton = (props: {
    label: string;
    targetStatus: OrderStatus;
    icon?: ReactNode;
    onClick: () => void;
    disabled?: boolean;
  }) => {
    if (!allowedTransitions.includes(props.targetStatus)) {
      return null;
    }

    return <ActionButton {...props} />;
  };

  switch (canonicalStatus) {
    case "new":
      return (
        <div className="flex gap-3 w-full">
          {renderTransitionActionButton({
            label: "Confirm",
            targetStatus: "confirmed",
            icon: <CheckCircle className="w-5 h-5" />,
            onClick: () => onStatusChange(orderId, "confirmed"),
            disabled: isStatusUpdating,
          })}
          {renderTransitionActionButton({
            label: "Cancel",
            targetStatus: "cancelled",
            icon: <X className="w-5 h-5" />,
            onClick: () => onStatusChange(orderId, "cancelled"),
            disabled: isStatusUpdating,
          })}
        </div>
      );
    case "awaiting_confirmation":
      return (
        <div className="flex gap-3 w-full">
          {renderTransitionActionButton({
            label: "Confirm",
            targetStatus: "confirmed",
            icon: <CheckCircle className="w-5 h-5" />,
            onClick: () => onStatusChange(orderId, "confirmed"),
            disabled: isStatusUpdating,
          })}
          {renderTransitionActionButton({
            label: "Cancel",
            targetStatus: "cancelled",
            icon: <X className="w-5 h-5" />,
            onClick: () => onStatusChange(orderId, "cancelled"),
            disabled: isStatusUpdating,
          })}
        </div>
      );
    case "confirmed":
      return (
        <div className="flex flex-col gap-2 w-full">
          <ActionButton
            label={isDispatching ? "Dispatching..." : "Send to delivery company"}
            targetStatus="dispatch_ready"
            icon={<Package className="w-5 h-5" />}
            onClick={() => onDispatch?.()}
            disabled={isDispatching}
          />
          {dispatchError && (
            <div className="space-y-2 text-center" role="alert">
              <p className="text-caption text-destructive">{dispatchError}</p>
              {dispatchAction && (
                <a
                  href={dispatchAction.href}
                  className="text-caption inline-flex items-center justify-center rounded-lg bg-white/10 px-3 py-1.5 text-white transition-colors hover:bg-white/15"
                >
                  {dispatchAction.label}
                </a>
              )}
            </div>
          )}
        </div>
      );
    case "dispatch_ready":
      return (
        <ActionButton
          label={isDispatching ? "Dispatching..." : "Send to delivery company"}
          targetStatus="dispatched"
          icon={<Truck className="w-5 h-5" />}
          onClick={() => onDispatch?.()}
          disabled={isDispatching}
        />
      );
    case "dispatched":
    case "in_transit":
      return <p className="text-body-sm py-2 text-center text-white/40">Waiting for courier update</p>;
    case "delivery_failed":
    case "unreachable":
      return (
        <div className="flex gap-3 w-full">
          {renderTransitionActionButton({
            label: "Retry Confirmation",
            targetStatus: "awaiting_confirmation",
            icon: <CheckCircle className="w-5 h-5" />,
            onClick: () => onStatusChange(orderId, "awaiting_confirmation"),
            disabled: isStatusUpdating,
          })}
          {renderTransitionActionButton({
            label: "Mark Returned",
            targetStatus: "returned",
            icon: <Package className="w-5 h-5" />,
            onClick: () => onStatusChange(orderId, "returned"),
            disabled: isStatusUpdating,
          })}
        </div>
      );
    case "returned":
      return (
        <div className="flex gap-3 w-full">
          {renderTransitionActionButton({
            label: "Retry Confirmation",
            targetStatus: "awaiting_confirmation",
            icon: <CheckCircle className="w-5 h-5" />,
            onClick: () => onStatusChange(orderId, "awaiting_confirmation"),
            disabled: isStatusUpdating,
          })}
          {renderTransitionActionButton({
            label: "Cancel Order",
            targetStatus: "cancelled",
            icon: <X className="w-5 h-5" />,
            onClick: () => onStatusChange(orderId, "cancelled"),
            disabled: isStatusUpdating,
          })}
        </div>
      );
    case "delivered":
      return <p className="text-body-sm py-2 text-center text-white/40">Delivered is final. Payment issues stay in this drawer.</p>;
    case "cod_collected":
      return <p className="text-body-sm py-2 text-center text-white/40">COD collected by courier sync</p>;
    case "cod_reconciled":
      return <p className="text-body-sm py-2 text-center text-white/40">COD reconciled</p>;
    case "cancelled":
    case "blocked":
      return renderTransitionActionButton({
        label: "Reopen Order",
        targetStatus: "new",
        icon: <CheckCircle className="w-5 h-5" />,
        onClick: () => onStatusChange(orderId, "new"),
        disabled: isStatusUpdating,
      });
    default:
      return null;
  }
}

function ActionButton({ label, targetStatus, icon, onClick, disabled }: {
  label: string, targetStatus: OrderStatus, icon?: ReactNode, onClick: () => void, disabled?: boolean
}) {
  const statusConfig = getStatusConfig(targetStatus);
  
  if (!statusConfig) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "text-body-sm flex flex-1 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-white/30 bg-white/10 py-3.5 text-white transition-all outline-none hover:bg-white/20 motion-reduce:transition-none w-full",
          disabled && "opacity-60 cursor-not-allowed"
        )}
      >
        {icon && <div className="p-1">{icon}</div>}
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "text-body-sm group relative flex flex-1 cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl py-3.5 outline-none focus-visible:ring-2 focus-visible:ring-white/20 w-full",
        disabled && "opacity-60 cursor-not-allowed"
      )}
      style={{
        backgroundColor: statusConfig.bgColor,
        color: statusConfig.textColor,
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-current opacity-30"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-10 group-focus-visible:opacity-10 motion-reduce:transition-none"
        style={{ backgroundColor: "currentColor" }}
      />
      {icon && <div className="relative p-1">{icon}</div>}
      <span className="relative">{label}</span>
    </button>
  );
}
