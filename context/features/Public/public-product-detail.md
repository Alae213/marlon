# Feature: Public Product Detail

> **Status:** `in-progress`
> **Phase:** v1
> **Last updated:** 2026-04-24

---

## Summary

The PDP at `app/[slug]/product/[productId]/page.tsx` is a live browse experience for anonymous shoppers. Current: it loads the store, navbar snapshot, delivery pricing, and the store's product list on the client, finds the requested product in memory, and supports quantity changes, variant selection, add-to-cart, and a direct "Buy Now" dialog. Direct "Buy Now" now submits through `POST /api/orders/create` and stores real anonymous orders.

---

## Users

- Anonymous shoppers reviewing a single product before buying or adding it to cart.
- Shoppers comparing variants, delivery costs, and related products within one storefront.

---

## User Stories

- As an anonymous shopper, I want to inspect one product's images, details, and variants so that I can decide whether it fits my needs.
- As an anonymous shopper, I want to add a product to cart or attempt a direct order so that I can continue toward purchase.

---

## Behaviour

### Happy Path

1. `app/[slug]/product/[productId]/page.tsx` resolves `slug`, loads the store with `api.stores.getStoreBySlug`, then client-fetches navbar content, delivery pricing, and the store product list with `convex.query(...)` inside `useEffect`.
2. The page finds the requested product from the fetched product array, renders images with `ImageCarousel`, shows price/details/variants, and lets the shopper change quantity or add the item to cart.
3. If the shopper uses `Buy Now`, the dialog collects customer details and submits product ID, quantity, variant, store slug, delivery type, and an idempotency key to `POST /api/orders/create`.

### Edge Cases & Rules
- Current: the PDP does not use a dedicated public `getProduct` query. It loads the store's product list and finds the requested item in memory.
- Current: if the product is missing from the fetched list, the page shows `Product not found`.
- Current: related products are just the first four other products from the same loaded array; there is no category or relevance logic.
- Partial: selected variant labels are stored in `selectedVariants` and passed into cart/order payloads, but `priceModifier` values are ignored, so displayed totals still use `basePrice` only.
- Current: delivery pricing is looked up by Arabic wilaya name first, then wilaya number, with UI fallbacks of `400` DZD for stopdesk and `600` DZD for domicile when no store pricing record matches.
- Current: the success state uses the order number returned by the server.
- Current: client-side totals are still shown as estimates; the saved order total is server-computed.

---

## Connections

This feature sits between catalog browsing, cart state, and public checkout.

- **Depends on:** `app/[slug]/product/[productId]/page.tsx`, `convex/stores.ts`, `convex/products.ts`, `components/features/shared/image-carousel.tsx`
- **Triggers:** `cart-sidebar.md`, `checkout-and-order-submission.md`
- **Shares data with:** `contexts/cart-context.tsx`, `lib/phone-validation.ts`, `components/features/shared/wilaya-select.tsx`

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Product loading | Current: client-fetched store product array, then in-memory lookup | Dedicated minimal public product query with stronger loading/error handling |
| Variant handling | Partial: variant labels can be selected and stored | Variant pricing and stock logic affect totals and availability consistently |
| Delivery estimate | Current: publicly readable pricing with fallback defaults | One canonical priced quote path without duplicated fallback logic |
| Direct order flow | Current: anonymous checkout succeeds through a real public-safe server path | Checkout attempt recovery and richer fake-order controls |

---

---

## Security Considerations

- Current: product browsing uses unauthenticated public reads. `getStoreBySlug` and the fetched product array are broader payloads than a minimal public contract, so do not document them as hardened public DTOs.
- Current: the page submits customer PII to `POST /api/orders/create`; server-side phone validation and abuse controls are enforced in `createPublicOrder`.
- Policy-locked: owner-only access is the live write model in `context/developer/SECURITY.md`. Do not describe future admin/staff/public policy layers as already implemented.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T9 | `[x]` | Build a real anonymous public order submission path with server-side validation and abuse controls, and stop calling owner-only `api.orders.createOrder` from public UI |
| T13 | `[ ]` | Apply product variant price modifiers consistently in PDP pricing, cart totals, and submitted public order lines |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** Not recorded in repo

**Outcome:** Current code shows the PDP browse path is implemented, but there is no recorded browser verification for the live public runtime.

## Open Questions

- None currently. The path is a hardened Next route backed by a dedicated public Convex mutation.

---

## Notes

- `FIXED_NAVBAR_LINKS` in `app/[slug]/product/[productId]/page.tsx` still points `FAQ` and `Help` to `/`, so the PDP navbar is only partially real.
- The page uses the same public delivery-pricing matching and fallback approach as `components/features/cart/cart-sidebar.tsx`, so pricing behavior is duplicated across two public checkout entry points.

---

## Archive

<!-- No archived notes yet. -->
