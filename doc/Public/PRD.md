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
- Footer

## Product Detail Page (PRD §6.2)

- Fixed navbar
- Image gallery (carousel)
- Name, price, old price, rich text description
- Variant selector (buttons) - if available
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

## Checkout modal (PRD §6.4)

- Form: Full Name, Phone, Delivery Type, Wilaya, Commune, Full Address (if Domicile)
- Real-time delivery cost: based on merchant's per-store delivery pricing table (Wilaya + Delivery Type)
- Order summary: subtotal + delivery cost + total
- Payment method: "Cash on Delivery" (read-only)
- "Place Order" button

## Order Confirmation modal (PRD §6.5)

- Message: "We'll call you at [phone] to confirm your order."
- Order ID displayed
- "Continue Shopping" button

---

## Edge Cases

- Locked store: storefront stays fully operational, orders still saved with status "new"
- 0 products: empty catalog with hero section still visible
- Invalid slug: 404 page

---

## Algerian Geographic Data

### Wilaya Dropdown Requirements
- Display format: `"1 - Adrar - أدرار"` (Number - French Name - Arabic Name)
- All 58 wilayas included
- Data sourced from official Algerian administrative divisions

### Commune (Baladia) Dropdown Requirements
- Dependent on selected wilaya
- Each wilaya has multiple communes
- Used for precise delivery location

### Phone Validation
- Algerian format: `05XX XXX XXX` or `06XX XXX XXX` or `07XX XXX XXX`
- 10 digits starting with 05 or 06 or 07
- Validation error message in Arabic/French

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
