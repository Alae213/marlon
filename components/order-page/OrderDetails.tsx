"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import {
  Phone,
  User,
  MapPin,
  Package,
  Truck,
  Clock,
  CheckCircle,
  MessageSquare,
  Plus,
  MoreHorizontal,
  ChevronDown,
  Search,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { SlideOver, Badge, Button } from "@/components/core";
import {
  Dropdown,
  DropdownItem,
  DropdownSeparator,
} from "@/components/core/dropdown";
import { LockedData } from "@/components/locked-overlay";
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

function callOutcomeBg(outcome?: string): string {
  switch (outcome) {
    case "answered":
      return "bg-green-500";
    case "no_answer":
      return "bg-yellow-500";
    case "refused":
      return "bg-red-500";
    case "wrong_number":
      return "bg-[var(--system-400)]";
    default:
      return "bg-[var(--system-200)]";
  }
}

// ---------------------------------------------------------------------------
// CallSlots sub-component
// ---------------------------------------------------------------------------

function CallSlots({ callLog }: { callLog: CallLog[] }) {
  // Always renders exactly MAX_CALL_SLOTS bars; empties show as grey
  const slots: (CallLog | null)[] = Array.from(
    { length: MAX_CALL_SLOTS },
    (_, i) => {
      const relevant = callLog.slice(-MAX_CALL_SLOTS);
      return relevant[i] ?? null;
    },
  );

  return (
    <div className="grid grid-cols-4 gap-2 mb-3">
      {slots.map((call, index) => (
        <div
          key={index}
          className={`h-2 rounded-full ${callOutcomeBg(call?.outcome)} transition-colors`}
          title={
            call
              ? `${CALL_OUTCOME_LABELS[call.outcome as CallLog["outcome"]]?.label} – ${formatDate(call.timestamp)}`
              : `Attempt ${index + 1}`
          }
        />
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

  // ── Call log "view more" ──────────────────────────────────────────────────
  const [showAllCalls, setShowAllCalls] = useState(false);

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

  // Reset panel state when it opens (avoids cascading setState in effect body)
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

  /**
   * Outcome is passed directly to avoid the stale-closure bug where
   * setCallOutcome + immediate call would see the old state value.
   */
  const handleAddCallLog = useCallback(
    async (outcome: CallLog["outcome"]) => {
      if (!order) return;
      await onAddCallLog(order._id, outcome);
    },
    [order, onAddCallLog],
  );

  /** Unified note handler with inline error feedback */
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

    // In replace mode: remove the old item first, then add the new one
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      title={`Order ${order?.orderNumber}`}
    >
      {order && (
        <div className="space-y-4">
          {/* ── Status + Date ─────────────────────────────────────────────── */}
          <div className="flex items-center justify-between">
            <Badge
              variant={
                STATUS_LABELS[order.status as OrderStatus]?.variant ?? "default"
              }
            >
              {STATUS_LABELS[order.status as OrderStatus]?.label ??
                order.status}
            </Badge>
            <span className="label-xs text-[var(--system-400)]">
              {formatDate(order.createdAt)}
            </span>
          </div>

          {/* ── Customer ──────────────────────────────────────────────────── */}
          <div className="p-4 bg-[var(--system-100)] rounded-[12px]">
            <div className="flex items-center gap-2 text-[var(--system-400)] mb-2">
              <User className="w-4 h-4" />
              <span className="label-xs">Customer</span>
            </div>
            <LockedData fallback="***">
              <p className="text-2xl font-semibold text-[var(--system-600)] mb-1">
                {order.customerPhone}
              </p>
              <p className="body-base text-[var(--system-600)]">
                {order.customerName}
              </p>
            </LockedData>
          </div>

          {/* ── Address ───────────────────────────────────────────────────── */}
          <div className="p-4 bg-[var(--system-100)] rounded-[12px]">
            <div className="flex items-center gap-2 text-[var(--system-400)] mb-2">
              <MapPin className="w-4 h-4" />
              <span className="label-xs">Address</span>
            </div>
            <LockedData fallback="***">
              <p className="body-base text-[var(--system-600)]">
                {order.customerWilaya}
              </p>
              <p className="label-xs text-[var(--system-400)]">
                {order.customerCommune}
              </p>
            </LockedData>
          </div>

          {/* ── Products ──────────────────────────────────────────────────── */}
          <div className="p-4 bg-[var(--system-100)] rounded-[12px]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-[var(--system-400)]">
                <Package className="w-4 h-4" />
                <span className="label-xs">Products</span>
              </div>
              <button
                onClick={() => openAddProductPanel(-1)}
                className="label-xs text-[var(--info)] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add product
              </button>
            </div>

            <div className="space-y-1">
              {(order.products ?? []).map((item, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2 hover:bg-[var(--system-200)] rounded-[8px] group transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 bg-[var(--system-200)] rounded-[8px] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-[8px] object-cover"
                      />
                    ) : (
                      <Package className="w-5 h-5 text-[var(--system-400)]" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="body-base text-[var(--system-600)] truncate">
                      {item.name}
                    </p>

                    {/* Variant — click to open variant swap dropdown */}
                    {item.variant && (
                      <Dropdown
                        isOpen={variantMenuIdx === idx}
                        onOpenChange={(open) =>
                          setVariantMenuIdx(open ? idx : null)
                        }
                        trigger={
                          <button className="label-xs text-[var(--system-400)] hover:text-[var(--system-600)] flex items-center gap-0.5 mt-0.5">
                            {item.variant}
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        }
                      >
                        {/*
                          Full variant options require the complete product document.
                          Without that context here, we surface the "replace" flow
                          which shows the full product picker with variant selection.
                        */}
                        <DropdownItem
                          onClick={() => {
                            setVariantMenuIdx(null);
                            openAddProductPanel(idx);
                          }}
                        >
                          <RefreshCw className="w-3 h-3" /> Change variant /
                          product
                        </DropdownItem>
                      </Dropdown>
                    )}

                    {/* Inline qty editor */}
                    <div className="flex items-center gap-1 mt-1">
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
                          className="w-14 px-1.5 py-0.5 border border-[var(--system-300)] rounded-[6px] label-xs bg-white dark:bg-[var(--system-700)] text-[var(--system-600)] focus:outline-none focus:ring-1 focus:ring-[var(--info)]"
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setEditingQtyIdx(idx);
                            setEditingQtyValue(String(item.quantity));
                          }}
                          className="label-xs text-[var(--system-400)] hover:text-[var(--system-600)] border border-transparent hover:border-[var(--system-200)] px-1.5 py-0.5 rounded-[6px] transition-colors"
                        >
                          Qty: {item.quantity}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <p className="body-base text-[var(--system-600)] flex-shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </p>

                  {/* 3-dots context menu */}
                  <Dropdown
                    isOpen={openMenuIdx === idx}
                    onOpenChange={(open) => setOpenMenuIdx(open ? idx : null)}
                    trigger={
                      <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-[var(--system-200)] rounded-[6px] transition-all">
                        <MoreHorizontal className="w-4 h-4 text-[var(--system-400)]" />
                      </button>
                    }
                  >
                    <DropdownItem
                      onClick={() => {
                        setOpenMenuIdx(null);
                        openAddProductPanel(idx);
                      }}
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Change (replace)
                    </DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem
                      className="text-destructive"
                      onClick={() => handleRemoveProduct(idx)}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </DropdownItem>
                  </Dropdown>
                </div>
              ))}
            </div>

            {/* ── Add / Replace product inline panel ────────────────────── */}
            {addProductMode !== null && (
              <div className="mt-3 pt-3 border-t border-[var(--system-200)]">
                <p className="label-xs text-[var(--system-500)] mb-2 font-medium">
                  {addProductMode >= 0 ? "Replace product" : "Add product"}
                </p>

                {/* Search input */}
                <div className="relative mb-2">
                  <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--system-300)]" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products…"
                    className="w-full ps-8 pe-3 py-1.5 border border-[var(--system-200)] rounded-[8px] label-xs bg-white dark:bg-[var(--system-700)] text-[var(--system-600)] focus:outline-none focus:ring-1 focus:ring-[var(--info)]"
                  />
                </div>

                {/* Product list */}
                <div className="max-h-40 overflow-y-auto space-y-1 mb-2">
                  {storeProducts === undefined && (
                    <p className="label-xs text-[var(--system-300)] py-2 text-center">
                      Loading…
                    </p>
                  )}
                  {storeProducts !== undefined &&
                    filteredProducts.length === 0 && (
                      <p className="label-xs text-[var(--system-300)] py-2 text-center">
                        No products found
                      </p>
                    )}
                  {filteredProducts.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => {
                        setSelectedStoreProduct(p);
                        setSelectedVariant("");
                      }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-[8px] text-start transition-colors ${
                        selectedStoreProduct?._id === p._id
                          ? "bg-[var(--info)]/10 border border-[var(--info)]/40"
                          : "hover:bg-[var(--system-200)]"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-[6px] bg-[var(--system-200)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {p.images?.[0] ? (
                          <Image
                            src={p.images[0]}
                            alt={p.name}
                            width={32}
                            height={32}
                            className="object-cover"
                          />
                        ) : (
                          <Package className="w-4 h-4 text-[var(--system-400)]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="label-xs text-[var(--system-600)] truncate">
                          {p.name}
                        </p>
                        <p className="label-xs text-[var(--system-400)]">
                          {formatPrice(p.basePrice)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Variant picker — shown after a product with variants is selected */}
                {selectedStoreProduct &&
                  (selectedStoreProduct.variants ?? []).length > 0 && (
                    <div className="mb-2 space-y-2">
                      {selectedStoreProduct.variants!.map((group) => (
                        <div key={group.name}>
                          <p className="label-xs text-[var(--system-400)] mb-1">
                            {group.name}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {group.options.map((opt) => {
                              const value = `${group.name}: ${opt.name}`;
                              return (
                                <button
                                  key={opt.name}
                                  onClick={() => setSelectedVariant(value)}
                                  className={`label-xs px-2 py-1 rounded-[6px] border transition-colors ${
                                    selectedVariant === value
                                      ? "border-[var(--info)] bg-[var(--info)]/10 text-[var(--info)]"
                                      : "border-[var(--system-200)] text-[var(--system-500)] hover:bg-[var(--system-200)]"
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

                {/* Confirm / Cancel */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={closeAddProductPanel}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={async () => {
                      await handleConfirmAddProduct();
                      closeAddProductPanel();
                    }}
                    disabled={!selectedStoreProduct}
                    className="flex-1"
                  >
                    {addProductMode >= 0 ? "Replace" : "Add"}
                  </Button>
                </div>
              </div>
            )}

            {/* ── Totals ──────────────────────────────────────────────────── */}
            <div className="mt-4 pt-4 border-t border-[var(--system-200)] space-y-2">
              <div className="flex justify-between label-xs">
                <span className="text-[var(--system-400)]">Subtotal:</span>
                <span className="text-[var(--system-600)]">
                  {formatPrice(order.subtotal)}
                </span>
              </div>
              <div className="flex justify-between label-xs">
                <span className="text-[var(--system-400)]">Delivery:</span>
                <span className="text-[var(--system-600)]">
                  {formatPrice(order.deliveryCost)}
                </span>
              </div>
              <div className="flex justify-between body-base font-semibold">
                <span className="text-[var(--system-600)]">Total:</span>
                <span className="text-[var(--system-600)]">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* ── Delivery Info ──────────────────────────────────────────────── */}
          <div className="p-4 bg-[var(--system-100)] rounded-[12px]">
            <div className="flex items-center gap-2 text-[var(--system-400)] mb-2">
              <Truck className="w-4 h-4" />
              <span className="label-xs">Delivery Info</span>
            </div>
            <p className="body-base text-[var(--system-600)]">
              {DELIVERY_TYPE_LABELS[
                order.deliveryType as Order["deliveryType"]
              ] ?? order.deliveryType}
            </p>
            {order.trackingNumber && (
              <p className="label-xs text-[var(--system-400)] mt-1">
                Tracking:{" "}
                <span className="font-mono">{order.trackingNumber}</span>
              </p>
            )}
          </div>

          {/* ── Call Logs ─────────────────────────────────────────────────── */}
          <div className="p-4 bg-[var(--system-100)] rounded-[12px]">
            <h3 className="title-xl text-[var(--system-600)] mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Call Logs
            </h3>

            {/* 4-slot progress bar — always padded to MAX_CALL_SLOTS */}
            <CallSlots
              callLog={(order.callLog ?? []).map((c) => ({
                ...c,
                outcome: c.outcome as CallLog["outcome"],
              }))}
            />

            {/* Scrollable call history */}
            {(order.callLog?.length ?? 0) > 0 && (
              <>
                <div className="max-h-24 overflow-y-auto mb-2 space-y-1">
                  {(showAllCalls
                    ? (order.callLog ?? [])
                    : (order.callLog ?? []).slice(-MAX_CALL_SLOTS)
                  )
                    .slice()
                    .reverse()
                    .map((call, idx) => {
                      // Convex stores outcome as string; cast to the union type
                      const outcome = call.outcome as CallLog["outcome"];
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${callOutcomeBg(
                              outcome,
                            )}`}
                          />
                          <span className="label-xs text-[var(--system-400)]">
                            {CALL_OUTCOME_LABELS[outcome]?.label}
                          </span>
                          <span className="label-xs text-[var(--system-300)] ms-auto">
                            {formatDate(call.timestamp)}
                          </span>
                        </div>
                      );
                    })}
                </div>

                {/* "View more" — visible only when total calls exceed MAX_CALL_SLOTS */}
                {(order.callLog?.length ?? 0) > MAX_CALL_SLOTS && (
                  <button
                    onClick={() => setShowAllCalls((prev) => !prev)}
                    className="label-xs text-[var(--info)] hover:underline mb-3"
                  >
                    {showAllCalls
                      ? "Show less"
                      : `View all ${order.callLog?.length} calls`}
                  </button>
                )}
              </>
            )}

            {/* Call action buttons — auto-save on click, no textarea friction */}
            <div className="flex gap-2 mt-1">
              {(["answered", "no_answer", "refused"] as const).map(
                (outcome) => (
                  <Button
                    key={outcome}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleAddCallLog(outcome)}
                  >
                    {CALL_OUTCOME_LABELS[outcome]?.label}
                  </Button>
                ),
              )}
            </div>
          </div>

          {/* ── State-based Actions ────────────────────────────────────────── */}
          <div className="p-4 bg-[var(--system-100)] rounded-[12px]">
            <h3 className="title-xl text-[var(--system-600)] mb-3">Actions</h3>

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
              <p className="body-base text-center text-[var(--system-400)] py-4">
                Order completed — no actions available
              </p>
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

          {/* ── Admin Notes ────────────────────────────────────────────────── */}
          <div className="p-4 bg-[var(--system-100)] rounded-[12px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="title-xl text-[var(--system-600)] flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Notes
                {(order.adminNotes?.length ?? 0) > 0 && (
                  <span className="label-xs text-[var(--system-400)]">
                    ({order.adminNotes!.length})
                  </span>
                )}
              </h3>
              {!showAddNote && (
                <button
                  onClick={() => setShowAddNote(true)}
                  className="label-xs text-[var(--info)] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add note
                </button>
              )}
            </div>

            {/* Inline add-note form */}
            {showAddNote && (
              <div className="mb-3">
                <textarea
                  value={newNote}
                  onChange={(e) => {
                    setNewNote(e.target.value);
                    setNoteError(null);
                  }}
                  placeholder="Private note (not visible to customer)…"
                  className="w-full px-3 py-2 border border-[var(--system-200)] bg-white dark:bg-[var(--system-700)] label-xs text-[var(--system-600)] resize-none rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[var(--info)]"
                  rows={3}
                />
                {noteError && (
                  <p className="label-xs text-destructive mt-1">{noteError}</p>
                )}
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddNote(false);
                      setNewNote("");
                      setNoteError(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="flex-1"
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}

            {/* Notes list */}
            {(order.adminNotes?.length ?? 0) > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(order.adminNotes ?? [])
                  .slice()
                  .reverse()
                  .map((note: AdminNote) => (
                    <div
                      key={note.id}
                      className="p-3 bg-[var(--note-bg)] border border-[var(--note-border)] rounded-[8px]"
                    >
                      <p className="label-xs text-[var(--note-text)]">
                        {note.text}
                      </p>
                      <p className="label-xs text-[var(--system-300)] mt-1">
                        {formatDate(note.timestamp)}
                      </p>
                    </div>
                  ))}
              </div>
            )}

            {(order.adminNotes?.length ?? 0) === 0 && !showAddNote && (
              <p className="label-xs text-[var(--system-300)] text-center py-2">
                No notes yet
              </p>
            )}
          </div>

          {/* ── Audit Trail (collapsible) ───────────────────────────────────── */}
          {(order.auditTrail?.length ?? 0) > 0 && (
            <div className="p-4 bg-[var(--system-100)] rounded-[12px]">
              <button
                onClick={() => setShowAuditTrail((prev) => !prev)}
                className="w-full flex items-center justify-between text-[var(--system-600)] hover:text-[var(--system-700)] transition-colors"
              >
                <span className="title-xl flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Change Log
                </span>
                {showAuditTrail ? (
                  <ChevronDown className="w-4 h-4 text-[var(--system-400)]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[var(--system-400)] -rotate-90" />
                )}
              </button>

              {showAuditTrail && (
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                  {(order.auditTrail ?? [])
                    .slice()
                    .reverse()
                    .map((entry) => (
                      <div key={entry.id} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-[var(--system-300)] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="body-base text-[var(--system-600)]">
                            {entry.details}
                          </p>
                          <p className="label-xs text-[var(--system-300)]">
                            {formatDate(entry.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </SlideOver>
  );
}
