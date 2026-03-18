"use client";

import { useState, useEffect, useMemo } from "react";
import { algeriaWilayas, Wilaya, Commune, getWilayaDisplay } from "@/lib/algeria-data";
import { ChevronDown } from "lucide-react";

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

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-normal text-foreground mb-1">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border bg-background text-foreground focus:outline-none focus:border-primary flex items-center justify-between ${
          error ? "border-destructive" : "border-input"
        } ${!value ? "text-muted-foreground" : ""}`}
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value || "اختر الولاية - Choisissez la wilaya"}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border shadow-lg max-h-[300px] overflow-hidden flex flex-col">
          <div className="p-2 border-b border-border">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث - Rechercher..."
              className="w-full px-2 py-1 text-sm border border-input bg-background focus:outline-none"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredWilayas.map((wilaya) => (
              <button
                key={wilaya.id}
                type="button"
                onClick={() => handleSelect(wilaya)}
                className={`w-full px-3 py-2 text-start hover:bg-accent transition-colors ${
                  value === getWilayaDisplay(wilaya) ? "bg-accent" : ""
                }`}
              >
                <span className="text-foreground text-sm">
                  {wilaya.id} - {wilaya.french} - {wilaya.arabic}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

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

  // Derive communes from wilayaValue - no need for useEffect
  const communes = useMemo(() => {
    if (!wilayaValue) return [];
    const wilaya = algeriaWilayas.find(w => getWilayaDisplay(w) === wilayaValue);
    return wilaya?.communes || [];
  }, [wilayaValue]);

  /* eslint-disable react-hooks/set-state-in-effect */
  // Reset UI state when disabled changes
  useEffect(() => {
    if (!disabled) {
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

  const isDisabled = disabled || !wilayaValue || communes.length === 0;

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-normal text-foreground mb-1">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        disabled={isDisabled}
        className={`w-full px-3 py-2 border bg-background text-foreground focus:outline-none focus:border-primary flex items-center justify-between ${
          error ? "border-destructive" : "border-input"
        } ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${
          !value ? "text-muted-foreground" : ""
        }`}
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value || (isDisabled ? "اختر الولاية أولاً - Choisissez d'abord la wilaya" : "اختر البلدية - Choisissez la commune")}
        </span>
        {!isDisabled && (
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border shadow-lg max-h-[300px] overflow-hidden flex flex-col">
          <div className="p-2 border-b border-border">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث - Rechercher..."
              className="w-full px-2 py-1 text-sm border border-input bg-background focus:outline-none"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredCommunes.map((commune, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(commune)}
                className={`w-full px-3 py-2 text-start hover:bg-accent transition-colors ${
                  value === commune.french ? "bg-accent" : ""
                }`}
              >
                <span className="text-foreground text-sm">
                  {commune.french} - {commune.arabic}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
