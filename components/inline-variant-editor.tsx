"use client";

import { useState, useEffect } from "react";
import { X, Plus, Edit2, Check, GripVertical, Eye, EyeOff, ChevronDown } from "lucide-react";
import { Button } from "@/components/core/button";
import { Input } from "@/components/core/input";

interface VariantOption {
  name: string;
  priceModifier?: number;
}

interface VariantGroup {
  name: string;
  variants: VariantOption[];
  isHidden?: boolean;
}

const PREBUILT_OPTIONS = {
  size: {
    name: "المقاس",
    variants: ["صغير", "متوسط", "كبير", "XL"]
  },
  color: {
    name: "اللون",
    variants: ["أحمر", "أزرق", "أخضر", "أسود", "أبيض"]
  },
  custom: {
    name: "مخصص",
    variants: []
  }
};

interface InlineVariantEditorProps {
  variants: VariantGroup[];
  onChange: (variants: VariantGroup[]) => void;
}

export function InlineVariantEditor({ variants, onChange }: InlineVariantEditorProps) {
  const [localVariants, setLocalVariants] = useState(variants);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editingOption, setEditingOption] = useState<{ group: string; option: string } | null>(null);
  const [groupInput, setGroupInput] = useState("");
  const [optionInput, setOptionInput] = useState("");
  const [showPrebuiltDropdown, setShowPrebuiltDropdown] = useState(false);

  // Sync with parent props
  useEffect(() => {
    setLocalVariants(variants);
  }, [variants]);

  const handleAddGroup = (prebuiltKey?: "size" | "color" | "custom") => {
    let newGroup: VariantGroup;
    
    if (prebuiltKey && PREBUILT_OPTIONS[prebuiltKey]) {
      const prebuilt = PREBUILT_OPTIONS[prebuiltKey];
      newGroup = {
        name: prebuilt.name,
        variants: prebuilt.variants.map(v => ({ name: v })),
        isHidden: false
      };
    } else {
      newGroup = { name: `خيار ${localVariants.length + 1}`, variants: [], isHidden: false };
    }
    
    const newVariants: VariantGroup[] = [...localVariants, newGroup];
    setLocalVariants(newVariants);
    onChange(newVariants);
    setShowPrebuiltDropdown(false);
  };

  const handleToggleVisibility = (groupName: string) => {
    const newVariants = localVariants.map(v =>
      v.name === groupName ? { ...v, isHidden: !v.isHidden } : v
    );
    setLocalVariants(newVariants);
    onChange(newVariants);
  };

  const handleDeleteGroup = (groupName: string) => {
    const newVariants = localVariants.filter(v => v.name !== groupName);
    setLocalVariants(newVariants);
    onChange(newVariants);
  };

  const handleStartEditGroup = (groupName: string) => {
    setEditingGroup(groupName);
    setGroupInput(groupName);
  };

  const handleSaveGroup = (oldName: string) => {
    const newVariants = localVariants.map(v => 
      v.name === oldName ? { ...v, name: groupInput } : v
    );
    setLocalVariants(newVariants);
    onChange(newVariants);
    setEditingGroup(null);
  };

  const handleAddOption = (groupName: string) => {
    const newVariants = localVariants.map(v => {
      if (v.name === groupName) {
        return {
          ...v,
          variants: [
            ...v.variants,
            { name: `خيار ${v.variants.length + 1}` }
          ]
        };
      }
      return v;
    });
    setLocalVariants(newVariants);
    onChange(newVariants);
  };

  const handleDeleteOption = (groupName: string, optionName: string) => {
    const newVariants = localVariants.map(v => {
      if (v.name === groupName) {
        return {
          ...v,
          variants: v.variants.filter(o => o.name !== optionName)
        };
      }
      return v;
    });
    setLocalVariants(newVariants);
    onChange(newVariants);
  };

  const handleStartEditOption = (groupName: string, optionName: string) => {
    setEditingOption({ group: groupName, option: optionName });
    setOptionInput(optionName);
  };

  const handleSaveOption = (groupName: string, oldName: string) => {
    const newVariants = localVariants.map(v => {
      if (v.name === groupName) {
        return {
          ...v,
          variants: v.variants.map(o => 
            o.name === oldName ? { ...o, name: optionInput } : o
          )
        };
      }
      return v;
    });
    setLocalVariants(newVariants);
    onChange(newVariants);
    setEditingOption(null);
  };

  return (
    <div className="space-y-4">
      {localVariants.map((group) => (
        <div key={group.name} className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-zinc-400 cursor-grab" />
              {editingGroup === group.name ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={groupInput}
                    onChange={(e) => setGroupInput(e.target.value)}
                    className="h-8 w-40"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveGroup(group.name);
                      if (e.key === "Escape") setEditingGroup(null);
                    }}
                  />
                  <button
                    onClick={() => handleSaveGroup(group.name)}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleStartEditGroup(group.name)}
                  className="font-medium text-zinc-900 dark:text-zinc-50 hover:text-[#00853f] flex items-center gap-1"
                >
                  {group.name}
                  <Edit2 className="w-3 h-3 opacity-50" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleToggleVisibility(group.name)}
                className={`p-1.5 rounded transition-colors ${
                  group.isHidden 
                    ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20" 
                    : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
                title={group.isHidden ? "إظهار في المتجر" : "إخفاء من المتجر"}
              >
                {group.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleDeleteGroup(group.name)}
                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {group.variants.map((variant) => (
              <div
                key={variant.name}
                className="flex items-center gap-1 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg group/variant"
              >
                {editingOption?.group === group.name && editingOption?.option === variant.name ? (
                  <>
                    <Input
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      className="h-6 w-24 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveOption(group.name, variant.name);
                        if (e.key === "Escape") setEditingOption(null);
                      }}
                    />
                    <button
                      onClick={() => handleSaveOption(group.name, variant.name)}
                      className="p-0.5 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleStartEditOption(group.name, variant.name)}
                      className="text-sm text-zinc-700 dark:text-zinc-300 hover:text-[#00853f]"
                    >
                      {variant.name}
                    </button>
                    <button
                      onClick={() => handleDeleteOption(group.name, variant.name)}
                      className="p-0.5 text-zinc-400 hover:text-red-500 opacity-0 group-hover/variant:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            ))}
            <button
              onClick={() => handleAddOption(group.name)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-zinc-500 hover:text-[#00853f] hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <Plus className="w-3 h-3" />
              إضافة
            </button>
          </div>
        </div>
      ))}

      <div className="relative">
        <Button 
          variant="outline" 
          onClick={() => setShowPrebuiltDropdown(!showPrebuiltDropdown)} 
          className="w-full"
        >
          <Plus className="w-4 h-4" />
          إضافة مجموعة خيارات
          <ChevronDown className={`w-4 h-4 transition-transform ${showPrebuiltDropdown ? "rotate-180" : ""}`} />
        </Button>
        
        {showPrebuiltDropdown && (
          <div className="absolute top-full start-0 end-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg z-10 overflow-hidden">
            <button
              onClick={() => handleAddGroup("size")}
              className="w-full px-4 py-3 text-start hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-100 dark:border-zinc-800"
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-100">المقاس</span>
              <p className="text-xs text-zinc-500 mt-0.5">صغير، متوسط، كبير، XL</p>
            </button>
            <button
              onClick={() => handleAddGroup("color")}
              className="w-full px-4 py-3 text-start hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-100 dark:border-zinc-800"
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-100">اللون</span>
              <p className="text-xs text-zinc-500 mt-0.5">أحمر، أزرق، أخضر، أسود، أبيض</p>
            </button>
            <button
              onClick={() => handleAddGroup("custom")}
              className="w-full px-4 py-3 text-start hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-100">مخصص</span>
              <p className="text-xs text-zinc-500 mt-0.5">إضافة خيارات خاصة بك</p>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
