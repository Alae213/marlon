"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Search, Plus, Grid3X3, List, Image as ImageIcon, Edit, Archive, Eye, EyeOff, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/core/button";
import { Input } from "@/components/core/input";
import { Textarea } from "@/components/core/textarea";
import { Modal } from "@/components/core/modal";
import { Card } from "@/components/core/card";
import { EmptyState } from "@/components/core/empty-state";
import { ImageUploader } from "@/components/image-cropper";
import { InlineVariantEditor } from "@/components/inline-variant-editor";
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

  const products = useQuery(
    api.products.getProducts,
    storeId ? { storeId: storeId as Id<"stores"> } : "skip"
  );

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
    setDeletingProductId(null);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-normal text-[#171717] dark:text-[#fafafa]">المنتجات</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4" />
          إضافة منتج
        </Button>
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-[#e5e5e5] dark:border-[#262626]">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث في المنتجات..."
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            
            <div className="flex items-center gap-1 p-0.5 bg-[#f5f5f5] dark:bg-[#171717]">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-colors ${
                  viewMode === "grid" 
                    ? "bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#fafafa]" 
                    : "text-[#737373] hover:text-[#171717] dark:hover:text-[#fafafa]"
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 transition-colors ${
                  viewMode === "list" 
                    ? "bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#fafafa]" 
                    : "text-[#737373] hover:text-[#171717] dark:hover:text-[#fafafa]"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
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
            {filteredProducts.map((product) => (
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
                  <h3 className="font-normal text-[#171717] dark:text-[#fafafa] mb-2 line-clamp-2">
                    {product.name}
                  </h3>
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
          </div>
        ) : (
          <div className="divide-y divide-[#e5e5e5] dark:divide-[#262626]">
            {filteredProducts.map((product) => (
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

export default function ProductsPage() {
  const params = useParams();
  const slug = params?.storeId as string; // storeId param contains the slug
  
  const store = useQuery(
    api.stores.getStoreBySlug,
    slug ? { slug } : "skip"
  );
  
  const storeId = store?._id;
  
  if (!store && slug) {
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
      <ProductsContent storeId={storeId} />
    </RealtimeProvider>
  );
}
