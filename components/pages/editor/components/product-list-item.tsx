"use client";

import Image from "next/image";
import { Image as ImageIcon, Edit, Archive } from "lucide-react";
import type { Product } from "../types";
import { formatPrice } from "../utils";

interface ProductListItemProps {
  product: Product;
  onEdit: (product: Product) => void;
  onToggleArchive: (productId: string, currentStatus?: boolean) => void;
}

export function ProductListItem({ product, onEdit, onToggleArchive }: ProductListItemProps) {
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-[--system-100] transition-colors">
      {/* Thumbnail */}
      <div className="w-14 h-14 bg-[--system-100] flex items-center justify-center flex-shrink-0 relative">
        {product.images?.[0] ? (
          <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
        ) : (
          <ImageIcon className="w-5 h-5 text-[--system-300]" />
        )}
      </div>

      {/* Name + Description */}
      <div className="flex-1 min-w-0">
        <h3 className="font-normal text-[--system-700] truncate">{product.name}</h3>
        <p className="text-sm text-[--system-400] truncate">{product.description}</p>
      </div>

      {/* Price */}
      <div className="flex items-center gap-2">
        <span className="font-medium text-[--system-700]">
          {formatPrice(product.basePrice)}
        </span>
        {product.oldPrice && (
          <span className="text-sm text-[--system-300] line-through">{formatPrice(product.oldPrice)}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onEdit(product)}
          className="p-2 hover:bg-[--system-100] transition-colors"
        >
          <Edit className="w-4 h-4 text-[--system-400]" />
        </button>
        <button
          onClick={() => onToggleArchive(product._id, product.isArchived)}
          className="p-2 hover:bg-[--system-100] transition-colors"
        >
          <Archive className="w-4 h-4 text-[--system-400]" />
        </button>
      </div>
    </div>
  );
}
