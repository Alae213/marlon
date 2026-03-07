# Public Storefront Tasks

## Completed

### Catalog Page
- [x] Build fixed navbar (logo, links, cart icon)
- [x] Implement hero section from site content
- [x] Create product grid with images, names, prices
- [x] Add product card hover effects

### Product Detail Page
- [x] Build image gallery with carousel
- [x] Implement variant selector buttons
- [x] Add quantity selector
- [x] Create order form with validation (Algerian phone format)
- [x] Implement wilaya/commune dependent dropdowns
- [x] Add "Buy Now" primary CTA with inline order form
- [x] Wire Buy Now to direct Convex order creation (no cart)
- [x] Ensure Buy Now and Add to Cart are visually distinct
- [x] Related products section (mini cards from same store)

### Cart & Checkout
- [x] Build cart sidebar with item management
- [x] Implement quantity adjustment and remove functionality
- [x] Create checkout popup with delivery cost calculation
- [x] Add order summary (subtotal, delivery, total)
- [x] Implement COD payment flow

### Order Confirmation
- [x] Build confirmation page with order ID
- [x] Add "Continue Shopping" button

---

## Phase 1: Cart Modal Fixes (Priority: HIGH)

### Tasks
- [ ] Fix cart modal width (too small)
- [ ] Auto-open cart modal when adding product to cart
- [ ] Ensure cart icon click also opens modal

---

## Phase 2: Hero Section (Priority: HIGH)

### Tasks
- [ ] Render hero section on catalog page from site content editor
- [ ] Support all layout options (left/center/right)
- [ ] Display CTA button with link

---

## Phase 3: Footer (Priority: HIGH)

### Tasks
- [ ] Add footer to catalog page
- [ ] Add footer to product detail page
- [ ] Display contact info, social links, logo from site content

---

## Phase 4: Wilaya & Commune Dropdowns (Priority: HIGH)

### Tasks
- [ ] Create algeria-data.ts with all 58 wilayas
- [ ] Include wilaya number, French name, Arabic name
- [ ] Add commune data per wilaya
- [ ] Implement wilaya dropdown component
- [ ] Implement dependent commune dropdown
- [ ] Update order forms (Buy Now, Checkout)

---

## Phase 5: Delivery Cost Calculation (Priority: HIGH)

### Tasks
- [ ] Pull delivery prices from store's delivery pricing table
- [ ] Calculate cost based on wilaya + delivery type (stopdesk/domicile)
- [ ] Display real-time delivery cost in checkout summary

---

## Phase 6: Product Image Carousel (Priority: MEDIUM)

### Tasks
- [ ] Implement image carousel/slider on product detail page
- [ ] Support multiple product images
- [ ] Add navigation arrows and dots
- [ ] Touch/swipe support for mobile

---

## Phase 7: Related Products Section (Priority: MEDIUM)

### Tasks
- [ ] Fetch related products from same store (exclude current)
- [ ] Display as mini product cards
- [ ] Add to product detail page

---

## Phase 8: Phone Validation (Priority: MEDIUM)

### Tasks
- [ ] Add Algerian phone format validation (05XX/06XX/07XX  XXX XXX)
- [ ] Show error message for invalid format
- [ ] Apply to both Buy Now and Checkout forms
