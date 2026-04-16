"use client";

import { useState, useEffect } from "react";
import { X, Plus, Edit2, Check, GripVertical, Eye, EyeOff, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/primitives/core/inputs/input";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";

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
    name: "Size",
    variants: ["Small", "Medium", "Large", "XL"]
  },
  color: {
    name: "Color",
    variants: ["Red", "Blue", "Green", "Black", "White"]
  },
  custom: {
    name: "Custom",
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
      newGroup = { name: `Option ${localVariants.length + 1}`, variants: [], isHidden: false };
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
                { name: `Option ${v.variants.length + 1}` }
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
        <div key={group.name} className="border border-[--system-200] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-[--system-400] cursor-grab" />
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
                    className="p-1 text-[--color-success] hover:bg-[--color-success-bg] rounded"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleStartEditGroup(group.name)}
                  className="font-medium text-[--system-700] hover:text-[#00853f] flex items-center gap-1"
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
                    ? "text-[--color-warning] hover:bg-[--color-warning-bg]" 
                    : "text-[--system-400] hover:bg-[--system-100]"
                }`}
                title={group.isHidden ? "Show in store" : "Hide from store"}
              >
                {group.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleDeleteGroup(group.name)}
                className="p-1 text-[--color-error] hover:bg-[--color-error-bg] rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {group.variants.map((variant) => (
              <div
                key={variant.name}
                className="flex items-center gap-1 px-3 py-1.5 bg-[--system-100] rounded-lg group/variant"
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
                      className="p-0.5 text-[--color-success] hover:bg-[--color-success-bg] rounded"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleStartEditOption(group.name, variant.name)}
                      className="text-sm text-[--system-600] hover:text-[#00853f]"
                    >
                      {variant.name}
                    </button>
                    <button
                      onClick={() => handleDeleteOption(group.name, variant.name)}
                      className="p-0.5 text-[--system-400] hover:text-[--color-error] opacity-0 group-hover/variant:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            ))}
            <button
              onClick={() => handleAddOption(group.name)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-[--system-400] hover:text-[#00853f] hover:bg-[--system-100] rounded-lg transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>
        </div>
      ))}

      <Menu open={showPrebuiltDropdown} onOpenChange={setShowPrebuiltDropdown}>
        <MenuTrigger asChild>
          <Button variant="outline" className="w-full">
            <Plus className="w-4 h-4" />
            Add Option Group
            <ChevronDown className={`w-4 h-4 transition-transform ${showPrebuiltDropdown ? "rotate-180" : ""}`} />
          </Button>
        </MenuTrigger>
        <MenuContent
          align="start"
          sideOffset={8}
          className="w-[var(--radix-popper-anchor-width)] rounded-xl border border-[--system-200] bg-[--system-50] p-0 shadow-[var(--shadow-lg)] overflow-hidden"
        >
          <MenuItem
            onSelect={() => handleAddGroup("size")}
            className="px-4 py-3 hover:bg-[--system-100] transition-colors border-b border-[--system-100] rounded-none cursor-pointer"
          >
            <div>
              <span className="font-medium text-[--system-700]">Size</span>
              <p className="text-xs text-[--system-400] mt-0.5">Small, Medium, Large, XL</p>
            </div>
          </MenuItem>
          <MenuItem
            onSelect={() => handleAddGroup("color")}
            className="px-4 py-3 hover:bg-[--system-100] transition-colors border-b border-[--system-100] rounded-none cursor-pointer"
          >
            <div>
              <span className="font-medium text-[--system-700]">Color</span>
              <p className="text-xs text-[--system-400] mt-0.5">Red, Blue, Green, Black, White</p>
            </div>
          </MenuItem>
          <MenuItem
            onSelect={() => handleAddGroup("custom")}
            className="px-4 py-3 hover:bg-[--system-100] transition-colors rounded-none cursor-pointer"
          >
            <div>
              <span className="font-medium text-[--system-700]">Custom</span>
              <p className="text-xs text-[--system-400] mt-0.5">Add your own options</p>
            </div>
          </MenuItem>
        </MenuContent>
      </Menu>
    </div>
  );
}
