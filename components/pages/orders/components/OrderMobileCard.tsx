"use client";

import type { ReactNode } from "react";
import { Truck } from "lucide-react";
import { Doc } from "@/convex/_generated/dataModel";
import { LockedData } from "@/components/pages/layout/locked-overlay";
import { Checkbox, CheckboxIndicator } from "@/components/ui/checkbox";
import { getDeliveryProviderDisplay } from "@/lib/order-delivery-display";
import { cn } from "@/lib/utils";

function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `about ${minutes}m ago`;
  if (hours < 24) return `about ${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(timestamp));
}

function highlightMatch(text: string, query: string): ReactNode {
  if (!query.trim()) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </>
  );
}

function getProductSummary(order: Doc<"orders">): string {
  if (!order.products?.length) {
    return "No products";
  }

  if (order.products.length === 1) {
    return order.products[0].name;
  }

  return `${order.products[0].name} +${order.products.length - 1} more`;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "DZD",
    minimumFractionDigits: 0,
  }).format(price);
}

interface OrderMobileCardProps {
  order: Doc<"orders">;
  isSelected: boolean;
  searchQuery: string;
  statusControl: ReactNode;
  onOrderClick: (order: Doc<"orders">) => void;
  onOrderSelect: (orderId: string) => void;
}

export function OrderMobileCard({
  order,
  isSelected,
  searchQuery,
  statusControl,
  onOrderClick,
  onOrderSelect,
}: OrderMobileCardProps) {
  const delivery = getDeliveryProviderDisplay(order.deliveryProvider, order.trackingNumber);
  const deliveryLabel = order.deliveryProvider ? delivery.label : "Not dispatched";

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOrderClick(order)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOrderClick(order);
        }
      }}
      className={cn(
        "rounded-2xl border border-[var(--system-200)] bg-white p-4 shadow-[var(--shadow-sm)] transition-colors",
        isSelected ? "bg-[var(--system-100)] ring-1 ring-[var(--system-200)]" : "hover:bg-[var(--system-50)]",
      )}
    >
      <div className="flex items-start gap-3">
        <div onClick={(event) => event.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onChange={() => onOrderSelect(order._id)}
            className="cursor-pointer w-4 h-4 rounded bg-[var(--system-200)]/40 hover:bg-[var(--system-300)] data-[checked]:bg-[var(--blue-300)] data-[checked]:border-[var(--blue-300)]"
          >
            <CheckboxIndicator className="text-white w-3 h-3" />
          </Checkbox>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <LockedData fallback="***">
                <p className="text-body text-[var(--system-700)] truncate">
                  {highlightMatch(order.customerName, searchQuery)}
                </p>
                <p className="text-body-sm text-[var(--system-400)] truncate">
                  {highlightMatch(order.customerPhone, searchQuery)}
                </p>
              </LockedData>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-body-sm font-medium text-[var(--system-700)]">
                {formatPrice(order.total)}
              </p>
              <p className="text-caption text-[var(--system-400)]">
                {getRelativeTime(order.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--system-100)] px-2 py-1 text-caption text-[var(--system-500)]">
              {getProductSummary(order)}
            </span>
            <div
              className="shrink-0"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              {statusControl}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-caption text-[var(--system-400)]">
            <Truck className="h-3.5 w-3.5 text-[var(--system-400)]" />
            <span className="truncate">{deliveryLabel}</span>
            {order.trackingNumber ? (
              <span className="truncate text-[var(--system-300)]">{order.trackingNumber}</span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
