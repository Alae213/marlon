"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, Image as ImageIcon, Settings, ExternalLink } from "lucide-react";
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
  const [viewMode] = useState<"grid" | "list">("grid");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- setter used in handlers for loading state
  const [_isSaving, setIsSaving] = useState(false);

  // ── Convex Queries ──────────────────────────────────────────
  const products = useQuery(api.products.getProducts, { storeId });
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
        ) : viewMode === "grid" ? (
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
        ) : (
          <div className="divide-y divide-[#e5e5e5] dark:divide-[#262626]">
            {activeProducts.map((product) => (
              <ProductListItem
                key={product._id}
                product={product}
                onEdit={handleEditProduct}
                onToggleArchive={handleToggleArchive}
              />
            ))}
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

      <BottomNavigation storeSlug={storeSlug} currentPage="products" />
    </div>
  );
}
