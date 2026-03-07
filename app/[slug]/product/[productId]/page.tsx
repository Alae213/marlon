"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import { ShoppingCart, ArrowRight, Package, Check } from "lucide-react";
import { useCart, CartProvider } from "@/contexts/cart-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { WilayaSelect, CommuneSelect } from "@/components/wilaya-select";
import { ImageCarousel } from "@/components/image-carousel";
import { validateAlgerianPhone, formatPhoneInput } from "@/lib/phone-validation";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0,
  }).format(price);
};

export default function ProductDetailPage() {
  return (
    <CartProvider>
      <ProductDetailContent />
    </CartProvider>
  );
}

function ProductDetailContent() {
  const params = useParams();
  const slug = params?.slug as string;
  const productId = params?.productId as string;
  
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [orderData, setOrderData] = useState({
    name: "",
    phone: "",
    address: "",
    wilaya: "",
    commune: "",
    deliveryType: "stopdesk" as "stopdesk" | "domicile",
  });
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const store = useQuery(api.stores.getStoreBySlug, slug ? { slug } : "skip");
  
  const footerContent = useQuery(
    api.siteContent.getSiteContentResolved,
    store?._id ? { storeId: store._id as Id<"stores">, section: "footer" } : "skip"
  );
  
  const products = useQuery(
    api.products.getProducts,
    store?._id ? { storeId: store._id as Id<"stores"> } : "skip"
  );

  const product = useMemo(() => {
    if (!products) return null;
    return products.find((p) => p._id === productId);
  }, [products, productId]);

  // Footer content
  const currentFooter = footerContent?.content as {
    logo?: string;
    logoUrl?: string;
    description?: string;
    contactEmail?: string;
    contactPhone?: string;
    copyright?: string;
  } | undefined;
  const footerLogoUrl = currentFooter?.logoUrl;
  const footerDescription = currentFooter?.description ?? "";
  const footerPhone = currentFooter?.contactPhone ?? "";
  const footerEmail = currentFooter?.contactEmail ?? "";
  const footerCopyright = currentFooter?.copyright ?? "";

  // Related products (other products from the same store, excluding current)
  const relatedProducts = useMemo(() => {
    if (!products || !productId) return [];
    return products
      .filter((p) => p._id !== productId)
      .slice(0, 4);
  }, [products, productId]);

  const handleVariantSelect = (variantName: string, option: string) => {
    setSelectedVariants(prev => ({ ...prev, [variantName]: option }));
  };

  const variantString = Object.values(selectedVariants).join(" - ");

  const createOrder = useMutation(api.orders.createOrder);

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  };

  const handleBuyNow = async () => {
    if (!product || !store) return;
    
    try {
      await createOrder({
        storeId: store._id as Id<"stores">,
        orderNumber: generateOrderNumber(),
        customerName: orderData.name,
        customerPhone: orderData.phone,
        customerWilaya: orderData.wilaya,
        customerCommune: orderData.commune || undefined,
        customerAddress: orderData.address || undefined,
        products: [{
          productId: product._id,
          name: product.name,
          image: product.images?.[0],
          price: product.basePrice,
          quantity,
          variant: variantString || undefined,
        }],
        subtotal: product.basePrice * quantity,
        deliveryCost: 0,
        total: product.basePrice * quantity,
        deliveryType: orderData.deliveryType,
      });
      
      setOrderNumber(generateOrderNumber());
      setOrderPlaced(true);
    } catch (error) {
      console.error("Failed to create order:", error);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: `${product._id}-${Date.now()}`,
      productId: product._id,
      name: product.name,
      price: product.basePrice,
      quantity,
      image: product.images?.[0] || "",
      variant: variantString || undefined,
    });
  };

  if (orderPlaced) {
    return (
      <div className="w-[300px] mx-auto px-6 py-16 text-center">
        <div className="w-16 h-16 bg-[#16a34a] rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-normal text-[#171717] dark:text-[#fafafa] mb-4">
          Order Confirmed!
        </h1>
        <p className="text-[#525252] dark:text-[#a3a3a3] mb-2">
          We will contact you at your phone number to verify your order
        </p>
        <p className="text-sm text-[#a3a3a3] mb-8">
          Order Number: <span className="font-medium">{orderNumber}</span>
        </p>
        <Link
          href={`/${slug}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#171717] dark:bg-[#fafafa] text-white dark:text-[#171717] font-normal"
        >
          Continue Shopping
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 text-center">
        <Package className="w-16 h-16 text-[#d4d4d4] mx-auto mb-4" />
        <p className="text-[#737373]">Product not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Link href={`/${slug}`} className="inline-flex items-center gap-2 text-[#737373] hover:text-[#171717] mb-6">
        <ArrowRight className="w-4 h-4 rotate-180" />
        Back to Store
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        <ImageCarousel 
          images={product.images || []} 
          alt={product.name} 
        />

        <div>
          <h1 className="text-2xl font-normal text-[#171717] dark:text-[#fafafa] mb-4">
            {product.name}
          </h1>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-3xl font-medium text-[#171717] dark:text-[#fafafa]">
              {formatPrice(product.basePrice)}
            </span>
            {product.oldPrice && (
              <span className="text-xl text-[#a3a3a3] line-through">
                {formatPrice(product.oldPrice)}
              </span>
            )}
          </div>

          {product.description && (
            <p className="text-[#525252] dark:text-[#a3a3a3] mb-6">
              {product.description}
            </p>
          )}

          {product.variants && product.variants.length > 0 && (
            <div className="mb-6">
              {product.variants.map((variant) => (
                <div key={variant.name} className="mb-4">
                  <p className="text-sm font-medium text-[#525252] dark:text-[#d4d4d4] mb-2">
                    {variant.name}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {variant.options?.map((option) => (
                      <button
                        key={option.name}
                        onClick={() => handleVariantSelect(variant.name, option.name)}
                        className={`px-4 py-2 border rounded-lg transition-colors ${
                          selectedVariants[variant.name] === option.name
                            ? "border-[#171717] dark:border-[#fafafa] bg-[#171717] dark:bg-[#fafafa] text-white dark:text-[#171717]"
                            : "border-[#e5e5e5] dark:border-[#404040] text-[#525252] dark:text-[#a3a3a3] hover:border-[#171717] dark:hover:border-[#fafafa]"
                        }`}
                      >
                        {option.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mb-6">
            <p className="text-sm font-medium text-[#525252] dark:text-[#d4d4d4] mb-2">
              Quantity
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 border border-[#e5e5e5] dark:border-[#404040] flex items-center justify-center"
              >
                -
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 border border-[#e5e5e5] dark:border-[#404040] flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-2 h-12 border border-[#171717] dark:border-[#fafafa] text-[#171717] dark:text-[#fafafa] font-normal hover:bg-[#f5f5f5] dark:hover:bg-[#171717] transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </button>
            <button
              onClick={() => setShowOrderForm(true)}
              className="flex-1 flex items-center justify-center gap-2 h-12 bg-[#171717] dark:bg-[#fafafa] text-white dark:text-[#171717] font-normal hover:opacity-80 transition-opacity"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl font-medium text-[#171717] dark:text-[#fafafa] mb-6">
            Related Products
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((relatedProduct) => (
              <Link
                key={relatedProduct._id}
                href={`/${slug}/product/${relatedProduct._id}`}
                className="group bg-white dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] overflow-hidden hover:border-[#171717] dark:hover:border-[#fafafa] transition-all duration-300"
              >
                <div className="relative aspect-square bg-[#f5f5f5] dark:bg-[#171717]">
                  {relatedProduct.images && relatedProduct.images[0] ? (
                    <Image
                      src={relatedProduct.images[0]}
                      alt={relatedProduct.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 25vw, 25vw"
                      loading="lazy"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-10 h-10 text-[#d4d4d4]" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-normal text-[#171717] dark:text-[#fafafa] text-sm mb-2 line-clamp-2">
                    {relatedProduct.name}
                  </h3>
                  <span className="text-base font-normal text-[#171717] dark:text-[#fafafa]">
                    {formatPrice(relatedProduct.basePrice)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {showOrderForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-[#0a0a0a] w-[400px] px-6 py-4 rounded-lg">
            <h2 className="text-xl font-normal mb-6">Confirm Order</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={orderData.name}
                  onChange={(e) => setOrderData({ ...orderData, name: e.target.value })}
                  className="w-full h-10 px-3 border border-[#e5e5e5] dark:border-[#404040] bg-white dark:bg-[#171717]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={orderData.phone}
                  onChange={(e) => setOrderData({ ...orderData, phone: e.target.value })}
                  className="w-full h-10 px-3 border border-[#e5e5e5] dark:border-[#404040] bg-white dark:bg-[#171717]"
                  placeholder="05xxxxxxxx"
                />
              </div>

              <div>
                <WilayaSelect
                  value={orderData.wilaya}
                  onChange={(value) => setOrderData({ ...orderData, wilaya: value })}
                  label="Wilaya"
                  required
                />
              </div>

              <div>
                <CommuneSelect
                  wilayaValue={orderData.wilaya}
                  value={orderData.commune}
                  onChange={(value) => setOrderData({ ...orderData, commune: value })}
                  label="Commune"
                  disabled={!orderData.wilaya}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Delivery Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="deliveryType"
                      value="stopdesk"
                      checked={orderData.deliveryType === "stopdesk"}
                      onChange={() => setOrderData({ ...orderData, deliveryType: "stopdesk" })}
                    />
                    <span>Pickup Point</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="deliveryType"
                      value="domicile"
                      checked={orderData.deliveryType === "domicile"}
                      onChange={() => setOrderData({ ...orderData, deliveryType: "domicile" })}
                    />
                    <span>Home Delivery</span>
                  </label>
                </div>
              </div>

              {orderData.deliveryType === "domicile" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <input
                    type="text"
                    value={orderData.address}
                    onChange={(e) => setOrderData({ ...orderData, address: e.target.value })}
                    className="w-full h-10 px-3 border border-[#e5e5e5] dark:border-[#404040] bg-white dark:bg-[#171717]"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowOrderForm(false)}
                className="flex-1 h-10 border border-[#e5e5e5] dark:border-[#404040]"
              >
                Cancel
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!orderData.name || !orderData.phone || !orderData.wilaya}
                className="flex-1 h-10 bg-[#171717] dark:bg-[#fafafa] text-white dark:text-[#171717] disabled:opacity-50"
              >
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}

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
