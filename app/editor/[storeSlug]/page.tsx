"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, Grid3X3, List, Image as ImageIcon, Edit, Archive, Eye, EyeOff, Trash2, Loader2, Settings, Package, ShoppingCart, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/core/button";
import { Card } from "@/components/core/card";
import { EmptyState } from "@/components/core/empty-state";
import { Modal } from "@/components/core/modal";
import { Input } from "@/components/core/input";
import { Textarea } from "@/components/core/textarea";
import { ImageUploader } from "@/components/image-cropper";
import { InlineVariantEditor } from "@/components/inline-variant-editor";
import { RealtimeProvider, useRealtime } from "@/contexts/realtime-context";
import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";

interface Product {
  _id: Id<"products">;
  _creationTime: number;
  name: string;
  description?: string;
  basePrice: number;
  oldPrice?: number;
  images?: string[];
  category?: string;
  variants?: any[];
  isArchived?: boolean;
  sortOrder?: number;
  createdAt?: number;
  updatedAt?: number;
}

function ProductsContent({ storeId, storeSlug }: { storeId: string; storeSlug: string }) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Inline editing states
  const [editingField, setEditingField] = useState<{ productId: string; field: "name" | "basePrice" | "oldPrice" } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const products = useQuery(
    api.products.getProducts,
    storeId ? { storeId: storeId as Id<"stores"> } : "skip"
  );

  const createProduct = useMutation(api.products.createProduct);
  const updateProduct = useMutation(api.products.updateProduct);
  const archiveProduct = useMutation(api.products.archiveProduct);
  const unarchiveProduct = useMutation(api.products.unarchiveProduct);

  const isLoading = !products;

  // Show all products (including archived) - filter out archived for display
  const activeProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => !p.isArchived);
  }, [products]);

  // Inline editing handlers
  const startEditing = (productId: string, field: "name" | "basePrice" | "oldPrice", currentValue: string | number) => {
    setEditingField({ productId, field });
    setEditValue(String(currentValue));
  };

  const saveInlineEdit = async () => {
    if (!editingField) return;
    
    setIsSaving(true);
    try {
      const product = products?.find(p => p._id === editingField.productId);
      if (!product) return;

      const updates: any = { productId: editingField.productId as Id<"products"> };
      
      if (editingField.field === "name") {
        updates.name = editValue;
      } else if (editingField.field === "basePrice") {
        updates.basePrice = parseInt(editValue) || 0;
      } else if (editingField.field === "oldPrice") {
        updates.oldPrice = editValue ? parseInt(editValue) : undefined;
      }

      await updateProduct(updates);
      setEditingField(null);
      setEditValue("");
    } catch (error) {
      console.error("Failed to update:", error);
    }
    setIsSaving(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveInlineEdit();
    } else if (e.key === "Escape") {
      setEditingField(null);
      setEditValue("");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddProduct = async (product: Omit<Product, "_id" | "isArchived" | "sortOrder">) => {
    try {
      await createProduct({
        storeId: storeId as Id<"stores">,
        name: product.name,
        description: product.description || undefined,
        basePrice: product.basePrice,
        oldPrice: product.oldPrice || undefined,
        images: product.images,
      });
    } catch (error) {
      console.error("Failed to create product:", error);
    }
  };

  const handleToggleArchive = async (productId: string, currentStatus?: boolean) => {
    try {
      if (currentStatus) {
        await unarchiveProduct({ productId: productId as Id<"products"> });
      } else {
        await archiveProduct({ productId: productId as Id<"products"> });
      }
    } catch (error) {
      console.error("Failed to toggle archive:", error);
    }
  };

  const handleUpdateProduct = async (product: Product) => {
    try {
      await updateProduct({
        productId: product._id,
        name: product.name,
        description: product.description || undefined,
        basePrice: product.basePrice,
        oldPrice: product.oldPrice || undefined,
        images: product.images,
      });
      setEditingProduct(null);
    } catch (error) {
      console.error("Failed to update product:", error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      // Use archive for soft delete
      await archiveProduct({ productId: productId as Id<"products"> });
      setDeletingProductId(null);
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with Logo, Back Button, and User Profile */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#e5e5e5] dark:border-[#262626]">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-[#f5f5f5] dark:hover:bg-[#171717] rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#525252] dark:text-[#d4d4d4]" />
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#171717] dark:bg-[#fafafa] rounded-full flex items-center justify-center">
              <Home className="w-4 h-4 text-white dark:text-[#171717]" />
            </div>
            <span className="font-medium text-[#171717] dark:text-[#fafafa]">متجري</span>
          </Link>
        </div>
        <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
      </div>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-normal text-[#171717] dark:text-[#fafafa]">المنتجات</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="w-4 h-4" />
            الإعدادات
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4" />
            إضافة منتج
          </Button>
        </div>
      </div>

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
              <div
                key={product._id}
                className="group relative bg-white dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] overflow-hidden hover:border-[#171717] dark:hover:border-[#fafafa] transition-all duration-200"
              >
                <div className="aspect-square bg-[#f5f5f5] dark:bg-[#171717] flex items-center justify-center">
                  {product.images?.[0] ? (
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-[#d4d4d4]" />
                  )}
                </div>
                
                <div className="p-4">
                  {/* Product Name - Inline Edit */}
                  {editingField?.productId === product._id && editingField?.field === "name" ? (
                    <input
                      autoFocus
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={saveInlineEdit}
                      onKeyDown={handleKeyDown}
                      className="w-full font-normal text-[#171717] dark:text-[#fafafa] mb-2 px-1 py-0.5 border border-[#171717] dark:border-[#fafafa] bg-white dark:bg-[#0a0a0a] focus:outline-none"
                    />
                  ) : (
                    <h3 
                      className="font-normal text-[#171717] dark:text-[#fafafa] mb-2 line-clamp-2 cursor-pointer hover:text-[#525252] dark:hover:text-[#d4d4d4]"
                      onClick={() => startEditing(product._id, "name", product.name)}
                    >
                      {product.name}
                    </h3>
                  )}
                  
                  <div className="flex items-center gap-2">
                    {/* Base Price - Inline Edit */}
                    {editingField?.productId === product._id && editingField?.field === "basePrice" ? (
                      <input
                        autoFocus
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveInlineEdit}
                        onKeyDown={handleKeyDown}
                        className="font-medium text-[#171717] dark:text-[#fafafa] px-1 py-0.5 w-24 border border-[#171717] dark:border-[#fafafa] bg-white dark:bg-[#0a0a0a] focus:outline-none"
                      />
                    ) : (
                      <span 
                        className="font-medium text-[#171717] dark:text-[#fafafa] cursor-pointer hover:text-[#525252] dark:hover:text-[#d4d4d4]"
                        onClick={() => startEditing(product._id, "basePrice", product.basePrice)}
                      >
                        {formatPrice(product.basePrice)}
                      </span>
                    )}
                    
                    {/* Old Price - Inline Edit */}
                    {product.oldPrice && (
                      editingField?.productId === product._id && editingField?.field === "oldPrice" ? (
                        <input
                          autoFocus
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveInlineEdit}
                          onKeyDown={handleKeyDown}
                          className="text-sm text-[#a3a3a3] line-through px-1 py-0.5 w-24 border border-[#a3a3a3] bg-white dark:bg-[#0a0a0a] focus:outline-none"
                          placeholder="السعر القديم"
                        />
                      ) : (
                        <span 
                          className="text-sm text-[#a3a3a3] line-through cursor-pointer hover:text-[#737373]"
                          onClick={() => startEditing(product._id, "oldPrice", product.oldPrice || "")}
                        >
                          {formatPrice(product.oldPrice)}
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div className="absolute top-2 end-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation(); 
                      setEditingProduct({ 
                        ...product, 
                        images: product.images || [],
                        isArchived: product.isArchived ?? false
                      }); 
                    }}
                    className="p-2 bg-white/90 dark:bg-[#0a0a0a]/90 hover:bg-[#f5f5f5] dark:hover:bg-[#171717] transition-colors"
                    title="تعديل"
                  >
                    <Edit className="w-4 h-4 text-[#525252]" />
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleArchive(product._id, product.isArchived); }}
                    className="p-2 bg-white/90 dark:bg-[#0a0a0a]/90 hover:bg-[#f5f5f5] dark:hover:bg-[#171717] transition-colors"
                    title={product.isArchived ? "تفعيل" : "تعطيل"}
                  >
                    {product.isArchived ? (
                      <Eye className="w-4 h-4 text-[#16a34a]" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-[#d97706]" />
                    )}
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeletingProductId(product._id); }}
                    className="p-2 bg-white/90 dark:bg-[#0a0a0a]/90 hover:bg-[#fee2e2] dark:hover:bg-[#7f1d1d]/20 transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4 text-[#dc2626]" />
                  </button>
                </div>

                {deletingProductId === product._id && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="text-center p-4">
                      <p className="text-white font-normal mb-3">حذف المنتج؟</p>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeletingProductId(null); }}
                          className="px-3 py-1.5 bg-white text-[#171717] text-sm"
                        >
                          إلغاء
                        </button>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteProduct(product._id); }}
                          className="px-3 py-1.5 bg-[#dc2626] text-white text-sm"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Add Product Button - Same size as product card */}
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
              <div
                key={product._id}
                className="flex items-center gap-4 p-4 hover:bg-[#f5f5f5] dark:hover:bg-[#171717]/50 transition-colors"
              >
                <div className="w-14 h-14 bg-[#f5f5f5] dark:bg-[#171717] flex items-center justify-center flex-shrink-0">
                  {product.images?.[0] ? (
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-[#d4d4d4]" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-normal text-[#171717] dark:text-[#fafafa] truncate">
                    {product.name}
                  </h3>
                  <p className="text-sm text-[#737373] truncate">
                    {product.description}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#171717] dark:text-[#fafafa]">
                    {formatPrice(product.basePrice)}
                  </span>
                  {product.oldPrice && (
                    <span className="text-sm text-[#a3a3a3] line-through">
                      {formatPrice(product.oldPrice)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setEditingProduct(product)}
                    className="p-2 hover:bg-[#f5f5f5] dark:hover:bg-[#171717] transition-colors"
                  >
                    <Edit className="w-4 h-4 text-[#737373]" />
                  </button>
                  <button 
                    onClick={() => handleToggleArchive(product._id, product.isArchived)}
                    className="p-2 hover:bg-[#f5f5f5] dark:hover:bg-[#171717] transition-colors"
                  >
                    <Archive className="w-4 h-4 text-[#737373]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="إضافة منتج جديد"
        size="lg"
      >
        <ProductForm onClose={() => setIsAddModalOpen(false)} onSubmit={handleAddProduct} />
      </Modal>

      <Modal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        title="تعديل المنتج"
        size="lg"
      >
        {editingProduct && (
          <ProductForm 
            product={editingProduct}
            onClose={() => setEditingProduct(null)} 
            onSubmit={(updated) => {
              handleUpdateProduct(updated);
              setEditingProduct(null);
            }} 
          />
        )}
      </Modal>

      <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} storeId={storeId} storeSlug={storeSlug} />

      {/* Fixed Bottom Navigation - 200px centered */}
      <div className="fixed bottom-4 start-1/2 -translate-x-1/2 bg-white dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] rounded-full px-6 py-2 flex justify-around items-center z-40 shadow-lg w-[200px]">
        <button
          onClick={() => router.push(`/editor/${storeSlug}`)}
          className="flex flex-col items-center gap-1 text-[#171717] dark:text-[#fafafa]"
        >
          <Package className="w-5 h-5" />
          <span className="text-xs">المنتجات</span>
        </button>
        <button
          onClick={() => router.push(`/orders/${storeSlug}`)}
          className="flex flex-col items-center gap-1 text-[#a3a3a3] dark:text-[#525252] hover:text-[#171717] dark:hover:text-[#fafafa]"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-xs">الطلبات</span>
        </button>
      </div>
      
      {/* Add padding bottom to avoid content being hidden behind fixed nav */}
      <div className="h-20"></div>
    </div>
  );
}

function ProductForm({ product, onClose, onSubmit }: { product?: Product; onClose: () => void; onSubmit: (product: any) => void }) {
  const convertToEditorFormat = (variants?: any[]) => {
    if (!variants || variants.length === 0) return [];
    return variants.map(v => ({
      name: v.name,
      variants: v.options || []
    }));
  };
  
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [basePrice, setBasePrice] = useState(product?.basePrice?.toString() || "");
  const [oldPrice, setOldPrice] = useState(product?.oldPrice?.toString() || "");
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [variants, setVariants] = useState<any[]>(convertToEditorFormat(product?.variants));

  const isEditing = !!product;

  const handleSubmit = () => {
    if (!name || !basePrice) return;
    
    const convertedVariants = variants.length > 0 ? variants.map(group => ({
      name: group.name,
      options: group.variants || []
    })) : undefined;
    
    const productData = {
      name,
      description,
      basePrice: parseInt(basePrice),
      oldPrice: oldPrice ? parseInt(oldPrice) : undefined,
      images,
      variants: convertedVariants,
    };
    
    onSubmit(productData);
    onClose();
  };

  return (
    <div className="space-y-5">
      <Input
        label="اسم المنتج"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="قميص رجالي قطني"
      />

      <Textarea
        label="الوصف"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="وصف المنتج..."
        rows={3}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="السعر (د.ج)"
          type="number"
          value={basePrice}
          onChange={(e) => setBasePrice(e.target.value)}
          placeholder="2500"
        />
        <Input
          label="السعر القديم (اختياري)"
          type="number"
          value={oldPrice}
          onChange={(e) => setOldPrice(e.target.value)}
          placeholder="3000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#525252] dark:text-[#d4d4d4] mb-2">
          صور المنتج
        </label>
        <ImageUploader
          images={images}
          onImagesChange={setImages}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#525252] dark:text-[#d4d4d4] mb-2">
          الخيارات (مثل: المقاس، اللون)
        </label>
        <InlineVariantEditor
          variants={variants}
          onChange={setVariants}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onClose} className="flex-1">
          إلغاء
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={!name || !basePrice}
          className="flex-1"
        >
          {isEditing ? "حفظ التغييرات" : "إضافة المنتج"}
        </Button>
      </div>
    </div>
  );
}

function SettingsDialog({ isOpen, onClose, storeId, storeSlug }: { isOpen: boolean; onClose: () => void; storeId: string; storeSlug: string }) {
  const [activeTab, setActiveTab] = useState("delivery");
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-[#e5e5e5] dark:border-[#262626]">
          <h2 className="text-lg font-medium">إعدادات المتجر</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#f5f5f5] dark:hover:bg-[#171717]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex border-b border-[#e5e5e5] dark:border-[#262626]">
          <button
            onClick={() => setActiveTab("delivery")}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === "delivery"
                ? "border-b-2 border-[#171717] dark:border-[#fafafa] text-[#171717] dark:text-[#fafafa]"
                : "text-[#737373]"
            }`}
          >
            أسعار التوصيل
          </button>
          <button
            onClick={() => setActiveTab("integration")}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === "integration"
                ? "border-b-2 border-[#171717] dark:border-[#fafafa] text-[#171717] dark:text-[#fafafa]"
                : "text-[#737373]"
            }`}
          >
            شركات التوصيل
          </button>
          <button
            onClick={() => setActiveTab("store")}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === "store"
                ? "border-b-2 border-[#171717] dark:border-[#fafafa] text-[#171717] dark:text-[#fafafa]"
                : "text-[#737373]"
            }`}
          >
            معلومات المتجر
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === "delivery" && (
            <DeliveryPricingSettings storeId={storeId} />
          )}
          {activeTab === "integration" && (
            <DeliveryIntegrationSettings storeId={storeId} />
          )}
          {activeTab === "store" && (
            <StoreInfoSettings storeId={storeId} storeSlug={storeSlug} />
          )}
        </div>
      </div>
    </div>
  );
}

function DeliveryPricingSettings({ storeId }: { storeId: string }) {
  const [pricing, setPricing] = useState<Record<string, { stopdesk: number; domicile: number }>>({});
  const updatePricing = useMutation(api.stores.updateDeliveryPricing);
  const [isSaving, setIsSaving] = useState(false);

  const wilayas = [
    "الجزائر", "قسنطينة", "وهران", "باتنة", "تيارت", "تبسة", "تلمسان", "تيارت",
    "بسكرة", "بشار", "بجاية", "عنابة", "الطارف", "المسيلة", "مستغانم", "المدية",
    "غرداية", "غليزان", "ورقلة", "سيدي بلعباس", "سوق أهراس", "تيبازة", "ميلة",
    "عين الدفلى", "النعامة", "عين تموشنت", "خنشلة", "سعيدة", "جيجل", "سكيكدة",
    "أولاد جلال", "برج بوعريريج", "مليانة", "عطار", "بريكة", "الوادي", "تامنة",
    " الطارف", "زريبة", "توقرت", "جبلية", "أولاد عيسى", " الشلف"
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save pricing for each wilaya
      for (const [wilaya, prices] of Object.entries(pricing)) {
        await updatePricing({
          storeId: storeId as Id<"stores">,
          wilaya,
          homeDelivery: prices.domicile,
          officeDelivery: prices.stopdesk,
        });
      }
    } catch (error) {
      console.error("Failed to save pricing:", error);
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">أسعار التوصيل لكل ولاية</h3>
      <div className="grid grid-cols-2 gap-4">
        {wilayas.slice(0, 10).map((wilaya) => (
          <div key={wilaya} className="p-3 border border-[#e5e5e5] dark:border-[#404040]">
            <p className="text-sm font-medium mb-2">{wilaya}</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-[#737373]">مكتب</label>
                <input
                  type="number"
                  className="w-full h-8 px-2 border border-[#e5e5e5] dark:border-[#404040] bg-white dark:bg-[#171717] text-sm"
                  placeholder="السعر"
                  onChange={(e) => setPricing(prev => ({
                    ...prev,
                    [wilaya]: { ...prev[wilaya], stopdesk: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <label className="text-xs text-[#737373]">منزل</label>
                <input
                  type="number"
                  className="w-full h-8 px-2 border border-[#e5e5e5] dark:border-[#404040] bg-white dark:bg-[#171717] text-sm"
                  placeholder="السعر"
                  onChange={(e) => setPricing(prev => ({
                    ...prev,
                    [wilaya]: { ...prev[wilaya], domicile: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-[#737373]">عرض 10 ولايات فقط - تمت إضافة المزيد</p>
      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving ? "جاري الحفظ..." : "حفظ الأسعار"}
      </Button>
    </div>
  );
}

function DeliveryIntegrationSettings({ storeId }: { storeId: string }) {
  const [provider, setProvider] = useState<"none" | "zr_express" | "yalidine">("none");
  const [apiKey, setApiKey] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  return (
    <div className="space-y-4">
      <h3 className="font-medium">اختر شركة التوصيل</h3>
      
      <div className="flex gap-3">
        <button
          onClick={() => setProvider("none")}
          className={`flex-1 py-3 border ${
            provider === "none" ? "border-[#171717] bg-[#f5f5f5]" : "border-[#e5e5e5]"
          }`}
        >
          لا شيء
        </button>
        <button
          onClick={() => setProvider("zr_express")}
          className={`flex-1 py-3 border ${
            provider === "zr_express" ? "border-[#171717] bg-[#f5f5f5]" : "border-[#e5e5e5]"
          }`}
        >
          ZR Express
        </button>
        <button
          onClick={() => setProvider("yalidine")}
          className={`flex-1 py-3 border ${
            provider === "yalidine" ? "border-[#171717] bg-[#f5f5f5]" : "border-[#e5e5e5]"
          }`}
        >
          Yalidine
        </button>
      </div>

      {provider !== "none" && (
        <div className="space-y-3 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full h-10 px-3 border border-[#e5e5e5] dark:border-[#404040] bg-white dark:bg-[#171717]"
              placeholder="أدخل API Key"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">API Token</label>
            <input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              className="w-full h-10 px-3 border border-[#e5e5e5] dark:border-[#404040] bg-white dark:bg-[#171717]"
              placeholder="أدخل API Token"
            />
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1">
              اختبار الاتصال
            </Button>
            <Button className="flex-1" disabled={isSaving}>
              {isSaving ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StoreInfoSettings({ storeId, storeSlug }: { storeId: string; storeSlug: string }) {
  const store = useQuery(api.stores.getStoreBySlug, { slug: storeSlug });
  const updateStore = useMutation(api.stores.updateStore);
  const [name, setName] = useState(store?.name || "");
  const [description, setDescription] = useState(store?.description || "");
  const [phone, setPhone] = useState(store?.phone || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateStore({
        storeId: storeId as Id<"stores">,
        name,
        description,
        phone,
      });
    } catch (error) {
      console.error("Failed to update store:", error);
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">معلومات المتجر</h3>
      
      <div>
        <label className="block text-sm font-medium mb-1">اسم المتجر</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-10 px-3 border border-[#e5e5e5] dark:border-[#404040] bg-white dark:bg-[#171717]"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">الوصف</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#404040] bg-white dark:bg-[#171717]"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">رقم الهاتف</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full h-10 px-3 border border-[#e5e5e5] dark:border-[#404040] bg-white dark:bg-[#171717]"
        />
      </div>

      <div className="p-3 bg-[#f5f5f5] dark:bg-[#171717]">
        <p className="text-sm text-[#737373]">رابط المتجر:</p>
        <p className="font-medium">marlon.com/{storeSlug}</p>
      </div>

      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
      </Button>
    </div>
  );
}

export default function EditorPage() {
  const params = useParams();
  const storeSlug = params?.storeSlug as string;
  
  const store = useQuery(
    api.stores.getStoreBySlug,
    storeSlug ? { slug: storeSlug } : "skip"
  );
  
  const storeId = store?._id as string | undefined;
  
  if (!store && storeSlug) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-[#171717] dark:text-[#fafafa]" />
      </div>
    );
  }
  
  if (!storeId) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] p-12 text-center">
          <p className="text-[#737373]">المتجر غير موجود</p>
        </div>
      </div>
    );
  }
  
  return (
    <RealtimeProvider storeId={storeId}>
      <ProductsContent storeId={storeId} storeSlug={storeSlug} />
    </RealtimeProvider>
  );
}
