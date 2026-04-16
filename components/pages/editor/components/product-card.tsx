"use client";

import Image from "next/image";
import { Image as ImageIcon, Edit, Eye, EyeOff, Trash2 } from "lucide-react";
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

  return (
    <>
      <div className="group relative overflow-hidden rounded-2xl border border-[--system-200] bg-white transition-all duration-200 hover:border-[--system-700]">
        <div className="relative flex aspect-square items-center justify-center bg-[--system-50]">
          {product.images?.[0] ? (
            <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
          ) : (
            <ImageIcon className="w-8 h-8 text-[--system-300]" />
          )}
        </div>

        <div className="p-4">
          
            <h3
              className="mb-2 line-clamp-2 cursor-pointer text-body text-[--system-700] hover:text-[--system-400]"
              onClick={() => onStartEditing(product._id, "name", product.name)}
            >
              {product.name}
            </h3>
          

          <div className="flex items-center gap-2">
            
              <span
                className="cursor-pointer text-body font-semibold tabular-nums text-[--system-700] hover:text-[--system-400]"
                onClick={() => onStartEditing(product._id, "basePrice", product.basePrice)}
              >
                {formatPrice(product.basePrice)}
              </span>
           

            {product.oldPrice &&
              (isEditingOldPrice ? (
                <input
                  autoFocus
                  type="number"
                  value={editValue}
                  onChange={(e) => onEditValueChange(e.target.value)}
                  onBlur={onSaveEdit}
                  onKeyDown={onKeyDown}
                  className="w-24 border border-[--system-300] bg-white px-1 py-0.5 text-xs line-through tabular-nums text-[--system-300] focus:outline-none"
                  placeholder="Old price"
                /> 
              ) : ( 
                <span
                  className="cursor-pointer text-xs line-through text-[--system-300] hover:text-[--system-400]"
                  onClick={() => onStartEditing(product._id, "oldPrice", product.oldPrice || "")}
                >
                  {formatPrice(product.oldPrice)}
                </span>
              ))}
          </div>
        </div>

        <div className="absolute top-2 end-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(product);
            }}
            className="bg-white/90 p-2 transition-colors hover:bg-[--system-50]"
            title="Edit"
          >
            <Edit className="w-4 h-4 text-[--system-400]" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleArchive(product._id, product.isArchived);
            }}
            className="bg-white/90 p-2 transition-colors hover:bg-[--system-50]"
            title={product.isArchived ? "Activate" : "Deactivate"}
          >
            {product.isArchived ? (
              <Eye className="w-4 h-4 text-[--color-success]" />
            ) : (
              <EyeOff className="w-4 h-4 text-[--color-warning]" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRequestDelete(product._id);
            }}
            className="bg-white/90 p-2 transition-colors hover:bg-red-50"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-[--destructive]" />
          </button>
        </div>
      </div>

      <Dialog open={isDeleting} onOpenChange={(open) => !open && onCancelDelete()}>
        <DialogContent className="max-w-[360px] border-[--system-200] bg-[--color-card] p-[var(--spacing-lg)] shadow-[var(--shadow-xl)]">
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
