"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import {
  Phone,
  Package,
  Clock,
  CheckCircle,
  MoreHorizontal,
  ChevronDown,
  Search,
  Trash2,
  RefreshCw,
  X,
  PhoneOff,
  PhoneMissed
} from "lucide-react";
import { Button } from "@/components/core";
import {
  Dropdown,
  DropdownItem,
  DropdownSeparator,
} from "@/components/core/dropdown";
import { LockedData } from "@/components/locked-overlay";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import type { CallLog, AdminNote, OrderStatus } from "@/lib/orders-types";
import {
  STATUS_LABELS,
  CALL_OUTCOME_LABELS,
  DELIVERY_TYPE_LABELS,
} from "@/lib/orders-types";
import type { Order } from "@/lib/orders-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  /** storeId required to fetch available products for the add-product panel */
  storeId?: string;
}

interface StoreProduct {
  _id: string;
  name: string;
  basePrice: number;
  images?: string[];
  variants?: {
    name: string;
    options: { name: string; priceModifier?: number }[];
  }[];
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
    <div className="flex items-end gap-1.5 h-6">
      {slots.map((call, index) => (
        <HoverCard key={index} openDelay={200} closeDelay={100}>
          <HoverCardTrigger asChild>
            <div
              className={`w-1 rounded-full transition-colors cursor-default ${
                call ? callOutcomeBg(call.outcome) : "bg-white/10"
              }`}
              style={{ height: call ? "100%" : "50%" }}
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
                  boxShadow: "var(--bottom-nav-shadow)",
                  border: "1px solid rgba(255,255,255,0.08)",
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
  order,
  isOpen,
  onClose,
  onStatusChange,
  onAddCallLog,
  onAddAdminNote,
  storeId,
}: OrderDetailsProps) {
  // ── Notes (single unified field) ─────────────────────────────────────────
  const [newNote, setNewNote] = useState("");
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // ── Audit trail toggle ────────────────────────────────────────────────────
  const [showAuditTrail, setShowAuditTrail] = useState(false);

  // ── Inline qty editing ────────────────────────────────────────────────────
  const [editingQtyIdx, setEditingQtyIdx] = useState<number | null>(null);
  const [editingQtyValue, setEditingQtyValue] = useState<string>("");

  // ── Variant dropdown per-row ──────────────────────────────────────────────
  const [variantMenuIdx, setVariantMenuIdx] = useState<number | null>(null);

  // ── 3-dots menu per-row ───────────────────────────────────────────────────
  const [openMenuIdx, setOpenMenuIdx] = useState<number | null>(null);

  // ── Add / Replace product panel ───────────────────────────────────────────
  // null = closed | -1 = "add" mode | >= 0 = "replace" mode (index)
  const [addProductMode, setAddProductMode] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [selectedStoreProduct, setSelectedStoreProduct] =
    useState<StoreProduct | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>("");

  // ── Convex mutations ──────────────────────────────────────────────────────
  const updateQtyMutation = useMutation(api.orders.updateOrderProductQuantity);
  const removeProductMutation = useMutation(api.orders.removeOrderProduct);
  const addProductMutation = useMutation(api.orders.addProductToOrder);

  // ── Store products (fetched only while panel is open) ────────────────────
  const storeProducts = useQuery(
    api.products.getProducts,
    storeId && addProductMode !== null
      ? { storeId: storeId as Id<"stores"> }
      : "skip",
  ) as StoreProduct[] | undefined;

  const filteredProducts = (storeProducts ?? []).filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()),
  );

  // Reset panel state when it opens
  const openAddProductPanel = useCallback((mode: number) => {
    setProductSearch("");
    setSelectedStoreProduct(null);
    setSelectedVariant("");
    setAddProductMode(mode);
  }, []);

