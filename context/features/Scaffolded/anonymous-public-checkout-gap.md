# Feature: Anonymous Public Checkout Gap

> **Status:** `in-progress`
> **Phase:** v1.1
> **Last updated:** 2026-04-16

---

## Summary

Anonymous public checkout looks present in the storefront UI, but the write path is still blocked by owner-only backend rules. Current: both the PDP flow in `app/[slug]/product/[productId]/page.tsx` and the cart checkout flow in `components/features/cart/cart-sidebar.tsx` call `api.orders.createOrder` directly from public UI. Partial: `convex/orders.ts:createOrder` requires authenticated store-owner access and rejects missing auth or non-owners, so anonymous shoppers cannot actually complete live order creation. There is also an unused mock route at `app/api/orders/create/route.ts`, and the PDP success UI regenerates a confirmation number instead of reusing the submitted one.

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
2. The UI builds an order payload and calls `api.orders.createOrder` from the browser.
3. `convex/orders.ts:createOrder` checks auth and store ownership, so the write only succeeds for an authenticated owner of that store, not an anonymous shopper.

### Edge Cases & Rules
- `Current`: the live public UI never calls `app/api/orders/create/route.ts`; that route is a mock-only stub.
- `Partial`: public checkout UI exists in two places, but both currently use an owner-only mutation.
- `Current`: `convex/orders.ts:createOrder` rejects missing auth with `Unauthorized` and rejects non-owners with `Forbidden`.
- `Partial`: the PDP generates one order number for submission, then generates a different one again for the confirmation screen.
- `Current`: cart checkout stores and reuses the submitted order number correctly inside the success state.
- `Planned`: the main fix is already tracked as `T9` in `context/project/TASK-LIST.md`.

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
| Anonymous write path | `Partial`: public UI calls an owner-only mutation | `Planned`: anonymous-safe server path with validation and abuse controls |
| Fallback route | `Current`: unused mock route only | `Planned`: real server-owned entry point or remove the stub |
| Confirmation number | `Partial`: PDP shows a regenerated number after success | `Current`: confirmation uses the exact submitted order number |

---

---

## Security Considerations

- `Current`: the owner-only mutation fails closed, which prevents anonymous abuse but also means public checkout is not actually live.
- `Partial`: there is still no dedicated anonymous-safe submission surface with server-side validation, rate limiting, or spam controls.
- `Current`: the mock Next route must not be treated as production checkout because it returns fake success only.
- `Policy-locked`: do not make public order creation client-trusted; the eventual anonymous path must stay server-owned.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T9 | `[ ]` | Build a real anonymous public order submission path with server-side validation and abuse controls, and stop calling owner-only `api.orders.createOrder` from public UI. |
| T28 | `[ ]` | Fix the PDP success state so it reuses the submitted order number instead of generating a second confirmation number. |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** -

**Outcome:** No browser UAT result is recorded in repo-backed context. Source review shows public checkout UI is present, but anonymous order creation is not live.

## Open Questions

- Should the eventual public submission path live in Convex, a hardened Next route, or another server-owned boundary?

---

## Notes

- Main implementation references: `app/[slug]/product/[productId]/page.tsx`, `components/features/cart/cart-sidebar.tsx`, `convex/orders.ts`, `app/api/orders/create/route.ts`.
- This doc reuses `T9` for the primary fix and records the PDP confirmation-number mismatch as a narrower follow-up.

---

## Archive

None.
