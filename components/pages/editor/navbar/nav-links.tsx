"use client";

import type { NavbarLink } from "../types";

interface NavLinksProps {
  links: NavbarLink[];
  textClass: string;
  editingLinkId: string | null;
  editingText: string;
  onStartEditing: (link: NavbarLink) => void;
  onTextChange: (text: string) => void;
  onSaveText: () => void;
  onTextKeyDown: (e: React.KeyboardEvent) => void;
}

export function NavLinks({
  links,
  textClass,
  editingLinkId,
  editingText,
  onStartEditing,
  onTextChange,
  onSaveText,
  onTextKeyDown,
}: NavLinksProps) {
  return (
    <div className="hidden lg:flex items-center gap-1">
      {links.map((link) => (
        <div key={link.id} className="relative group">
          {editingLinkId === link.id ? (
            <input
              key={`input-${link.id}`}
              type="text"
              value={editingText}
              onChange={(e) => onTextChange(e.target.value)}
              onBlur={onSaveText}
              onKeyDown={onTextKeyDown}
              autoFocus
              className={`px-3 py-2 text-sm bg-transparent border-b-2 border-[var(--system-600)] outline-none ${textClass} w-auto min-w-[80px]`}
            />
          ) : (
            <button
              key={`btn-${link.id}`}
              onClick={() => onStartEditing(link)}
              className={`px-3 py-2 text-sm border-b-2 border-transparent ${textClass} hover:opacity-70 transition-opacity cursor-text`}
            >
              {link.text}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
