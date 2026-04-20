"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { algeriaWilayas, Commune, getWilayaDisplay, Wilaya } from "@/lib/algeria-data";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface WilayaSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
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

interface SearchableLocationSelectProps<T> {
  value: string;
  label?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  options: T[];
  highlightedIndex: number;
  search: string;
  placeholder: string;
  disabledPlaceholder?: string;
  searchPlaceholder: string;
  getKey: (option: T, index: number) => string;
  getValue: (option: T) => string;
  getDisplay: (option: T) => string;
  onSearchChange: (value: string) => void;
  onHighlightChange: (index: number) => void;
  onSelect: (option: T) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function SearchableLocationSelect<T>({
  value,
  label,
  required,
  error,
  disabled,
  options,
  highlightedIndex,
  search,
  placeholder,
  disabledPlaceholder,
  searchPlaceholder,
  getKey,
  getValue,
  getDisplay,
  onSearchChange,
  onHighlightChange,
  onSelect,
  isOpen,
  onOpenChange,
}: SearchableLocationSelectProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isDisabled = !!disabled;
  const shownPlaceholder = isDisabled && disabledPlaceholder ? disabledPlaceholder : placeholder;

  return (
    <div className="relative">
      {label && (
        <label className="mb-1 block text-body-sm text-[var(--sheet-surface-fg)]">
          {label} {required && <span className="text-[var(--color-error)]">*</span>}
        </label>
      )}

      <Popover open={isOpen && !isDisabled} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={isDisabled}
            className={cn(
              "flex min-h-10 w-full items-center justify-between gap-3 rounded-lg border bg-[var(--system-800)] px-3 py-2 text-start text-body-sm text-[var(--sheet-surface-fg)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors",
              "focus:border-[var(--color-primary)] focus:outline-none",
              error ? "border-[var(--color-error)]" : "border-[var(--system-700)]",
              isDisabled
                ? "cursor-not-allowed bg-[var(--system-800)]/60 text-[var(--system-400)] opacity-70"
                : "cursor-pointer hover:border-[var(--system-500)]"
            )}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span
              className={cn(
                "min-w-0 flex-1 truncate",
                value ? "text-[var(--sheet-surface-fg)]" : "text-[var(--system-300)]"
              )}
            >
              {value || shownPlaceholder}
            </span>
            {!isDisabled && (
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-[var(--system-300)] transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            )}
          </button>
        </PopoverTrigger>

        {!isDisabled && (
          <PopoverContent
            align="start"
            sideOffset={6}
            className="z-[calc(var(--z-sheet)+1)] w-[var(--radix-popper-anchor-width)] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-[var(--sheet-surface-border)] bg-[var(--sheet-surface-bg)] p-0 text-[var(--sheet-surface-fg)] shadow-[var(--sheet-surface-shadow)]"
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              inputRef.current?.focus();
            }}
            onFocusOutside={() => onOpenChange(false)}
          >
            <div className="flex max-h-[300px] flex-col overflow-hidden bg-[var(--sheet-surface-bg)] text-[var(--sheet-surface-fg)]">
              <div className="border-b border-[var(--sheet-surface-border)] p-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-lg border border-[var(--system-700)] bg-[var(--system-800)] px-3 py-2 text-body-sm text-[var(--sheet-surface-fg)] placeholder:text-[var(--system-400)] focus:border-[var(--color-primary)] focus:outline-none"
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      onOpenChange(false);
                      return;
                    }
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      onHighlightChange(Math.min(highlightedIndex + 1, Math.max(0, options.length - 1)));
                    }
                    if (event.key === "ArrowUp") {
                      event.preventDefault();
                      onHighlightChange(Math.max(0, highlightedIndex - 1));
                    }
                    if (event.key === "Enter") {
                      event.preventDefault();
                      const pick = options[highlightedIndex];
                      if (pick) onSelect(pick);
                    }
                  }}
                />
              </div>
              <div className="flex-1 overflow-y-auto py-1" role="listbox">
                {options.map((option, index) => {
                  const optionValue = getValue(option);
                  const isSelected = value === optionValue;
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <button
                      key={getKey(option, index)}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onMouseMove={() => onHighlightChange(index)}
                      onClick={() => onSelect(option)}
                      className={cn(
                        "w-full px-3 py-2 text-start text-body-sm transition-colors",
                        isHighlighted
                          ? "bg-[var(--system-700)] text-[var(--system-100)]"
                          : "text-[var(--system-300)] hover:bg-[var(--system-700)] hover:text-[var(--system-100)]",
                        isSelected && "font-medium text-[var(--sheet-surface-fg)]"
                      )}
                    >
                      <span className="block truncate">{getDisplay(option)}</span>
                    </button>
                  );
                })}

                {options.length === 0 && (
                  <div className="px-3 py-6 text-center text-body-sm text-[var(--system-400)]">
                    No results found
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        )}
      </Popover>

      {error && <p className="mt-1 text-caption text-[var(--color-error)]">{error}</p>}
    </div>
  );
}

