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
- [x] Fix cart modal width (too small)
- [x] Auto-open cart modal when adding product to cart
- [x] Ensure cart icon click also opens modal

---

## Phase 2: Hero Section (Priority: HIGH)

### Tasks
- [x] Render hero section on catalog page from site content editor
- [x] Support all layout options (left/center/right)
- [x] Display CTA button with link

---

## Phase 3: Footer (Priority: HIGH)

### Tasks
- [x] Add footer to catalog page
- [x] Add footer to product detail page
- [x] Display contact info, social links, logo from site content

---

## Phase 4: Wilaya & Commune Dropdowns (Priority: HIGH)

### Tasks
- [x] Create algeria-data.ts with all 58 wilayas
- [x] Include wilaya number, French name, Arabic name
- [x] Add commune data per wilaya
- [x] Implement wilaya dropdown component
- [x] Implement dependent commune dropdown
- [x] Update order forms (Buy Now, Checkout)

---

## Phase 5: Delivery Cost Calculation (Priority: HIGH)

### Tasks
- [x] Pull delivery prices from store's delivery pricing table
- [x] Calculate cost based on wilaya + delivery type (stopdesk/domicile)
- [x] Display real-time delivery cost in checkout summary

---

## Phase 6: Product Image Carousel (Priority: MEDIUM)

### Tasks
- [x] Implement image carousel/slider on product detail page
- [x] Support multiple product images
- [x] Add navigation arrows and dots
- [x] Touch/swipe support for mobile

---

## Phase 7: Related Products Section (Priority: MEDIUM)

### Tasks
- [x] Fetch related products from same store (exclude current)
- [x] Display as mini product cards
- [x] Add to product detail page

---

## Phase 8: Phone Validation (Priority: MEDIUM)

### Tasks
- [x] Add Algerian phone format validation (05XX/06XX/07XX  XXX XXX)
- [x] Show error message for invalid format
- [x] Apply to both Buy Now and Checkout forms
