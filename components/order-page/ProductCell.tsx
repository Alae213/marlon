"use client";

import { Package } from "lucide-react";
import Image from "next/image";

interface ProductCellProps {
  items: Array<{ name: string; variant?: string; image?: string }>;
}

export function ProductCell({ items }: ProductCellProps) {
  const firstItem = items[0];
  const remainingCount = items.length - 1;

  return (
    <div className="flex items-center gap-2">
      {firstItem.image ? (
        <div className="w-8 h-8 bg-[#f5f5f5] dark:bg-[#262626] rounded overflow-hidden relative flex-shrink-0">
          <Image
            src={firstItem.image}
            alt={firstItem.name}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="w-8 h-8 bg-[#f5f5f5] dark:bg-[#262626] rounded flex items-center justify-center flex-shrink-0">
          <Package className="w-4 h-4 text-[#a3a3a3]" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm text-[#171717] dark:text-[#fafafa] truncate">{firstItem.name}</p>
        {firstItem.variant && (
          <p className="text-xs text-[#737373] truncate">{firstItem.variant}</p>
        )}
      </div>
      {remainingCount > 0 && (
        <span className="text-xs text-[#737373] whitespace-nowrap">+{remainingCount} more</span>
      )}
    </div>
  );
}
