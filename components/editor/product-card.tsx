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
    <div className="group relative bg-white dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] overflow-hidden hover:border-[#171717] dark:hover:border-[#fafafa] transition-all duration-200">
      {/* Image */}
      <div className="aspect-square bg-[#f5f5f5] dark:bg-[#171717] flex items-center justify-center relative">
        {product.images?.[0] ? (
          <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
        ) : (
          <ImageIcon className="w-8 h-8 text-[#d4d4d4]" />
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
            className="w-full font-normal text-[#171717] dark:text-[#fafafa] mb-2 px-1 py-0.5 border border-[#171717] dark:border-[#fafafa] bg-white dark:bg-[#0a0a0a] focus:outline-none"
          />
        ) : (
          <h3
            className="font-normal text-[#171717] dark:text-[#fafafa] mb-2 line-clamp-2 cursor-pointer hover:text-[#525252] dark:hover:text-[#d4d4d4]"
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
              className="font-medium text-[#171717] dark:text-[#fafafa] px-1 py-0.5 w-24 border border-[#171717] dark:border-[#fafafa] bg-white dark:bg-[#0a0a0a] focus:outline-none"
            />
          ) : (
            <span
              className="font-medium text-[#171717] dark:text-[#fafafa] cursor-pointer hover:text-[#525252] dark:hover:text-[#d4d4d4]"
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
                className="text-sm text-[#a3a3a3] line-through px-1 py-0.5 w-24 border border-[#a3a3a3] bg-white dark:bg-[#0a0a0a] focus:outline-none"
                placeholder="السعر القديم"
              />
            ) : (
              <span
                className="text-sm text-[#a3a3a3] line-through cursor-pointer hover:text-[#737373]"
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
          className="p-2 bg-white/90 dark:bg-[#0a0a0a]/90 hover:bg-[#f5f5f5] dark:hover:bg-[#171717] transition-colors"
          title="تعديل"
        >
          <Edit className="w-4 h-4 text-[#525252]" />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleArchive(product._id, product.isArchived);
          }}
          className="p-2 bg-white/90 dark:bg-[#0a0a0a]/90 hover:bg-[#f5f5f5] dark:hover:bg-[#171717] transition-colors"
          title={product.isArchived ? "تفعيل" : "تعطيل"}
        >
          {product.isArchived ? (
            <Eye className="w-4 h-4 text-[#16a34a]" />
          ) : (
            <EyeOff className="w-4 h-4 text-[#d97706]" />
          )}
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRequestDelete(product._id);
          }}
          className="p-2 bg-white/90 dark:bg-[#0a0a0a]/90 hover:bg-[#fee2e2] dark:hover:bg-[#7f1d1d]/20 transition-colors"
          title="حذف"
        >
          <Trash2 className="w-4 h-4 text-[#dc2626]" />
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
