# Feature: Anonymous Public Checkout Gap

> **Status:** `complete`
> **Phase:** v1.1
> **Last updated:** 2026-04-24

---

## Summary

Anonymous public checkout now has a real write path. Current: both the PDP flow in `app/[slug]/product/[productId]/page.tsx` and the cart checkout flow in `components/features/cart/cart-sidebar.tsx` call `POST /api/orders/create`, which delegates to `convex/orders.ts:createPublicOrder`. The owner-only `convex/orders.ts:createOrder` remains for merchant-created orders only.

---

## Users

- Anonymous shoppers trying to buy from the public storefront.
- Store owners expecting public checkout submissions to turn into real orders.

---

## User Stories

- As an anonymous shopper, I want checkout to submit through a real public-safe server path so my order is actually created.
- As a store owner, I want storefront confirmation details to match the order payload that was submitted.

---

## Behaviour

### Happy Path

1. A shopper opens checkout from the PDP or cart sidebar and fills the public order form.
2. The UI sends product IDs, quantities, variants, store slug, customer fields, delivery type, and an idempotency key to `POST /api/orders/create`.
3. The route strips client-supplied prices/totals and calls `api.orders.createPublicOrder`.
4. Convex resolves store/product data, validates phone and product ownership, computes totals, blocks recent duplicates/velocity abuse, and creates the order.

### Edge Cases & Rules
- `Current`: the live public UI calls `app/api/orders/create/route.ts`; that route is now real.
- `Current`: public checkout UI no longer calls the owner-only mutation.
- `Current`: `convex/orders.ts:createOrder` rejects missing auth with `Unauthorized` and rejects non-owners with `Forbidden`.
- `Current`: both PDP and cart confirmation states use the server-returned order number.
- `Current`: T9 is complete.

---

## Connections

This gap sits between public storefront UI and owner-scoped order creation.

- **Depends on:** `app/[slug]/product/[productId]/page.tsx`, `components/features/cart/cart-sidebar.tsx`, `convex/orders.ts`, `app/api/orders/create/route.ts`
- **Triggers:** order creation for `context/features/Public/checkout-and-order-submission.md`
- **Shares data with:** `context/features/Public/public-product-detail.md`, `context/features/Public/cart-sidebar.md`, `context/features/Public/checkout-and-order-submission.md`

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Public checkout UI | `Current`: PDP and cart checkout forms exist | `Current`: keep one intentional public checkout architecture |
| Anonymous write path | `Current`: anonymous-safe server path with validation and abuse controls | `Current`: owner-only mutation remains separate |
| Fallback route | `Current`: mock route replaced by real public route | `Current`: no mock success path remains |
| Confirmation number | `Current`: confirmation uses the stored server order number | `Current`: same behavior for PDP and cart |

---

---

## Security Considerations

- `Current`: the owner-only mutation still fails closed for merchant-created orders.
- `Current`: anonymous checkout has a dedicated server-owned route/mutation pair with server-side validation and lightweight spam controls.
- `Current`: client-supplied price and total fields are ignored.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T9 | `[x]` | Build a real anonymous public order submission path with server-side validation and abuse controls, and stop calling owner-only `api.orders.createOrder` from public UI. |
| T28 | `[x]` | Fix the PDP success state so it reuses the submitted order number instead of generating a second confirmation number. |

---

---

## User Acceptance Tests

**UAT Status:** `programmatic-pass`

**Last tested:** 2026-04-24

**Outcome:** Targeted public checkout route/mutation tests pass; no browser UAT was run.

## Open Questions

- None. The implemented boundary is `POST /api/orders/create` plus `api.orders.createPublicOrder`.

---

## Notes

- Main implementation references: `app/[slug]/product/[productId]/page.tsx`, `components/features/cart/cart-sidebar.tsx`, `convex/orders.ts`, `convex/schema.ts`, `app/api/orders/create/route.ts`.

---

## Archive

None.
