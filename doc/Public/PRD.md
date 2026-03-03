# Public Storefront PRD

> Domain owner for: Catalog Page, Product Detail, Cart, Checkout, Order Confirmation
> Route: `/[storeSlug]` and `/[storeSlug]/[productId]`

---

## Summary

The public-facing storefront that customers see. Displays the merchant's products, allows adding to cart or buying directly, and handles the COD checkout flow with delivery cost calculation.

---

## Catalog Page (PRD §6.1)

- Fixed navbar (logo, Shop / FAQ / Help links, cart icon)
- Hero section (rendered from site content editor settings)
- Product grid: main image, name, price, old price
- Product card hover effects

## Product Detail Page (PRD §6.2)

- Fixed navbar
- Image gallery (carousel)
- Name, price, old price, rich text description
- Variant selector (buttons)
- Quantity selector
- **"Buy Now" button** (primary) — single item, inline order form:
  - Full Name, Phone (Algerian format validation), Delivery Type (Stopdesk / Domicile), Wilaya (dropdown), Commune (dependent dropdown), Full Address (if Domicile)
  - Submits directly to Convex order creation (no cart), status → "new"
- **"Add to Cart" button** — opens cart sidebar
- Buy Now and Add to Cart are visually distinct and independent flows
- Related products section: mini product cards from same store (exclude current)

## Cart Sidebar (PRD §6.3)

- Item list: image, name, variant, quantity (+/-), price, remove
- Subtotal (products only)
- "Proceed to Checkout" button

## Checkout Popup (PRD §6.4)

- Form: Full Name, Phone, Delivery Type, Wilaya, Commune, Full Address (if Domicile)
- Real-time delivery cost: based on merchant's per-store delivery pricing table (Wilaya + Delivery Type)
- Order summary: subtotal + delivery cost + total
- Payment method: "Cash on Delivery" (read-only)
- "Place Order" button

## Order Confirmation (PRD §6.5)

- Message: "We'll call you at [phone] to confirm your order."
- Order ID displayed
- "Continue Shopping" button

---

## Edge Cases

- Locked store: storefront stays fully operational, orders still saved with status "new"
- 0 products: empty catalog with hero section still visible
- Invalid slug: 404 page

---

## Relevant Data Models

### Order (created from storefront)
```
storeId, orderNumber,
customer: { name, phone, wilaya, commune, address },
items: [{ productId, name, variant, quantity, price }],
deliveryType: 'stopdesk' | 'domicile',
deliveryCost, subtotal, total,
status: 'new',
createdAt
```
