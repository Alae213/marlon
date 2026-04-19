"use client";

import Image from "next/image";
import { Edit, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Product, EditingField } from "../types";
import { formatPrice } from "../utils";

interface ProductCardProps {
  product: Product;
  editingField: EditingField | null;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onStartEditing: (productId: string, field: "name" | "basePrice" | "oldPrice", value: string | number) => void;
  onSaveEdit: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onEdit: (product: Product) => void;
  onToggleArchive: (productId: string, currentStatus?: boolean) => void;
  deletingProductId: string | null;
  onRequestDelete: (productId: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (productId: string) => void;
}

export function ProductCard({
  product,
  editingField,
  editValue,
  onEditValueChange,
  onStartEditing,
  onSaveEdit,
  onKeyDown,
  onEdit,
  onToggleArchive,
  deletingProductId,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: ProductCardProps) {
  const isEditingName = editingField?.productId === product._id && editingField?.field === "name";
  const isEditingBasePrice = editingField?.productId === product._id && editingField?.field === "basePrice";
  const isEditingOldPrice = editingField?.productId === product._id && editingField?.field === "oldPrice";
  const isDeleting = deletingProductId === product._id;
  const showOldPrice = product.oldPrice !== undefined;
  const thumbnailSrc = product.images?.[0] || "/Hero-bg.jpg";

  return (
    <>
      <div className="group relative overflow-hidden transition-all duration-200">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[var(--radius-xl)]">
          <Image
            src={thumbnailSrc}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="object-cover"
          />
        </div>

        <div className="p-[var(--spacing-sm)]">
          {isEditingName ? (
            <input
              autoFocus
              type="text"
              value={editValue}
              onChange={(e) => onEditValueChange(e.target.value)}
              onBlur={onSaveEdit}
              onKeyDown={onKeyDown}
              className="text-body mb-[var(--spacing-sm)] w-full rounded-[var(--radius-md)] border border-[--color-input] bg-[--color-card] px-[var(--spacing-sm)] py-[var(--spacing-xs)] text-[--system-700]"
              aria-label={`Edit name for ${product.name}`}
            />
          ) : (
            <button
              type="button"
              className="text-body mb-[var(--spacing-sm)] line-clamp-2 cursor-pointer text-left text-[--system-700] hover:text-[--system-400]"
              onClick={() => onStartEditing(product._id, "name", product.name)}
            >
              {product.name}
            </button>
          )}

          <div className="flex items-center gap-[var(--spacing-sm)]">
            {isEditingBasePrice ? (
              <input
                autoFocus
                type="number"
                value={editValue}
                onChange={(e) => onEditValueChange(e.target.value)}
                onBlur={onSaveEdit}
                onKeyDown={onKeyDown}
                className="text-body w-24 rounded-[var(--radius-md)] border border-[--color-input] bg-[--color-card] px-[var(--spacing-sm)] py-[var(--spacing-xs)] font-semibold tabular-nums text-[--system-700]"
                aria-label={`Edit base price for ${product.name}`}
              />
            ) : (
              <button
                type="button"
                className="text-body cursor-pointer font-semibold tabular-nums text-[--system-700] hover:text-[--system-400]"
                onClick={() => onStartEditing(product._id, "basePrice", product.basePrice)}
              >
                {formatPrice(product.basePrice)}
              </button>
            )}

            {showOldPrice &&
              (isEditingOldPrice ? (
                <input
                  autoFocus
                  type="number"
                  value={editValue}
                  onChange={(e) => onEditValueChange(e.target.value)}
                  onBlur={onSaveEdit}
                  onKeyDown={onKeyDown}
                  className="text-caption w-24 rounded-[var(--radius-md)] border border-[--color-input] bg-[--color-card] px-[var(--spacing-xs)] py-[var(--spacing-xs)] line-through tabular-nums text-[--system-300]"
                  placeholder="Old price"
                  aria-label={`Edit old price for ${product.name}`}
                /> 
              ) : ( 
                <button
                  type="button"
                  className="text-caption cursor-pointer line-through text-[--system-300] hover:text-[--system-400]"
                  onClick={() => onStartEditing(product._id, "oldPrice", product.oldPrice || "")}
                >
                  {product.oldPrice && formatPrice(product.oldPrice)}
                </button>
              ))}
          </div>
        </div>

        <div className="absolute top-[var(--spacing-sm)] end-[var(--spacing-sm)] flex gap-[var(--spacing-xs)] opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(product);
            }}
            className="rounded-[var(--radius-md)] border border-[--color-border] bg-[--color-card] p-[var(--spacing-sm)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[--system-50]"
            title="Edit"
            aria-label={`Edit ${product.name}`}
          >
            <Edit className="w-4 h-4 text-[--system-400]" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleArchive(product._id, product.isArchived);
            }}
            className="rounded-[var(--radius-md)] border border-[--color-border] bg-[--color-card] p-[var(--spacing-sm)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[--system-50]"
            title={product.isArchived ? "Activate" : "Deactivate"}
            aria-label={product.isArchived ? `Activate ${product.name}` : `Deactivate ${product.name}`}
          >
            {product.isArchived ? (
              <Eye className="w-4 h-4 text-[--color-success]" />
            ) : (
              <EyeOff className="w-4 h-4 text-[--color-warning]" />
            )}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRequestDelete(product._id);
            }}
            className="rounded-[var(--radius-md)] border border-[--color-border] bg-[--color-card] p-[var(--spacing-sm)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[--color-error-bg]"
            title="Delete"
            aria-label={`Delete ${product.name}`}
          >
            <Trash2 className="w-4 h-4 text-[--destructive]" />
          </button>
        </div>
      </div>

      <Dialog open={isDeleting} onOpenChange={(open) => !open && onCancelDelete()}>
        <DialogContent className="max-w-[360px]">
          <DialogHeader className="pr-10">
            <DialogTitle>Delete product?</DialogTitle>
            <DialogDescription>This action will archive the product from the storefront.</DialogDescription>
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
