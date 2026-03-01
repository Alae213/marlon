"use client";

import { Fragment, ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function Modal({ isOpen, onClose, title, description, children, size = "md" }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <Fragment>
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className={`relative bg-white dark:bg-zinc-900 rounded-3xl p-8 w-full ${sizeStyles[size]} shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto`}>
          {title && (
            <div className="mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{title}</h2>
                  {description && (
                    <p className="text-sm text-zinc-500 mt-1">{description}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors -me-2 -mt-2"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
            </div>
          )}
          {!title && (
            <button
              onClick={onClose}
              className="absolute top-4 end-4 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          )}
          {children}
        </div>
      </Fragment>
    </div>
  );
}
