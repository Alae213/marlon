"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Minus, Plus, ShoppingCart, Heart, Check, MapPin } from "lucide-react";
import { useCart } from "@/contexts/cart-context";

const MOCK_PRODUCT = {
  id: "1",
  name: "سماعة بلوتوث عالية الجودة",
  description: "استمتع بصوت عالي الجودة مع سماعتنا البلوتوثية المتقدمة. بطارية تدوم طويلاً، تصميم مريح للأذن، وتقنية إلغاء الضوضاء.",
  price: 2500,
  images: [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=800&fit=crop",
  ],
  inStock: true,
  variants: [
    { name: "اللون", options: ["أسود", "أبيض", "أزرق"] },
    { name: "السعة", options: ["64GB", "128GB", "256GB"] },
  ],
};

const WILAYAS = [
  "الجزائر", "وهران", "قسنطينة", "باتنة", "تيبازة", "تبارت", "مستغانم",
  "بسكرة", "تل党支部书记", "عنابة", "سكيكدة", "عقبة", "بجاية", "béja",
];

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ar-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0,
  }).format(price);
};

export default function ProductPage({ params }: { params: { id: string } }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [wilaya, setWilaya] = useState("");
  const [commune, setCommune] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const { addItem } = useCart();

  const handleVariantSelect = (variantName: string, option: string) => {
    setSelectedVariants(prev => ({ ...prev, [variantName]: option }));
  };

  const handleAddToCart = () => {
    const variantString = Object.values(selectedVariants).join(" - ");
    addItem({
      id: `${MOCK_PRODUCT.id}-${Date.now()}`,
      productId: MOCK_PRODUCT.id,
      name: MOCK_PRODUCT.name,
      price: MOCK_PRODUCT.price,
      quantity,
      image: MOCK_PRODUCT.images[0],
      variant: variantString || undefined,
    });
    setQuantity(1);
  };

  const isValidPhone = (phone: string) => {
    const phoneRegex = /^(0[567][0-9]{8})$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  };

  const isFormValid = name && isValidPhone(phone) && wilaya && address;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
        <Link href="/marlon" className="hover:text-zinc-900 dark:hover:text-zinc-50">
          الرئيسية
        </Link>
        <ArrowRight className="w-4 h-4" />
        <span className="text-zinc-900 dark:text-zinc-50">المنتجات</span>
        <ArrowRight className="w-4 h-4" />
        <span className="text-zinc-900 dark:text-zinc-50 truncate">{MOCK_PRODUCT.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-2xl overflow-hidden">
            <Image
              src={MOCK_PRODUCT.images[selectedImage]}
              alt={MOCK_PRODUCT.name}
              fill
              className="object-cover"
            />
            {!MOCK_PRODUCT.inStock && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="bg-red-500 text-white px-4 py-2 rounded-full font-medium">
                  غير متوفر
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {MOCK_PRODUCT.images.map((image, index) => (
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
                  alt={`${MOCK_PRODUCT.name} ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
              {MOCK_PRODUCT.name}
            </h1>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-3xl font-bold text-[#00853f]">
                {formatPrice(MOCK_PRODUCT.price)}
              </span>
              {MOCK_PRODUCT.inStock && (
                <span className="flex items-center gap-1 text-green-600 text-sm">
                  <Check className="w-4 h-4" />
                  متوفر
                </span>
              )}
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {MOCK_PRODUCT.description}
            </p>
          </div>

          {MOCK_PRODUCT.variants.map((variant) => (
            <div key={variant.name}>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                {variant.name}
              </label>
              <div className="flex flex-wrap gap-2">
                {variant.options.map((option) => (
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
              disabled={!MOCK_PRODUCT.inStock}
              className="flex-1 h-14 bg-[#00853f] text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-[#007537] disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              إضافة للسلة
            </button>
            <button className="w-14 h-14 border border-zinc-200 dark:border-zinc-700 rounded-2xl flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              <Heart className="w-5 h-5 text-zinc-400" />
            </button>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6 space-y-4">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
              معلومات التوصيل
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-500 mb-2">الولاية</label>
                <select
                  value={wilaya}
                  onChange={(e) => {
                    setWilaya(e.target.value);
                    setCommune("");
                  }}
                  className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#00853f]"
                >
                  <option value="">اختر الولاية</option>
                  {WILAYAS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-500 mb-2">البلدية</label>
                <input
                  type="text"
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  placeholder="أدخل البلدية"
                  className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#00853f]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-500 mb-2">العنوان بالتفصيل</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="الحي، رقم المنزل، رقم الشقة..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#00853f] resize-none"
              />
            </div>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6 space-y-4">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
              معلومات الطلب
            </h3>
            
            <div>
              <label className="block text-sm text-zinc-500 mb-2">الاسم الكامل</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل اسمك الكامل"
                className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#00853f]"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-500 mb-2">رقم الهاتف</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0551 23 45 67"
                className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-[#00853f]"
              />
              {!isValidPhone(phone) && phone.length > 0 && (
                <p className="text-red-500 text-sm mt-1">
                  يرجى إدخال رقم هاتف صحيح (مثال: 0551 23 45 67)
                </p>
              )}
            </div>

            <button
              disabled={!isFormValid}
              className="w-full h-14 bg-[#00853f] text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-[#007537] disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors"
            >
              طلب الآن - {formatPrice(MOCK_PRODUCT.price * quantity)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
