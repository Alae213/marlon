"use client";

import Image from "next/image";
import { Image as ImageIcon, Edit, Eye, EyeOff, Trash2 } from "lucide-react";
import type { Product, EditingField } from "./types";
import { DeleteConfirmOverlay } from "./delete-confirm-overlay";
import { formatPrice } from "./utils";

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

  return (
    <div className="group relative bg-white dark:bg-[var(--system-700)] border border-[var(--system-200)] dark:border-[var(--system-600)] overflow-hidden hover:border-[var(--system-700)] dark:hover:border-[var(--system-50)] transition-all duration-200">
      {/* Image */}
      <div className="aspect-square bg-[var(--system-50)] dark:bg-[var(--system-700)] flex items-center justify-center relative">
        {product.images?.[0] ? (
          <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
        ) : (
          <ImageIcon className="w-8 h-8 text-[var(--system-300)]" />
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        {/* Product Name - Inline Edit */}
        {isEditingName ? (
          <input
            autoFocus
            type="text"
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            onBlur={onSaveEdit}
            onKeyDown={onKeyDown}
            className="w-full body-base text-[var(--system-700)] dark:text-[var(--system-50)] mb-2 px-1 py-0.5 border border-[var(--system-700)] dark:border-[var(--system-50)] bg-white dark:bg-[var(--system-700)] focus:outline-none"
          />
        ) : (
          <h3
            className="body-base text-[var(--system-700)] dark:text-[var(--system-50)] mb-2 line-clamp-2 cursor-pointer hover:text-[var(--system-400)] dark:hover:text-[var(--system-200)]"
            onClick={() => onStartEditing(product._id, "name", product.name)}
          >
            {product.name}
          </h3>
        )}

        <div className="flex items-center gap-2">
          {/* Base Price - Inline Edit */}
          {isEditingBasePrice ? (
            <input
              autoFocus
              type="number"
              value={editValue}
              onChange={(e) => onEditValueChange(e.target.value)}
              onBlur={onSaveEdit}
              onKeyDown={onKeyDown}
              className="body-base font-semibold text-[var(--system-700)] dark:text-[var(--system-50)] tabular-nums px-1 py-0.5 w-24 border border-[var(--system-700)] dark:border-[var(--system-50)] bg-white dark:bg-[var(--system-700)] focus:outline-none"
            />
          ) : (
            <span
              className="body-base font-semibold text-[var(--system-700)] dark:text-[var(--system-50)] tabular-nums cursor-pointer hover:text-[var(--system-400)] dark:hover:text-[var(--system-200)]"
              onClick={() => onStartEditing(product._id, "basePrice", product.basePrice)}
            >
              {formatPrice(product.basePrice)}
            </span>
          )}

          {/* Old Price - Inline Edit */}
          {product.oldPrice &&
            (isEditingOldPrice ? (
              <input
                autoFocus
                type="number"
                value={editValue}
                onChange={(e) => onEditValueChange(e.target.value)}
                onBlur={onSaveEdit}
                onKeyDown={onKeyDown}
                className="label-xs text-[var(--system-300)] line-through tabular-nums px-1 py-0.5 w-24 border border-[var(--system-300)] bg-white dark:bg-[var(--system-700)] focus:outline-none"
                placeholder="Old price"
              />
            ) : (
              <span
                className="label-xs text-[var(--system-300)] line-through cursor-pointer hover:text-[var(--system-400)]"
                onClick={() => onStartEditing(product._id, "oldPrice", product.oldPrice || "")}
              >
                {formatPrice(product.oldPrice)}
              </span>
            ))}
        </div>
      </div>

      {/* Action buttons (visible on hover) */}
      <div className="absolute top-2 end-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit(product);
          }}
          className="p-2 bg-white/90 dark:bg-[var(--system-700)]/90 hover:bg-[var(--system-50)] dark:hover:bg-[var(--system-600)] transition-colors"
          title="Edit"
        >
          <Edit className="w-4 h-4 text-[var(--system-400)]" />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleArchive(product._id, product.isArchived);
          }}
          className="p-2 bg-white/90 dark:bg-[var(--system-700)]/90 hover:bg-[var(--system-50)] dark:hover:bg-[var(--system-600)] transition-colors"
          title={product.isArchived ? "Activate" : "Deactivate"}
        >
          {product.isArchived ? (
            <Eye className="w-4 h-4 text-[var(--success)]" />
          ) : (
            <EyeOff className="w-4 h-4 text-[var(--warning)]" />
          )}
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRequestDelete(product._id);
          }}
          className="p-2 bg-white/90 dark:bg-[var(--system-700)]/90 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4 text-[var(--destructive)]" />
        </button>
      </div>

      {/* Delete confirmation overlay */}
      {isDeleting && (
        <DeleteConfirmOverlay
          onCancel={onCancelDelete}
          onConfirm={() => onConfirmDelete(product._id)}
        />
      )}
    </div>
  );
}
