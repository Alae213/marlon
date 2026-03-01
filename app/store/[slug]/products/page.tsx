"use client";

import { useState } from "react";
import { Search, Plus, Grid3X3, List, MoreVertical, Image, Edit, Archive } from "lucide-react";
import { Button } from "@/components/core/button";
import { Input } from "@/components/core/input";
import { Textarea } from "@/components/core/textarea";
import { Modal } from "@/components/core/modal";
import { Card } from "@/components/core/card";
import { EmptyState } from "@/components/core/empty-state";
import { Spinner } from "@/components/core/spinner";

const MOCK_PRODUCTS = [
  {
    id: "1",
    name: "قميص رجالي قطني",
    description: "قميص قطني 100%، متوفر بألوان متعددة",
    basePrice: 2500,
    oldPrice: 3000,
    images: [],
    isArchived: false,
    sortOrder: 0,
  },
  {
    id: "2",
    name: "حذاء رياضي",
    description: "حذاء رياضي مريح للرياضة واليوميات",
    basePrice: 4500,
    oldPrice: null,
    images: [],
    isArchived: false,
    sortOrder: 1,
  },
  {
    id: "3",
    name: "حقيبة ظهر",
    description: "حقيبة ظهر كبيرة للدراسة والسفر",
    basePrice: 3200,
    oldPrice: 3800,
    images: [],
    isArchived: false,
    sortOrder: 2,
  },
];

export default function ProductsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [products] = useState(MOCK_PRODUCTS);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
    }).format(price);
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
            icon={<Image className="w-8 h-8 text-zinc-400" />}
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
                key={product.id}
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
                    <Image className="w-12 h-12 text-zinc-300" />
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

                <button className="absolute top-2 end-2 p-2 bg-white/90 dark:bg-zinc-800/90 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
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
                    <Image className="w-6 h-6 text-zinc-300" />
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
                  <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                    <Edit className="w-4 h-4 text-zinc-500" />
                  </button>
                  <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
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
        <ProductForm onClose={() => setIsAddModalOpen(false)} />
      </Modal>
    </div>
  );
}

function ProductForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [images, setImages] = useState<string[]>([]);

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
        <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-8 text-center hover:border-[#00853f] hover:bg-[#00853f]/5 transition-colors cursor-pointer">
          <Image className="w-10 h-10 mx-auto mb-3 text-zinc-300" />
          <p className="text-sm text-zinc-500 mb-1">
            اسحب وأفلت الصور هنا
          </p>
          <p className="text-xs text-zinc-400">
            أو انقر للتصفح
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onClose} className="flex-1">
          إلغاء
        </Button>
        <Button 
          onClick={() => {
            console.log("Adding product:", { name, description, basePrice, oldPrice, images });
            onClose();
          }} 
          disabled={!name || !basePrice}
          className="flex-1"
        >
          إضافة المنتج
        </Button>
      </div>
    </div>
  );
}
