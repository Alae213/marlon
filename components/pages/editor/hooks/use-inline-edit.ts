"use client";

import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import type { EditingField, EditableField } from "../types";

type ProductEditableField = "name" | "basePrice" | "oldPrice";

interface UseInlineEditOptions {
  products: Array<{ _id: Id<"products"> }> | undefined;
}

/**
 * Custom hook for inline editing of product fields and hero text.
 *
 * Manages:
 * - editingField: which field is currently being edited (null when not editing)
 * - editValue: the current input value
 * - isSaving: whether a save operation is in progress
 *
 * Provides:
 * - startEditing: begin editing a product field (name, basePrice, oldPrice)
 * - saveInlineEdit: save the current product field edit
 * - handleKeyDown: Enter to save, Escape to cancel (for product fields)
 * - setEditingField / setEditValue: for hero fields that manage their own save logic
 */
export function useInlineEdit({ products }: UseInlineEditOptions) {
  const updateProduct = useMutation(api.products.updateProduct);

  const [editingField, setEditingField] = useState<EditingField | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Start editing a product field (name, basePrice, oldPrice).
   */
  const startEditing = useCallback(
    (productId: string, field: ProductEditableField, currentValue: string | number) => {
      setEditingField({ productId, field: field as EditableField });
      setEditValue(String(currentValue));
    },
    []
  );

  /**
   * Save the current product field edit via Convex mutation.
   */
  const saveInlineEdit = useCallback(async () => {
    if (!editingField) return;

    setIsSaving(true);
    try {
      const product = products?.find((p) => p._id === editingField.productId);
      if (!product) return;

      const updates: {
        productId: Id<"products">;
        name?: string;
        basePrice?: number;
        oldPrice?: number;
        images?: string[];
      } = {
        productId: editingField.productId as Id<"products">,
      };

      if (editingField.field === "name") {
        updates.name = editValue;
      } else if (editingField.field === "basePrice") {
        updates.basePrice = parseInt(editValue, 10) || 0;
      } else if (editingField.field === "oldPrice") {
        updates.oldPrice = editValue ? parseInt(editValue, 10) : undefined;
      }

      await updateProduct(updates);
      setEditingField(null);
      setEditValue("");
    } catch (error) {
      console.error("Failed to update:", error);
    }
    setIsSaving(false);
  }, [editingField, editValue, products, updateProduct]);

  /**
   * Keyboard handler: Enter saves, Escape cancels.
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        saveInlineEdit();
      } else if (e.key === "Escape") {
        setEditingField(null);
        setEditValue("");
      }
    },
    [saveInlineEdit]
  );

  return {
    editingField,
    editValue,
    isSaving,
    startEditing,
    saveInlineEdit,
    handleKeyDown,
    setEditingField,
    setEditValue,
  };
}
