"use client";

import Image from "next/image";
import { ReactNode } from "react";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import windowIcon from "@/public/windw.svg";
import favicon from "@/public/favicon.svg";

interface EditorShellProps {
  leftSlot?: ReactNode;
  centerSlot?: ReactNode;
  rightSlot?: ReactNode;
  children: ReactNode;
}

export function EditorShell({ leftSlot, centerSlot, rightSlot, children }: EditorShellProps) {
  return (
    <div className="fixed inset-0 flex h-screen w-screen flex-col bg-[var(--system-200)]">
      <div className="flex-1" />

      <div
        style={{
          background: "var(--gradient-popup)",
          boxShadow: "var(--shadow-xl-shadow)",
        }}
        className="mx-auto flex h-[96vh] w-full max-w-7xl flex-col gap-[8px] overflow-hidden rounded-t-[20px] px-[12px] pb-[0px] pt-[8px]"
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between px-[8px]">
          {/* Left */}
          <div className="flex w-[140px] items-center gap-[12px]">
            <Image
              src={windowIcon}
              alt="Window"
              width={24}
              height={24}
              className="h-6 w-6 cursor-pointer"
            />
            {leftSlot}
          </div>

          {/* Center */}
          <div className="flex flex-1 justify-center">
            <div
              style={{ boxShadow: "var(--shadow-inside-shadow)" }}
              className="flex w-full max-w-[360px] items-center gap-2 rounded-[8px] bg-black/40 p-[3px] pl-[8px]"
            >
              <Image src={favicon} alt="Marlon" width={24} height={24} className="h-4 w-4" />
              <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-center text-sm font-semibold text-[var(--system-200)]">
                {centerSlot}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="flex w-[180px] items-center justify-end gap-2">
            {rightSlot}
          </div>
        </div>

        {/* Scrollable Viewport */}
        <ScrollArea.Root className="h-full w-full overflow-hidden rounded-[12px] rounded-b-[0px] bg-none">
          <ScrollArea.Viewport
            style={{ boxShadow: "var(--shadow-inside-shadow)" }}
            className="h-full flex-1 overflow-hidden overflow-y-auto rounded-[12px] rounded-b-[0px] border-t-[1px] border-[var(--system-400)] bg-[var(--system-100)]"
          >
            <div className="min-h-full px-6 py-10 sm:px-10 lg:px-16">
              {children}
            </div>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar
            className="flex select-none touch-none bg-black/10 p-[1px] transition-colors duration-[100ms] ease-in hover:bg-black/20"
            orientation="vertical"
          >
            <ScrollArea.Thumb className="relative flex-1 cursor-grab rounded-full bg-black/30 active:cursor-grabbing" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      </div>
    </div>
  );
}
