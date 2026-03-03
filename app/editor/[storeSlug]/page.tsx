"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, Grid3X3, List, Image as ImageIcon, Edit, Archive, Eye, EyeOff, Trash2, Loader2, Settings, Package, ShoppingCart, ArrowLeft, Home, Upload, Palette, Type, ExternalLink } from "lucide-react";
import { Button } from "@/components/core/button";
import { Card } from "@/components/core/card";
import { EmptyState } from "@/components/core/empty-state";
import { Modal } from "@/components/core/modal";
import { Input } from "@/components/core/input";
import { Textarea } from "@/components/core/textarea";
import { ImageUploader } from "@/components/image-cropper";
import { ImageCropper } from "@/components/image-cropper";
import { InlineVariantEditor } from "@/components/inline-variant-editor";
import { RealtimeProvider, useRealtime } from "@/contexts/realtime-context";
import { useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";

const ALGERIAN_WILAYAS = [
  "أدرار", "الشلف", "الأغواط", "أم البواقي", "باتنة", "بجاية", "بسكرة", "بشار", "البليدة", "البويرة",
  "تمنراست", "تبسة", "تلمسان", "تيارت", "وهران", "سعيدة", "سكيكدة", "سطيف", "سيدي بلعباس", "عنابة",
  "قسنطينة", "المدية", "مستغانم", "المسيلة", "معسكر", "ورقلة", "وادي رهيو", "بسكرة", "خنشلة", "سوق أهراس",
  "تيبازة", "ميلة", "عين الدفلى", "النعامة", "عين تموشنت", "غرداية", "غليزان", "تيسمسيلت", "الوادي", "مشرع",
  "برج بوعريريج", "بومرداس", "الطارف", "تندوف", "تيندوف", "جانجا", "المكان", "أولاد جلال", "بشار", "برج باجي مختار",
  "عين صالح", "عين قزام", "تقرت", "جانت", "المريكة"
];

const DEFAULT_DELIVERY_PRICES: Record<string, { home: number; office: number }> = {
  "أدرار": { home: 700, office: 500 },
  "الجزائر": { home: 0, office: 0 },
  "وهران": { home: 500, office: 350 },
  "قسنطينة": { home: 500, office: 350 },
  "عنابة": { home: 500, office: 350 },
};

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

function ProductsContent({ storeId, storeSlug }: { storeId: string; storeSlug: string }) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNavbarHovered, setIsNavbarHovered] = useState(false);
  const [logoCropSrc, setLogoCropSrc] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  // Inline editing states
  const [editingField, setEditingField] = useState<{ productId: string; field: "name" | "basePrice" | "oldPrice" | "heroTitle" | "heroCtaText" | "footerPhone" | "footerEmail" | "footerCopyright" } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const products = useQuery(
    api.products.getProducts,
    storeId ? { storeId: storeId as Id<"stores"> } : "skip"
  );

  const createProduct = useMutation(api.products.createProduct);
  const updateProduct = useMutation(api.products.updateProduct);
  const archiveProduct = useMutation(api.products.archiveProduct);
  const unarchiveProduct = useMutation(api.products.unarchiveProduct);

  const navbarContent = useQuery(
    api.siteContent.getSiteContentResolved,
    storeId ? { storeId: storeId as Id<"stores">, section: "navbar" } : "skip"
  );

  const heroContent = useQuery(
    api.siteContent.getSiteContentResolved,
    storeId ? { storeId: storeId as Id<"stores">, section: "hero" } : "skip"
  );

  const footerContent = useQuery(
    api.siteContent.getSiteContentResolved,
    storeId ? { storeId: storeId as Id<"stores">, section: "footer" } : "skip"
  );

  const deliveryPricing = useQuery(
    api.siteContent.getDeliveryPricing,
    storeId ? { storeId: storeId as Id<"stores"> } : "skip"
  );

  const deliveryIntegration = useQuery(
    api.siteContent.getDeliveryIntegration,
    storeId ? { storeId: storeId as Id<"stores"> } : "skip"
  );

  const setNavbarStyles = useMutation(api.siteContent.setNavbarStyles);
  const setHeroStyles = useMutation(api.siteContent.setHeroStyles);
  const setFooterStyles = useMutation(api.siteContent.setFooterStyles);
  const setDeliveryPricing = useMutation(api.siteContent.setDeliveryPricing);
  const setDeliveryIntegration = useMutation(api.siteContent.setDeliveryIntegration);
  const testDeliveryConnection = useAction(api.siteContent.testDeliveryConnection);
  const generateUploadUrl = useMutation(api.siteContent.generateUploadUrl);
  const setLogoAndSyncFooter = useMutation(api.siteContent.setLogoAndSyncFooter);

  const isLoading = !products;

  // Show all products (including archived) - filter out archived for display
  const activeProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => !p.isArchived);
  }, [products]);

  // Inline editing handlers
  const startEditing = (productId: string, field: "name" | "basePrice" | "oldPrice", currentValue: string | number) => {
    setEditingField({ productId, field });
    setEditValue(String(currentValue));
  };

  const saveInlineEdit = async () => {
    if (!editingField) return;
    
    setIsSaving(true);
    try {
      const product = products?.find(p => p._id === editingField.productId);
      if (!product) return;

      const updates: any = { productId: editingField.productId as Id<"products"> };
      
      if (editingField.field === "name") {
        updates.name = editValue;
      } else if (editingField.field === "basePrice") {
        updates.basePrice = parseInt(editValue) || 0;
      } else if (editingField.field === "oldPrice") {
        updates.oldPrice = editValue ? parseInt(editValue) : undefined;
      }

      await updateProduct(updates);
      setEditingField(null);
      setEditValue("");
    } catch (error) {
      console.error("Failed to update:", error);
    }
    setIsSaving(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveInlineEdit();
    } else if (e.key === "Escape") {
      setEditingField(null);
      setEditValue("");
    }
  };

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

  const handleDeleteProduct = async (productId: string) => {
    try {
      // Use archive for soft delete
      await archiveProduct({ productId: productId as Id<"products"> });
      setDeletingProductId(null);
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  const uploadToConvexStorage = async (dataUrl: string) => {
    const uploadUrl = await generateUploadUrl({});
    const blob = await (await fetch(dataUrl)).blob();
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": blob.type || "image/jpeg" },
      body: blob,
    });
    if (!res.ok) throw new Error("Upload failed");
    const json = await res.json();
    return json.storageId as string;
  };

  const handleSelectLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => setLogoCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleApplyLogoCrop = async (croppedDataUrl: string) => {
    setIsUploadingLogo(true);
    try {
      const storageId = await uploadToConvexStorage(croppedDataUrl);
      await setLogoAndSyncFooter({
        storeId: storeId as Id<"stores">,
        logoStorageId: storageId,
      });
      setLogoCropSrc(null);
    } catch (error) {
      console.error("Failed to upload logo:", error);
    }
    setIsUploadingLogo(false);
  };

  const currentNavbar: any = navbarContent?.content;
  const navbarBg = currentNavbar?.background ?? "light";
  const navbarText = currentNavbar?.textColor ?? "dark";
  const navbarLogoUrl = currentNavbar?.logoUrl;

  const navbarBgClass =
    navbarBg === "dark"
      ? "bg-[#0a0a0a]"
      : navbarBg === "transparent"
        ? "bg-transparent"
        : "bg-white";

  const navbarTextClass = navbarText === "light" ? "text-white" : "text-[#171717]";

  const handleSetNavbarStyle = async (next: { background?: "dark" | "light" | "transparent"; textColor?: "dark" | "light" }) => {
    try {
      await setNavbarStyles({
        storeId: storeId as Id<"stores">,
        background: next.background,
        textColor: next.textColor,
      });
    } catch (error) {
      console.error("Failed to update navbar style:", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with Logo, Back Button, and User Profile */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#e5e5e5] dark:border-[#262626]">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-[#f5f5f5] dark:hover:bg-[#171717] rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#525252] dark:text-[#d4d4d4]" />
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#171717] dark:bg-[#fafafa] rounded-full flex items-center justify-center">
              <Home className="w-4 h-4 text-white dark:text-[#171717]" />
            </div>
            <span className="font-medium text-[#171717] dark:text-[#fafafa]">متجري</span>
          </Link>
        </div>
        <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
      </div>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-normal text-[#171717] dark:text-[#fafafa]">المنتجات</h1>
        <div className="flex items-center gap-3">
          <a
            href={`/${storeSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 font-medium transition-all h-10 px-4 text-sm border border-[#e5e5e5] dark:border-[#404040] text-[#171717] dark:text-[#fafafa] hover:bg-[#f5f5f5] dark:hover:bg-[#171717]"
          >
            <ExternalLink className="w-4 h-4" />
            معاينة
          </a>
          <Button 
            variant="outline" 
            onClick={() => setIsSettingsOpen(true)}
            aria-label="فتح الإعدادات"
          >
            <Settings className="w-4 h-4" />
            الإعدادات
          </Button>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            aria-label="إضافة منتج جديد"
          >
            <Plus className="w-4 h-4" />
            إضافة منتج
          </Button>
        </div>
      </div>

      <Card className="mb-6" padding="none">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">شريط التنقل (Navbar)</h2>
            <div className="text-xs text-[#737373]">المعاينة + التحرير</div>
          </div>

          <div
            className={`relative border border-[#e5e5e5] dark:border-[#262626] overflow-hidden ${navbarBgClass}`}
            onMouseEnter={() => setIsNavbarHovered(true)}
            onMouseLeave={() => setIsNavbarHovered(false)}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#f5f5f5] dark:bg-[#171717] overflow-hidden flex items-center justify-center flex-shrink-0">
                  {navbarLogoUrl ? (
                    <img src={navbarLogoUrl} alt="logo" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-5 h-5 text-[#a3a3a3]" />
                  )}
                </div>
                <div className={`font-medium truncate ${navbarTextClass}`}>متجرك</div>
              </div>

              <div className="hidden sm:flex items-center gap-5">
                <span className={`text-sm ${navbarTextClass}`}>المتجر</span>
                <span className={`text-sm ${navbarTextClass}`}>الأسئلة</span>
                <span className={`text-sm ${navbarTextClass}`}>مساعدة</span>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  className={`w-9 h-9 flex items-center justify-center border border-[#e5e5e5] dark:border-[#262626] ${navbarTextClass}`}
                  aria-label="السلة"
                >
                  <ShoppingCart className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isNavbarHovered && (
              <div className="absolute top-2 end-2 flex items-center gap-2 bg-white/90 dark:bg-[#0a0a0a]/90 border border-[#e5e5e5] dark:border-[#262626] px-2 py-1.5 rounded-lg">
                <div className="flex items-center gap-1">
                  <Palette className="w-4 h-4 text-[#737373]" />
                  <button
                    onClick={() => handleSetNavbarStyle({ background: "light" })}
                    className={`px-2 py-1 text-xs border ${navbarBg === "light" ? "border-[#171717]" : "border-[#e5e5e5]"}`}
                  >
                    فاتح
                  </button>
                  <button
                    onClick={() => handleSetNavbarStyle({ background: "dark" })}
                    className={`px-2 py-1 text-xs border ${navbarBg === "dark" ? "border-[#171717]" : "border-[#e5e5e5]"}`}
                  >
                    داكن
                  </button>
                  <button
                    onClick={() => handleSetNavbarStyle({ background: "transparent" })}
                    className={`px-2 py-1 text-xs border ${navbarBg === "transparent" ? "border-[#171717]" : "border-[#e5e5e5]"}`}
                  >
                    شفاف
                  </button>
                </div>

                <div className="w-px h-6 bg-[#e5e5e5] dark:bg-[#262626]" />

                <div className="flex items-center gap-1">
                  <Type className="w-4 h-4 text-[#737373]" />
                  <button
                    onClick={() => handleSetNavbarStyle({ textColor: "dark" })}
                    className={`px-2 py-1 text-xs border ${navbarText === "dark" ? "border-[#171717]" : "border-[#e5e5e5]"}`}
                  >
                    نص داكن
                  </button>
                  <button
                    onClick={() => handleSetNavbarStyle({ textColor: "light" })}
                    className={`px-2 py-1 text-xs border ${navbarText === "light" ? "border-[#171717]" : "border-[#e5e5e5]"}`}
                  >
                    نص فاتح
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-xs text-[#737373]">رفع شعار (يتم مزامنته تلقائياً مع الفوتر)</div>
            <div className="flex items-center gap-2">
              <input
                id="navbar-logo-upload"
                type="file"
                accept="image/*"
                onChange={handleSelectLogoFile}
                className="hidden"
              />
              <Button variant="outline" disabled={isUploadingLogo} onClick={() => document.getElementById("navbar-logo-upload")?.click()}>
                <Upload className="w-4 h-4" />
                {isUploadingLogo ? "جاري الرفع..." : "رفع الشعار"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Hero Section Editor */}
      <Card className="mb-6" padding="none">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">قسم الرئيسية (Hero)</h2>
            <div className="text-xs text-[#737373]">المعاينة + التحرير</div>
          </div>

          {(() => {
            const currentHero: any = heroContent?.content;
            const heroTitle = currentHero?.title ?? "متجرنا الإلكتروني";
            const heroCtaText = currentHero?.ctaText ?? "تسوق الآن";
            const heroCtaColor = currentHero?.ctaColor ?? "#171717";
            const heroLayout = currentHero?.layout ?? "center";
            const heroBgUrl = currentHero?.backgroundImageUrl;

            return (
              <div
                className="relative border border-[#e5e5e5] dark:border-[#262626] overflow-hidden min-h-[200px] flex flex-col items-center justify-center p-8"
                style={heroBgUrl ? { backgroundImage: `url(${heroBgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
              >
                {!heroBgUrl && (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#f5f5f5] to-[#e5e5e5] dark:from-[#171717] dark:to-[#262626]" />
                )}

                <div className={`relative z-10 text-center w-full ${heroLayout === "left" ? "text-start items-start" : heroLayout === "right" ? "text-end items-end" : "text-center items-center"} flex flex-col`}>
                  {/* Hero Title - Inline Edit */}
                  {editingField?.field === "heroTitle" ? (
                    <input
                      autoFocus
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={async () => {
                        if (editValue.trim()) {
                          await setHeroStyles({ storeId: storeId as Id<"stores">, title: editValue.trim() });
                        }
                        setEditingField(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (editValue.trim()) {
                            setHeroStyles({ storeId: storeId as Id<"stores">, title: editValue.trim() });
                          }
                          setEditingField(null);
                        } else if (e.key === "Escape") {
                          setEditingField(null);
                        }
                      }}
                      className="text-3xl font-bold text-[#171717] dark:text-[#fafafa] bg-transparent border-b-2 border-[#171717] dark:border-[#fafafa] focus:outline-none text-center"
                      placeholder="عنوان الصفحة"
                    />
                  ) : (
                    <h1 
                      className="text-3xl font-bold text-[#171717] dark:text-[#fafafa] mb-4 cursor-pointer hover:text-[#525252] dark:hover:text-[#d4d4d4]"
                      onClick={() => {
                        setEditingField({ productId: "", field: "heroTitle" });
                        setEditValue(heroTitle);
                      }}
                    >
                      {heroTitle}
                    </h1>
                  )}

                  {/* Hero CTA Button - Inline Edit */}
                  {editingField?.field === "heroCtaText" ? (
                    <input
                      autoFocus
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={async () => {
                        if (editValue.trim()) {
                          await setHeroStyles({ storeId: storeId as Id<"stores">, ctaText: editValue.trim() });
                        }
                        setEditingField(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (editValue.trim()) {
                            setHeroStyles({ storeId: storeId as Id<"stores">, ctaText: editValue.trim() });
                          }
                          setEditingField(null);
                        } else if (e.key === "Escape") {
                          setEditingField(null);
                        }
                      }}
                      className="px-6 py-3 text-white font-medium bg-transparent border-b-2 focus:outline-none"
                      style={{ backgroundColor: heroCtaColor }}
                      placeholder="نص الزر"
                    />
                  ) : (
                    <button 
                      className="px-6 py-3 text-white font-medium cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: heroCtaColor }}
                      onClick={() => {
                        setEditingField({ productId: "", field: "heroCtaText" });
                        setEditValue(heroCtaText);
                      }}
                    >
                      {heroCtaText}
                    </button>
                  )}
                </div>

                {/* Layout Toggle - Show on hover */}
                <div className="absolute top-2 end-2 flex items-center gap-2 bg-white/90 dark:bg-[#0a0a0a]/90 border border-[#e5e5e5] dark:border-[#262626] px-2 py-1.5 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-xs text-[#737373]">الموقع:</span>
                  <button
                    onClick={() => setHeroStyles({ storeId: storeId as Id<"stores">, layout: "left" })}
                    className={`px-2 py-1 text-xs border ${heroLayout === "left" ? "border-[#171717]" : "border-[#e5e5e5]"}`}
                  >
                    يسار
                  </button>
                  <button
                    onClick={() => setHeroStyles({ storeId: storeId as Id<"stores">, layout: "center" })}
                    className={`px-2 py-1 text-xs border ${heroLayout === "center" ? "border-[#171717]" : "border-[#e5e5e5]"}`}
                  >
                    وسط
                  </button>
                  <button
                    onClick={() => setHeroStyles({ storeId: storeId as Id<"stores">, layout: "right" })}
                    className={`px-2 py-1 text-xs border ${heroLayout === "right" ? "border-[#171717]" : "border-[#e5e5e5]"}`}
                  >
                    يمين
                  </button>
                </div>
              </div>
            );
          })()}

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-xs text-[#737373]">تغيير صورة الخلفية</div>
            <div className="flex items-center gap-2">
              <input
                id="hero-bg-upload"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file || !file.type.startsWith("image/")) return;
                  const reader = new FileReader();
                  reader.onload = async () => {
                    try {
                      const storageId = await uploadToConvexStorage(reader.result as string);
                      await setHeroStyles({ storeId: storeId as Id<"stores">, backgroundImageStorageId: storageId });
                    } catch (error) {
                      console.error("Failed to upload hero background:", error);
                    }
                  };
                  reader.readAsDataURL(file);
                }}
                className="hidden"
              />
              <Button variant="outline" onClick={() => document.getElementById("hero-bg-upload")?.click()}>
                <Upload className="w-4 h-4" />
                رفع صورة
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Footer Section Editor */}
      <Card className="mb-6" padding="none">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">قسم الفوتر (Footer)</h2>
            <div className="text-xs text-[#737373]">المعاينة + التحرير</div>
          </div>

          {(() => {
            const currentFooter: any = footerContent?.content;
            const footerLogoUrl = navbarContent?.content?.logoUrl;
            const contactPhone = currentFooter?.contactPhone ?? "";
            const contactEmail = currentFooter?.contactEmail ?? "";
            const copyright = currentFooter?.copyright ?? "جميع الحقوق محفوظة";
            const socialLinks = currentFooter?.socialLinks ?? [];

            return (
              <div className="border border-[#e5e5e5] dark:border-[#262626] bg-[#f5f5f5] dark:bg-[#171717] p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Logo Section */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white dark:bg-[#0a0a0a] overflow-hidden flex items-center justify-center flex-shrink-0">
                      {footerLogoUrl ? (
                        <img src={footerLogoUrl} alt="logo" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-5 h-5 text-[#a3a3a3]" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">متجرك</div>
                      <div className="text-xs text-[#737373]">الشعار مُزامَن من Navbar</div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-[#171717] dark:text-[#fafafa] mb-2">معلومات التواصل</div>
                    
                    {/* Phone - Inline Edit */}
                    {editingField?.field === "footerPhone" ? (
                      <input
                        autoFocus
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={async () => {
                          await setFooterStyles({ storeId: storeId as Id<"stores">, contactPhone: editValue });
                          setEditingField(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setFooterStyles({ storeId: storeId as Id<"stores">, contactPhone: editValue });
                            setEditingField(null);
                          } else if (e.key === "Escape") {
                            setEditingField(null);
                          }
                        }}
                        className="w-full px-2 py-1 text-sm border border-[#171717] dark:border-[#fafafa] bg-white dark:bg-[#0a0a0a] focus:outline-none"
                        placeholder="رقم الهاتف"
                      />
                    ) : (
                      <div 
                        className="flex items-center gap-2 text-sm text-[#525252] dark:text-[#d4d4d4] cursor-pointer hover:text-[#171717] dark:hover:text-[#fafafa]"
                        onClick={() => {
                          setEditingField({ productId: "", field: "footerPhone" });
                          setEditValue(contactPhone);
                        }}
                      >
                        <span className="text-[#737373]">📱</span>
                        <span>{contactPhone || "أضف رقم الهاتف"}</span>
                      </div>
                    )}

                    {/* Email - Inline Edit */}
                    {editingField?.field === "footerEmail" ? (
                      <input
                        autoFocus
                        type="email"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={async () => {
                          await setFooterStyles({ storeId: storeId as Id<"stores">, contactEmail: editValue });
                          setEditingField(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setFooterStyles({ storeId: storeId as Id<"stores">, contactEmail: editValue });
                            setEditingField(null);
                          } else if (e.key === "Escape") {
                            setEditingField(null);
                          }
                        }}
                        className="w-full px-2 py-1 text-sm border border-[#171717] dark:border-[#fafafa] bg-white dark:bg-[#0a0a0a] focus:outline-none"
                        placeholder="البريد الإلكتروني"
                      />
                    ) : (
                      <div 
                        className="flex items-center gap-2 text-sm text-[#525252] dark:text-[#d4d4d4] cursor-pointer hover:text-[#171717] dark:hover:text-[#fafafa]"
                        onClick={() => {
                          setEditingField({ productId: "", field: "footerEmail" });
                          setEditValue(contactEmail);
                        }}
                      >
                        <span className="text-[#737373]">✉️</span>
                        <span>{contactEmail || "أضف البريد الإلكتروني"}</span>
                      </div>
                    )}
                  </div>

                  {/* Copyright */}
                  <div className="flex items-center">
                    {editingField?.field === "footerCopyright" ? (
                      <input
                        autoFocus
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={async () => {
                          await setFooterStyles({ storeId: storeId as Id<"stores">, copyright: editValue });
                          setEditingField(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setFooterStyles({ storeId: storeId as Id<"stores">, copyright: editValue });
                            setEditingField(null);
                          } else if (e.key === "Escape") {
                            setEditingField(null);
                          }
                        }}
                        className="w-full px-2 py-1 text-sm border border-[#171717] dark:border-[#fafafa] bg-white dark:bg-[#0a0a0a] focus:outline-none"
                        placeholder="نص الحقوق"
                      />
                    ) : (
                      <div 
                        className="text-sm text-[#737373] cursor-pointer hover:text-[#525252] dark:hover:text-[#d4d4d4]"
                        onClick={() => {
                          setEditingField({ productId: "", field: "footerCopyright" });
                          setEditValue(copyright);
                        }}
                      >
                        © {copyright}
                      </div>
                    )}
                  </div>
                </div>

                {/* Social Links Row */}
                <div className="mt-6 pt-4 border-t border-[#e5e5e5] dark:border-[#262626]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#737373]">روابط التواصل الاجتماعي</span>
                    <div className="flex items-center gap-2">
                      {["facebook", "instagram", "twitter", "whatsapp"].map((platform) => {
                        const link = socialLinks.find((l: any) => l.platform === platform);
                        return (
                          <button
                            key={platform}
                            className={`w-8 h-8 flex items-center justify-center border ${link?.enabled ? "border-[#171717] dark:border-[#fafafa]" : "border-[#e5e5e5] dark:border-[#262626]"}`}
                            onClick={async () => {
                              const newLinks = link?.enabled 
                                ? socialLinks.filter((l: any) => l.platform !== platform)
                                : [...socialLinks.filter((l: any) => l.platform !== platform), { platform, url: "", enabled: true }];
                              await setFooterStyles({ storeId: storeId as Id<"stores">, socialLinks: newLinks });
                            }}
                            title={platform}
                          >
                            {platform === "facebook" && "f"}
                            {platform === "instagram" && "ig"}
                            {platform === "twitter" && "x"}
                            {platform === "whatsapp" && "wa"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </Card>

      <Card padding="none">
        {activeProducts.length === 0 ? (
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
            {activeProducts.map((product) => (
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
                  {/* Product Name - Inline Edit */}
                  {editingField?.productId === product._id && editingField?.field === "name" ? (
                    <input
                      autoFocus
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={saveInlineEdit}
                      onKeyDown={handleKeyDown}
                      className="w-full font-normal text-[#171717] dark:text-[#fafafa] mb-2 px-1 py-0.5 border border-[#171717] dark:border-[#fafafa] bg-white dark:bg-[#0a0a0a] focus:outline-none"
                    />
                  ) : (
                    <h3 
                      className="font-normal text-[#171717] dark:text-[#fafafa] mb-2 line-clamp-2 cursor-pointer hover:text-[#525252] dark:hover:text-[#d4d4d4]"
                      onClick={() => startEditing(product._id, "name", product.name)}
                    >
                      {product.name}
                    </h3>
                  )}
                  
                  <div className="flex items-center gap-2">
                    {/* Base Price - Inline Edit */}
                    {editingField?.productId === product._id && editingField?.field === "basePrice" ? (
                      <input
                        autoFocus
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveInlineEdit}
                        onKeyDown={handleKeyDown}
                        className="font-medium text-[#171717] dark:text-[#fafafa] px-1 py-0.5 w-24 border border-[#171717] dark:border-[#fafafa] bg-white dark:bg-[#0a0a0a] focus:outline-none"
                      />
                    ) : (
                      <span 
                        className="font-medium text-[#171717] dark:text-[#fafafa] cursor-pointer hover:text-[#525252] dark:hover:text-[#d4d4d4]"
                        onClick={() => startEditing(product._id, "basePrice", product.basePrice)}
                      >
                        {formatPrice(product.basePrice)}
                      </span>
                    )}
                    
                    {/* Old Price - Inline Edit */}
                    {product.oldPrice && (
                      editingField?.productId === product._id && editingField?.field === "oldPrice" ? (
                        <input
                          autoFocus
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveInlineEdit}
                          onKeyDown={handleKeyDown}
                          className="text-sm text-[#a3a3a3] line-through px-1 py-0.5 w-24 border border-[#a3a3a3] bg-white dark:bg-[#0a0a0a] focus:outline-none"
                          placeholder="السعر القديم"
                        />
                      ) : (
                        <span 
                          className="text-sm text-[#a3a3a3] line-through cursor-pointer hover:text-[#737373]"
                          onClick={() => startEditing(product._id, "oldPrice", product.oldPrice || "")}
                        >
                          {formatPrice(product.oldPrice)}
                        </span>
                      )
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
            
            {/* Add Product Button - Same size as product card */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="aspect-[1/1.3] bg-white dark:bg-[#0a0a0a] border border-dashed border-[#d4d4d4] dark:border-[#404040] hover:border-[#171717] dark:hover:border-[#fafafa] transition-all duration-200 flex flex-col items-center justify-center gap-2"
            >
              <Plus className="w-8 h-8 text-[#d4d4d4] dark:text-[#525252]" />
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#e5e5e5] dark:divide-[#262626]">
            {activeProducts.map((product) => (
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

      {logoCropSrc && (
        <ImageCropper
          imageSrc={logoCropSrc}
          aspectRatio={1}
          onCancel={() => setLogoCropSrc(null)}
          onCropComplete={handleApplyLogoCrop}
        />
      )}

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

      <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} storeId={storeId} storeSlug={storeSlug} />

      {/* Fixed Bottom Navigation - 200px centered */}
      <div className="fixed bottom-4 start-1/2 -translate-x-1/2 bg-white dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] rounded-full px-6 py-2 flex justify-around items-center z-40 shadow-lg w-[200px]">
        <button
          onClick={() => router.push(`/editor/${storeSlug}`)}
          className="flex flex-col items-center gap-1 text-[#171717] dark:text-[#fafafa]"
        >
          <Package className="w-5 h-5" />
          <span className="text-xs">المنتجات</span>
        </button>
        <button
          onClick={() => router.push(`/orders/${storeSlug}`)}
          className="flex flex-col items-center gap-1 text-[#a3a3a3] dark:text-[#525252] hover:text-[#171717] dark:hover:text-[#fafafa]"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-xs">الطلبات</span>
        </button>
      </div>
      
      {/* Add padding bottom to avoid content being hidden behind fixed nav */}
      <div className="h-20"></div>
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
      ...(product?._id ? { productId: product._id } : {}),
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

function SettingsDialog({ isOpen, onClose, storeId, storeSlug }: { isOpen: boolean; onClose: () => void; storeId: string; storeSlug: string }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState("delivery");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-[#e5e5e5] dark:border-[#262626]">
          <h2 className="text-lg font-medium">إعدادات المتجر</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#f5f5f5] dark:hover:bg-[#171717]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex border-b border-[#e5e5e5] dark:border-[#262626]">
          <button
            onClick={() => setActiveTab("delivery")}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === "delivery"
                ? "border-b-2 border-[#171717] dark:border-[#fafafa] text-[#171717] dark:text-[#fafafa]"
                : "text-[#737373]"
            }`}
          >
            أسعار التوصيل
          </button>
          <button
            onClick={() => setActiveTab("integration")}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === "integration"
                ? "border-b-2 border-[#171717] dark:border-[#fafafa] text-[#171717] dark:text-[#fafafa]"
                : "text-[#737373]"
            }`}
          >
            شركات التوصيل
          </button>
          <button
            onClick={() => setActiveTab("store")}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === "store"
                ? "border-b-2 border-[#171717] dark:border-[#fafafa] text-[#171717] dark:text-[#fafafa]"
                : "text-[#737373]"
            }`}
          >
            معلومات المتجر
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === "delivery" && (
            <DeliveryPricingSettings storeId={storeId} />
          )}
          {activeTab === "integration" && (
            <DeliveryIntegrationSettings storeId={storeId} />
          )}
          {activeTab === "store" && (
            <StoreInfoSettings storeId={storeId} storeSlug={storeSlug} />
          )}
        </div>
      </div>
    </div>
  );
}

function DeliveryPricingSettings({ storeId }: { storeId: string }) {
  const deliveryPricing = useQuery(
    api.siteContent.getDeliveryPricing,
    storeId ? { storeId: storeId as Id<"stores"> } : "skip"
  );
  const setDeliveryPricing = useMutation(api.siteContent.setDeliveryPricing);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  const wilayas = [
    "أدرار", "الشلف", "الأغواط", "أم البواقي", "باتنة", "بجاية", "بسكرة", "بشار", "البليدة", "البويرة",
    "تمنراست", "تبسة", "تلمسان", "تيارت", "وهران", "سعيدة", "سكيكدة", "سطيف", "سيدي بلعباس", "عنابة",
    "قسنطينة", "المدية", "مستغانم", "المسيلة", "معسكر", "ورقلة", "وادي رهيو", "خنشلة", "سوق أهراس", "تيبازة",
    "ميلة", "عين الدفلى", "النعامة", "عين تموشنت", "غرداية", "غليزان", "تيسمسيلت", "الوادي", "مشرع", "برج بوعريريج",
    "بومرداس", "الطارف", "تندوف", "تيندوف", "جانجا", "المكان", "أولاد جلال", "برج باجي مختار", "عين صالح", "عين قزام",
    "تقرت", "جانت", "المريكة"
  ];

  const handleSave = async (wilaya: string, field: "homeDelivery" | "officeDelivery", value: number) => {
    try {
      await setDeliveryPricing({
        storeId: storeId as Id<"stores">,
        wilaya,
        [field]: value,
      });
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2000);
    } catch (error) {
      console.error("Failed to save pricing:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-[#171717] dark:text-[#fafafa]">أسعار التوصيل لكل ولاية</h3>
        {savedMessage && (
          <span className="text-sm text-green-600">✓ تم الحفظ</span>
        )}
      </div>

      <div className="border border-[#e5e5e5] dark:border-[#262626] rounded-lg overflow-hidden">
        <div className="grid grid-cols-3 gap-4 bg-[#f5f5f5] dark:bg-[#171717] p-3 text-sm font-medium text-[#525252] dark:text-[#d4d4d4]">
          <span>الولاية</span>
          <span className="text-center">توصيل للمنزل (د.ج)</span>
          <span className="text-center">توصيل للمكتب (د.ج)</span>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {wilayas.map((wilaya) => {
            const pricing = deliveryPricing?.find(p => p.wilaya === wilaya);
            const homePrice = pricing?.homeDelivery ?? 600;
            const officePrice = pricing?.officeDelivery ?? 400;

            return (
              <div key={wilaya} className="grid grid-cols-3 gap-4 p-3 border-t border-[#e5e5e5] dark:border-[#262626] items-center">
                <span className="text-sm text-[#171717] dark:text-[#fafafa]">{wilaya}</span>
                <input
                  type="number"
                  defaultValue={homePrice}
                  onBlur={(e) => handleSave(wilaya, "homeDelivery", parseInt(e.target.value) || 0)}
                  className="h-8 px-2 text-center text-sm border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#fafafa] rounded focus:outline-none focus:border-[#171717] dark:focus:border-[#fafafa]"
                  placeholder="0"
                />
                <input
                  type="number"
                  defaultValue={officePrice}
                  onBlur={(e) => handleSave(wilaya, "officeDelivery", parseInt(e.target.value) || 0)}
                  className="h-8 px-2 text-center text-sm border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#fafafa] rounded focus:outline-none focus:border-[#171717] dark:focus:border-[#fafafa]"
                  placeholder="0"
                />
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-[#737373]">
        * الأسعار الافتراضية: توصيل للمنزل 600 د.ج | توصيل للمكتب 400 د.ج
      </p>
    </div>
  );
}

function DeliveryIntegrationSettings({ storeId }: { storeId: string }) {
  const deliveryIntegration = useQuery(
    api.siteContent.getDeliveryIntegration,
    storeId ? { storeId: storeId as Id<"stores"> } : "skip"
  );
  const setDeliveryIntegration = useMutation(api.siteContent.setDeliveryIntegration);
  const testDeliveryConnection = useAction(api.siteContent.testDeliveryConnection);

  const [provider, setProvider] = useState<"none" | "zr-express" | "yalidine">("none");
  const [apiKey, setApiKey] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    if (deliveryIntegration) {
      setProvider((deliveryIntegration.provider as any) || "none");
      setApiKey(deliveryIntegration.apiKey || "");
      setApiToken(deliveryIntegration.apiToken || "");
    }
  }, [deliveryIntegration]);

  const handleProviderChange = async (newProvider: "none" | "zr-express" | "yalidine") => {
    setProvider(newProvider);
    setTestResult(null);
    try {
      await setDeliveryIntegration({
        storeId: storeId as Id<"stores">,
        provider: newProvider,
        apiKey: newProvider === "none" ? "" : apiKey,
        apiToken: newProvider === "none" ? "" : apiToken,
      });
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2000);
    } catch (error) {
      console.error("Failed to save provider:", error);
    }
  };

  const handleSaveCredentials = async () => {
    if (provider === "none") return;
    setIsSaving(true);
    try {
      await setDeliveryIntegration({
        storeId: storeId as Id<"stores">,
        provider,
        apiKey,
        apiToken,
      });
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2000);
    } catch (error) {
      console.error("Failed to save credentials:", error);
    }
    setIsSaving(false);
  };

  const handleTestConnection = async () => {
    if (!apiKey || !apiToken) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testDeliveryConnection({
        storeId: storeId as Id<"stores">,
        provider: provider as "zr-express" | "yalidine",
        apiKey,
        apiToken,
      });
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, message: "فشل الاتصال" });
    }
    setIsTesting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-[#171717] dark:text-[#fafafa]">تكامل شركة التوصيل</h3>
        {savedMessage && (
          <span className="text-sm text-green-600">✓ تم الحفظ</span>
        )}
      </div>

      <div className="flex gap-3">
        {[
          { value: "none", label: "بدون" },
          { value: "zr-express", label: "ZR Express" },
          { value: "yalidine", label: "Yalidine" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleProviderChange(opt.value as any)}
            className={`flex-1 py-3 text-sm font-medium border ${
              provider === opt.value
                ? "border-[#171717] dark:border-[#fafafa] bg-[#f5f5f5] dark:bg-[#171717] text-[#171717] dark:text-[#fafafa]"
                : "border-[#e5e5e5] dark:border-[#262626] text-[#525252] dark:text-[#d4d4d4]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {provider !== "none" && (
        <div className="space-y-3 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-[#525252] dark:text-[#d4d4d4]">مفتاح API</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onBlur={handleSaveCredentials}
              className="w-full h-10 px-3 border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#fafafa] rounded focus:outline-none focus:border-[#171717] dark:focus:border-[#fafafa]"
              placeholder="أدخل مفتاح API"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-[#525252] dark:text-[#d4d4d4]">رمز API</label>
            <input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              onBlur={handleSaveCredentials}
              className="w-full h-10 px-3 border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] text-[#171717] dark:text-[#fafafa] rounded focus:outline-none focus:border-[#171717] dark:focus:border-[#fafafa]"
              placeholder="أدخل رمز API"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={!apiKey || !apiToken || isTesting}
              className="flex-1"
            >
              {isTesting ? "جاري الاختبار..." : "اختبار الاتصال"}
            </Button>
            <Button
              onClick={handleSaveCredentials}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>

          {testResult && (
            <div className={`p-3 rounded-lg text-sm ${testResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {testResult.message}
            </div>
          )}

          <p className="text-xs text-[#737373]">
            {provider === "zr-express" && "احصل على مفتاح API من موقع ZR Express"}
            {provider === "yalidine" && "احصل على مفتاح ورمز API من موقع Yalidine"}
          </p>
        </div>
      )}

      {provider === "none" && (
        <div className="p-4 bg-[#f5f5f5] dark:bg-[#171717] rounded-lg">
          <p className="text-sm text-[#737373]">
            لم يتم اختيار شركة توصيل. سيتم استخدام الوضع اليدوي للشحن.
          </p>
        </div>
      )}
    </div>
  );
}

function StoreInfoSettings({ storeId, storeSlug }: { storeId: string; storeSlug: string }) {
  const store = useQuery(api.stores.getStoreBySlug, { slug: storeSlug });
  const updateStore = useMutation(api.stores.updateStore);
  const [name, setName] = useState(store?.name || "");
  const [description, setDescription] = useState(store?.description || "");
  const [phone, setPhone] = useState(store?.phone || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateStore({
        storeId: storeId as Id<"stores">,
        name,
        description,
        phone,
      });
    } catch (error) {
      console.error("Failed to update store:", error);
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">معلومات المتجر</h3>
      
      <div>
        <label className="block text-sm font-medium mb-1">اسم المتجر</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-10 px-3 border border-[#e5e5e5] dark:border-[#404040] bg-white dark:bg-[#171717]"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">الوصف</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#404040] bg-white dark:bg-[#171717]"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">رقم الهاتف</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full h-10 px-3 border border-[#e5e5e5] dark:border-[#404040] bg-white dark:bg-[#171717]"
        />
      </div>

      <div className="p-3 bg-[#f5f5f5] dark:bg-[#171717]">
        <p className="text-sm text-[#737373]">رابط المتجر:</p>
        <p className="font-medium">marlon.com/{storeSlug}</p>
      </div>

      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
      </Button>
    </div>
  );
}

export default function EditorPage() {
  const params = useParams();
  const storeSlug = params?.storeSlug as string;
  
  const store = useQuery(
    api.stores.getStoreBySlug,
    storeSlug ? { slug: storeSlug } : "skip"
  );
  
  const storeId = store?._id as string | undefined;
  
  if (!store && storeSlug) {
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
      <ProductsContent storeId={storeId} storeSlug={storeSlug} />
    </RealtimeProvider>
  );
}
