"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { Check, ChevronDown, Copy, Eye, Minus, Plus, Save } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/primitives/core/inputs/input";
import { Textarea } from "@/components/primitives/core/inputs/textarea";
import { InlineVariantEditor } from "@/components/features/shared/inline-variant-editor";
import { useToast } from "@/contexts/toast-context";
import { useImageUpload } from "../hooks/use-image-upload";
import type { Product, Variant, VariantOption } from "../types";
import { formatPrice } from "../utils";
import { EditorProductGallery } from "./editor-product-gallery";
import {
  getProductEditorPrimaryActionLabel,
  getProductEditorSaveMode,
  isFreshQuickCreatedHiddenProduct,
  isPublishReadyProduct,
  shouldResetProductEditorState,
} from "@/lib/product-editor";

interface EditorVariantGroup {
  name: string;
  variants: VariantOption[];
  isHidden?: boolean;
}

interface EditorFormState {
  name: string;
  description: string;
  basePrice: string;
  oldPrice: string;
  images: string[];
  variants: EditorVariantGroup[];
}

interface EditorProductDetailModalProps {
  open: boolean;
  product: Product | null;
  storeSlug: string;
  onClose: () => void;
}

function convertToEditorFormat(variants?: Variant[]): EditorVariantGroup[] {
  if (!variants || variants.length === 0) {
    return [];
  }

  return variants.map((variant) => ({
    name: variant.name,
    variants: variant.options ?? [],
  }));
}

function convertFromEditorFormat(variants: EditorVariantGroup[]): Variant[] | undefined {
  if (variants.length === 0) {
    return undefined;
  }

  return variants.map((group) => ({
    name: group.name,
    options: group.variants ?? [],
  }));
}

function buildEditorState(product: Product): EditorFormState {
  return {
    name: product.name ?? "",
    description: product.description ?? "",
    basePrice: String(product.basePrice ?? 0),
    oldPrice: product.oldPrice !== undefined ? String(product.oldPrice) : "",
    images: product.images ?? [],
    variants: convertToEditorFormat(product.variants),
  };
}

function serializeState(state: EditorFormState) {
  return JSON.stringify(state);
}

function parsePriceValue(value: string) {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : 0;
}

function createVariantSelection(variants: Variant[] | undefined) {
  return (variants ?? []).reduce<Record<string, string>>((selection, variant) => {
    if (variant.options?.[0]?.name) {
      selection[variant.name] = variant.options[0].name;
    }
    return selection;
  }, {});
}

