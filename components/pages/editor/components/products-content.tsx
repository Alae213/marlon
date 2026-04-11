"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, Image as ImageIcon, Settings, Eye, Copy, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Root as ScrollAreaRoot,
  Viewport as ScrollAreaViewport,
  Scrollbar as ScrollAreaScrollbar,
  Thumb as ScrollAreaThumb,
} from "@radix-ui/react-scroll-area";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/primitives/core/buttons/button";
import { Card } from "@/components/primitives/core/layout/card";
import { EmptyState } from "@/components/primitives/core/feedback/empty-state";
import { Modal } from "@/components/primitives/core/feedback/modal";
import { BottomNavigation } from "@/components/primitives/core/layout/bottom-navigation";

import type { Product, ProductFormData } from "../types";
import { useInlineEdit } from "../hooks/use-inline-edit";
import { useImageUpload } from "../hooks/use-image-upload";
import { ProductCard } from "./product-card";
import { ProductForm } from "./product-form";
import { NavbarEditor } from "./navbar-editor";
import { HeroEditor } from "./hero-editor";
import { FooterEditor } from "./footer-editor";
import { SettingsDialog } from "./settings-dialog";

// Convex ID validation helper
function isValidConvexId(id: string): boolean {
  return typeof id === "string" && id.length > 0 && /^[a-zA-Z0-9]+$/.test(id);
}

function toProductId(id: string, context: string): Id<"products"> {
  if (!isValidConvexId(id)) {
    throw new Error(`Invalid ID provided for ${context}`);
  }
  return id as unknown as Id<"products">;
}

interface ProductsContentProps {
  storeId: Id<"stores">;
  storeSlug: string;
}

