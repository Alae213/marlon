"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type KeyboardEvent, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

export type StoreCardSubscription = "active" | "trial" | "locked" | string | undefined;

export type StoreCardProps = {
  name: string;
  slug: string;
  subscription?: StoreCardSubscription;
  paidUntil?: number;
  className?: string;
  now?: number;
};

const isStorePaid = ({
  subscription,
  paidUntil,
  now,
}: {
  subscription?: StoreCardSubscription;
  paidUntil?: number;
  now: number;
}) => subscription === "active" && typeof paidUntil === "number" && paidUntil > now;

export function StoreCard({
  name,
  slug,
  subscription,
  paidUntil,
  className,
  now,
}: StoreCardProps) {
  const router = useRouter();
  const [fallbackNow] = useState(() => Date.now());
  const editorHref = `/editor/${slug}`;
  const storefrontHref = `/${slug}`;
  const isPaid = isStorePaid({ subscription, paidUntil, now: now ?? fallbackNow });

  const openEditor = () => {
    router.push(editorHref);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openEditor();
  };

  const handleStorefrontClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
  };

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`Open ${name} editor`}
      onClick={openEditor}
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative flex h-[200px] w-[200px] cursor-pointer items-end justify-center overflow-hidden rounded-[28px]",
        "border-t-2 border-[rgba(176,176,176,0.44)] bg-gradient-to-t from-[var(--system-700)] to-[var(--system-500)]",
        "shadow-[0px_94px_26px_0px_rgba(0,0,0,0.01),0px_60px_24px_0px_rgba(0,0,0,0.05),0px_34px_20px_0px_rgba(0,0,0,0.17),0px_15px_15px_0px_rgba(0,0,0,0.29),0px_4px_8px_0px_rgba(0,0,0,0.34)]",
        "outline-none transition-transform duration-150 ease-out active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--system-50)]",
        className
      )}
    >
      <div className="relative flex h-[97px] min-w-0 flex-1 flex-col items-start justify-end overflow-hidden rounded-[28px] border border-white/10 bg-[var(--system-700)] p-[5px] shadow-[0px_-2px_19.4px_0px_rgba(0,0,0,0.19),0px_-2px_12px_0px_rgba(0,0,0,0.16)]">
        <div className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_1px_0px_6px_0px_rgba(144,154,162,0.12),inset_-1px_0px_6px_0px_rgba(144,154,162,0.12),inset_0px_-1px_8px_0px_rgba(144,154,162,0.16)]" />

        <div className="relative flex min-h-0 w-full flex-1 flex-col justify-end overflow-hidden rounded-[24px] border border-dashed border-white/35 bg-white/10 p-3 shadow-[inset_0px_11px_20px_0px_rgba(255,255,255,0.06)]">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="truncate text-[17px] font-bold leading-[1.2] tracking-[-0.24px] text-[var(--system-50)]">
              {name}
            </span>
            <span
              className={cn(
                "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold leading-none",
                isPaid
                  ? "border-[#f1ca72]/60 bg-[#d6a43d] text-[#2f2103] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
                  : "border-white/20 bg-[#d7d9dc] text-[var(--system-600)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
              )}
            >
              {isPaid ? "Paid" : "Free"}
            </span>
          </div>

          <Link
            href={storefrontHref}
            onClick={handleStorefrontClick}
            aria-label={`Open ${name} public storefront`}
            className="relative z-10 max-w-full truncate text-[12px] font-bold leading-4 text-[var(--system-300)] underline-offset-4 transition-colors hover:text-[var(--system-50)] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60"
          >
            marlon.app/{slug}
          </Link>
        </div>
      </div>
    </div>
  );
}
