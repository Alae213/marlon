# Feature: Public Storefront Catalog

> **Status:** `in-progress`
> **Phase:** v1
> **Last updated:** 2026-04-18

---

## Summary

The public catalog at `app/[slug]/page.tsx` is a live browseable storefront route. Current: it resolves the store by slug, then client-fetches navbar, hero, footer, and product data as a snapshot in `useEffect` with `convex.query(...)`, and renders a polished hero plus a simple product grid that links into the PDP. Partial: it is not a live SSR/ISR storefront, and some surrounding nav/footer chrome is still placeholder or drifting.

---

## Users

- Anonymous shoppers landing on a store slug and browsing available products.
- Returning shoppers reopening the same storefront from a browser that may already have local cart state.

---

## User Stories

- As an anonymous shopper, I want to open a store slug and see its current products so that I can decide what to buy.
- As an anonymous shopper, I want to move from the catalog into a product page and optionally open the cart so that I can continue toward checkout.

---

## Behaviour

### Happy Path

1. `app/[slug]/page.tsx` reads `slug` from the route, resolves the store via `useQuery(api.stores.getStoreBySlug, ...)`, and wraps the page in `CartProvider`.
2. Once `store._id` is available, the page loads navbar, hero, footer, and product snapshot data with `convex.query(api.siteContent.getSiteContentResolved, ...)` and `convex.query(api.products.getProducts, ...)` inside `useEffect`.
3. The page renders a hero section with default fallback content when the hero section is missing, a product grid linking to `/${slug}/product/${product._id}`, and a lazily mounted `CartSidebar` after the shopper opens the cart.

### Edge Cases & Rules
- Current: the catalog is client-rendered snapshot content, not SSR, ISR, or a live Convex subscription storefront; public data refreshes on page load, not continuously.
- Current: product cards come from `api.products.getProducts` in `convex/products.ts`, which returns active and legacy-unset products but excludes records explicitly archived with `isArchived: true`.
- Current: when no products are returned, the page shows `No products available`.
- Partial: navbar labels are hardcoded `Shop`, `FAQ`, and `Help` spans in `app/[slug]/page.tsx`; they do not navigate anywhere.
- Current: the hero CTA button uses the shared button component and smoothly scrolls to the `#products` anchor.
- Current: the hero supports multiline title text, separate title/CTA colors, shared alignment, one responsive background image, focal positioning, zoom, and a bottom white fade for readability; typography is locked to the Inter-only five-scale system (`text-display` for the headline and shared UI scales elsewhere).
- Partial: footer rendering is legacy/drifting; it uses a few footer fields but still repeats the same placeholder labels instead of store-managed navigation.

---

## Connections

This route is the public entry point for storefront browsing.

- **Depends on:** `app/[slug]/page.tsx`, `convex/stores.ts`, `convex/siteContent.ts`, `convex/products.ts`
- **Triggers:** `public-product-detail.md`, `cart-sidebar.md`
- **Shares data with:** `storefront-content-rendering.md` for public content sections and `contexts/cart-context.tsx` for cart badge state

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Catalog rendering | Current: client-side snapshot fetch in `app/[slug]/page.tsx` | SSR/ISR or another explicitly supported public rendering model |
| Product discovery | Current: simple grid of all active products | Search, filters, categories, merchandising, and pagination |
| Hero polish | Current: improved spacing, contrast overlays, responsive composition, product-scroll CTA, and locked Inter-only five-scale typography | Stronger typed public contracts and a more explicit caching strategy |
| Navigation chrome | Partial: placeholder labels and drifting footer content remain | Fully wired store-managed navigation and CTA destinations |
| Cart entry | Current: badge and sidebar open from the catalog when navbar content allows it | Store-scoped cart UX with stronger continuity across pages |

---

---

## Security Considerations

- Current: public browsing depends on unauthenticated reads in `convex/stores.ts`, `convex/siteContent.ts`, and `convex/products.ts`; this is by design for storefront access, but the payloads are broader than a minimal public contract.
- Partial: `getStoreBySlug` returns the raw store document, not a narrowed public shape. The doc should not claim tenant-safe field minimization that is not implemented.
- Partial: generic public site-content reads return whole section records via `getSiteContentResolved`; keep documentation aligned with the fact that these reads are not yet hardened to least-privilege payloads.
- Current: browsing itself does not require auth, but any write path reached from this surface still needs server-side authorization. Do not describe future admin/staff policy layers as live.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T11 | `[ ]` | Add explicit minimal public queries for storefront slug, content, pricing, and products instead of returning broad raw records |
| T12 | `[~]` | Replace placeholder public navbar and footer affordances with real links/actions or remove them from runtime; the catalog hero CTA now scrolls to products |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** Not recorded in repo

**Outcome:** Current code confirms public browsing is implemented, but this doc update did not add a browser test record.

## Open Questions

- None currently. The main gaps here are confirmed implementation gaps, not unresolved product questions.

---

## Notes

- The cart sidebar is mounted only after the shopper opens it once via `hasOpenedCart` in `app/[slug]/page.tsx`.
- Text content is rendered through normal React escaping, and the hero title/CTA text are additionally stripped of HTML tags before display in `app/[slug]/page.tsx`.
- The products grid now exposes a stable `products` anchor so the hero CTA has a real scroll target.

---

## Archive

<!-- No archived notes yet. -->