export function ProductsContent({ storeId, storeSlug }: ProductsContentProps) {
  // ── UI State ────────────────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Router ──────────────────────────────────────────────────
  const router = useRouter();

  // ── Convex Queries ──────────────────────────────────────────
  const products = useQuery(api.products.getProducts, { storeId });
  const store = useQuery(api.stores.getStore, { storeId });
  const navbarContent = useQuery(api.siteContent.getSiteContentResolved, {
    storeId,
    section: "navbar",
  });
  const heroContent = useQuery(api.siteContent.getSiteContentResolved, {
    storeId,
    section: "hero",
  });
  const footerContent = useQuery(api.siteContent.getSiteContentResolved, {
    storeId,
    section: "footer",
  });

  // ── Convex Mutations ────────────────────────────────────────
  const createProduct = useMutation(api.products.createProduct);
  const updateProduct = useMutation(api.products.updateProduct);
  const archiveProduct = useMutation(api.products.archiveProduct);
  const unarchiveProduct = useMutation(api.products.unarchiveProduct);

  // ── Hooks ───────────────────────────────────────────────────
  const { resolveImageStorageIds } = useImageUpload();
  const {
    editingField,
    editValue,
    startEditing,
    saveInlineEdit,
    handleKeyDown,
    setEditingField,
    setEditValue,
  } = useInlineEdit({ products });

  // ── Derived Data ────────────────────────────────────────────
  const activeProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => !p.isArchived);
  }, [products]);

  // ── Copy Handler ────────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    const url = `${window.location.origin}/${storeSlug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [storeSlug]);

  // ── Product Handlers ────────────────────────────────────────

  // Shared helper for saving product (create or update)
  const saveProduct = useCallback(
    async (
      product: ProductFormData,
      mutation: typeof createProduct | typeof updateProduct,
      options: {
        isUpdate: boolean;
        onSuccess: () => void;
        setError: (error: string | null) => void;
      }
    ) => {
      options.setError(null);
      setIsSaving(true);
      try {
        const storageIds = await resolveImageStorageIds(product.images);

        if (options.isUpdate) {
          if (!product.productId) {
            throw new Error("Product ID is required for updates");
          }
          await updateProduct({
            productId: product.productId,
            name: product.name,
            description: product.description || undefined,
            basePrice: product.basePrice,
            oldPrice: product.oldPrice || undefined,
            images: storageIds,
            variants: product.variants,
          });
        } else {
          await createProduct({
            storeId,
            name: product.name,
            description: product.description || undefined,
            basePrice: product.basePrice,
            oldPrice: product.oldPrice || undefined,
            images: storageIds,
            variants: product.variants,
          });
        }
        options.onSuccess();
      } catch (err) {
        console.error("Failed to save product:", err);
        const message = err instanceof Error ? err.message : "Failed to save product";
        options.setError(message);
      } finally {
        setIsSaving(false);
      }
    },
    [createProduct, updateProduct, resolveImageStorageIds, storeId]
  );

  const handleAddProduct = useCallback(
    async (product: ProductFormData) => {
      await saveProduct(product, createProduct, {
        isUpdate: false,
        onSuccess: () => setIsAddModalOpen(false),
        setError: setError,
      });
    },
    [saveProduct]
  );

  const handleUpdateProduct = useCallback(
    async (product: ProductFormData) => {
      await saveProduct(product, updateProduct, {
        isUpdate: true,
        onSuccess: () => setEditingProduct(null),
        setError: setUpdateError,
      });
    },
    [saveProduct]
  );

  const handleToggleArchive = useCallback(
    async (productId: string, currentStatus?: boolean) => {
      try {
        const validId = toProductId(productId, "toggle archive");
        if (currentStatus) {
          await unarchiveProduct({ productId: validId });
        } else {
          await archiveProduct({ productId: validId });
        }
      } catch (error) {
        console.error("Failed to toggle archive:", error);
      }
    },
    [archiveProduct, unarchiveProduct]
  );

  const handleDeleteProduct = useCallback(
    async (productId: string) => {
      try {
        const validId = toProductId(productId, "delete product");
        await archiveProduct({ productId: validId });
        setDeletingProductId(null);
      } catch (error) {
        console.error("Failed to delete product:", error);
      }
    },
    [archiveProduct]
  );

  const handleEditProduct = useCallback((product: Product) => {
    setEditingProduct({
      ...product,
      images: product.images || [],
      isArchived: product.isArchived ?? false,
      variants:
        product.variants?.map((v) => ({
          name: v.name,
          options: v.options.map((o) => ({
            name: typeof o === "string" ? o : o.name,
            priceModifier: typeof o === "string" ? undefined : o.priceModifier,
          })),
        })) || [],
    });
  }, []);

  const handleEditSubmit = useCallback(
    async (updated: ProductFormData) => {
      await handleUpdateProduct(updated);
      // Don't close here — handleUpdateProduct closes on success
    },
    [handleUpdateProduct]
  );

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="h-screen w-full">

      {/* Browser Chrome Window */}
      <div className="flex flex-col items-center justify-center bg-[var(--system-200)] h-full">
        {/* Header */}
      <div className="px-[12px] w-full flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center">
            <Image src="/Logo-text.svg" alt="Marlon Logo" width={118} height={36} className="h-[10px] w-auto" />
          </Link>
        </div>
        <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
      </div>

        <div className="flex-1" />
        <div
          style={{
            background: "linear-gradient(0deg, #434545 100%, #212525 0%)",
            boxShadow: "var(--shadow-xl-shadow)",
          }}
          className="flex flex-col gap-[8px] w-full h-[96vh] max-w-7xl mx-auto px-[12px] pt-[8px] pb-[0px] rounded-t-[20px] overflow-hidden"
        >
          {/* Browser Window Header */}
          <div className="px-[8px] flex items-center justify-between h-[24px]">
            {/* Left */}
            <div className="w-[150px] flex items-center gap-2">
              <button
                onClick={() => router.push("/")}
                className="flex items-center justify-center cursor-pointer"
              >
                <Image src="/windw.svg" alt="marlon" width={24} height={24} className="w-8" />
              </button>
              
            </div>

            {/* Center */}
            <div className="flex-1 flex justify-center h-[26px]">
              <div
                style={{ boxShadow: "var(--shadow-inside-shadow)" }}
                className="h-full bg-black/40 flex flex-row justify-between items-center gap-2 rounded-[8px] p-[3px] pl-[6px] py-1 w-[300px]"
              >
                <div className="flex items-center gap-2 w-[50px]">
                  <Image src="/favicon.svg" alt="Marlon" width={27} height={27} className="w-4 h-4" />
                </div>
                <div className="group relative cursor-pointer">
                  <p className="label-xs text-[var(--system-300)]">
                    {store?.name ?? storeSlug}
                    <span className="absolute left-[-42px] top-[42px] mt-1 w-max bg-[var(--system-100)] text-[var(--system-400)] rounded-[6px] label-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none shadow-lg z-50">
                      marlon.app/{storeSlug}
                    </span>
                  </p>
                </div>
                <div className="w-[50px] flex justify-end">
                <button
                  onClick={handleCopy}
                  aria-label="Copy store URL"
                  className="cursor-pointer w-4 h-4 flex items-center justify-center rounded hover:bg-white/10 transition-all duration-200"
                >
                  <AnimatePresence mode="wait">
                    {!copied ? (
                      <motion.div
                        key="copy"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Copy className="w-3 h-3 text-[var(--system-300)]" />
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
                        <Check className="w-3 h-3 text-[--color-success] stroke-[3px]" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
                </div>
              </div>
            </div>
 
            {/* Right */}
            <div className="flex justify-end gap-1 w-[150px]">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  window.open(`/${storeSlug}`, "_blank");
                }}
                className="cursor-pointer label-xs justify-center items-center flex flex-row gap-[8px]  text-white bg-white/5 w-fit h-6 px-[8px] rounded-[10px] hover:bg-white/10 transition-all focus:outline-none"
              >
                <Eye className="w-3 h-3 stroke-[2px]" />
                Preview
              </button>
              
              <button
                onClick={() => setIsSettingsOpen(true)}
                aria-label="Settings"
                className="cursor-pointer label-xs justify-center items-center flex flex-row gap-[8px]  text-white bg-white/5 w-fit h-6 px-[8px] rounded-[10px] hover:bg-white/10 transition-all focus:outline-none"
              >
                <Settings className="w-3.5 h-3.5 stroke-[2px]" />
              </button>
              
            </div>
          </div>

          {/* Browser Content — Scrollable Viewport */}
          <ScrollAreaRoot className="w-full h-full overflow-hidden rounded-t-[12px]">
            <ScrollAreaViewport
              style={{ boxShadow: "var(--shadow-inside-shadow)" }}
              className="bg-[var(--system-100)] h-full overflow-y-auto rounded-t-[12px] border-t border-[var(--system-600)] "
            >
              {/* Navbar Editor */}
              <NavbarEditor storeId={storeId} navbarContent={navbarContent} />

              {/* Hero Editor */}
              <HeroEditor
                storeId={storeId}
                heroContent={heroContent}
                editingField={editingField}
                editValue={editValue}
                onEditValueChange={setEditValue}
                onStartEditing={(field, value) => {
                  setEditingField({ productId: "", field });
                  setEditValue(value);
                }}
                onSaveEdit={() => {
                  setEditingField(null);
                  setEditValue("");
                }}
              />

              {/* Products Catalog */}
              <Card padding="none">
                {activeProducts.length === 0 ? (
                  <EmptyState
                    icon={<ImageIcon className="w-6 h-6 text-[--system-300]" />}
                    title="No products yet"
                    description="Start by adding your first product"
                    action={
                      <Button onClick={() => setIsAddModalOpen(true)}>
                        <Plus className="w-4 h-4" />
                         Add Product
                      </Button>
                    }
                  />
                ) : (
                  <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {activeProducts.map((product) => (
                      <ProductCard
                        key={product._id}
                        product={product}
                        editingField={editingField}
                        editValue={editValue}
                        onEditValueChange={setEditValue}
                        onStartEditing={startEditing}
                        onSaveEdit={saveInlineEdit}
                        onKeyDown={handleKeyDown}
                        onEdit={handleEditProduct}
                        onToggleArchive={handleToggleArchive}
                        deletingProductId={deletingProductId}
                        onRequestDelete={setDeletingProductId}
                        onCancelDelete={() => setDeletingProductId(null)}
                        onConfirmDelete={handleDeleteProduct}
                      />
                    ))}

                    {/* Add Product Button */}
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      aria-label="Add new product"
                      className="aspect-[1/1.3] bg-white border border-dashed border-[--system-300] hover:border-[--system-700] transition-all duration-200 flex flex-col items-center justify-center gap-2"
                    >
                      <Plus className="w-8 h-8 text-[--system-300]" />
                    </button>
                  </div>
                )}
              </Card>

              {/* Footer Editor */}
              <FooterEditor
                storeId={storeId}
                footerContent={footerContent}
                navbarContent={navbarContent}
                editingField={editingField}
                editValue={editValue}
                onEditValueChange={setEditValue}
                onStartEditing={(field, value) => {
                  setEditingField({ productId: "", field });
                  setEditValue(value);
                }}
                onSaveEdit={() => {
                  setEditingField(null);
                  setEditValue("");
                }}
              />
            </ScrollAreaViewport>
            <ScrollAreaScrollbar
              orientation="vertical"
              className="flex w-2 touch-none select-none p-[1px] transition-colors"
            >
              <ScrollAreaThumb className="relative flex-1 rounded-full bg-[var(--system-300)]" />
            </ScrollAreaScrollbar>
          </ScrollAreaRoot>

          {/* Bottom Navigation */}
          <BottomNavigation storeSlug={storeSlug} currentPage="products" />
        </div>
        <div className="flex-1" />
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setError(null);
        }}
        title="Add new product"
      >
        <ProductForm
          onClose={() => {
            setIsAddModalOpen(false);
            setError(null);
          }}
          onSubmit={handleAddProduct}
          error={error}
        />
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        title="Edit product"
      >
        {editingProduct && (
          <ProductForm
            product={editingProduct}
            onClose={() => {
              setEditingProduct(null);
              setUpdateError(null);
            }}
            onSubmit={handleEditSubmit}
            error={updateError}
          />
        )}
      </Modal>

      {/* Settings Dialog */}
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        storeId={storeId}
        storeSlug={storeSlug}
        initialTab="preferences"
      />
    </div>
  );
}
