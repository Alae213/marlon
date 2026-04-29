"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Package, Menu, X } from "lucide-react";
import { CartIcon } from "@/components/primitives/core/media/cart-icon";
import { useCart, CartProvider } from "@/contexts/cart-context";
import { useConvex, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CartSidebar } from "@/components/features/cart/cart-sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { containsArabicText } from "@/components/primitives/core/typography";
import { StoreBrowserBranding } from "@/components/pages/shared/store-browser-branding";
import {
  resolveHeroAlignment,
  resolveHeroCta,
  resolveHeroCtaColor,
  resolveHeroFocalX,
  resolveHeroFocalY,
  resolveHeroImage,
  resolveHeroTitle,
  resolveHeroTitleColor,
  resolveHeroZoom,
} from "@/lib/hero-content";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0,
  }).format(price);
};

interface NavbarContent {
  logoUrl?: string;
  background?: "dark" | "light" | "glass";
  textColor?: "dark" | "light";
  showCart?: boolean;
}

interface StorefrontProduct {
  _id: string;
  name: string;
  basePrice: number;
  images?: string[];
}

export default function StorefrontPage() {
  const params = useParams();
  const slug = params?.slug as string | undefined;

  return (
    <CartProvider storageKey={slug ? `cart:${slug}` : "cart"}>
      <StorefrontContent />
    </CartProvider>
  );
}

