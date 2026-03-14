import { Id } from "@/convex/_generated/dataModel";

// ── Product Types ──────────────────────────────────────────────

export interface VariantOption {
  name: string;
  priceModifier?: number;
}

export interface Variant {
  name: string;
  options: VariantOption[];
}

export interface Product {
  _id: Id<"products">;
  _creationTime: number;
  name: string;
  description?: string;
  basePrice: number;
  oldPrice?: number;
  images?: string[];
  category?: string;
  variants?: Variant[];
  isArchived?: boolean;
  sortOrder?: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface ProductFormData {
  productId?: Id<"products">;
  name: string;
  description: string;
  basePrice: number;
  oldPrice?: number;
  images: string[];
  variants?: Variant[];
}

// ── Site Content Types ─────────────────────────────────────────

export interface NavbarContent {
  logoStorageId?: string;
  logoUrl?: string;
  links: Array<{
    text: string;
    url: string;
    enabled: boolean;
  }>;
  background?: string;
  textColor?: string;
}

export interface HeroContent {
  title?: string;
  ctaText?: string;
  ctaColor?: string;
  layout?: "left" | "center" | "right";
  backgroundImageStorageId?: string;
  backgroundImageUrl?: string;
}

export interface FooterContent {
  contactEmail?: string;
  contactPhone?: string;
  copyright?: string;
  socialLinks?: Array<{
    platform: string;
    url: string;
    enabled: boolean;
  }>;
}

// ── Inline Editing Types ───────────────────────────────────────

export type EditableField =
  | "name"
  | "basePrice"
  | "oldPrice"
  | "heroTitle"
  | "heroCtaText"
  | "footerPhone"
  | "footerEmail"
  | "footerCopyright";

export interface EditingField {
  productId: string;
  field: EditableField;
}