export function EditorProductDetailModal({
  open,
  product,
  storeSlug,
  onClose,
}: EditorProductDetailModalProps) {
  const updateProduct = useMutation(api.products.updateProduct);
  const archiveProduct = useMutation(api.products.archiveProduct);
  const unarchiveProduct = useMutation(api.products.unarchiveProduct);
  const { resolveImageStorageIds } = useImageUpload();
  const { showToast } = useToast();
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const priceInputRef = useRef<HTMLInputElement | null>(null);
  const [formState, setFormState] = useState<EditorFormState | null>(null);
  const [savedState, setSavedState] = useState<EditorFormState | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [showVariantEditor, setShowVariantEditor] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; basePrice?: string }>({});
  const [copied, setCopied] = useState(false);
  const initializedProductKeyRef = useRef<string | null>(null);
  const store = useQuery(api.stores.getStoreBySlug, storeSlug ? { slug: storeSlug } : "skip");

  useEffect(() => {
    if (!open || !product) {
      initializedProductKeyRef.current = null;
      return;
    }

    const nextProductKey = String(product._id);
    if (
      !shouldResetProductEditorState({
        currentProductKey: initializedProductKeyRef.current,
        nextProductId: nextProductKey,
        open,
      })
    ) {
      return;
    }

    initializedProductKeyRef.current = nextProductKey;
    const nextState = buildEditorState(product);
    setFormState(nextState);
    setSavedState(nextState);
    setQuantity(1);
    setIsHidden(product.isArchived === true);
    setSelectedVariants(createVariantSelection(product.variants));
    setShowVariantEditor(false);
    setShowDiscardDialog(false);
    setFieldErrors({});
  }, [open, product]);

  const isFreshHiddenQuickCreate = useMemo(
    () => (product ? isFreshQuickCreatedHiddenProduct(product) : false),
    [product],
  );

  const isDirty =
    formState !== null && savedState !== null && serializeState(formState) !== serializeState(savedState);
  const primaryActionVisible = Boolean(isDirty || isSaving);
  const basePriceValue = parsePriceValue(formState?.basePrice ?? "0");
  const oldPriceValue =
    formState?.oldPrice && formState.oldPrice.trim().length > 0
      ? parsePriceValue(formState.oldPrice)
      : undefined;
  const publishReady = formState
    ? isPublishReadyProduct({ name: formState.name, basePrice: basePriceValue })
    : false;
  const currentVariants = useMemo(() => convertFromEditorFormat(formState?.variants ?? []), [formState?.variants]);
  const subtotal = basePriceValue * quantity;
  const mockDelivery = 400;
  const total = subtotal + mockDelivery;

  useEffect(() => {
    setSelectedVariants((current) => {
      const nextSelection = (currentVariants ?? []).reduce<Record<string, string>>((selection, variant) => {
        const currentOption = current[variant.name];
        const optionNames = variant.options.map((option) => option.name);

        if (currentOption && optionNames.includes(currentOption)) {
          selection[variant.name] = currentOption;
          return selection;
        }

        if (variant.options[0]?.name) {
          selection[variant.name] = variant.options[0].name;
        }

        return selection;
      }, {});

      return JSON.stringify(nextSelection) === JSON.stringify(current) ? current : nextSelection;
    });
  }, [currentVariants]);

  const setFormField = useCallback(<K extends keyof EditorFormState>(field: K, value: EditorFormState[K]) => {
    setFormState((current) => (current ? { ...current, [field]: value } : current));
    if (field === "name") {
      setFieldErrors((current) => ({ ...current, name: undefined }));
    }
    if (field === "basePrice") {
      setFieldErrors((current) => ({ ...current, basePrice: undefined }));
    }
  }, []);

  const persistFields = useCallback(async () => {
    if (!product || !formState) {
      return;
    }

    const resolvedImages = await resolveImageStorageIds(formState.images);
    const nextOldPrice = formState.oldPrice.trim().length > 0 ? parsePriceValue(formState.oldPrice) : undefined;
    const shouldClearOldPrice = formState.oldPrice.trim().length === 0 && product.oldPrice !== undefined;
    const nextVariants = convertFromEditorFormat(formState.variants) ?? [];

    await updateProduct({
      productId: product._id,
      name: formState.name.trim(),
      description: formState.description,
      basePrice: parsePriceValue(formState.basePrice),
      oldPrice: nextOldPrice,
      clearOldPrice: shouldClearOldPrice ? true : undefined,
      images: resolvedImages,
      variants: nextVariants,
    });

    const nextSavedState = {
      ...formState,
      name: formState.name.trim(),
      oldPrice: nextOldPrice !== undefined ? String(nextOldPrice) : "",
    };

    setFormState(nextSavedState);
    setSavedState(nextSavedState);
  }, [formState, product, resolveImageStorageIds, updateProduct]);

  const closeWithToast = useCallback(
    (message: string) => {
      showToast(message, "success");
      onClose();
    },
    [onClose, showToast],
  );

  const handleCopy = useCallback(async () => {
    const url = `${window.location.origin}/${storeSlug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [storeSlug]);

  const handleSave = useCallback(async () => {
    if (!product || !formState) {
      return;
    }

    setIsSaving(true);
    try {
      await persistFields();

      switch (
        getProductEditorSaveMode({
          isFreshHiddenQuickCreate,
          isHidden,
          publishReady,
        })
      ) {
        case "publish_and_close":
          await unarchiveProduct({ productId: product._id });
          setIsHidden(false);
          closeWithToast("Product published");
          return;

        case "save_hidden_and_close":
          closeWithToast("Hidden product saved");
          return;

        case "archive_and_close":
          await archiveProduct({ productId: product._id });
          setIsHidden(true);
          closeWithToast("Product saved");
          return;

        case "save_visible_and_close":
        default:
          closeWithToast("Product saved");
          return;
      }
    } catch (error) {
      console.error("Failed to save product:", error);
      showToast("Failed to save product", "error");
    } finally {
      setIsSaving(false);
    }
  }, [
    archiveProduct,
    closeWithToast,
    formState,
    isFreshHiddenQuickCreate,
    isHidden,
    persistFields,
    product,
    publishReady,
    showToast,
    unarchiveProduct,
  ]);

  const requestClose = useCallback(() => {
    if (isDirty) {
      setShowDiscardDialog(true);
      return;
    }

    onClose();
  }, [isDirty, onClose]);

  const primaryActionLabel = useMemo(() => {
    return getProductEditorPrimaryActionLabel({
      isFreshHiddenQuickCreate,
      publishReady,
    });
  }, [isFreshHiddenQuickCreate, publishReady]);

  if (!product || !formState) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && requestClose()}>
        <DialogContent
          showCloseButton={false}
          overlayClassName="bg-black/0"
          className="h-[100dvh] max-h-[100dvh] w-screen max-w-none rounded-none border-0 bg-transparent p-0 text-[var(--system-600)] shadow-none md:h-[92vh] md:max-h-[92vh] md:w-[calc(100vw-2rem)] md:max-w-[1180px] md:rounded-[20px]"
        >
          <DialogTitle className="sr-only hidden">
            {formState.name.trim().length > 0 ? `Edit ${formState.name}` : "Edit product"}
          </DialogTitle>
          <DialogDescription className="sr-only hidden">
            Update product images, description, price, variants, and publish visibility.
          </DialogDescription>
          <div
            style={{
              background: "linear-gradient(0deg, #434545 100%, #212525 0%)",
              boxShadow: "var(--shadow-xl-shadow)",
            }}
            className="flex h-full flex-col overflow-hidden rounded-none px-[10px] pb-[12px] py-[8px] md:rounded-[20px] md:px-[12px]"
          >
            <div className="mb-2 flex h-[24px] items-center justify-between px-[8px]"> 
              <div className="flex w-[150px] items-center gap-2">
                <button
                  type="button"
                  onClick={requestClose}
                  className="flex cursor-pointer items-center justify-center"
                  aria-label="Close product modal"
                >
                  <Image src="/windw.svg" alt="marlon" width={24} height={24} className="w-8" />
                </button>
              </div>

              <div className="flex h-[26px] flex-1 justify-center">
                <div
                  style={{ boxShadow: "var(--shadow-inside-shadow)" }}
                  className="flex h-full w-[300px] flex-row items-center justify-between gap-2 rounded-[8px] bg-black/40 p-[3px] py-1 pl-[6px]"
                >
                  <div className="flex w-[50px] items-center gap-2">
                    <Image src="/favicon.svg" alt="Marlon" width={27} height={27} className="h-4 w-4" />
                  </div>
                  <div className="group relative cursor-pointer">
                    <p className="text-micro-label text-[var(--system-300)]">
                      {store?.name ?? storeSlug}
                      <span className="text-micro-label pointer-events-none absolute left-[-42px] top-[42px] z-50 mt-1 w-max rounded bg-[var(--system-100)] px-2 py-1 text-[var(--system-400)] opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                        marlon.app/{storeSlug}
                      </span>
                    </p>
                  </div>
                  <div className="flex w-[50px] justify-end">
                    <button
                      onClick={handleCopy}
                      aria-label="Copy store URL"
                      className="flex h-4 w-4 cursor-pointer items-center justify-center rounded transition-all duration-200 hover:bg-white/10"
                    >
                      <AnimatePresence mode="wait">
                        {!copied ? (
                          <motion.div
                            key="copy"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                          >
                            <Copy className="h-3 w-3 text-[var(--system-300)]" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="check"
                            initial={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
                            animate={{
                              opacity: 1,
                              scale: 1,
                              filter: "blur(0px)",
                              transition: { duration: 0.1, type: "spring", stiffness: 500, damping: 25 },
                            }}
                            exit={{
                              opacity: 0,
                              scale: 0.5,
                              filter: "blur(4px)",
                              transition: { duration: 0.1 },
                            }}
                          >
                            <Check className="h-3 w-3 stroke-[3px] text-[--color-success]" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex w-[150px] justify-end gap-1">
                <button
                  onClick={(event) => {
                    event.preventDefault();
                    window.open(`/${storeSlug}`, "_blank");
                  }}
                  className="text-micro-label flex h-6 w-fit cursor-pointer flex-row items-center justify-center gap-[8px] rounded-[10px] bg-white/5 px-[8px] text-white transition-all hover:bg-white/10 focus:outline-none"
                >
                  <Eye className="h-3 w-3 stroke-[2px]" />
                  Preview
                </button>
              </div>
            </div>

            <div className="relative flex-1 overflow-hidden rounded-[12px] bg-[var(--system-100)]">
              <div className="h-full overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="grid gap-10 px-4 py-5 pb-28 md:px-7 md:py-7 md:pb-32 lg:grid-cols-[minmax(0,1.04fr)_minmax(340px,0.96fr)] lg:gap-12">
                  <div className="space-y-8">
                    <EditorProductGallery
                      images={formState.images}
                      productName={formState.name}
                      onImagesChange={(images) => setFormField("images", images)}
                    />

                    <section className="border-t border-[var(--system-200)]/80 pt-6">
                      <Textarea
                        label="Description"
                        value={formState.description}
                        onChange={(event) => setFormField("description", event.target.value)}
                        rows={8}
                        containerClassName="rounded-[28px] border border-[var(--system-200)] bg-white p-5 shadow-[0_12px_32px_rgba(15,16,17,0.05)]"
                        surfaceClassName="p-0"
                        className="text-[var(--system-600)]"
                        placeholder="Add product details that will appear next to the gallery."
                      />
                    </section>
                  </div>

                  <div className="lg:sticky lg:top-0">
                    <div className="space-y-8">
                      <section className="space-y-5">
                        <div className="space-y-4">
                          <Input
                            ref={titleInputRef}
                            value={formState.name}
                            onChange={(event) => setFormField("name", event.target.value)}
                            error={fieldErrors.name}
                            placeholder="Product title"
                          />

                          <div className="grid gap-4 md:grid-cols-2">
                            <Input
                              ref={priceInputRef}
                              type="number"
                              value={formState.basePrice}
                              onChange={(event) => setFormField("basePrice", event.target.value)}
                              error={fieldErrors.basePrice}
                              placeholder="0"
                            />
                            <Input
                              type="number"
                              value={formState.oldPrice}
                              onChange={(event) => setFormField("oldPrice", event.target.value)}
                              placeholder="Optional"
                            />
                          </div>
                        </div>

                        
                      </section>

                      <section className="border-t border-[var(--system-200)]/80 pt-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            
                            <Button
                              variant="outline"
                              onClick={() => setShowVariantEditor((current) => !current)}
                              className="rounded-full"
                            >
                              Manage
                              <ChevronDown className={`h-4 w-4 transition-transform ${showVariantEditor ? "rotate-180" : ""}`} />
                            </Button>
                          </div>

                          {currentVariants && currentVariants.length > 0 ? (
                            <div className="space-y-4 rounded-[28px] border border-[var(--system-200)] bg-white px-5 py-5 shadow-[0_12px_32px_rgba(15,16,17,0.04)]">
                              {currentVariants.map((variant) => (
                                <div key={variant.name} className="space-y-2">
                                  <p className="text-micro-label text-[var(--system-500)]">{variant.name}</p>
                                  <div className="flex flex-wrap gap-2">
                                    {variant.options.map((option) => {
                                      const isSelected = selectedVariants[variant.name] === option.name;
                                      return (
                                        <button
                                          key={option.name}
                                          type="button"
                                          onClick={() =>
                                            setSelectedVariants((current) => ({
                                              ...current,
                                              [variant.name]: option.name,
                                            }))
                                          }
                                          className={`rounded-full px-4 py-2 text-body-sm transition-colors ${
                                            isSelected
                                              ? "bg-[var(--system-700)] text-white"
                                              : "bg-[var(--system-100)] text-[var(--system-600)] hover:bg-[var(--system-200)]"
                                          }`}
                                        >
                                          {option.name}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-[28px] border border-dashed border-[var(--system-300)] bg-white px-4 py-5 text-body-sm text-[var(--system-400)]">
                              Add size, color, or custom options in the manage section.
                            </div>
                          )}

                          {showVariantEditor ? (
                              <InlineVariantEditor
                                variants={formState.variants}
                                onChange={(variants) => setFormField("variants", variants)}
                              />
                            
                          ) : null}
                        </div>
                      </section>

                     
                    </div>
                  </div>
                </div>
              </div>

              {primaryActionVisible ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4 md:bottom-6">
                  <div className="pointer-events-auto flex w-full max-w-max items-center gap-2 rounded-full border border-white/10 bg-[color:rgb(24_27_27_/_0.92)] p-2 shadow-[var(--shadow-xl)] backdrop-blur-xl">
                    <Button
                      variant="ghost"
                      onClick={requestClose}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSave} loading={isSaving} >
                      {!isSaving ? <Save className="h-4 w-4" /> : null}
                      {primaryActionLabel}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <DialogContent className="max-w-[420px] ">
          <DialogTitle className="sr-only">Discard unsaved product changes</DialogTitle>
          <DialogDescription className="sr-only">
            Confirm whether you want to discard your unsaved product edits.
          </DialogDescription>
          <div className="space-y-2">
            <h2 className="text-title text-[var(--system-700)]">Discard unsaved changes?</h2>
            <p className="text-body text-[var(--system-400)]">
              Your product field edits have not been saved yet. Visibility changes that already happened will stay.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setShowDiscardDialog(false)}>
              Keep editing
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setShowDiscardDialog(false);
                onClose();
              }}
            >
              Discard changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
