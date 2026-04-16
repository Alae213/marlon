# Feature: Delivery Dispatch From Orders

> **Status:** `in-progress`
> **Phase:** v1
> **Last updated:** 2026-04-16

---

## Summary

Delivery dispatch is live from the orders list and order details drawer. Both send a POST request to `app/api/delivery/create-order/route.ts`, which authenticates the caller, re-resolves store ownership, loads per-store delivery credentials, creates the courier order synchronously, records analytics, and patches tracking/provider data back onto the order. Current: owners can dispatch confirmed orders from Orders. Partial: status progression is split across route and UI layers and is not yet robustly unified.

---

## Users

- Store owners dispatching confirmed COD orders to a configured delivery provider.
- Owners checking whether an order already has courier metadata from the list or drawer.

---

## User Stories

- As a store owner, I want to dispatch confirmed orders directly from the Orders screen so that I do not need a separate courier dashboard for every order.
- As a store owner, I want dispatch attempts to record provider/tracking data and analytics so that I can monitor fulfillment progress.

---

## Behaviour

### Happy Path

1. The owner dispatches from `components/pages/orders/views/ListView.tsx` (`Dispatch All` or `Dispatch Selected`) or from `components/pages/orders/views/OrderDetails.tsx`.
2. The client posts order/customer payload data plus `storeSlug` and provider hint to `app/api/delivery/create-order/route.ts`.
3. The route checks auth, rate-limits requests, resolves the owned store, loads delivery config, records an `attempted` analytics event, calls the provider, records `dispatched` on success, and patches tracking/provider fields via `api.orders.markOrderDispatchedFromDeliveryApi`.
4. The UI then calls `onStatusChange(..., "packaged")` on success, so tracking metadata and status advancement happen in separate steps.

### Edge Cases & Rules

- Current: only authenticated owners of the target store can dispatch; the route rejects mismatched `storeId`/`storeSlug` and non-owner access.
- Current: the route uses an in-memory rate limit per user and client IP.
- Current: provider credentials are loaded server-side; if store credentials are missing, the route can only use emergency fallback secrets when `DELIVERY_ALLOW_GLOBAL_CREDENTIAL_FALLBACK=true`.
- Partial: dispatch success can patch tracking/provider data even if the later UI status update fails.
- Partial: the route records `attempted` and `dispatched` analytics, while status-driven analytics are handled separately in `convex/orders.ts`.
- Current: list bulk dispatch loops requests sequentially in the client; there is no dedicated batch dispatch API.

---

## Connections

This feature joins order management, delivery credentials, and analytics.

- **Depends on:** `components/pages/orders/views/ListView.tsx`, `components/pages/orders/views/OrderDetails.tsx`, `app/api/delivery/create-order/route.ts`, `convex/orders.ts`
- **Triggers:** courier API requests, `api.deliveryAnalytics.recordDeliveryEvent`, tracking metadata patching
- **Shares data with:** `order-status-lifecycle.md`, `orders-list-and-filters.md`

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Dispatch entry points | Current: list and drawer can dispatch | Add more resilient queueing/retry controls |
| Credential loading | Current: owner-scoped runtime credentials with optional emergency fallback | Keep fallback incident-only and minimize operational ambiguity |
| Status progression | Partial: success sets tracking in route, then status in UI | Atomic or centrally orchestrated dispatch/status progression |
| Bulk dispatch | Current: client-side loop over selected/confirmed orders | Dedicated server batch dispatch with consistent side effects |

---

---

## Security Considerations

- Current: `app/api/delivery/create-order/route.ts` re-checks auth and store ownership server-side; UI state alone is never trusted.
- Policy-locked: dispatch access is owner-scoped today. Do not document admin/staff dispatch rights as live.
- Current: delivery credentials stay server-only and are loaded via Convex runtime queries; decrypted secrets are not returned to the browser.
- Current: the route fails closed on missing auth, missing store context, unsupported provider, or missing credentials.
- Current: an in-memory rate limit exists, but per `context/developer/SECURITY.md` it is only a temporary abuse guard, not durable protection.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T6 | `[ ]` | Unify delivery dispatch and status progression so tracking, status, and analytics stay consistent across layers |
| T3 | `[ ]` | Bring bulk/batch behavior to parity with single-order analytics side effects where dispatch changes lifecycle state |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** Not recorded in repo

**Outcome:** Dispatch code is live and repo-backed, but this documentation update did not add a fresh browser validation result.

## Open Questions

- None. The main weakness is known technical split-brain between route success and later status mutation.

---

## Notes

- Successful dispatch returns `trackingNumber` and `deliveryFee` to the caller, but the route itself is responsible for patching courier metadata back to the order.
- The drawer labels the confirmed-state action `Send to delivery company`; the list surfaces `Dispatch All` and `Dispatch Selected` shortcuts.

---

## Archive

<!-- No archived notes yet. -->