  const closeAddProductPanel = useCallback(() => {
    setAddProductMode(null);
  }, []);

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
      setShowAddNote(false);
    } catch {
      setNoteError("Failed to save note. Please try again.");
    }
  };

  const handleSaveQty = async (idx: number) => {
    if (!order) return;
    const parsed = parseInt(editingQtyValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      await updateQtyMutation({
        orderId: order._id as Id<"orders">,
        productIndex: idx,
        quantity: parsed,
      });
    }
    setEditingQtyIdx(null);
  };

  const handleRemoveProduct = async (idx: number) => {
    if (!order) return;
    setOpenMenuIdx(null);
    await removeProductMutation({
      orderId: order._id as Id<"orders">,
      productIndex: idx,
    });
  };

  const handleConfirmAddProduct = async () => {
    if (!order || !selectedStoreProduct) return;

    const product = {
      productId: selectedStoreProduct._id,
      name: selectedStoreProduct.name,
      image: selectedStoreProduct.images?.[0],
      price: selectedStoreProduct.basePrice,
      quantity: 1,
      variant: selectedVariant || undefined,
    };

    if (addProductMode !== null && addProductMode >= 0) {
      await removeProductMutation({
        orderId: order._id as Id<"orders">,
        productIndex: addProductMode,
      });
    }

    await addProductMutation({
      orderId: order._id as Id<"orders">,
      product,
    });

    setAddProductMode(null);
  };

  if (!order) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{
          boxShadow: "var(--bottom-nav-shadow)",
          background: "linear-gradient(0deg, #1D1E1F 0%, #353737 100%)",
        }}
        className="w-full sm:max-w-[420px] h-full flex flex-col p-0 border-s border-white/5 outline-none gap-0"
      >
        {/* Accessible hidden title for screen readers */}
        <SheetTitle className="sr-only">Order #{order.orderNumber} Details</SheetTitle>
        {/* Header Fixed */}
            <div className="flex items-center justify-between w-full px-6 pt-6 pb-2 shrink-0">
               <div className="text-[var(--system-200)] font-sans font-medium tracking-wide uppercase">
                 #{order.orderNumber}
               </div>
               <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors shrink-0">
                 <Image src="/icons/CloseIcon.svg" alt="Close" width={14} height={14} className="opacity-70" />
               </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto w-full pb-4 scrollbar-hide">
               
              {/* ── Customer Info ────────────────────────────────────────────── */}
              <div className="mx-4 p-4 rounded-[28px] border border-white/5 bg-white/5" style={{ boxShadow: "inset 0px 4px 10px 0px rgba(0,0,0,0.1), inset 0px 1px 0px 0px rgba(255,255,255,0.05)" }}>
                <div className="flex items-center justify-between mb-4">
                   <h2 className="text-3xl font-bold tracking-tight text-white m-0">
                      <LockedData fallback="*** *** ***">
                        {formatPhoneSpaced(order.customerPhone)}
                      </LockedData>
                   </h2>
                   <div className="px-2 py-0.5 rounded-full border border-[var(--blue-200)] text-[var(--blue-200)] text-xs flex items-center gap-1.5 bg-[var(--blue-200)]/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--blue-200)] shadow-[0_0_8px_rgba(93,160,219,0.8)]" />
                      {STATUS_LABELS[order.status as OrderStatus]?.label ?? order.status}
                   </div>
                </div>

                <div className="w-full text-sm text-[var(--system-200)] font-medium space-y-3">
                   <div className="flex items-center">
                      <span className="min-w-[100px] text-white/50">Full Name</span>
                      <span className="text-white text-base truncate flex-1">
                        <LockedData fallback="***">{order.customerName}</LockedData>
                      </span>
                   </div>
                   <div className="flex items-center">
                      <span className="min-w-[100px] text-white/50">Wilaya</span>
                      <span className="text-white text-base truncate flex-1">
                        <LockedData fallback="***">{order.customerWilaya}</LockedData>
                      </span>
                   </div>
                   <div className="flex items-center">
                      <span className="min-w-[100px] text-white/50">Address</span>
                      <span className="text-white text-base truncate flex-1">
                        <LockedData fallback="***">{order.customerCommune}</LockedData>
                      </span>
                   </div>
                   
                   <div className="flex items-center justify-between pt-3">
                      <span className="text-xs text-[var(--system-400)]">{formatDate(order.createdAt)}</span>
                      <button 
                         onClick={() => setShowAddNote(!showAddNote)}
                         className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 text-white rounded-full text-xs font-semibold transition-colors"
                      >
                         Add Notes
                      </button>
                   </div>
                </div>

                {/* Inline add-note form */}
                {showAddNote && (
                   <div className="mt-4 pt-4 border-t border-white/10">
                      <textarea
                        value={newNote}
                        onChange={(e) => {
                          setNewNote(e.target.value);
                          setNoteError(null);
                        }}
                        placeholder="Private note (not visible to customer)…"
                        className="w-full px-3 py-2 border border-white/10 bg-black/20 text-white label-xs resize-none rounded-[12px] focus:outline-none focus:border-white/30"
                        rows={3}
                      />
                      {noteError && (
                        <p className="label-xs text-destructive mt-1">{noteError}</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowAddNote(false);
                            setNewNote("");
                            setNoteError(null);
                          }}
                          className="flex-1 bg-white/5 hover:bg-white/10 text-white"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleAddNote}
                          disabled={!newNote.trim()}
                          className="flex-1"
                        >
                          Save Note
                        </Button>
                      </div>
                   </div>
                )}
              </div>

              {/* ── Products Section ─────────────────────────────────────────── */}
              <div className="mx-4 p-4 rounded-[28px] border border-white/5 bg-white/5 mt-3 space-y-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_4px_10px_rgba(0,0,0,0.1)]">
                 <div className="space-y-4">
                    {(order.products ?? []).map((item, idx: number) => (
                       <div key={idx} className="flex items-center gap-4 group relative">
                          <div className="w-[52px] h-[52px] bg-white/5 border border-white/5 rounded-[14px] flex-shrink-0 flex items-center justify-center overflow-hidden">
                             {item.image ? (
                                <Image src={item.image} alt={item.name} width={52} height={52} className="w-full h-full object-cover" />
                             ) : (
                                <Package className="w-6 h-6 text-white/30" />
                             )}
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="flex justify-between items-start">
                                <h4 className="text-white font-medium text-base truncate pr-2">{item.name}</h4>
                                <span className="text-white font-semibold text-base flex-shrink-0">{formatPrice(item.price * item.quantity).replace('DZD','').trim()}</span>
                             </div>
                             <div className="flex items-center gap-2 mt-1">
                                {editingQtyIdx === idx ? (
                                   <input
                                      type="number"
                                      min={1}
                                      value={editingQtyValue}
                                      autoFocus
                                      onChange={(e) => setEditingQtyValue(e.target.value)}
                                      onBlur={() => handleSaveQty(idx)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSaveQty(idx);
                                        if (e.key === "Escape") setEditingQtyIdx(null);
                                      }}
                                      className="w-10 px-2 leading-none py-0.5 border border-white/20 bg-black/20 text-white text-xs rounded-full outline-none"
                                    />
                                ) : (
                                   <button 
                                      onClick={() => {
                                         setEditingQtyIdx(idx);
                                         setEditingQtyValue(String(item.quantity));
                                      }}
                                      className="bg-white/10 hover:bg-white/20 transition-colors border border-white/5 rounded-full px-2.5 py-0.5 text-xs text-white"
                                   >
                                      {item.quantity}
                                   </button>
                                )}
                                {item.variant && (
                                   <div className="bg-white/10 border border-white/5 rounded-full px-2.5 py-0.5 text-xs text-white">
                                      {item.variant}
                                   </div>
                                )}
                                <div className="bg-white/5 border border-[var(--system-300)]/30 rounded-full px-2 py-0.5 flex items-center justify-center">
                                   <div className="w-3 h-1 bg-[var(--blue-200)]/80 rounded-full" />
                                </div>
                             </div>
                          </div>

                          {/* 3 dots menu mapped to Dropdown */}
                          <Dropdown
                             isOpen={openMenuIdx === idx}
                             onOpenChange={(open) => setOpenMenuIdx(open ? idx : null)}
                             trigger={
                               <button className="absolute right-0 top-1/2 -translate-y-[60%] p-1.5 opacity-0 group-hover:opacity-100 bg-black/60 backdrop-blur-md rounded-xl text-white transition-opacity hover:bg-black/80">
                                 <MoreHorizontal className="w-[18px] h-[18px]" />
                               </button>
                             }
                           >
                             <DropdownItem onClick={() => { setOpenMenuIdx(null); openAddProductPanel(idx); }}>
                               <RefreshCw className="w-3.5 h-3.5" /> Replace
                             </DropdownItem>
                             <DropdownSeparator />
                             <DropdownItem className="text-destructive" onClick={() => handleRemoveProduct(idx)}>
                               <Trash2 className="w-3.5 h-3.5" /> Delete
                             </DropdownItem>
                          </Dropdown>
                       </div>
                    ))}
                 </div>

                 <div className="flex justify-between items-center pt-2">
                    <div className="text-sm font-medium text-[var(--system-200)]/80">Cart items</div>
                    <button 
                       onClick={() => openAddProductPanel(-1)}
                       className="px-3 py-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-full text-xs font-semibold transition-colors"
                    >
                       Add items
                    </button>
                 </div>
                 
                 {/* Product Panel replacing/adding inline block */}
                 {addProductMode !== null && (
                    <div className="mt-3 pt-4 border-t border-white/10">
                      <p className="label-xs text-white/50 mb-2 font-medium">
                        {addProductMode >= 0 ? "Replace Item" : "Add Item"}
                      </p>
                      <div className="relative mb-3">
                        <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/50" />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Search..."
                          className="w-full ps-8 pe-3 py-2 bg-black/20 border border-white/10 rounded-[12px] label-xs text-white focus:outline-none focus:border-white/30"
                        />
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1 mb-3 scrollbar-hide">
                        {filteredProducts.map((p) => (
                          <button
                            key={p._id}
                            onClick={() => {
                              setSelectedStoreProduct(p);
                              setSelectedVariant("");
                            }}
                            className={`w-full flex items-center gap-3 px-2 py-2 rounded-[12px] text-start transition-colors border ${
                              selectedStoreProduct?._id === p._id
                                ? "bg-[var(--info)]/20 border-[var(--info)]/50"
                                : "border-transparent hover:bg-white/5"
                            }`}
                          >
                            <div className="w-8 h-8 rounded-[8px] bg-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {p.images?.[0] ? (
                                <Image src={p.images[0]} alt={p.name} width={32} height={32} className="object-cover" />
                              ) : (
                                <Package className="w-4 h-4 text-white/50" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="label-xs text-white truncate">{p.name}</p>
                              <p className="text-[10px] text-white/50">{formatPrice(p.basePrice)}</p>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Variant picker */}
                      {selectedStoreProduct && (selectedStoreProduct.variants ?? []).length > 0 && (
                        <div className="mb-3 space-y-2">
                          {selectedStoreProduct.variants!.map((group) => (
                            <div key={group.name} className="bg-black/10 p-2 rounded-xl">
                              <p className="text-[10px] text-white/50 mb-2 uppercase tracking-wide">{group.name}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {group.options.map((opt) => {
                                  const value = `${group.name}: ${opt.name}`;
                                  return (
                                    <button
                                      key={opt.name}
                                      onClick={() => setSelectedVariant(value)}
                                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                                        selectedVariant === value
                                          ? "border-[var(--info)] bg-[var(--info)]/20 text-white"
                                          : "border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
                                      }`}
                                    >
                                      {opt.name}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={closeAddProductPanel} className="flex-1 bg-white/5 hover:bg-white/10 text-white">Cancel</Button>
                        <Button size="sm" onClick={async () => { await handleConfirmAddProduct(); closeAddProductPanel(); }} disabled={!selectedStoreProduct} className="flex-1">
                          {addProductMode >= 0 ? "Confirm Replace" : "Confirm Add"}
                        </Button>
                      </div>
                    </div>
                 )}
              </div>

              {/* ── Totals Section ───────────────────────────────────────────── */}
              <div className="mx-4 p-4 rounded-[28px] border border-white/5 bg-white/5 mt-3 space-y-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_4px_10px_rgba(0,0,0,0.1)]">
                 <div className="flex justify-between items-center text-[var(--system-200)] text-sm font-medium">
                    <span>Subtotal</span>
                    <span className="text-white">{formatPrice(order.subtotal).replace('DZD', '').trim()}</span>
                 </div>
                 <div className="flex justify-between items-center text-[var(--system-200)] text-sm pb-3 border-b border-white/10 font-medium">
                    <span>Delivery</span>
                    <span className="text-white">{formatPrice(order.deliveryCost).replace('DZD', '').trim()}</span>
                 </div>
                 <div className="flex justify-between items-center text-[var(--system-200)] text-[15px] font-medium pt-1">
                    <span>Total Price</span>
                    <span className="text-white">{formatPrice(order.total).replace('DZD', '').trim()}</span>
                 </div>
              </div>

              {/* ── Call Logs Section ────────────────────────────────────────── */}
              <div className="mx-4 mt-4 relative pb-2">
                 <div className="text-[13px] text-white font-medium mb-3 ms-1">Call Log</div>
                 <div className="flex items-center justify-between">
                    <CallSlotsHover callLog={(order.callLog ?? []).map((c) => ({ ...c, outcome: c.outcome as CallLog["outcome"] }))} />
                    
                    <div className="flex gap-2">
                       <button 
                          onClick={() => handleAddCallLog("answered")}
                          className="h-9 px-4 rounded-full bg-[#1bc57d] hover:bg-[#1bc57d]/80 text-white flex items-center justify-center gap-1.5 text-xs font-semibold shadow-sm transition-colors border border-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"
                       >
                          <Phone className="w-[14px] h-[14px]" style={{ strokeWidth: 2.5 }} /> Answered
                       </button>
                       <button 
                          onClick={() => handleAddCallLog("no_answer")}
                          className="h-9 w-[46px] rounded-full bg-[#fa9a34] hover:bg-[#fa9a34]/80 text-white flex items-center justify-center shadow-sm transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"
                       >
                          <PhoneMissed className="w-[15px] h-[15px]" style={{ strokeWidth: 2.5 }} />
                       </button>
                       <button 
                          onClick={() => handleAddCallLog("refused")}
                          className="h-9 w-[46px] rounded-full bg-[#f44055] hover:bg-[#f44055]/80 text-white flex items-center justify-center shadow-sm transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"
                       >
                          <PhoneOff className="w-[15px] h-[15px]" style={{ strokeWidth: 2.5 }} />
                       </button>
                    </div>
                 </div>
              </div>
              
              {/* Optional Audit Trail inside body just for completeness if opened later */}
              {(order.auditTrail?.length ?? 0) > 0 && (
                <div className="mx-4 mt-4 p-4 rounded-[28px] bg-white/5 border border-white/5">
                   <button onClick={() => setShowAuditTrail(!showAuditTrail)} className="w-full flex justify-between items-center text-white/80 hover:text-white group">
                      <span className="text-sm font-medium flex items-center gap-2"><Clock className="w-4 h-4 opacity-70" /> View History</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showAuditTrail ? 'rotate-180' : ''}`} />
                   </button>
                   {showAuditTrail && (
                      <div className="mt-4 space-y-3 max-h-48 overflow-y-auto scrollbar-hide">
                         {(order.auditTrail ?? []).slice().reverse().map(entry => (
                            <div key={entry.id} className="flex gap-3 text-white/80">
                               <CheckCircle className="w-4 h-4 mt-0.5 text-white/50 shrink-0" />
                               <div>
                                  <p className="text-sm">{entry.details}</p>
                                  <p className="text-[10px] text-white/40 mt-0.5">{formatDate(entry.timestamp)}</p>
                               </div>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
              )}

            </div> {/* End Scrollable Body */}

            {/* ── Fixed Footer Actions ─────────────────────────────────────── */}
            <div className="w-full p-4 pb-6 pt-3 mt-auto shrink-0 z-10 box-border">
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
