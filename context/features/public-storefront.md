# Feature: Public Storefront

> **Status:** `complete`
> **Phase:** v1
> **Last updated:** 2026-04-10

---

## Summary

The public storefront is what customers see when they visit a merchant's store. It includes a product catalog, product detail pages, shopping cart, and checkout flow with COD-specific fields for Algeria (wilaya, commune, address). Access via `/[storeSlug]` and `/[storeSlug]/product/[productId]`.

---

## Users

- **Primary**: End customers (Buyers)
- **When**: To browse products, add to cart, place orders
- **Journey**: Visit store → Browse products → View product → Add to cart → Checkout → Order confirmation

---

## User Stories

- As a customer, I want to browse products so I can see what's available
- As a customer, I want to see product details (images, description, variants) so I can decide what to buy
- As a customer, I want to add items to cart so I can buy multiple products
- As a customer, I want to place a COD order so I can pay when I receive my order
- As a customer, I want to see delivery costs calculated in real-time so I know the total

---

## Behaviour

### Happy Path

1. **Catalog Page** (`/[storeSlug]`)
   - Fixed navbar (logo, Shop/FAQ/Help links, cart icon)
   - Hero section (from site content)
   - Product grid: main image, name, price, old price

2. **Product Detail Page** (`/[storeSlug]/product/[productId]`)
   - Fixed navbar
   - Image gallery (carousel)
   - Name, price, old price, rich text description
   - Variant selector (buttons)
   - Quantity selector
   - Order form: Full Name, Phone (Algerian format), Delivery Type, Wilaya, Commune, Address (if Domicile)
   - "Buy Now" button (primary)
   - "Add to Cart" button

3. **Cart Sidebar**
   - Item list: image, name, variant, quantity (+/-), price, remove
   - Subtotal (products only)
   - "Proceed to Checkout" button

4. **Checkout Popup**
   - Form: Full Name, Phone, Delivery Type, Wilaya, Commune, Full Address (if Domicile)
   - Real-time delivery cost (based on merchant's per-store pricing)
   - Order summary: subtotal + delivery + total
   - Payment method: "Cash on Delivery" (read-only)
   - "Place Order" button

5. **Order Confirmation**
   - "We'll call you at [phone] to confirm your order."
   - Order ID displayed
   - "Continue Shopping" button

### Edge Cases & Rules

- **0 products**: Show "No products available" message
- **Out of stock**: Not in MVP (inventory tracking out of scope)
- **Phone validation**: Algerian format (starts with 05xx, 06xx, 07xx)
- **Commune depends on Wilaya**: Cascading dropdown

---

## Connections

- **Depends on**: Store Editor (products, site content, delivery pricing)
- **Triggers**: Order creation → Orders Management
- **Shares data with**: Store Editor (site content), Orders (customer data)

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Mobile optimized | Basic | Full |
| Image lazy loading | Not implemented | Implemented |
| Guest checkout | Required | Optional account |

---

## Security Considerations

- Auth required: No (public storefront)
- Input validation: Phone format, required fields
- Rate limiting: None at this level
- Sensitive data: None stored on storefront (orders sent to Convex)

---

## Tasks

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T17 | [x] | Catalog page with product grid |
| T18 | [x] | Product detail page with variants |
| T19 | [x] | Shopping cart (localStorage) |
| T20 | [x] | Checkout flow (Algeria-specific fields) |
| T21 | [x] | Delivery cost calculation |
| T22 | [x] | Order confirmation page |

---

## UAT Status

**UAT Status:** `passed`

**Last tested:** 2026-04-10

**Outcome:** All storefront features working - catalog, product, cart, checkout, confirmation

---

## Open Questions

- [ ] Need image lazy loading for performance?
- [ ] Any SEO requirements?

---

## Notes

- Implementation follows PRD: COD only, Algeria-specific fields (wilaya/commune), real-time delivery cost
- Phone validation: Algerian format (05xx, 06xx, 07xx)
- Cart persists in localStorage
- Delivery cost calculated from store's delivery pricing table