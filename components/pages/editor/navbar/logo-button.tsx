"use client";

import Image from "next/image";
import { Package } from "lucide-react";

interface LogoButtonProps {
  logoUrl?: string;
  onClick: () => void;
}

export function LogoButton({ logoUrl, onClick }: LogoButtonProps) {
  return (
    <button onClick={onClick} className="cursor-pointer">
      <div className="w-9 h-9 bg-[var(--system-100)] flex items-center justify-center flex-shrink-0 relative">
        {logoUrl ? (
          <Image src={logoUrl} alt="logo" fill className="object-cover" />
        ) : (
          <Package className="w-5 h-5 text-[var(--system-300)]" />
        )}
      </div>
    </button>
  );
}
