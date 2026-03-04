"use client";

import { Fragment, ReactNode } from "react";
import { X } from "lucide-react";

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}



export function SlideOver({ isOpen, onClose, title, children }: SlideOverProps) {
  if (!isOpen) return null;

  return (
    <Fragment>
      <div 
        className="fixed inset-0 z-50 bg-black/30 transition-opacity"
        onClick={onClose}
      />
      <div className={`fixed inset-y-0 right-0 z-50 w-[400px] bg-card shadow-xl animate-in slide-in-from-right duration-300 overflow-y-auto`}>
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-sm">
          {title && (
            <h2 className="text-lg font-medium text-foreground">{title}</h2>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted transition-colors ms-auto"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </Fragment>
  );
}
