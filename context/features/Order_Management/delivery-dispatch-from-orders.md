# Feature: Delivery Dispatch From Orders

> **Status:** `in-progress`
> **Phase:** v1
> **Last updated:** 2026-04-26

---

## Summary

Delivery dispatch is live from the orders list and order details drawer. Both send a POST request to `app/api/delivery/create-order/route.ts`, which authenticates the caller, re-resolves store ownership, loads the confirmed or legacy `dispatch_ready` order, loads per-store delivery credentials, creates the courier order synchronously, and then records tracking, provider, `dispatched` status, timeline, digest, and dispatch analytics through the server-owned `api.orders.markOrderDispatchedFromDeliveryApi` mutation. Current: owners can dispatch confirmed COD orders from Orders without a separate client-side status mutation, and unauthenticated dispatch attempts return structured `DELIVERY_AUTH_REQUIRED` JSON instead of provider-failure feedback.

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
3. The route checks auth, rate-limits requests, resolves the owned store, loads the order, returns idempotent success if the order already has dispatch metadata, loads delivery config, and calls the provider.
4. On provider success, the route requires a tracking number and calls `api.orders.markOrderDispatchedFromDeliveryApi`, which verifies the order is still confirmed, writes tracking/provider fields, moves the lifecycle to `dispatched`, appends timeline/digest data, and records one `dispatched` analytics event.
5. On provider failure, the route records one failed delivery analytics event and leaves the order status/tracking fields unchanged.

### Edge Cases & Rules

- Current: only authenticated owners of the target store can dispatch; the route rejects mismatched `storeId`/`storeSlug` and non-owner access.
- Current: Clerk middleware runs for `/api/delivery(.*)` so route-level auth can produce structured JSON errors, while merchant page routes such as `/orders(.*)` and `/editor(.*)` redirect to sign-in before unauthorized Convex reads.
- Current: the route uses an in-memory rate limit per user and client IP.
- Current: provider credentials are loaded server-side; if store credentials are missing, the route can only use emergency fallback secrets when `DELIVERY_ALLOW_GLOBAL_CREDENTIAL_FALLBACK=true`.
- Current: successful dispatch is server-owned and no longer depends on a follow-up UI status mutation.
- Current: delivery dispatch failures return structured safe feedback codes; missing setup/credentials includes an `Open Courier settings` action pointing to `/editor/{storeSlug}?settings=integration`.
- Current: duplicate dispatch requests for already-dispatched orders with tracking are idempotent and do not call the courier again.
- Current: confirmed orders that already have tracking/provider metadata from the old split flow are recovered to `dispatched` without creating another courier order.
- Current: old `dispatch_ready` orders without tracking can be dispatched through the same server-owned provider path.
- Current: provider failure leaves the order in its previous valid state.
- Current: `lib/delivery-status-sync.ts` maps live provider statuses into canonical order states, including `refused`, `unreachable`, and `returned`.
- Current: Andrson and Noest are hidden from the settings UI and gated in the dispatch route until live adapters exist.
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
| Status progression | Current: provider success is recorded through one server-owned order mutation that writes tracking and `dispatched` together | More resilient queued dispatch/retry controls |
| Bulk dispatch | Current: client-side loop over selected/confirmed orders, but each request now uses the same server-owned dispatch side effects as single dispatch | Dedicated server batch dispatch with queueing and retry policy |

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
| T6 | `[x]` | Unify delivery dispatch and status progression so tracking, status, and analytics stay consistent across layers |
| T3 | `[x]` | Bring bulk/batch behavior to parity with single-order analytics side effects where dispatch changes lifecycle state |

---

---

## User Acceptance Tests

**UAT Status:** `programmatic-partial`

**Last tested:** 2026-04-26

**Outcome:** Targeted dispatch route, public checkout route, proxy routing regression, and lint checks pass. Fallback browser smoke checks verified unauthenticated `/orders/alaa` and `/editor/alaa?settings=integration` redirect to Clerk sign-in, and unauthenticated delivery dispatch returns `DELIVERY_AUTH_REQUIRED`. Authenticated merchant row/dispatch browser testing still requires a browser session with the merchant logged in.

## Open Questions

- None for Phase 4. Full audit-event normalization and bulk status analytics parity remain later hardening work.

---

## Notes

- Successful dispatch returns `trackingNumber`, `deliveryFee`, and `status` to the caller; Convex is responsible for the lifecycle write and analytics event.
- The drawer labels the confirmed-state action `Send to delivery company`; the list surfaces `Dispatch All` and `Dispatch Selected` shortcuts.
- The row status dropdown intentionally does not expose manual `dispatch_ready` or `dispatched` transitions.

---

## Archive

<!-- No archived notes yet. -->
