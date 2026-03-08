"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Search, ShoppingCart, Package } from "lucide-react";
import { useCart, CartProvider } from "@/contexts/cart-context";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CartSidebar } from "@/components/cart-sidebar";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0,
  }).format(price);
};

export default function StorefrontPage() {
  return (
    <CartProvider>
      <StorefrontContent />
    </CartProvider>
  );
}

function StorefrontContent() {
  const params = useParams();
  const slug = params?.slug as string;
  const [searchQuery, setSearchQuery] = useState("");
  const { addItem, itemCount, isOpen, openCart, closeCart } = useCart();

  const store = useQuery(api.stores.getStoreBySlug, slug ? { slug } : "skip");

  const navbarContent = useQuery(
    api.siteContent.getSiteContentResolved,
    store?._id ? { storeId: store._id as Id<"stores">, section: "navbar" } : "skip"
  );
  
  const heroContent = useQuery(
    api.siteContent.getSiteContentResolved,
    store?._id ? { storeId: store._id as Id<"stores">, section: "hero" } : "skip"
  );
  
  const footerContent = useQuery(
    api.siteContent.getSiteContentResolved,
    store?._id ? { storeId: store._id as Id<"stores">, section: "footer" } : "skip"
  );
  
  const products = useQuery(
    api.products.getProducts,
    store?._id ? { storeId: store._id as Id<"stores"> } : "skip"
  );

  const productsData = useMemo(() => products || [], [products]);

  const filteredProducts = productsData.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentNavbar = navbarContent?.content as { background?: string; textColor?: string; logoUrl?: string } | undefined;
  const navbarBg = currentNavbar?.background ?? "light";
  const navbarText = currentNavbar?.textColor ?? "dark";
  const navbarLogoUrl = currentNavbar?.logoUrl;

  // Hero content
  const currentHero = heroContent?.content as { 
    title?: string; 
    ctaText?: string; 
    ctaColor?: string;
    layout?: "left" | "center" | "right";
    backgroundImageUrl?: string;
  } | undefined;
  const heroTitle = currentHero?.title ?? "";
  const heroCtaText = currentHero?.ctaText ?? "";
  const heroCtaColor = currentHero?.ctaColor ?? "#171717";
  const heroLayout = currentHero?.layout ?? "center";
  const heroBgUrl = currentHero?.backgroundImageUrl;

  // Footer content
  const currentFooter = footerContent?.content as {
    logo?: string;
    logoUrl?: string;
    description?: string;
    contactEmail?: string;
    contactPhone?: string;
    copyright?: string;
    socialLinks?: Array<{ platform: string; url: string; enabled: boolean }>;
  } | undefined;
  const footerLogoUrl = currentFooter?.logoUrl;
  const footerDescription = currentFooter?.description ?? "";
  const footerPhone = currentFooter?.contactPhone ?? "";
  const footerEmail = currentFooter?.contactEmail ?? "";
  const footerCopyright = currentFooter?.copyright ?? "";

  const navbarBgClass =
    navbarBg === "dark"
      ? "bg-[#0a0a0a]"
      : navbarBg === "transparent"
        ? "bg-transparent"
        : "bg-white";

  const navbarTextClass = navbarText === "light" ? "text-white" : "text-[#171717]";

  return (
    <div className="w-full">
      {/* Navbar */}
      <div className={`fixed top-0 left-0 right-0 z-50 ${navbarBgClass}`}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#f5f5f5] dark:bg-[#171717] overflow-hidden flex items-center justify-center flex-shrink-0">
              {navbarLogoUrl ? (
                <Image
                  src={navbarLogoUrl}
                  alt="logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-5 h-5 text-[#a3a3a3]" />
              )}
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-5">
            <span className={`body-base ${navbarTextClass}`}>Shop</span>
            <span className={`body-base ${navbarTextClass}`}>FAQ</span>
            <span className={`body-base ${navbarTextClass}`}>Help</span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={openCart}
              className={`w-9 h-9 flex items-center justify-center border border-[#e5e5e5] dark:border-[#262626] relative ${navbarTextClass}`}
            >
              <ShoppingCart className="w-4 h-4" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -end-1 w-4 h-4 bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      {heroTitle && (
        <div 
          className="relative overflow-hidden h-[calc(100vh-80px)] flex flex-col items-center justify-center p-8 mb-10"
          style={heroBgUrl ? { 
            backgroundImage: `url(${heroBgUrl})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center' 
          } : {}}
        >
          {!heroBgUrl && (
            <div className="absolute inset-0 bg-gradient-to-br from-[#f5f5f5] to-[#e5e5e5] dark:from-[#171717] dark:to-[#262626]" />
          )}
          
          <div className={`relative z-10 text-center w-full ${
            heroLayout === "left" ? "text-start items-start" : 
            heroLayout === "right" ? "text-end items-end" : 
            "text-center items-center"
          } flex flex-col gap-4`}>
            <h1 className="display-5xl text-[var(--system-100)] dark:text-[#fafafa]">
              {heroTitle}
            </h1>
            {heroCtaText && (
              <button 
                className="px-6 py-2 text-white font-medium hover:opacity-90 transition-opacity w-fit"
                style={{ backgroundColor: heroCtaColor }}
              >
                {heroCtaText}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <Link
            key={product._id}
            href={`/${slug}/product/${product._id}`}
            className=" dark:bg-[#0a0a0a] border border-[#e5e5e5] overflow-hidden"
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
              </div>
            </div>
          </Link>
        ))}
        </div>
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[#737373]">No products available</p>
        </div>
      )}

      <CartSidebar 
        isOpen={isOpen} 
        onClose={closeCart}
        storeId={store?._id as string}
        storeSlug={slug}
      />

      {/* Footer */}
      <footer className="mt-16 border-t border-[#e5e5e5] dark:border-[#262626] pt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo & Description */}
          <div>
            {footerLogoUrl && (
              <div className="w-16 h-16 mb-4 relative">
                <Image
                  src={footerLogoUrl}
                  alt="Store logo"
                  fill
                  className="object-contain"
                />
              </div>
            )}
            {footerDescription && (
              <p className="text-sm text-[#737373] mb-4">{footerDescription}</p>
            )}
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-medium text-[#171717] dark:text-[#fafafa] mb-4">معلومات التواصل</h3>
            {footerPhone && (
              <p className="text-sm text-[#737373] mb-2">
                Phone: {footerPhone}
              </p>
            )}
            {footerEmail && (
              <p className="text-sm text-[#737373]">
                Email: {footerEmail}
              </p>
            )}
          </div>

          {/* Copyright */}
          <div className="md:text-end">
            {footerCopyright && (
              <p className="text-sm text-[#737373]">{footerCopyright}</p>
            )}
            <p className="text-sm text-[#a3a3a3] mt-4">
              © {new Date().getFullYear()} {store?.name || "Store"}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
