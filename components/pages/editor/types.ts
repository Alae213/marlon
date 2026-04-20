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

export interface NavbarLink {
  id: string;
  text: string;
  url: string;
  isDefault: boolean;
  enabled: boolean;
}

export interface NavbarContent {
  logoStorageId?: string;
  logoUrl?: string;
  background?: "dark" | "light" | "glass";
  textColor?: "dark" | "light";
  showCart?: boolean;
  links: NavbarLink[];
}

export interface HeroContent {
  title?: string;
  ctaText?: string;
  titleColor?: string;
  ctaColor?: string;
  alignment?: "left" | "center" | "right";
  backgroundImageStorageId?: string;
  backgroundImageUrl?: string;
  focalPointX?: number;
  focalPointY?: number;
  zoom?: number;
}

// ── Inline Editing Types ───────────────────────────────────────