function StorefrontContent() {
  const params = useParams();
  const slug = params?.slug as string;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasOpenedCart, setHasOpenedCart] = useState(false);
  const { itemCount, isOpen, openCart, closeCart } = useCart();
  const convex = useConvex();

  const store = useQuery(api.stores.getStoreBySlug, slug ? { slug } : "skip");
  const [navbarContent, setNavbarContent] = useState<{ content?: unknown } | null>(null);
  const [heroContent, setHeroContent] = useState<{ content?: unknown } | null>(null);
  const [footerContent, setFooterContent] = useState<{ content?: unknown } | null>(null);
  const [productsData, setProductsData] = useState<StorefrontProduct[]>([]);
  const [hasLoadedProducts, setHasLoadedProducts] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadSnapshot() {
      if (!store?._id) return;
      const storeId = store._id as Id<"stores">;
      const [navbar, hero, footer, products] = await Promise.all([
        convex.query(api.siteContent.getSiteContentResolved, { storeId, section: "navbar" }),
        convex.query(api.siteContent.getSiteContentResolved, { storeId, section: "hero" }),
        convex.query(api.siteContent.getSiteContentResolved, { storeId, section: "footer" }),
        convex.query(api.products.getProducts, { storeId }),
      ]);
      if (cancelled) return;
      setNavbarContent(navbar);
      setHeroContent(hero);
      setFooterContent(footer);
      setProductsData((products ?? []) as StorefrontProduct[]);
      setHasLoadedProducts(true);
    }

    void loadSnapshot();
    return () => {
      cancelled = true;
    };
  }, [convex, store?._id]);

  const filteredProducts = useMemo(() => productsData, [productsData]);

  const currentNavbar = navbarContent?.content as NavbarContent | undefined;
  const navbarBg = currentNavbar?.background ?? "light";
  const navbarText =
    navbarBg === "dark"
      ? "light"
      : navbarBg === "light"
        ? "dark"
        : (currentNavbar?.textColor ?? "dark");
  const navbarLogoUrl = currentNavbar?.logoUrl;
  const showCart = currentNavbar?.showCart ?? true;
  const openCartWithInit = () => {
    setHasOpenedCart(true);
    openCart();
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleShopClick = () => {
    scrollToSection("products");
    setMobileMenuOpen(false);
  };

  const handleContactClick = () => {
    scrollToSection("contact");
    setMobileMenuOpen(false);
  };

  // Hero content
  const currentHero = heroContent?.content as { 
    title?: string; 
    ctaText?: string; 
    titleColor?: string;
    ctaColor?: string;
    alignment?: "left" | "center" | "right";
    backgroundImageUrl?: string;
    focalPointX?: number;
    focalPointY?: number;
    zoom?: number;
  } | undefined;
  // Sanitize user-provided content - React escapes by default, but we add extra protection
  // by stripping any HTML tags if strict mode is needed
  const sanitizeText = (text: string): string => {
    return text.replace(/<[^>]*>/g, "");
  };
  const heroTitle = sanitizeText(resolveHeroTitle(currentHero?.title));
  const heroCtaText = sanitizeText(resolveHeroCta(currentHero?.ctaText));
  const heroTitleColor = resolveHeroTitleColor(currentHero?.titleColor);
  const heroCtaColor = resolveHeroCtaColor(currentHero?.ctaColor);
  const heroAlignment = resolveHeroAlignment(currentHero?.alignment);
  const heroBgUrl = resolveHeroImage(currentHero?.backgroundImageUrl);
  const heroFocalX = resolveHeroFocalX(currentHero?.focalPointX);
  const heroFocalY = resolveHeroFocalY(currentHero?.focalPointY);
  const heroZoom = resolveHeroZoom(currentHero?.zoom);
  const heroTitleIsArabic = containsArabicText(heroTitle);

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

  const hasContactInfo = Boolean(footerPhone || footerEmail);

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
    <>
      <StoreBrowserBranding title={store?.name} iconUrl={navbarLogoUrl} />
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
            <button
              type="button"
              onClick={handleShopClick}
              className={`text-body-sm rounded-full px-3 py-2 ${navbarTextClass} transition-opacity hover:opacity-70`}
            >
              Shop
            </button>
            {hasContactInfo && (
              <button
                type="button"
                onClick={handleContactClick}
                className={`text-body-sm rounded-full px-3 py-2 ${navbarTextClass} transition-opacity hover:opacity-70`}
              >
                Contact
              </button>
            )}
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
                onClick={openCartWithInit}
                className={`relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ${cartClasses} ${navbarTextClass}`}
              >
                <CartIcon className="w-4 h-4" />
                {itemCount > 0 && (
                  <span className="text-caption absolute -top-1 -end-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--color-primary)] px-1 font-medium tabular-nums text-white">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={(open) => setMobileMenuOpen(open)}>
        <SheetContent side="right" showCloseButton={false} className="w-72 flex flex-col p-0">
          <SheetHeader className="flex items-center justify-between p-4 border-b border-[var(--sheet-surface-border)]">
            <SheetTitle className="text-title tracking-title-arabic" lang="ar">
              القائمة
            </SheetTitle>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 hover:bg-[var(--system-700)] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[var(--system-300)]" />
            </button>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <button
              type="button"
              onClick={handleShopClick}
              className="text-body block w-full rounded-lg bg-[var(--system-700)] p-3 text-left text-[var(--sheet-surface-fg)]"
            >
              Shop
            </button>
            {hasContactInfo && (
              <button
                type="button"
                onClick={handleContactClick}
                className="text-body block w-full rounded-lg bg-[var(--system-700)] p-3 text-left text-[var(--sheet-surface-fg)]"
              >
                Contact
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Hero Section */}
      <section
        className="relative mb-10 min-h-[88svh] overflow-hidden"
        style={{
          backgroundImage: `url(${heroBgUrl})`,
          backgroundSize: `${heroZoom * 100}%`,
          backgroundPosition: `${heroFocalX}% ${heroFocalY}%`,
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent" />
        <div
          className={`relative z-10 mx-auto flex min-h-[88svh] max-w-6xl flex-col justify-center gap-7 px-5 pt-28 pb-16 md:px-8 ${
            heroAlignment === "left"
              ? "items-start text-left"
              : heroAlignment === "right"
                ? "items-end text-right"
                : "items-center text-center"
          }`}
        >
          <div className="max-w-4xl space-y-7">
            <h1
              lang={heroTitleIsArabic ? "ar" : undefined}
              className="text-display whitespace-pre-line text-balance text-[var(--system-700)]"
              style={{ color: heroTitleColor }}
            >
              {heroTitle}
            </h1>
            <Button
              variant="primary"
              size="lg"
              className="w-fit rounded-full px-6 shadow-[0_20px_50px_rgba(23,48,82,0.18)]"
              style={{ backgroundColor: heroCtaColor, color: "#fff" }}
              onClick={() => {
                document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              {heroCtaText}
            </Button>
          </div>
        </div>
      </section>

      {/* Product Catalog Section */}
      <div id="products" className="max-w-6xl mx-auto  min-h-screen scroll-mt-28">
        <h2 className="text-title mb-6 text-[var(--system-700)]">Products</h2>
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
              <h3 className="text-title text-[var(--system-600)] line-clamp-2">
                {product.name}
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-body text-[var(--system-600)]">
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
          <p className="text-body text-[var(--system-400)]">No products available</p>
        </div>
      )}

      {showCart && hasOpenedCart && store?._id && (
        <CartSidebar 
          isOpen={isOpen} 
          onClose={closeCart}
          storeId={store?._id as string}
          storeSlug={slug}
          validProductIds={hasLoadedProducts ? productsData.map((product) => product._id) : undefined}
        />
      )}

      <footer id="contact" className="mt-16 p-8 pb-[180px]">
        {footerLogoUrl || footerDescription || footerPhone || footerEmail ? (
          <div className="flex flex-col justify-between w-full gap-10 md:flex-row max-w-6xl mx-auto">
            <div className="max-w-md">
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
                <p className="text-body text-[var(--system-400)]">{footerDescription}</p>
              )}
            </div>

            {(footerPhone || footerEmail) && (
              <div className="flex flex-col items-start gap-3">
                <p className="text-micro-label text-[var(--system-500)]">Contact</p>
                {footerPhone && (
                  <p className="text-body text-[var(--system-400)]">
                    Phone: {footerPhone}
                  </p>
                )}
                {footerEmail && (
                  <p className="text-body text-[var(--system-400)]">
                    Email: {footerEmail}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-6xl mx-auto text-body text-[var(--system-400)]">
            Powered by Marlon
          </div>
        )}
      </footer>
      </div>
    </>
  );
}
