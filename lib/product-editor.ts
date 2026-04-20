export interface ProductEditorVariantOption {
  name: string;
  priceModifier?: number;
}

export interface ProductEditorVariantGroup {
  name: string;
  options: ProductEditorVariantOption[];
}

export interface ProductEditorLike {
  name?: string;
  description?: string;
  basePrice?: number;
  oldPrice?: number;
  images?: string[];
  variants?: ProductEditorVariantGroup[];
  isArchived?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export type ProductEditorSaveMode =
  | "publish_and_close"
  | "save_hidden_and_close"
  | "save_visible_and_close"
  | "archive_and_close";

export type ProductEditorUnhideMode = "blocked" | "unhide_only" | "save_and_unhide";

export const QUICK_PRODUCT_DEFAULTS = Object.freeze({
  name: "New Product",
  description: "",
  basePrice: 0,
  images: [] as string[],
});

function normalizeText(value?: string) {
  return value ?? "";
}

function normalizeImages(images?: string[]) {
  return images ?? [];
}

function hasVariantContent(variants?: ProductEditorVariantGroup[]) {
  if (!variants || variants.length === 0) {
    return false;
  }

  return variants.some(
    (group) =>
      group.name.trim().length > 0 ||
      group.options.some((option) => option.name.trim().length > 0 || option.priceModifier !== undefined),
  );
}

export function isPublishReadyProduct(product: Pick<ProductEditorLike, "name" | "basePrice">) {
  return product.name?.trim().length !== 0 && (product.basePrice ?? 0) > 0;
}

export function getProductEditorPrimaryActionLabel({
  isFreshHiddenQuickCreate,
  publishReady,
}: {
  isFreshHiddenQuickCreate: boolean;
  publishReady: boolean;
}) {
  if (isFreshHiddenQuickCreate) {
    return publishReady ? "Save & Publish" : "Save Hidden";
  }

  return "Save Changes";
}

export function getProductEditorSaveMode({
  isFreshHiddenQuickCreate,
  isHidden,
  publishReady,
}: {
  isFreshHiddenQuickCreate: boolean;
  isHidden: boolean;
  publishReady: boolean;
}): ProductEditorSaveMode {
  if (isFreshHiddenQuickCreate) {
    return publishReady ? "publish_and_close" : "save_hidden_and_close";
  }

  if (isHidden) {
    return "save_hidden_and_close";
  }

  return publishReady ? "save_visible_and_close" : "archive_and_close";
}

export function getProductEditorUnhideMode({
  isDirty,
  publishReady,
}: {
  isDirty: boolean;
  publishReady: boolean;
}): ProductEditorUnhideMode {
  if (!publishReady) {
    return "blocked";
  }

  return isDirty ? "save_and_unhide" : "unhide_only";
}

export function shouldResetProductEditorState({
  currentProductKey,
  nextProductId,
  open,
}: {
  currentProductKey: string | null;
  nextProductId: string | null;
  open: boolean;
}) {
  if (!open || !nextProductId) {
    return false;
  }

  return currentProductKey !== nextProductId;
}

export function isFreshQuickCreatedHiddenProduct(product: ProductEditorLike) {
  return (
    product.isArchived === true &&
    product.createdAt !== undefined &&
    product.createdAt === product.updatedAt &&
    normalizeText(product.name) === QUICK_PRODUCT_DEFAULTS.name &&
    normalizeText(product.description) === QUICK_PRODUCT_DEFAULTS.description &&
    (product.basePrice ?? QUICK_PRODUCT_DEFAULTS.basePrice) === QUICK_PRODUCT_DEFAULTS.basePrice &&
    product.oldPrice === undefined &&
    normalizeImages(product.images).length === 0 &&
    !hasVariantContent(product.variants)
  );
}
