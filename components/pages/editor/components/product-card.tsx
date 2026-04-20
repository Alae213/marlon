"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Edit, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Product } from "../types";
import { formatPrice } from "../utils";

interface ProductCardProps {
  product: Product;
  isHighlighted?: boolean;
  onOpen: (product: Product) => void;
  onToggleArchive: (productId: string, currentStatus?: boolean) => void;
  deletingProductId: string | null;
  onRequestDelete: (productId: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (productId: string) => void;
}

export function ProductCard({
  product,
  isHighlighted = false,
  onOpen,
  onToggleArchive,
  deletingProductId,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: ProductCardProps) {
  const isDeleting = deletingProductId === product._id;
  const isHidden = product.isArchived === true;
  const showOldPrice = product.oldPrice !== undefined;
  const thumbnailSrc = product.images?.[0] || "/Hero-bg.jpg";

  return (
    <>
      <motion.div
        role="button"
        tabIndex={0}
        data-product-card-id={product._id}
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", duration: 0.2, bounce: 0 }}
        onClick={() => onOpen(product)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen(product);
          }
        }}
        className="group relative cursor-pointer overflow-hidden rounded-[28px] p-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6B97FF]"
      >
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 rounded-[28px] transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)] ${
            isHighlighted
              ? "bg-[#EAF3FF]/28 shadow-[inset_0_0_0_1px_rgba(107,151,255,0.55),0_22px_40px_-24px_rgba(84,131,207,0.22)]"
              : "bg-[#EAF3FF]/0 group-hover:bg-[#EAF3FF]/35 group-hover:shadow-[inset_0_0_0_1px_rgba(180,202,245,0.55),0_20px_40px_-24px_rgba(84,131,207,0.3)] hover:bg-[var(--system-200)]/40"
          }`}
        />

        <div className="relative overflow-hidden rounded-[24px] p-2 ">
          <div className="relative aspect-[3/4] overflow-hidden rounded-[22px] shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute left-4 right-4 top-3 z-[1] h-1.5 w-1.5 rounded-full transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
                isHighlighted
                  ? "bg-[#6B97FF]/0 shadow-[0_10px_24px_-8px_rgba(84,131,207,0.65)]"
                  : "bg-transparent"
              }`}
            />
            <Image
              src={thumbnailSrc}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              className="object-cover transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] group-hover:scale-[1.03] "
            />

            {isHidden ? (
              <div className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-caption font-medium text-white backdrop-blur-sm">
                <EyeOff className="h-3.5 w-3.5" />
                Hidden
              </div>
            ) : null}
          </div>

          <div className="space-y-2 p-3">
            <div className="text-title text-[var(--system-600)]">{product.name}</div>
            <div className="flex items-center gap-2">
              <p className="text-title font-bold text-[var(--system-600)]">{formatPrice(product.basePrice)}</p>
              {showOldPrice ? (
                <p className="text-title font-medium text-[var(--system-300)] line-through">
                  {product.oldPrice ? formatPrice(product.oldPrice) : ""}
                </p>
              ) : null}
            </div>
          </div>

          <div className="absolute right-3 top-3 flex gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onOpen(product);
              }}
              className="rounded-xl bg-[var(--system-600)] p-3 text-white transition-colors hover:bg-[var(--system-400)]"
              title="Edit"
              aria-label={`Edit ${product.name}`}
            >
              <Edit className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onToggleArchive(product._id, product.isArchived);
              }}
              className="rounded-xl bg-[var(--system-600)] p-3 text-white transition-colors hover:bg-[var(--system-400)]"
              title={isHidden ? "Unhide" : "Hide"}
              aria-label={isHidden ? `Unhide ${product.name}` : `Hide ${product.name}`}
            >
              {isHidden ? (
                <Eye className="h-4 w-4 text-[var(--color-success)]" />
              ) : (
                <EyeOff className="h-4 w-4 text-[var(--color-warning)]" />
              )}
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onRequestDelete(product._id);
              }}
              className="rounded-xl bg-[var(--system-600)] p-3 text-white transition-colors hover:bg-[var(--system-400)]"
              title="Delete"
              aria-label={`Delete ${product.name}`}
            >
              <Trash2 className="h-4 w-4 text-[var(--destructive)]" />
            </button>
          </div>
        </div>
      </motion.div>

      <Dialog open={isDeleting} onOpenChange={(nextOpen) => !nextOpen && onCancelDelete()}>
        <DialogContent className="max-w-[360px]">
          <DialogHeader>
            <DialogTitle>Delete product?</DialogTitle>
            <DialogDescription>
              This permanently removes the product from your workspace.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onCancelDelete}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => onConfirmDelete(product._id)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
