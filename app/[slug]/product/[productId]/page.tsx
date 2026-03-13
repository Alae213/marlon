"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Package, Check } from "lucide-react";
import { CartIcon } from "@/components/core/cart-icon";
import { useCart, CartProvider } from "@/contexts/cart-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { WilayaSelect, CommuneSelect } from "@/components/wilaya-select";
import { ImageCarousel } from "@/components/image-carousel";
import { validateAlgerianPhone, formatPhoneInput } from "@/lib/phone-validation";
import { Button } from "@/components/core/button";
import { CartSidebar } from "@/components/cart-sidebar";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/animate-ui/primitives/radix/dialog";

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
  
  const { addItem, itemCount, isOpen, openCart, closeCart } = useCart();
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
  const [phoneError, setPhoneError] = useState("");

  const store = useQuery(api.stores.getStoreBySlug, slug ? { slug } : "skip");
  
  const navbarContent = useQuery(
    api.siteContent.getSiteContentResolved,
    store?._id ? { storeId: store._id as Id<"stores">, section: "navbar" } : "skip"
  );

  // Fetch delivery pricing
  const deliveryPricing = useQuery(
    api.stores.getDeliveryPricing,
    store?._id ? { storeId: store._id as Id<"stores"> } : "skip"
  );
  
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

  const currentNavbar = navbarContent?.content as { background?: string; textColor?: string; logoUrl?: string } | undefined;
  const navbarBg = currentNavbar?.background ?? "light";
  const navbarText = currentNavbar?.textColor ?? "dark";
  const navbarLogoUrl = currentNavbar?.logoUrl;

  const navbarBgClass =
    navbarBg === "dark"
      ? "bg-[var(--system-700)]"
      : navbarBg === "transparent"
        ? "bg-transparent"
        : "bg-white";

  const navbarTextClass = navbarText === "light" ? "text-white" : "text-[var(--system-600)]";

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

  // Extract wilaya Arabic name from the selected wilaya string (e.g., "1 - Adrar - أدرار" -> "أدرار")
  const selectedWilayaArabic = useMemo(() => {
    if (!orderData.wilaya) return null;
    const parts = orderData.wilaya.split(" - ");
    return parts.length >= 3 ? parts[2].trim() : null;
  }, [orderData.wilaya]);

  // Extract wilaya number as fallback (e.g., "1 - Adrar - أدرار" -> "1")
  const selectedWilayaNumber = useMemo(() => {
    if (!orderData.wilaya) return null;
    const match = orderData.wilaya.match(/^(\d+)/);
    return match ? match[1] : null;
  }, [orderData.wilaya]);

  // Find pricing with multiple fallback strategies
  const findDeliveryPrice = useMemo(() => {
    if (!deliveryPricing || !orderData.wilaya) return null;
    
    // Strategy 1: Match by Arabic name
    if (selectedWilayaArabic) {
      const found = deliveryPricing.find(p => p.wilaya === selectedWilayaArabic);
      if (found) return found;
    }
    
    // Strategy 2: Match by wilaya number (some entries might be saved with number)
    if (selectedWilayaNumber) {
      const found = deliveryPricing.find(p => p.wilaya === selectedWilayaNumber);
      if (found) return found;
    }
    
    return null;
  }, [deliveryPricing, selectedWilayaArabic, selectedWilayaNumber, orderData.wilaya]);

  // Get delivery cost - use stored price or default fallback
  const getDeliveryCost = (type: "domicile" | "stopdesk") => {
    const pricing = findDeliveryPrice;
    if (!pricing) {
      // Default fallback prices (same as editor defaults)
      return type === "domicile" ? 600 : 400;
    }
    return type === "domicile" 
      ? (pricing.homeDelivery || 0) 
      : (pricing.officeDelivery || 0);
  };

  // Calculate delivery cost based on wilaya and delivery type
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const deliveryCost = useMemo(() => getDeliveryCost(orderData.deliveryType), [findDeliveryPrice, orderData.deliveryType]);

  // Calculate order totals
  const subtotal = product ? product.basePrice * quantity : 0;
  const total = subtotal + deliveryCost;

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
    
    // Validate phone before submitting
    const phoneValidation = validateAlgerianPhone(orderData.phone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || "Invalid phone number");
      return;
    }
    
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
        subtotal,
        deliveryCost,
        total,
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
        <div className="w-16 h-16 bg-[var(--success)] rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-white" />
        </div>
        <h1 className="headline-2xl text-[var(--system-600)] mb-4">
          Order Confirmed!
        </h1>
        <p className="body-base text-[var(--system-400)] mb-2">
          We will contact you at your phone number to verify your order
        </p>
        <p className="label-xs text-[var(--system-300)] mb-8">
          Order Number: <span className="font-medium">{orderNumber}</span>
        </p>
        <Link
          href={`/${slug}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--system-600)] text-white font-normal"
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
        <Package className="w-16 h-16 text-[var(--system-300)] mx-auto mb-4" />
        <p className="body-base text-[var(--system-400)]">Product not found</p>
      </div>
    );
  }

  return (
    <>
    <div className="w-full pt-16">
      {/* Navbar */}
      <div className={`fixed top-0 left-0 right-0 z-50 ${navbarBgClass}`}>
        <div className="flex items-center max-w-6xl mx-auto justify-between px-4 py-3">
          <Link href={`/${slug}`} className="flex items-center gap-3 min-w-0">
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
          </Link>

          <div className="hidden sm:flex items-center gap-5">
            <Link href={`/${slug}`} className={`body-base ${navbarTextClass}`}>Shop</Link>
            <span className={`body-base ${navbarTextClass}`}>FAQ</span>
            <span className={`body-base ${navbarTextClass}`}>Help</span>
          </div>

          <div className="flex items-center gap-2">
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

      <div className="max-w-6xl mx-auto px-4 py-8">

      <Link href={`/${slug}`} className="inline-flex items-center gap-2 body-base text-[var(--system-400)] hover:text-[var(--system-600)] mb-6">
        <ArrowRight className="w-4 h-4 rotate-180" />
        Back to Store
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        <ImageCarousel 
          images={product.images || []} 
          alt={product.name} 
        />

        <div>
          <h1 className="headline-2xl text-[var(--system-600)] mb-4">
            {product.name}
          </h1>

          <div className="flex items-center gap-4 mb-6">
            <span className="title-xl text-[var(--system-600)]">
              {formatPrice(product.basePrice)}
            </span>
            {product.oldPrice && (
              <span className="title-xl text-[var(--system-300)] line-through">
                {formatPrice(product.oldPrice)}
              </span>
            )}
          </div>

          {product.description && (
            <p className="body-base text-[var(--system-400)] mb-6">
              {product.description}
            </p>
          )}

          {product.variants && product.variants.length > 0 && (
            <div className="mb-6">
              {product.variants.map((variant) => (
                <div key={variant.name} className="mb-4">
                  <p className="label-xs text-[var(--system-500)] mb-2">
                    {variant.name}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {variant.options?.map((option) => (
                      <button
                        key={option.name}
                        onClick={() => handleVariantSelect(variant.name, option.name)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          selectedVariants[variant.name] === option.name
                            ? "bg-[var(--system-600)] text-white"
                            : "bg-[var(--system-100)] text-[var(--system-500)] hover:bg-[var(--system-200)]"
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
            <p className="label-xs text-[var(--system-500)] mb-2">
              Quantity
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 bg-[var(--system-100)] flex items-center justify-center"
              >
                -
              </button>
              <span className="w-12 text-center title-xl">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 bg-[var(--system-100)] flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-2 h-12"
            >
              <CartIcon className="w-5 h-5" />
              Add to Cart
            </Button>
            <Button
              onClick={() => setShowOrderForm(true)}
              className="flex-1 flex items-center justify-center gap-2 h-12"
            >
              Buy Now
            </Button>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="title-xl text-[var(--system-600)] mb-6">
            Related Products
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((relatedProduct) => (
              <Link
                key={relatedProduct._id}
                href={`/${slug}/product/${relatedProduct._id}`}
                className="group bg-[var(--system-50)] overflow-hidden hover:bg-[var(--system-100)] transition-all duration-300"
              >
                <div className="relative aspect-square bg-[var(--system-100)]">
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
                      <Package className="w-10 h-10 text-[var(--system-300)]" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="body-base text-[var(--system-600)] mb-2 line-clamp-2">
                    {relatedProduct.name}
                  </h3>
                  <span className="body-base text-[var(--system-600)]">
                    {formatPrice(relatedProduct.basePrice)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Confirm Order Dialog */}
      <Dialog open={showOrderForm} onOpenChange={(open) => !open && setShowOrderForm(false)}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 z-[60] bg-black/30" />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <DialogContent
              style={{ boxShadow: "var(--shadow-xl-shadow)" } as React.CSSProperties}
              className="w-[400px] max-h-[90vh] overflow-y-auto bg-[--system-100] [corner-shape:squircle] rounded-[48px] overflow-hidden bg-[image:var(--gradient-popup)] p-[20px] flex flex-col gap-[12px] items-start backdrop-blur-[12px]"
              from="top"
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <DialogHeader>
                <DialogTitle className="title-xl text-[var(--system-600)] mb-2">Confirm Order</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 w-full">
                <div>
                  <label className="block label-xs mb-1 text-[var(--system-500)]">Full Name</label>
                  <input
                    type="text"
                    value={orderData.name}
                    onChange={(e) => setOrderData({ ...orderData, name: e.target.value })}
                    className="w-full h-10 px-3 bg-[var(--system-50)] rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block label-xs mb-1 text-[var(--system-500)]">Phone Number</label>
                  <input
                    type="tel"
                    value={orderData.phone}
                    onChange={(e) => {
                      const formatted = formatPhoneInput(e.target.value);
                      setOrderData({ ...orderData, phone: formatted });
                      
                      // Validate phone
                      if (formatted.length > 0) {
                        const validation = validateAlgerianPhone(formatted);
                        setPhoneError(validation.error || "");
                      } else {
                        setPhoneError("");
                      }
                    }}
                    className={`w-full h-10 px-3 bg-[var(--system-50)] rounded-lg ${
                      phoneError ? "border border-red-500" : ""
                    }`}
                    placeholder="05XX XXX XXX"
                  />
                  {phoneError && (
                    <p className="label-xs text-red-500 mt-1">{phoneError}</p>
                  )}
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
                  <label className="block label-xs mb-2 text-[var(--system-500)]">Delivery Type</label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-3 p-3 bg-[var(--system-50)] rounded-lg cursor-pointer hover:bg-[var(--system-200)] transition-colors">
                      <input
                        type="radio"
                        name="deliveryType"
                        value="stopdesk"
                        checked={orderData.deliveryType === "stopdesk"}
                        onChange={() => setOrderData({ ...orderData, deliveryType: "stopdesk" })}
                        className="w-4 h-4"
                      />
                      <span className="body-base text-[var(--system-600)]">Pickup Point</span>
                      {selectedWilayaArabic && (
                        <span className="ms-auto label-xs text-[var(--system-400)]">
                          {formatPrice(getDeliveryCost("stopdesk"))}
                        </span>
                      )}
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-[var(--system-50)] rounded-lg cursor-pointer hover:bg-[var(--system-200)] transition-colors">
                      <input
                        type="radio"
                        name="deliveryType"
                        value="domicile"
                        checked={orderData.deliveryType === "domicile"}
                        onChange={() => setOrderData({ ...orderData, deliveryType: "domicile" })}
                        className="w-4 h-4"
                      />
                      <span className="body-base text-[var(--system-600)]">Home Delivery</span>
                      {selectedWilayaArabic && (
                        <span className="ms-auto label-xs text-[var(--system-400)]">
                          {formatPrice(getDeliveryCost("domicile"))}
                        </span>
                      )}
                    </label>
                  </div>
                </div>

                {orderData.deliveryType === "domicile" && (
                  <div>
                    <label className="block label-xs mb-1 text-[var(--system-500)]">Address</label>
                    <input
                      type="text"
                      value={orderData.address}
                      onChange={(e) => setOrderData({ ...orderData, address: e.target.value })}
                      className="w-full h-10 px-3 bg-[var(--system-50)] rounded-lg"
                    />
                  </div>
                )}

                {/* Order Summary */}
                <div className="pt-4 mt-4 bg-[var(--system-50)] rounded-xl p-4">
                  <h3 className="label-xs mb-3 text-[var(--system-500)]">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="body-base text-[var(--system-400)]">Subtotal</span>
                      <span className="body-base text-[var(--system-600)]">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="body-base text-[var(--system-400)]">Delivery</span>
                      <span className="body-base text-[var(--system-600)]">{deliveryCost > 0 ? formatPrice(deliveryCost) : "Free"}</span>
                    </div>
                    <div className="flex justify-between title-xl pt-2 mt-2 border-t border-[var(--system-200)]">
                      <span className="text-[var(--system-600)]">Total</span>
                      <span className="text-[var(--system-600)]">{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-4 w-full">
                <Button
                  variant="outline"
                  onClick={() => setShowOrderForm(false)}
                  className="flex-1 h-10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBuyNow}
                  disabled={!orderData.name || !orderData.phone || !orderData.wilaya}
                  className="flex-1 h-10"
                >
                  Confirm Order
                </Button>
              </div>
            </DialogContent>
          </div>
        </DialogPortal>
      </Dialog>

      {/* Cart Sidebar */}
      {store && (
        <CartSidebar
          isOpen={isOpen}
          onClose={closeCart}
          storeId={store._id as string}
          storeSlug={slug}
        />
      )}

      {/* Footer */}
      <footer className="mt-16 pt-8">
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
              <p className="body-base text-[var(--system-400)] mb-4">{footerDescription}</p>
            )}
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="title-xl text-[var(--system-600)] mb-4">معلومات التواصل</h3>
            {footerPhone && (
              <p className="body-base text-[var(--system-400)] mb-2">
                Phone: {footerPhone}
              </p>
            )}
            {footerEmail && (
              <p className="body-base text-[var(--system-400)]">
                Email: {footerEmail}
              </p>
            )}
          </div>

          {/* Copyright */}
          <div className="md:text-end">
            {footerCopyright && (
              <p className="body-base text-[var(--system-400)]">{footerCopyright}</p>
            )}
            <p className="label-xs text-[var(--system-300)] mt-4">
              © {new Date().getFullYear()} {store?.name || "Store"}
            </p>
          </div>
        </div>
      </footer>
    </div>
    </div>
    </>
  );
}