export function WilayaSelect({ value, onChange, label, required, error }: WilayaSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const filteredWilayas = algeriaWilayas.filter((wilaya) => {
    const display = getWilayaDisplay(wilaya).toLowerCase();
    const searchLower = search.toLowerCase();
    return (
      display.includes(searchLower) ||
      wilaya.arabic.includes(search) ||
      wilaya.french.toLowerCase().includes(searchLower)
    );
  });

  const handleSelect = (wilaya: Wilaya) => {
    onChange(getWilayaDisplay(wilaya));
    setIsOpen(false);
    setSearch("");
    setHighlightedIndex(0);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setHighlightedIndex(0);
    }
  };

  const handleSearchChange = (nextSearch: string) => {
    setSearch(nextSearch);
    setHighlightedIndex(0);
  };

  return (
    <SearchableLocationSelect
      value={value}
      label={label}
      required={required}
      error={error}
      options={filteredWilayas}
      highlightedIndex={highlightedIndex}
      search={search}
      placeholder="اختر الولاية - Choisissez la wilaya"
      searchPlaceholder="بحث - Rechercher..."
      getKey={(wilaya) => String(wilaya.id)}
      getValue={getWilayaDisplay}
      getDisplay={(wilaya) => `${wilaya.id} - ${wilaya.french} - ${wilaya.arabic}`}
      onSearchChange={handleSearchChange}
      onHighlightChange={setHighlightedIndex}
      onSelect={handleSelect}
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
    />
  );
}

export function CommuneSelect({
  wilayaValue,
  value,
  onChange,
  label,
  required,
  error,
  disabled,
}: CommuneSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const communes = useMemo(() => {
    if (!wilayaValue) return [];
    const wilaya = algeriaWilayas.find((item) => getWilayaDisplay(item) === wilayaValue);
    return wilaya?.communes || [];
  }, [wilayaValue]);

  const isDisabled = disabled || !wilayaValue || communes.length === 0;

  const filteredCommunes = communes.filter((commune) => {
    const searchLower = search.toLowerCase();
    return commune.french.toLowerCase().includes(searchLower) || commune.arabic.includes(search);
  });

  const handleSelect = (commune: Commune) => {
    onChange(commune.french);
    setIsOpen(false);
    setSearch("");
    setHighlightedIndex(0);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setHighlightedIndex(0);
    }
  };

  const handleSearchChange = (nextSearch: string) => {
    setSearch(nextSearch);
    setHighlightedIndex(0);
  };

  return (
    <SearchableLocationSelect
      value={value}
      label={label}
      required={required}
      error={error}
      disabled={isDisabled}
      options={filteredCommunes}
      highlightedIndex={highlightedIndex}
      search={search}
      placeholder="اختر البلدية - Choisissez la commune"
      disabledPlaceholder="اختر الولاية أولا - Choisissez d'abord la wilaya"
      searchPlaceholder="بحث - Rechercher..."
      getKey={(commune, index) => `${commune.french}-${index}`}
      getValue={(commune) => commune.french}
      getDisplay={(commune) => `${commune.french} - ${commune.arabic}`}
      onSearchChange={handleSearchChange}
      onHighlightChange={setHighlightedIndex}
      onSelect={handleSelect}
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
    />
  );
}
