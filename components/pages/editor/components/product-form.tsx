"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/primitives/core/inputs/input";
import { Textarea } from "@/components/primitives/core/inputs/textarea";
import { ImageUploader } from "@/components/features/shared/image-cropper";
import { InlineVariantEditor } from "@/components/features/shared/inline-variant-editor";
import type { Product, Variant, VariantOption, ProductFormData } from "../types";

interface EditorVariant {
  name: string;
  variants: VariantOption[];
}

function convertToEditorFormat(variants?: Variant[]): EditorVariant[] {
  if (!variants || variants.length === 0) return [];
  return variants.map((v) => ({
    name: v.name,
    variants: v.options || [],
  }));
}

function convertFromEditorFormat(variants: EditorVariant[]): Variant[] | undefined {
  if (variants.length === 0) return undefined;
  return variants.map((group) => ({
    name: group.name,
    options: group.variants || [],
  }));
}

interface ProductFormProps {
  product?: Product;
  onClose: () => void;
  onSubmit: (product: ProductFormData) => void;
  error?: string | null;
}

export function ProductForm({ product, onClose, onSubmit, error }: ProductFormProps) {
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [basePrice, setBasePrice] = useState(product?.basePrice?.toString() || "");
  const [oldPrice, setOldPrice] = useState(product?.oldPrice?.toString() || "");
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [variants, setVariants] = useState<EditorVariant[]>(convertToEditorFormat(product?.variants));

  const isEditing = !!product;

  const handleSubmit = useCallback(() => {
    if (!name || !basePrice) return;

    const productData: ProductFormData = {
      ...(product?._id ? { productId: product._id } : {}),
      name,
      description,
      basePrice: parseInt(basePrice, 10),
      oldPrice: oldPrice ? parseInt(oldPrice, 10) : undefined,
      images,
      variants: convertFromEditorFormat(variants),
    };

    onSubmit(productData);
    onClose();
  }, [name, description, basePrice, oldPrice, images, variants, product, onSubmit, onClose]);

  return (
    <div className="space-y-[var(--spacing-md)] text-[--system-700]">
      <div>
        <label className="mb-[var(--spacing-sm)] block text-body-sm text-[--system-500]">Product Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cotton men shirt" />
      </div>

      <div>
        <label className="mb-[var(--spacing-sm)] block text-body-sm text-[--system-500]">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Product description..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-[var(--spacing-md)]">
        <div>
          <label className="mb-[var(--spacing-sm)] block text-body-sm text-[--system-500]">Price (DZD)</label>
          <Input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="2500" />
        </div>
        <div>
          <label className="mb-[var(--spacing-sm)] block text-body-sm text-[--system-500]">Old Price (optional)</label>
          <Input type="number" value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} placeholder="3000" />
        </div>
      </div>

      <div>
        <label className="mb-[var(--spacing-sm)] block text-body-sm text-[--system-500]">Product Images</label>
        <ImageUploader images={images} onImagesChange={setImages} />
      </div>

      <div>
        <label className="mb-[var(--spacing-sm)] block text-body-sm text-[--system-500]">
          Options (e.g., Size, Color)
        </label>
        <InlineVariantEditor variants={variants} onChange={setVariants} />
      </div>

      {error && (
        <div className="rounded-[var(--radius-md)] border border-[--color-error] bg-[--color-error-bg] p-[var(--spacing-sm)]">
          <p className="text-body-sm text-[--color-error]">{error}</p>
        </div>
      )}

      <div className="flex gap-[var(--spacing-sm)] pt-[var(--spacing-xs)]">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!name || !basePrice} className="flex-1">
          {isEditing ? "Save Changes" : "Add Product"}
        </Button>
      </div>
    </div>
  );
}
