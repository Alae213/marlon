"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Search, ShoppingCart, Heart, Package } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface CatalogProduct {
  _id: string;
  name: string;
  basePrice: number;
  oldPrice?: number;
  images?: string[];
  isArchived?: boolean;
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
  const { addItem } = useCart();

  // Get store by slug
  const store = useQuery(api.stores.getStoreBySlug, slug ? { slug } : "skip");
  
  // Get products for this store using the store's ID
  const products = useQuery(
    api.products.getProducts,
    store?._id ? { storeId: store._id as Id<"stores"> } : "skip"
  );

  const productsData = useMemo(() => {
    return products || [];
  }, [products]);

  const filteredProducts = productsData.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-2xl font-normal text-[#171717] dark:text-[#fafafa] mb-6 text-center">
          اكتشف منتجاتنا
        </h1>
        
        <div className="max-w-md mx-auto relative">
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3a3a3]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث عن منتج..."
            className="w-full h-11 ps-11 pe-4 border border-[#e5e5e5] dark:border-[#404040] bg-white dark:bg-[#171717] text-[#171717] dark:text-[#fafafa] placeholder:text-[#a3a3a3] focus:outline-none focus:border-[#171717] dark:focus:border-[#fafafa] transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <Link
            key={product._id}
            href={`/shop/${slug}/product/${product._id}`}
            className="group bg-white dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] overflow-hidden hover:border-[#171717] dark:hover:border-[#fafafa] transition-all duration-300"
          >
            <div className="relative aspect-square bg-[#f5f5f5] dark:bg-[#171717]">
              {product.images && product.images[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 25vw"
                  loading="lazy"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-10 h-10 text-[#d4d4d4]" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-normal text-[#171717] dark:text-[#fafafa] mb-3 line-clamp-2">
                {product.name}
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-base font-normal text-[#171717] dark:text-[#fafafa]">
                  {formatPrice(product.basePrice)}
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addItem({
                      id: `${product._id}-${Date.now()}`,
                      productId: product._id,
                      name: product.name,
                      price: product.basePrice,
                      quantity: 1,
                      image: product.images?.[0] || "",
                    });
                  }}
                  className="w-9 h-9 bg-[#171717] dark:bg-[#fafafa] text-white dark:text-[#171717] flex items-center justify-center hover:opacity-80 transition-opacity"
                >
                  <ShoppingCart className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[#737373]">لا توجد منتجات مطابقة للبحث</p>
        </div>
      )}
    </div>
  );
}
