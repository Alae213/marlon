"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Minus, Plus, ShoppingCart, Heart, Check, MapPin, Package, Zap } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { handleSubscriptionExpiryOnOrder } from "@/lib/locked-store-cleanup";

interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  oldPrice: number | null;
  images: string[];
  isArchived: boolean;
  variants?: { name: string; options: string[] }[];
}

const WILAYAS = [
  "الجزائر", "وهران", "قسنطينة", "باتنة", "تيبازة", "تبارت", "مستغانم",
  "بسكرة", "عنابة", "سكيكدة", "عقبة", "بجاية",
];

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ar-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0,
  }).format(price);
};

export default function ProductPage({ params }: { params: { slug: string; id: string } }) {
  const { slug, id } = params;
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [wilaya, setWilaya] = useState("");
  const [commune, setCommune] = useState("");
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryType, setDeliveryType] = useState<"home" | "office" | "stop_desk">("home");
  const [isBuyNowMode, setIsBuyNowMode] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const { addItem } = useCart();
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  // Load product from localStorage
  useEffect(() => {
    const savedProducts = localStorage.getItem(`marlon_products_${slug}`);
    if (savedProducts) {
      const products: Product[] = JSON.parse(savedProducts);
      const found = products.find(p => p.id === id);
      if (found) {
        setProduct(found);
      }
      // Get related products (exclude current, show up to 4)
      const related = products
        .filter(p => p.id !== id && !p.isArchived)
        .slice(0, 4);
      setRelatedProducts(related);
    }
  }, [slug, id]);

  const handleVariantSelect = (variantName: string, option: string) => {
    setSelectedVariants(prev => ({ ...prev, [variantName]: option }));
  };

  const handleAddToCart = () => {
    if (!product) return;
    const variantString = Object.values(selectedVariants).join(" - ");
    addItem({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: product.basePrice,
      quantity,
      image: product.images?.[0] || "",
      variant: variantString || undefined,
    });
    setQuantity(1);
  };

  const isValidPhone = (phone: string) => {
    const phoneRegex = /^(0[567][0-9]{8})$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  };

  const isFormValid = customerName && isValidPhone(phone) && wilaya && address;

  const handleBuyNow = () => {
    if (!product || !isFormValid) return;

    // Handle subscription expiry - this will revert expired stores to trial
    handleSubscriptionExpiryOnOrder(slug);

    // Create order directly
    const newOrderNumber = "ORD-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const variantString = Object.values(selectedVariants).join(" - ");
    
    const newOrder = {
      id: `order_${Date.now()}`,
      orderNumber: newOrderNumber,
      customerName,
      customerPhone: phone,
      customerWilaya: wilaya,
      customerCommune: commune,
      customerAddress: address,
      items: [{
        id: `item_${Date.now()}`,
        name: product.name,
        quantity,
        price: product.basePrice,
        variant: variantString || undefined,
      }],
      subtotal: product.basePrice * quantity,
      deliveryCost: 600, // Default delivery cost - in real app, fetch from store settings
      total: (product.basePrice * quantity) + 600,
      status: "new" as const,
      deliveryType,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      callLog: [],
      auditTrail: [{
        id: `audit_${Date.now()}`,
        timestamp: Date.now(),
        action: "created",
        details: "تم إنشاء الطلب عبر الشراء المباشر"
      }],
      adminNotes: [],
    };

    // Save to localStorage
    const existingOrders = JSON.parse(localStorage.getItem(`marlon_orders_${slug}`) || "[]");
    localStorage.setItem(`marlon_orders_${slug}`, JSON.stringify([newOrder, ...existingOrders]));

    setOrderNumber(newOrderNumber);
    setOrderPlaced(true);
  };

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <Package className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
        <p className="text-zinc-500">المنتج غير موجود</p>
        <Link href={`/${slug}`} className="text-[#00853f] hover:underline mt-2 inline-block">
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
        <Link href={`/${slug}`} className="hover:text-zinc-900 dark:hover:text-zinc-50">
          الرئيسية
        </Link>
        <ArrowRight className="w-4 h-4" />
        <span className="text-zinc-900 dark:text-zinc-50">المنتجات</span>
        <ArrowRight className="w-4 h-4" />
        <span className="text-zinc-900 dark:text-zinc-50 truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-2xl overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-20 h-20 text-zinc-300" />
              </div>
            )}
          </div>
          {product.images && product.images.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((image: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-colors ${
                    selectedImage === index
                      ? "border-[#00853f]"
                      : "border-transparent hover:border-zinc-300 dark:hover:border-zinc-600"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
              {product.name}
            </h1>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-3xl font-bold text-[#00853f]">
                {formatPrice(product.basePrice)}
              </span>
              {!product.isArchived && (
                <span className="flex items-center gap-1 text-green-600 text-sm">
                  <Check className="w-4 h-4" />
                  متوفر
                </span>
              )}
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {product.description}
            </p>
          </div>

          {product.variants && product.variants.map((variant) => (
            <div key={variant.name}>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                {variant.name}
              </label>
              <div className="flex flex-wrap gap-2">
                {variant.options.map((option: string) => (
                  <button
                    key={option}
                    onClick={() => handleVariantSelect(variant.name, option)}
                    className={`px-4 py-2 rounded-xl border transition-colors ${
                      selectedVariants[variant.name] === option
                        ? "border-[#00853f] bg-[#00853f]/10 text-[#00853f]"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              الكمية
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="w-12 text-center font-medium text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="w-10 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={product.isArchived}
              className="flex-1 h-14 bg-[#00853f] text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-[#007537] disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              إضافة للسلة
            </button>
            <button
              onClick={handleBuyNow}
              disabled={!isFormValid || product.isArchived}
              className="flex-1 h-14 bg-zinc-900 text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors"
            >
              <Zap className="w-5 h-5" />
              شراء الآن
            </button>
            <button className="w-14 h-14 border border-zinc-200 dark:border-zinc-700 rounded-2xl flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              <Heart className="w-5 h-5 text-zinc-400" />
            </button>
          </div>

          {/* Order Placed Confirmation */}
          {orderPlaced && (
            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                  تم استلام طلبك بنجاح!
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                  رقم الطلب: <span className="font-mono font-bold">{orderNumber}</span>
                </p>
                <p className="text-sm text-zinc-500 mb-6">
                  سنقوم بالاتصال بك قريباً لتأكيد الطلب
                </p>
                <Link
                  href={`/${slug}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#00853f] text-white rounded-xl font-medium hover:bg-[#007537] transition-colors"
                >
                  متابعة التسوق
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* GAP 9: Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">
            منتجات مشابهة
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((relatedProduct) => (
              <Link
                key={relatedProduct.id}
                href={`/${slug}/product/${relatedProduct.id}`}
                className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:border-[#00853f] hover:shadow-lg transition-all duration-200"
              >
                <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  {relatedProduct.images && relatedProduct.images.length > 0 ? (
                    <Image
                      src={relatedProduct.images[0]}
                      alt={relatedProduct.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <Package className="w-12 h-12 text-zinc-300" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-50 mb-1 line-clamp-2 group-hover:text-[#00853f] transition-colors">
                    {relatedProduct.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#00853f]">
                      {formatPrice(relatedProduct.basePrice)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
