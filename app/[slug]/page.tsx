"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Package, Menu, X } from "lucide-react";
import { CartIcon } from "@/components/primitives/core/media/cart-icon";
import { useCart, CartProvider } from "@/contexts/cart-context";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CartSidebar } from "@/components/features/cart/cart-sidebar";
import { Button } from "@/components/primitives/core/buttons/button";

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
  showCart?: boolean;
}

const DEFAULT_NAVBAR_LINKS: NavbarLink[] = [
  { id: "link-shop", text: "Shop", url: "#products", isDefault: true, enabled: true },
  { id: "link-faq", text: "FAQ", url: "/", isDefault: true, enabled: true },
  { id: "link-help", text: "Help", url: "/", isDefault: true, enabled: true },
];

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { itemCount, isOpen, openCart, closeCart } = useCart();

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

  const filteredProducts = productsData;

  const currentNavbar = navbarContent?.content as NavbarContent | undefined;
  const navbarBg = currentNavbar?.background ?? "light";
  const navbarText =
    navbarBg === "dark"
      ? "light"
      : navbarBg === "light"
        ? "dark"
        : (currentNavbar?.textColor ?? "dark");
  const navbarLogoUrl = currentNavbar?.logoUrl;
  const navbarLinks = DEFAULT_NAVBAR_LINKS;
  const showCart = currentNavbar?.showCart ?? true;

  // Hero content
  const currentHero = heroContent?.content as { 
    title?: string; 
    ctaText?: string; 
    ctaColor?: string;
    layout?: "left" | "center" | "right";
    backgroundImageUrl?: string;
  } | undefined;
  // Sanitize user-provided content - React escapes by default, but we add extra protection
  // by stripping any HTML tags if strict mode is needed
  const sanitizeText = (text: string): string => {
    return text.replace(/<[^>]*>/g, "");
  };
  const heroTitle = sanitizeText(currentHero?.title ?? "");
  const heroCtaText = sanitizeText(currentHero?.ctaText ?? "");
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
  const navbarSurfaceClass =
    navbarBg === "dark"
      ? "border-white/12 bg-[color:rgb(23_23_23_/_0.72)]"
      : "border-white/70 bg-[color:rgb(255_255_255_/_0.72)]";

  const navbarGlassStyle = {
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
  };

  const navbarTextClass = navbarText === "light" ? "text-white" : "text-[var(--system-700)]";
  const cartClasses =
    navbarBg === "dark"
      ? "bg-transparent hover:bg-white/10"
      : "bg-transparent hover:bg-black/5";

  return (
    <div className="w-full bg-[var(--system-50)]">
      {/* Navbar */}
      <div className="fixed inset-x-0 top-5 z-50 px-4">
        <div
          className={`mx-auto flex max-w-5xl items-center gap-4 rounded-2xl border px-4 py-3 shadow-[var(--shadow-lg)] ${navbarSurfaceClass}`}
          style={navbarGlassStyle}
        >
          <div className="flex min-w-0 flex-1 items-center">
            {navbarLogoUrl ? (
              <Image
                src={navbarLogoUrl}
                alt="logo"
                width={160}
                height={40}
                className="h-10 w-auto max-w-[170px] rounded-md object-contain"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:rgb(255_255_255_/_0.14)]">
                <Package className={`w-5 h-5 ${navbarTextClass}`} />
              </div>
            )}
          </div>

          <div className="hidden lg:flex flex-1 items-center justify-center gap-2">
            {navbarLinks.map((link, index) => (
              <a
                key={`desktop-${link.id || `link-${index}`}`}
                href={link.url}
                className={`rounded-full px-3 py-2 text-body-sm ${navbarTextClass} hover:opacity-70 transition-opacity`}
              >
                {link.text}
              </a>
            ))}
          </div>

          <div className="flex flex-1 items-center justify-end gap-2">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={`lg:hidden flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[color:rgb(255_255_255_/_0.08)] ${navbarTextClass}`}
            >
              <Menu className="w-5 h-5" />
            </button>

            {showCart && (
              <button
                onClick={openCart}
                className={`relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ${cartClasses} ${navbarTextClass}`}
              >
                <CartIcon className="w-4 h-4" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -end-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-medium text-white">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </button>
            )}
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
          <div className="fixed top-0 right-0 h-full w-72 bg-[--system-gray-6] shadow-xl z-50 lg:hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[--system-gray-4]">
              <h2 className="text-lg font-medium text-[--system-gray-900]">القائمة</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-[--system-gray-5] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {navbarLinks.map((link, index) => (
                <a
                  key={`mobile-${link.id || `link-${index}`}`}
                  href={link.url}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block p-3 rounded-lg bg-[--system-gray-5] text-[--system-gray-900]"
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

      {showCart && (
        <CartSidebar 
          isOpen={isOpen} 
          onClose={closeCart}
          storeId={store?._id as string}
          storeSlug={slug}
        />
      )}

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
            {navbarLinks.map((link, index) => (
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
