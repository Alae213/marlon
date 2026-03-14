"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, Image as ImageIcon, Settings, ExternalLink, Eye, Copy, Check, Globe } from "lucide-react";
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
import { Button } from "@/components/core/button";
import { Card } from "@/components/core/card";
import { EmptyState } from "@/components/core/empty-state";
import { Modal } from "@/components/core/modal";
import { BottomNavigation } from "@/components/core/bottom-navigation";

import type { Product, ProductFormData } from "./types";
import { useInlineEdit } from "./hooks/use-inline-edit";
import { useImageUpload } from "./hooks/use-image-upload";
import { ProductCard } from "./product-card";
import { ProductListItem } from "./product-list-item";
import { ProductForm } from "./product-form";
import { NavbarEditor } from "./navbar-editor";
import { HeroEditor } from "./hero-editor";
import { FooterEditor } from "./footer-editor";
import { SettingsDialog } from "./settings-dialog";

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

  const handleAddProduct = useCallback(
    async (product: ProductFormData) => {
      setError(null);
      setIsSaving(true);
      try {
        const storageIds = await resolveImageStorageIds(product.images);

        await createProduct({
          storeId,
          name: product.name,
          description: product.description || undefined,
          basePrice: product.basePrice,
          oldPrice: product.oldPrice || undefined,
          images: storageIds,
          variants: product.variants,
        });
        setIsAddModalOpen(false);
      } catch (err) {
        console.error("Failed to create product:", err);
        const message = err instanceof Error ? err.message : "فشل في إضافة المنتج";
        setError(message);
      } finally {
        setIsSaving(false);
      }
    },
    [createProduct, resolveImageStorageIds, storeId]
  );

  const handleUpdateProduct = useCallback(
    async (product: ProductFormData) => {
      setUpdateError(null);
      setIsSaving(true);
      try {
        const storageIds = await resolveImageStorageIds(product.images);

        await updateProduct({
          productId: product.productId!,
          name: product.name,
          description: product.description || undefined,
          basePrice: product.basePrice,
          oldPrice: product.oldPrice || undefined,
          images: storageIds,
          variants: product.variants,
        });
        setEditingProduct(null);
      } catch (err) {
        console.error("Failed to update product:", err);
        const message = err instanceof Error ? err.message : "فشل في تحديث المنتج";
        setUpdateError(message);
      } finally {
        setIsSaving(false);
      }
    },
    [updateProduct, resolveImageStorageIds]
  );

  const handleToggleArchive = useCallback(
    async (productId: string, currentStatus?: boolean) => {
      try {
        if (currentStatus) {
          await unarchiveProduct({ productId: productId as Id<"products"> });
        } else {
          await archiveProduct({ productId: productId as Id<"products"> });
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
        await archiveProduct({ productId: productId as Id<"products"> });
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
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center">
            <Image src="/Logo-text.svg" alt="Marlon Logo" width={118} height={36} className="h-[10px] w-auto" />
          </Link>
        </div>
        <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
      </div>

      {/* Page Title + Actions */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-normal text-[#171717] dark:text-[#fafafa]">المنتجات</h1>
        <div className="flex items-center gap-3">
          <a
            href={`/${storeSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 font-medium transition-all h-10 px-4 text-sm border border-[#e5e5e5] dark:border-[#404040] text-[#171717] dark:text-[#fafafa] hover:bg-[#f5f5f5] dark:hover:bg-[#171717]"
          >
            <ExternalLink className="w-4 h-4" />
            معاينة
          </a>
          <Button variant="outline" onClick={() => setIsSettingsOpen(true)} aria-label="فتح الإعدادات">
            <Settings className="w-4 h-4" />
            الإعدادات
          </Button>
        </div>
      </div>

      {/* Browser Chrome Window */}
      <div className="fixed inset-0 flex flex-col h-screen w-screen bg-[var(--system-200)]">
        <div className="flex-1" />
        <div
          style={{
            background: "var(--gradient-popup)",
            boxShadow: "var(--shadow-xl-shadow)",
          }}
          className="flex flex-col gap-[8px] w-full h-[96vh] max-w-7xl mx-auto px-[12px] pt-[8px] pb-[0px] rounded-t-[20px] overflow-hidden"
        >
          {/* Browser Window Header */}
          <div className="px-[8px] flex items-center justify-between">
            {/* Left */}
            <div className="w-[120px]">
              <div className="flex flex-row gap-[16px]">
                <button
                  onClick={() => router.push("/")}
                  className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-[var(--system-300)]" />
                </button>
              </div>
            </div>

            {/* Center */}
            <div className="flex-1 flex justify-center">
              <div
                style={{ boxShadow: "var(--shadow-inside-shadow)" }}
                className="bg-black/40 flex flex-row justify-between items-center gap-2 rounded-[8px] p-[3px] pl-[8px] w-[300px]"
              >
                <Globe className="w-4 h-4 text-[var(--system-200)]" />

                <div className="group relative cursor-pointer">
                  <p className="caption-text text-[var(--system-200)] font-semibold">
                    {store?.name ?? storeSlug}
                    <span className="absolute left-[-42px] top-[42px] mt-1 w-max bg-[var(--system-100)] text-[var(--system-400)] rounded-[6px] text-xs py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none shadow-lg z-50">
                      marlon.app/{storeSlug}
                    </span>
                  </p>
                </div>

                <div className="relative">
                  <AnimatePresence mode="wait">
                    {!copied ? (
                      <motion.button
                        key="copy"
                        onClick={handleCopy}
                        className="group relative w-6 h-6 flex items-center justify-center rounded-lg hover:bg-[var(--system-300)] transition-all duration-200"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        whileHover={{
                          backgroundColor: "rgba(0, 0, 0, 0.05)",
                        }}
                        whileTap={{ scale: 0.9 }}
                        title="Copy URL"
                      >
                        <Copy className="w-3.5 h-3.5 text-[var(--system-300)]" />
                      </motion.button>
                    ) : (
                      <motion.div
                        key="check"
                        className="w-6 h-6 flex items-center justify-center"
                        initial={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          filter: "blur(0px)",
                          transition: { duration: 0.3, type: "spring", stiffness: 500, damping: 25 },
                        }}
                        exit={{
                          opacity: 0,
                          scale: 0.5,
                          filter: "blur(4px)",
                          transition: { duration: 0.2 },
                        }}
                      >
                        <Check className="w-3.5 h-3.5 text-[var(--success-200)]" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="w-[120px] flex justify-end">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  window.open(`/${storeSlug}`, "_blank");
                }}
                className="font-semibold justify-center items-center flex flex-row gap-[8px] caption-text text-[var(--system-300)] bg-white/5 w-fit h-6 px-[8px] rounded-md hover:bg-white/20 hover:text-[var(--system-200)] transition-all focus:outline-none"
              >
                <Eye className="w-3 h-3 stroke-[3px]" />
                عرض
              </button>
            </div>
          </div>

          {/* Browser Content — Scrollable Viewport */}
          <ScrollAreaRoot className="w-full h-full overflow-hidden rounded-t-[12px]">
            <ScrollAreaViewport
              style={{ boxShadow: "var(--shadow-inside-shadow)" }}
              className="py-12 px-24 bg-[var(--system-100)] h-full overflow-y-auto rounded-t-[12px] border-t border-[var(--system-400)]"
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
                    icon={<ImageIcon className="w-6 h-6 text-[#a3a3a3]" />}
                    title="لا توجد منتجات"
                    description="ابدأ بإضافة أول منتج لمتجرك"
                    action={
                      <Button onClick={() => setIsAddModalOpen(true)}>
                        <Plus className="w-4 h-4" />
                        إضافة منتج
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
                      className="aspect-[1/1.3] bg-white dark:bg-[#0a0a0a] border border-dashed border-[#d4d4d4] dark:border-[#404040] hover:border-[#171717] dark:hover:border-[#fafafa] transition-all duration-200 flex flex-col items-center justify-center gap-2"
                    >
                      <Plus className="w-8 h-8 text-[#d4d4d4] dark:text-[#525252]" />
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
              <ScrollAreaThumb className="relative flex-1 rounded-full bg-[var(--system-400)]" />
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
        title="إضافة منتج جديد"
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
        title="تعديل المنتج"
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
