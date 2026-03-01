"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Search, ShoppingCart, Heart, Package } from "lucide-react";
import { useCart } from "@/contexts/cart-context";

interface CatalogProduct {
  id: string;
  name: string;
  basePrice: number;
  oldPrice: number | null;
  images: string[];
  isArchived: boolean;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ar-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0,
  }).format(price);
};

export default function CatalogPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const { addItem } = useCart();

  // Load products from localStorage
  useEffect(() => {
    const savedProducts = localStorage.getItem(`marlon_products_${slug}`);
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts).filter((p: CatalogProduct) => !p.isArchived));
    }
  }, [slug]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-6 text-center">
          اكتشف منتجاتنا
        </h1>
        
        <div className="max-w-md mx-auto relative">
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث عن منتج..."
            className="w-full h-12 ps-12 pe-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#00853f] focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {filteredProducts.map((product) => (
          <Link
            key={product.id}
            href={`/${slug}/product/${product.id}`}
            className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition-all"
          >
            <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800">
              {product.images && product.images[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 25vw"
                  loading="lazy"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-12 h-12 text-zinc-300" />
                </div>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="absolute top-3 end-3 w-9 h-9 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Heart className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <div className="p-4">
              <h3 className="font-medium text-zinc-900 dark:text-zinc-50 mb-2 line-clamp-2">
                {product.name}
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-[#00853f]">
                  {formatPrice(product.basePrice)}
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addItem({
                      id: `${product.id}-${Date.now()}`,
                      productId: product.id,
                      name: product.name,
                      price: product.basePrice,
                      quantity: 1,
                      image: product.images?.[0] || "",
                    });
                  }}
                  className="w-10 h-10 bg-[#00853f] text-white rounded-xl flex items-center justify-center hover:bg-[#007537] transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-zinc-500">لا توجد منتجات مطابقة للبحث</p>
        </div>
      )}
    </div>
  );
}
