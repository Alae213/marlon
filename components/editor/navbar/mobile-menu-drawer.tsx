"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { NavbarLink } from "../types";

interface MobileMenuDrawerProps {
  isOpen: boolean;
  links: NavbarLink[];
  editingLinkId: string | null;
  editingText: string;
  onStartEditing: (link: NavbarLink) => void;
  onTextChange: (text: string) => void;
  onSaveText: () => void;
  onTextKeyDown: (e: React.KeyboardEvent) => void;
  onClose: () => void;
}

export function MobileMenuDrawer({
  isOpen,
  links,
  editingLinkId,
  editingText,
  onStartEditing,
  onTextChange,
  onSaveText,
  onTextKeyDown,
  onClose,
}: MobileMenuDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-72 bg-[var(--system-50)] dark:bg-[var(--system-700)] shadow-xl z-50 lg:hidden flex flex-col pt-[env(safe-area-inset-top)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--system-200)] dark:border-[var(--system-600)]">
              <h2 className="text-lg font-medium text-[var(--system-600)] dark:text-[var(--system-50)]">Menu</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[var(--system-100)] dark:hover:bg-[var(--system-600)] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="p-3 rounded-lg bg-[var(--system-100)] dark:bg-[var(--system-600)]"
                >
                  {editingLinkId === link.id ? (
                    <input
                      key={`input-${link.id}`}
                      type="text"
                      value={editingText}
                      onChange={(e) => onTextChange(e.target.value)}
                      onBlur={onSaveText}
                      onKeyDown={onTextKeyDown}
                      autoFocus
                      className="w-full bg-transparent border-b-2 border-[var(--system-600)] dark:border-[var(--system-50)] outline-none text-[var(--system-600)] dark:text-[var(--system-50)]"
                    />
                  ) : (
                    <button
                      key={`btn-${link.id}`}
                      onClick={() => onStartEditing(link)}
                      className="text-[var(--system-600)] dark:text-[var(--system-50)] w-full text-left cursor-text"
                    >
                      {link.text}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
