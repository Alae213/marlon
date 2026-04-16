# Feature: Checkout and Order Submission

> **Status:** `in-progress`
> **Phase:** v1
> **Last updated:** 2026-04-16

---

## Summary

Public checkout UI exists in two places: the PDP "Buy Now" dialog in `app/[slug]/product/[productId]/page.tsx` and the cart drawer checkout flow in `components/features/cart/cart-sidebar.tsx`. Current: both flows collect customer details, validate Algerian phone numbers on the client, estimate delivery, and build order payloads. Partial: neither flow is truly live for anonymous shoppers because both call `api.orders.createOrder`, and `convex/orders.ts:createOrder` currently requires authenticated store-owner access.

---

## Users

- Anonymous shoppers trying to place a cash-on-delivery style order from the PDP or cart.
- Store owners indirectly relying on this flow to generate public orders, even though the current runtime path is not anonymous-safe.

---

## User Stories

- As an anonymous shopper, I want to submit my name, phone, location, and delivery preference so that the store can process my order.
- As a store owner, I want public checkout submissions to create real orders through a safe server path so that storefront browsing can convert into actual order records.

---

## Behaviour

### Happy Path

1. The shopper opens checkout either from the PDP dialog or from the cart drawer and fills name, phone, wilaya, optional commune, optional address, and delivery type.
2. The UI formats and validates the phone number with `formatPhoneInput` and `validateAlgerianPhone`, then computes subtotal, delivery, and total on the client.
3. The UI calls `useMutation(api.orders.createOrder)` with the built payload. In the current runtime, that mutation only succeeds for an authenticated owner of the target store.

### Edge Cases & Rules
- Current: the live public UI does not use `app/api/orders/create/route.ts`; that route is a mock-only stub and is unused by the storefront.
- Partial: anonymous shoppers cannot truly submit orders today because `convex/orders.ts:createOrder` rejects unauthenticated users and non-owners.
- Current: checkout requires name, phone, and wilaya in the UI before the submit button enables; commune and address remain optional, with address effectively needed only for domicile delivery.
- Current: delivery pricing is publicly read and then duplicated with client fallbacks, so the final amount shown to shoppers can depend on local fallback logic as well as stored pricing records.
- Partial: the PDP and cart flows duplicate most checkout logic instead of sharing one canonical public order path.
- Partial: the PDP success screen uses a freshly generated order number after submission instead of reusing the number sent in the mutation payload.

---

## Connections

This feature is the write-side bridge from public browsing into order management, but that bridge is incomplete today.

- **Depends on:** `app/[slug]/product/[productId]/page.tsx`, `components/features/cart/cart-sidebar.tsx`, `convex/orders.ts`, `lib/phone-validation.ts`
- **Triggers:** `context/features/Order_Management/orders-list-and-filters.md` once an order is actually created
- **Shares data with:** `public-product-detail.md`, `cart-sidebar.md`, `convex/stores.ts`

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Checkout surfaces | Current: PDP dialog and cart drawer forms exist | One intentional public checkout architecture |
| Order submission | Partial: UI calls a real mutation, but that mutation is owner-only | Anonymous-safe order creation with server validation and abuse controls |
| Delivery pricing | Partial: public reads plus duplicated UI fallbacks | One canonical public quote/order pricing path |
| Runtime status | Partial: browseable storefront with non-live anonymous checkout | End-to-end anonymous order placement that creates real owner-visible orders |

---

---

## Security Considerations

- Current: `convex/orders.ts:createOrder` fails closed by requiring authenticated owner access. This blocks anonymous public checkout, but it is safer than exposing an unauthenticated write without server checks.
- Partial: the current public checkout attempts send customer PII from the browser, yet there is no dedicated anonymous-safe server entry point with durable rate limiting, spam resistance, or narrow public validation documented in the repo.
- Current: store authorization on the write path is based on server-side `store.ownerId` checks, not slug or client claims. Do not describe a public policy layer that does not exist.
- Partial: delivery totals are computed client-side from publicly readable pricing plus fallbacks, so the displayed amount is not yet a hardened server-owned quote.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T9 | `[ ]` | Build a real anonymous public order submission path with server-side validation and abuse controls, and stop calling owner-only `api.orders.createOrder` from public UI |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** Not recorded in repo

**Outcome:** The repo shows checkout UI and payload construction, but anonymous order submission is not live in the current runtime and there is no browser verification record here.

## Open Questions

- Which server entry point should own future anonymous checkout: a dedicated public Convex mutation, a hardened Next route, or another server path? The current repo contains an owner-only mutation and an unused mock route.

---

## Notes

- The owner-only mutation behavior explains why these docs describe checkout as Partial even though the forms and confirmation states exist in the UI.
- `app/api/orders/create/route.ts` should not be treated as a fallback implementation; it currently returns mock success only and is not wired into the public pages.

---

## Archive

<!-- No archived notes yet. -->
