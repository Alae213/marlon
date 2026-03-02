"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Search, Plus, Grid3X3, List, MoreVertical, Image as ImageIcon, Edit, Archive, Eye, EyeOff, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/core/button";
import { Input } from "@/components/core/input";
import { Textarea } from "@/components/core/textarea";
import { Modal } from "@/components/core/modal";
import { Card } from "@/components/core/card";
import { EmptyState } from "@/components/core/empty-state";
import { ImageUploader } from "@/components/image-cropper";
import { RealtimeProvider, useRealtime } from "@/contexts/realtime-context";

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

function ProductsContent({ storeId }: { storeId: string }) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Get products from Convex
  const products = useQuery(
    api.products.getProducts,
    storeId ? { storeId: storeId as Id<"stores"> } : "skip"
  );

  // Mutations
  const createProduct = useMutation(api.products.createProduct);
  const updateProduct = useMutation(api.products.updateProduct);
  const archiveProduct = useMutation(api.products.archiveProduct);
  const unarchiveProduct = useMutation(api.products.unarchiveProduct);

  const isLoading = !products;

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !p.isArchived
    );
  }, [products, searchQuery]);

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

  const handleDeleteProduct = (productId: string) => {
    // Note: Hard delete not implemented in Convex (soft delete only)
    // For now, just close the modal
    setDeletingProductId(null);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">المنتجات</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-5 h-5" />
          إضافة منتج
        </Button>
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث في المنتجات..."
                icon={<Search className="w-5 h-5" />}
              />
            </div>
            
            <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid" 
                    ? "bg-white dark:bg-zinc-700 text-[#00853f] shadow-sm" 
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                }`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list" 
                    ? "bg-white dark:bg-zinc-700 text-[#00853f] shadow-sm" 
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <EmptyState
            icon={<ImageIcon className="w-8 h-8 text-zinc-400" />}
            title="لا توجد منتجات"
            description="ابدأ بإضافة أول منتج لمتجرك"
            action={
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="w-5 h-5" />
                إضافة منتج
              </Button>
            }
          />
        ) : viewMode === "grid" ? (
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="group relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:border-[#00853f] hover:shadow-lg transition-all duration-200"
              >
                <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  {product.images?.[0] ? (
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-zinc-300" />
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-50 mb-1 line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#00853f]">
                      {formatPrice(product.basePrice)}
                    </span>
                    {product.oldPrice && (
                      <span className="text-sm text-zinc-400 line-through">
                        {formatPrice(product.oldPrice)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Hover Actions */}
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
                    className="p-2 bg-white/90 dark:bg-zinc-800/90 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    title="تعديل"
                  >
                    <Edit className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleArchive(product._id, product.isArchived); }}
                    className="p-2 bg-white/90 dark:bg-zinc-800/90 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    title={product.isArchived ? "تفعيل" : "تعطيل"}
                  >
                    {product.isArchived ? (
                      <Eye className="w-4 h-4 text-green-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-amber-600" />
                    )}
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeletingProductId(product._id); }}
                    className="p-2 bg-white/90 dark:bg-zinc-800/90 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>

                {/* Delete Confirmation */}
                {deletingProductId === product._id && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl">
                    <div className="text-center p-4">
                      <p className="text-white font-medium mb-3">حذف المنتج؟</p>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeletingProductId(null); }}
                          className="px-3 py-1.5 bg-white text-zinc-900 rounded-lg text-sm"
                        >
                          إلغاء
                        </button>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteProduct(product._id); }}
                          className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="flex items-center gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <div className="w-16 h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  {product.images?.[0] ? (
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-zinc-300" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-50 truncate">
                    {product.name}
                  </h3>
                  <p className="text-sm text-zinc-500 truncate">
                    {product.description}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#00853f]">
                    {formatPrice(product.basePrice)}
                  </span>
                  {product.oldPrice && (
                    <span className="text-sm text-zinc-400 line-through">
                      {formatPrice(product.oldPrice)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setEditingProduct(product)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4 text-zinc-500" />
                  </button>
                  <button 
                    onClick={() => handleToggleArchive(product._id, product.isArchived)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Archive className="w-4 h-4 text-zinc-500" />
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
    </div>
  );
}

function ProductForm({ product, onClose, onSubmit }: { product?: Product; onClose: () => void; onSubmit: (product: any) => void }) {
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [basePrice, setBasePrice] = useState(product?.basePrice?.toString() || "");
  const [oldPrice, setOldPrice] = useState(product?.oldPrice?.toString() || "");
  const [images, setImages] = useState<string[]>(product?.images || []);

  const isEditing = !!product;

  const handleSubmit = () => {
    if (!name || !basePrice) return;
    
    const productData = {
      name,
      description,
      basePrice: parseInt(basePrice),
      oldPrice: oldPrice ? parseInt(oldPrice) : undefined,
      images,
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
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          صور المنتج
        </label>
        <ImageUploader
          images={images}
          onImagesChange={setImages}
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

// Main page component - fetches storeId from slug
export default function ProductsPage() {
  const params = useParams();
  const slug = params?.slug as string;
  
  // Get store by slug
  const store = useQuery(
    api.stores.getStoreBySlug,
    slug ? { slug } : "skip"
  );
  
  const storeId = store?._id;
  
  // Show loading state
  if (!store && slug) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#00853f]" />
      </div>
    );
  }
  
  // No store found
  if (!storeId) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
          <p className="text-zinc-500">المتجر غير موجود</p>
        </div>
      </div>
    );
  }
  
  return (
    <RealtimeProvider storeId={storeId}>
      <ProductsContent storeId={storeId} />
    </RealtimeProvider>
  );
}
