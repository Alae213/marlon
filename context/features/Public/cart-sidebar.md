# Feature: Cart Sidebar

> **Status:** `in-progress`
> **Phase:** v1
> **Last updated:** 2026-04-16

---

## Summary

The cart drawer in `components/features/cart/cart-sidebar.tsx` is the live public cart UI for storefront browsing. Current: it renders cart contents, quantity controls, a checkout form, total calculations, and a success state, with state stored in `contexts/cart-context.tsx`. Partial: cart persistence is global to the browser under one `localStorage` key, and the final order submission still relies on an owner-only mutation, so anonymous checkout from the cart is not truly live.

---

## Users

- Anonymous shoppers adding products from the catalog or PDP and reviewing them before checkout.
- Returning shoppers whose browser may reopen with previous cart state already persisted locally.

---

## User Stories

- As an anonymous shopper, I want to review and adjust my selected items in one place so that I can confirm the right order before checkout.
- As an anonymous shopper, I want the cart to persist in my browser so that I do not lose my selection if I refresh or revisit.

---

## Behaviour

### Happy Path

1. `CartProvider` in `contexts/cart-context.tsx` hydrates cart items from `localStorage`, exposes add/update/remove helpers, and tracks drawer open state.
2. `CartSidebar` renders either the cart view, the checkout form, or the success state based on local component state in `components/features/cart/cart-sidebar.tsx`.
3. The shopper can edit quantities, remove lines, continue into checkout, and attempt order submission through `useMutation(api.orders.createOrder)`.

### Edge Cases & Rules
- Current: `addItem` merges lines by `productId` plus `variant`; it does not create duplicate rows for the same product/variant combination.
- Current: setting a quantity to `0` or below removes the item from the cart.
- Current: cart totals are computed entirely client-side from local state, then the drawer adds a public delivery estimate to produce the final total.
- Partial: cart persistence uses the global `localStorage` key `cart` in `contexts/cart-context.tsx`, so a shopper can carry items across different storefront slugs in the same browser.
- Current: delivery pricing is queried publicly with `api.stores.getDeliveryPricing` and falls back to `400` or `600` DZD when no matching wilaya pricing record is found.
- Partial: the success state is only reachable if the owner-scoped order mutation succeeds, so the UI overstates runtime readiness for anonymous users.

---

## Connections

This feature is shared by the catalog and PDP public routes.

- **Depends on:** `components/features/cart/cart-sidebar.tsx`, `contexts/cart-context.tsx`, `convex/orders.ts`
- **Triggers:** `checkout-and-order-submission.md`
- **Shares data with:** `public-storefront-catalog.md`, `public-product-detail.md`, `lib/phone-validation.ts`

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Persistence | Partial: browser persistence exists, but it is global and not store-scoped | Per-store cart state with clear isolation rules |
| Quantity editing | Current: add, increment, decrement, and remove are implemented | Better stock awareness and richer cart validation |
| Checkout handoff | Current: cart launches its own checkout form in the drawer | Dedicated, reliable public checkout surface |
| Submission outcome | Partial: UI has a success state, but anonymous order submission is not truly live | Anonymous orders submit through a real public-safe server path |

---

---

## Security Considerations

- Current: cart contents live in browser `localStorage`, so they should be treated as client-controlled state, not a trusted order source.
- Partial: because the storage key is global, cart contents are not isolated per storefront. This is a data-integrity/runtime issue even though it does not expose server secrets.
- Partial: the cart checkout form collects customer PII in the browser and then attempts an owner-only mutation. The server fails closed, but the current public flow still lacks a real anonymous-safe write path with abuse controls.
- Policy-locked: public checkout must not be documented as authorized by future role models. The live server write model is still owner-only in `convex/orders.ts`.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T9 | `[ ]` | Build a real anonymous public order submission path with server-side validation and abuse controls, and stop calling owner-only `api.orders.createOrder` from public UI |
| T10 | `[ ]` | Scope cart persistence by storefront so one store does not reuse another store's local cart state |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** Not recorded in repo

**Outcome:** Live code confirms the cart drawer UI exists, but there is no recorded browser validation for the current anonymous runtime.

## Open Questions

- None currently. The known issues here are concrete implementation gaps already visible in code.

---

## Notes

- `CartSidebar` uses one component for three states: cart contents, checkout form, and success confirmation.
- The sidebar title and some empty-state copy are Arabic today, while the checkout form labels are English, so the public cart experience is linguistically mixed.

---

## Archive

<!-- No archived notes yet. -->
