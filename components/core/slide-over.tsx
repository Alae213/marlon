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
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className={`fixed inset-y-0 end-0 z-50 w-full ${sizeStyles[size]} bg-white dark:bg-zinc-900 shadow-2xl animate-in slide-in-from-end duration-300 overflow-y-auto`}>
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
          {title && (
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{title}</h2>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors ms-auto"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </Fragment>
  );
}
