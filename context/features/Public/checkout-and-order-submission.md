# Feature: Checkout and Order Submission

> **Status:** `current`
> **Phase:** v1
> **Last updated:** 2026-04-27

---

## Summary

Public checkout UI exists in two places: the PDP "Buy Now" dialog in `app/[slug]/product/[productId]/page.tsx` and the cart drawer checkout flow in `components/features/cart/cart-sidebar.tsx`. Current: both flows start a lightweight anonymous checkout attempt through `POST /api/checkout-attempts`, then submit to `POST /api/orders/create`, which calls `convex/orders.ts:createPublicOrder` without owner auth and creates real orders through a server-owned validation path.

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

1. The shopper opens checkout either from the PDP dialog or from the cart drawer; the UI creates an attempt key and calls `POST /api/checkout-attempts` with `action=start`, store slug, and product summary.
2. The shopper fills name, phone, wilaya, optional commune, optional address, and delivery type.
3. The UI formats and validates the phone number with `formatPhoneInput` and `validateAlgerianPhone`, then sends customer fields, delivery type, product IDs, quantities, variants, store slug, idempotency key, and checkout attempt key to `POST /api/orders/create`.
4. The route strips client-supplied prices/totals and calls `api.orders.createPublicOrder`.
5. `createPublicOrder` resolves the store by slug, validates phone/product ownership, computes product subtotal, delivery cost, and total server-side, stamps lightweight risk flags when prior order history warrants it, marks the checkout attempt `submitted`, writes the order, digest, and timeline entry, links the attempt, marks it `converted`, updates store order count/billing state, and returns the stored order number.

### Edge Cases & Rules
- Current: the live public UI uses `app/api/orders/create/route.ts`; the old mock route has been replaced.
- Current: anonymous shoppers can submit real orders without calling owner-only `api.orders.createOrder`.
- Current: checkout requires name, phone, and wilaya in the UI before the submit button enables; commune and address remain optional, with address effectively needed only for domicile delivery.
- Current: delivery pricing is still estimated in the UI, but the saved order amount is computed in `createPublicOrder` from server-resolved product and delivery records.
- Current: duplicate submit protection uses `publicIdempotencyKey` on orders and the `storeIdempotencyKey` index.
- Current: public checkout returns safe shopper feedback for known failures and uses “Order service is temporarily unavailable. Please try again.” for unknown service failures instead of a generic create-order error.
- Current: malformed or Convex-rejected product selections map to “Invalid product selection.” instead of the generic temporary-unavailable message.
- Current: checkout attempts are separate from orders in `checkoutAttempts` with lifecycle `started`, `submitted`, `converted`, `abandoned`, and `recovered`.
- Current: PDP and cart close/cancel paths call `POST /api/checkout-attempts` with `action=abandon` when the checkout did not convert.
- Current: public cart state is scoped per store slug so a cart from one storefront cannot be submitted against another store.
- Current: cart checkout compares cart product IDs against the currently loaded store products and removes unavailable/stale items before starting or submitting checkout.
- Current: recovery hooks exist through `action=recover`; no customer account is required and no order is created for abandoned attempts.
- Current: converted attempts are linked to `orders.checkoutAttemptId` and `checkoutAttempts.convertedOrderId`.
- Current: abuse controls reject malformed payloads, invalid products, recent duplicate orders, excessive per-phone velocity, and excessive per-store velocity.
- Current: accepted orders may carry `riskFlags` for duplicate phone, repeated cancelled/refused history, and high-frequency submissions.
- Current: the PDP success screen uses the stored order number returned by the server.

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
| Order submission | Current: public route plus `createPublicOrder` create real anonymous orders | More durable abuse controls |
| Checkout attempt tracking | Current: anonymous `checkoutAttempts` are created before conversion and linked to final orders | Merchant-facing recovery/analytics dashboard |
| Delivery pricing | Current: UI estimate plus server-owned saved totals | One canonical quote/order pricing path shared by all checkout surfaces |
| Runtime status | Current: end-to-end anonymous order placement creates owner-visible orders | Lead/checkout attempt recovery and richer fraud controls |

---

---

## Security Considerations

- Current: `convex/orders.ts:createOrder` remains owner-only for merchant-created orders.
- Current: anonymous checkout writes go through `createPublicOrder`, which resolves store/product data server-side and ignores client-supplied prices/totals.
- Current: customer PII is sent only in the POST body and stored on the order; route errors avoid echoing PII.
- Partial: abuse controls are implemented in Convex but are still lightweight and not a full fraud/risk engine.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T9 | `[x]` | Build a real anonymous public order submission path with server-side validation and abuse controls, and stop calling owner-only `api.orders.createOrder` from public UI |

---

---

## User Acceptance Tests

**UAT Status:** `programmatic-pass`

**Last tested:** 2026-04-27

**Outcome:** Targeted public order route, public order mutation, cart storage regression, and lint checks pass. Live local API smoke verified a valid `alaa` product creates an order and a fake/stale product ID returns safe `PUBLIC_ORDER_INVALID_PRODUCT` feedback.

## Open Questions

- None currently. The live entry point is `POST /api/orders/create` backed by `api.orders.createPublicOrder`.

---

## Notes

- `app/api/orders/create/route.ts` is the public boundary and strips client-trusted price fields before calling Convex.
- Public checkout error messages are centralized through `lib/order-action-feedback.ts`.
- The cart provider accepts a `storageKey`; public storefront and PDP pages pass `cart:{storeSlug}` to avoid cross-store localStorage leakage.
- Cart checkout receives the current store product IDs and removes stale/unavailable cart entries before `POST /api/orders/create`.
- Browser QA should first confirm Convex functions are synced; stale dev deployments can make `orders:createPublicOrder` unavailable even when local code is correct.
- `convex/orders.ts:createPublicOrder` stores `publicIdempotencyKey` for duplicate-submit protection.
- `app/api/checkout-attempts/route.ts` is the public boundary for `start`, `abandon`, and `recover` attempt lifecycle hooks.
- `convex/orders.ts:startPublicCheckoutAttempt`, `abandonPublicCheckoutAttempt`, and `recoverPublicCheckoutAttempt` write minimal attempt records before order creation.

---

## Archive

<!-- No archived notes yet. -->
