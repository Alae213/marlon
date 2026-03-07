"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  useFloating,
  autoUpdate,
  flip,
  shift,
  arrow,
  Placement,
} from "@floating-ui/react";

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  placement?: Placement;
}

export function Dropdown({
  trigger,
  children,
  isOpen,
  onOpenChange,
  placement = "bottom-start",
}: DropdownProps) {
  const arrowRef = useRef<SVGSVGElement>(null);

  const { refs, floatingStyles, middlewareData } = useFloating({
    open: isOpen,
    onOpenChange,
    placement,
    middleware: [
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      arrow({ element: arrowRef }),
    ],
    whileElementsMounted: autoUpdate,
  });

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const floating = refs.floating.current;
      const reference = refs.reference.current as HTMLElement | null;
      
      if (
        floating &&
        reference &&
        !floating.contains(event.target as Node) &&
        !reference.contains(event.target as Node)
      ) {
        onOpenChange(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onOpenChange, refs.floating, refs.reference]);

  return (
    <>
      <div ref={refs.setReference} className="inline-flex">
        {trigger}
      </div>
      {isOpen &&
        createPortal(
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="z-[9999]"
          >
            <div className="bg-white dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#404040] shadow-lg rounded-lg overflow-hidden min-w-[160px] py-1">
              {children}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function DropdownItem({
  children,
  onClick,
  disabled,
  className = "",
}: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full px-3 py-2 text-start text-sm flex items-center gap-2 hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return (
    <div className="h-px bg-[#e5e5e5] dark:bg-[#404040] my-1" />
  );
}
