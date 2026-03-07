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
    <div className="flex items-center gap-2 min-w-0">
      {firstItem.image ? (
        <div className="w-8 h-8 bg-[var(--system-100)] rounded-lg overflow-hidden relative flex-shrink-0">
          <Image
            src={firstItem.image}
            alt={firstItem.name}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="w-8 h-8 bg-[var(--system-100)] rounded-lg flex items-center justify-center flex-shrink-0">
          <Package className="w-4 h-4 text-[var(--system-300)]" />
        </div>
      )}
      <div className="min-w-0">
        <p className="body-base text-[var(--system-600)] truncate">{firstItem.name}</p>
        {firstItem.variant && (
          <p className="body-base text-[var(--system-300)] truncate">{firstItem.variant}</p>
        )}
      </div>
      {remainingCount > 0 && (
        <span className="body-base text-[var(--system-300)] whitespace-nowrap">+{remainingCount} more</span>
      )}
    </div>
  );
}
