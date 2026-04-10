"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Search, Package, Menu, X } from "lucide-react";
import { CartIcon } from "@/components/core/cart-icon";
import { useCart, CartProvider } from "@/contexts/cart-context";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CartSidebar } from "@/components/cart-sidebar";
import { Button } from "@/components/core/button";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0,
  }).format(price);
};

// Types matching the backend
interface NavbarLink {
  id: string;
  text: string;
  url: string;
  isDefault: boolean;
  enabled: boolean;
}

interface NavbarContent {
  logoUrl?: string;
  background?: "dark" | "light" | "glass";
  textColor?: "dark" | "light";
  links?: NavbarLink[];
}

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const currentNavbar = navbarContent?.content as NavbarContent | undefined;
  const navbarBg = currentNavbar?.background ?? "light";
  const navbarText = currentNavbar?.textColor ?? "dark";
  const navbarLogoUrl = currentNavbar?.logoUrl;
  const navbarLinks = currentNavbar?.links ?? [];

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
      ? "bg-slate-950"
      : navbarBg === "glass"
        ? "bg-white/80"
        : "bg-white";

  const navbarGlassStyle = navbarBg === "glass" ? {
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
  } : {};

  const navbarTextClass = navbarText === "light" ? "text-white" : "text-foreground";

  return (
    <div className="w-full bg-[var(--system-50)]">
      {/* Navbar */}
      <div className={`fixed top-0 left-0 right-0 z-50 ${navbarBgClass}`} style={navbarGlassStyle}>
        <div className="flex items-center max-w-6xl mx-auto justify-between px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[var(--system-100)] overflow-hidden flex items-center justify-center flex-shrink-0">
              {navbarLogoUrl ? (
                <Image
                  src={navbarLogoUrl}
                  alt="logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-5 h-5 text-[var(--system-400)]" />
              )}
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-5">
            {navbarLinks.filter(link => link.enabled).map((link, index) => (
              <a
                key={`desktop-${link.id || `link-${index}`}`}
                href={link.url}
                className={`body-base ${navbarTextClass} hover:opacity-70 transition-opacity`}
              >
                {link.text}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className={`lg:hidden w-9 h-9 flex items-center justify-center ${navbarTextClass}`}
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Cart Button */}
            <button 
              onClick={openCart}
              className={`w-9 h-9 flex items-center justify-center relative ${navbarTextClass}`}
            >
              <CartIcon className="w-4 h-4" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -end-1 w-4 h-4 bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Drawer */}
          <div className="fixed top-0 right-0 h-full w-72 bg-background dark:bg-slate-950 shadow-xl z-50 lg:hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border dark:border-slate-800">
              <h2 className="text-lg font-medium text-foreground dark:text-background">القائمة</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {navbarLinks.filter(link => link.enabled).map((link, index) => (
                <a
                  key={`mobile-${link.id || `link-${index}`}`}
                  href={link.url}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-3 rounded-lg bg-muted dark:bg-slate-800 text-foreground dark:text-background"
                >
                  {link.text}
                </a>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Hero Section */}
      {heroTitle && (
        <div 
          className="relative overflow-hidden h-[calc(100vh-40px)] flex flex-col items-center justify-center mb-10"
          style={heroBgUrl ? { 
            backgroundImage: `url(${heroBgUrl})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center'
          } : {}}
        >
          {!heroBgUrl && (
            <div className="absolute inset-0 bg-[var(--system-100)]" />
          )}
          
          <div className={`max-w-6xl mx-auto relative z-10 text-center w-full ${
            heroLayout === "left" ? "text-start items-start": 
            heroLayout === "right" ? "text-end items-end": 
            "text-center items-center"
          } flex flex-col gap-6`}>
            <h1 className="display-5xl text-[var(--system-600)]">
              {heroTitle}
            </h1>
            {heroCtaText && (
              <Button 
                className="px-6 py-2 w-fit"
                style={{ backgroundColor: heroCtaColor }}
              >
                {heroCtaText}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Product Catalog Section */}
      <div className="max-w-6xl mx-auto  min-h-screen">
        <h2 className="headline-2xl mb-6">Products</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 ">
        {filteredProducts.map((product) => (
          <Link
            key={product._id}
            href={`/${slug}/product/${product._id}`}
            className="bg-[var(--system-50)] overflow-hidden flex flex-col gap-[16px] p-1 pb-4 rounded-[20px] hover:bg-black/2"
          >
            <div className="relative aspect-square bg-[var(--system-100)] rounded-[18px]">
              {product.images && product.images[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 25vw"
                  loading="lazy"
                  className="object-cover rounded-[18px]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-10 h-10 text-[var(--system-300)]" />
                </div>
              )}
            </div>
            <div className="px-[2px] flex flex-col gap-2">
              <h3 className="title-xl text-[var(--system-600)] line-clamp-2">
                {product.name}
              </h3>
              <div className="flex items-center justify-between">
                <span className="body-base text-[var(--system-600)]">
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
          <p className="body-base text-[var(--system-400)]">No products available</p>
        </div>
      )}

      <CartSidebar 
        isOpen={isOpen} 
        onClose={closeCart}
        storeId={store?._id as string}
        storeSlug={slug}
      />

      {/* Footer */}
      <footer className="mt-16 p-8 pb-[180px]">
        <div className="flex flex-col justify-between w-full md:flex-row max-w-6xl mx-auto">
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
              <p className="title-xl text-[var(--system-400)]">{heroTitle}</p>
            )}
          </div>

          {/* Links */}
          <div className="flex flex-col items-start gap-6">
            {navbarLinks.filter(link => link.enabled).map((link, index) => (
              <a
                key={`footer-${link.id || `link-${index}`}`}
                href={link.url}
                className="body-base text-[var(--system-400)] hover:text-[var(--system-600)] transition-colors"
              >
                {link.text}
              </a>
            ))}
          </div>


          {/* Contact Info */}
          <div className="flex flex-col items-start gap-6">
            {footerPhone && (
              <p className="body-base text-[var(--system-400)]">
                Phone: {footerPhone}
              </p>
            )}
            {footerEmail && (
              <p className="body-base text-[var(--system-400)]">
                Email: {footerEmail}
              </p>
            )}
          </div>
          
        </div>
      </footer>
    </div>
  );
}
