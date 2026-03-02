"use client";

import { Fragment, ReactNode } from "react";
import { X } from "lucide-react";

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function SlideOver({ isOpen, onClose, title, children, size = "md" }: SlideOverProps) {
  if (!isOpen) return null;

  return (
    <Fragment>
      <div 
        className="fixed inset-0 z-50 bg-black/30 transition-opacity"
        onClick={onClose}
      />
      <div className={`fixed inset-y-0 end-0 z-50 w-full ${sizeStyles[size]} bg-white dark:bg-[#0a0a0a] shadow-2xl animate-in slide-in-from-end duration-300 overflow-y-auto`}>
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-[#e5e5e5] dark:border-[#262626] bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-sm">
          {title && (
            <h2 className="text-lg font-medium text-[#171717] dark:text-[#fafafa]">{title}</h2>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#f5f5f5] dark:hover:bg-[#171717] transition-colors ms-auto"
          >
            <X className="w-5 h-5 text-[#737373]" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </Fragment>
  );
}
