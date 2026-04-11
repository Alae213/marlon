"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
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
    middleware: useMemo(
      () => [
        flip({ padding: 8 }),
        shift({ padding: 8 }),
        arrow({ element: arrowRef }),
      ],
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    ),
    whileElementsMounted: autoUpdate,
  });

  const setFloatingRef = useCallback(
    (node: HTMLElement | null) => refs.setFloating(node),
    [refs],
  );

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
            ref={setFloatingRef}
            style={floatingStyles}
            className="z-[9999]"
          >
            <div className="bg-[--system-gray-6] border border-[#e5e5e5] shadow-lg rounded-lg overflow-hidden min-w-[160px] py-1">
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
      className={`w-full px-3 py-2 text-start text-sm flex items-center gap-2 hover:bg-[--system-gray-5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return (
    <div className="h-px bg-[--system-gray-4] my-1" />
  );
}
