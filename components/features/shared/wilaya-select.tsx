"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { algeriaWilayas, Wilaya, Commune, getWilayaDisplay } from "@/lib/algeria-data";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface WilayaSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
}

export function WilayaSelect({ value, onChange, label, required, error }: WilayaSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredWilayas = algeriaWilayas.filter(w => {
    const display = getWilayaDisplay(w).toLowerCase();
    const searchLower = search.toLowerCase();
    return display.includes(searchLower) || 
           w.arabic.includes(search) ||
           w.french.toLowerCase().includes(searchLower);
  });

  const handleSelect = (wilaya: Wilaya) => {
    onChange(getWilayaDisplay(wilaya));
    setIsOpen(false);
    setSearch("");
  };

  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [search]);

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-normal text-foreground mb-1">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`w-full px-3 py-2 border bg-background text-foreground focus:outline-none focus:border-primary flex items-center justify-between ${
              error ? "border-destructive" : "border-input"
            } ${!value ? "text-muted-foreground" : ""}`}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span className={value ? "text-foreground" : "text-muted-foreground"}>
              {value || "اختر الولاية - Choisissez la wilaya"}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={4}
          className="p-0 w-[var(--radix-popper-anchor-width)] max-w-[calc(100vw-2rem)]"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
          onFocusOutside={() => setIsOpen(false)}
        >
          <div className="bg-popover text-popover-foreground border border-border shadow-lg max-h-[300px] overflow-hidden flex flex-col">
            <div className="p-2 border-b border-border">
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث - Rechercher..."
                className="w-full px-2 py-1 text-sm border border-input bg-background focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsOpen(false);
                    return;
                  }
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setHighlightedIndex((i) => Math.min(i + 1, Math.max(0, filteredWilayas.length - 1)));
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setHighlightedIndex((i) => Math.max(0, i - 1));
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const pick = filteredWilayas[highlightedIndex];
                    if (pick) handleSelect(pick);
                  }
                }}
              />
            </div>
            <div className="overflow-y-auto flex-1" role="listbox">
              {filteredWilayas.map((wilaya, idx) => {
                const display = getWilayaDisplay(wilaya);
                const isSelected = value === display;
                const isHighlighted = idx === highlightedIndex;
                return (
                  <button
                    key={wilaya.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseMove={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelect(wilaya)}
                    className={`w-full px-3 py-2 text-start transition-colors ${
                      isHighlighted ? "bg-accent" : "hover:bg-accent"
                    } ${isSelected ? "font-medium" : ""}`}
                  >
                    <span className="text-foreground text-sm">
                      {wilaya.id} - {wilaya.french} - {wilaya.arabic}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

interface CommuneSelectProps {
  wilayaValue: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

export function CommuneSelect({ wilayaValue, value, onChange, label, required, error, disabled }: CommuneSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derive communes from wilayaValue - no need for useEffect
  const communes = useMemo(() => {
    if (!wilayaValue) return [];
    const wilaya = algeriaWilayas.find(w => getWilayaDisplay(w) === wilayaValue);
    return wilaya?.communes || [];
  }, [wilayaValue]);

  /* eslint-disable react-hooks/set-state-in-effect */
  // Reset UI state when disabled changes
  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
      setSearch("");
    }
  }, [disabled]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filteredCommunes = communes.filter(c => {
    const searchLower = search.toLowerCase();
    return c.french.toLowerCase().includes(searchLower) || 
           c.arabic.includes(search);
  });

  const handleSelect = (commune: Commune) => {
    onChange(commune.french);
    setIsOpen(false);
    setSearch("");
  };

  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [search]);

  const isDisabled = disabled || !wilayaValue || communes.length === 0;

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-normal text-foreground mb-1">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={isDisabled}
            className={`w-full px-3 py-2 border bg-background text-foreground focus:outline-none focus:border-primary flex items-center justify-between ${
              error ? "border-destructive" : "border-input"
            } ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${
              !value ? "text-muted-foreground" : ""
            }`}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span className={value ? "text-foreground" : "text-muted-foreground"}>
              {value || (isDisabled ? "اختر الولاية أولاً - Choisissez d'abord la wilaya" : "اختر البلدية - Choisissez la commune")}
            </span>
            {!isDisabled && (
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            )}
          </button>
        </PopoverTrigger>
        {!isDisabled && (
          <PopoverContent
            align="start"
            sideOffset={4}
            className="p-0 w-[var(--radix-popper-anchor-width)] max-w-[calc(100vw-2rem)]"
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              inputRef.current?.focus();
            }}
            onFocusOutside={() => setIsOpen(false)}
          >
            <div className="bg-popover text-popover-foreground border border-border shadow-lg max-h-[300px] overflow-hidden flex flex-col">
              <div className="p-2 border-b border-border">
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث - Rechercher..."
                  className="w-full px-2 py-1 text-sm border border-input bg-background focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsOpen(false);
                      return;
                    }
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setHighlightedIndex((i) => Math.min(i + 1, Math.max(0, filteredCommunes.length - 1)));
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setHighlightedIndex((i) => Math.max(0, i - 1));
                    }
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const pick = filteredCommunes[highlightedIndex];
                      if (pick) handleSelect(pick);
                    }
                  }}
                />
              </div>
              <div className="overflow-y-auto flex-1" role="listbox">
                {filteredCommunes.map((commune, idx) => {
                  const isSelected = value === commune.french;
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <button
                      key={`${commune.french}-${idx}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onMouseMove={() => setHighlightedIndex(idx)}
                      onClick={() => handleSelect(commune)}
                      className={`w-full px-3 py-2 text-start transition-colors ${
                        isHighlighted ? "bg-accent" : "hover:bg-accent"
                      } ${isSelected ? "font-medium" : ""}`}
                    >
                      <span className="text-foreground text-sm">
                        {commune.french} - {commune.arabic}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </PopoverContent>
        )}
      </Popover>

      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
