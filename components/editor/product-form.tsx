"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/core/button";
import { Input } from "@/components/core/input";
import { Textarea } from "@/components/core/textarea";
import { ImageUploader } from "@/components/image-cropper";
import { InlineVariantEditor } from "@/components/inline-variant-editor";
import type { Product, Variant, VariantOption, ProductFormData } from "./types";

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
    <div className="space-y-5">
      <div>
        <label className="block text-sm mb-2">اسم المنتج</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="قميص رجالي قطني" />
      </div>

      <div>
        <label className="block text-sm mb-2">الوصف</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="وصف المنتج..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-2">السعر (د.ج)</label>
          <Input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="2500" />
        </div>
        <div>
          <label className="block text-sm mb-2">السعر القديم (اختياري)</label>
          <Input type="number" value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} placeholder="3000" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#525252] dark:text-[#d4d4d4] mb-2">صور المنتج</label>
        <ImageUploader images={images} onImagesChange={setImages} />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#525252] dark:text-[#d4d4d4] mb-2">
          الخيارات (مثل: المقاس، اللون)
        </label>
        <InlineVariantEditor variants={variants} onChange={setVariants} />
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onClose} className="flex-1">
          إلغاء
        </Button>
        <Button onClick={handleSubmit} disabled={!name || !basePrice} className="flex-1">
          {isEditing ? "حفظ التغييرات" : "إضافة المنتج"}
        </Button>
      </div>
    </div>
  );
}
