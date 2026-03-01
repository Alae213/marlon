"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingCart, Heart } from "lucide-react";
import { useCart } from "@/contexts/cart-context";

const MOCK_PRODUCTS = [
  {
    id: "1",
    name: "سماعة بلوتوث عالية الجودة",
    price: 2500,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    inStock: true,
  },
  {
    id: "2",
    name: "ساعة ذكية運動",
    price: 3200,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    inStock: true,
  },
  {
    id: "3",
    name: "لابتوب برو 2024",
    price: 68000,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop",
    inStock: true,
  },
  {
    id: "4",
    name: "كفر حماية شفاف",
    price: 500,
    image: "https://images.unsplash.com/photo-1586942593568-29361efcd571?w=400&h=400&fit=crop",
    inStock: true,
  },
  {
    id: "5",
    name: "keyboard ميكانيكي",
    price: 4500,
    image: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=400&h=400&fit=crop",
    inStock: false,
  },
  {
    id: "6",
    name: "ماوس لاسلكي",
    price: 1500,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop",
    inStock: true,
  },
  {
    id: "7",
    name: "كاميرا ويب HD",
    price: 2800,
    image: "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=400&h=400&fit=crop",
    inStock: true,
  },
  {
    id: "8",
    name: "شاحن أنكر السريع",
    price: 1800,
    image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&h=400&fit=crop",
    inStock: true,
  },
];

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ar-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0,
  }).format(price);
};

export default function CatalogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { addItem } = useCart();

  const filteredProducts = MOCK_PRODUCTS.filter(product =>
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
            href={`/marlon/product/${product.id}`}
            className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition-all"
          >
            <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800">
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 25vw"
                loading="lazy"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {!product.inStock && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    غير متوفر
                  </span>
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
                  {formatPrice(product.price)}
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (product.inStock) {
                      addItem({
                        id: `${product.id}-${Date.now()}`,
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        quantity: 1,
                        image: product.image,
                      });
                    }
                  }}
                  disabled={!product.inStock}
                  className="w-10 h-10 bg-[#00853f] text-white rounded-xl flex items-center justify-center disabled:bg-zinc-300 disabled:cursor-not-allowed hover:bg-[#007537] transition-colors"
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
