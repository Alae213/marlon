# Feature: Order Details Drawer

> **Status:** `in-progress`
> **Phase:** v1
> **Last updated:** 2026-04-16

---

## Summary

The order details drawer is live in `components/pages/orders/views/OrderDetails.tsx` and opens from the list view. It is the focused order workspace for customer info, product lines, totals, delivery tracking, call logging, admin notes, copy-to-clipboard, and guided status actions. Current: the drawer is functional and central to single-order handling. Partial: it does not expose the full order timeline already written on the backend.

---

## Users

- Store owners who need a single-order workspace without leaving the orders page.
- Owners confirming orders, logging call outcomes, reviewing totals, or dispatching to delivery.

---

## User Stories

- As a store owner, I want to open one order and see the customer, products, totals, and delivery data together so that I can process it without context switching.
- As a store owner, I want the drawer footer to guide the next action for the current status so that I do not have to remember the normal workflow.

---

## Behaviour

### Happy Path

1. Clicking a row in `components/pages/orders/views/ListView.tsx` sets `selectedOrder` in `app/orders/[storeSlug]/page.tsx`.
2. `OrderDetails` opens as a right-side sheet and renders customer, product, totals, tracking, admin note, and call controls from the live order object.
3. The owner can copy customer details, log a call outcome, save a private note, or use the footer action buttons to move the order forward.

### Edge Cases & Rules

- Current: the drawer is controlled entirely by the selected order already loaded on the page; it does not fetch a richer per-order payload on open.
- Current: tracking info is only shown when `trackingNumber` exists and status is `packaged` or `shipped`.
- Current: footer actions are status-specific through `StatusActionButtons` in `components/pages/orders/views/OrderDetails.tsx`.
- Partial: the drawer offers a guided lifecycle, but it is not authoritative because the list dropdown still allows direct status jumps.
- Partial: backend timeline and event records exist in `convex/orders.ts`, but the drawer does not show a full timeline, delivery event log, or note history.

---

## Connections

The drawer is the single-order layer on top of the list page.

- **Depends on:** `app/orders/[storeSlug]/page.tsx`, `components/pages/orders/views/OrderDetails.tsx`
- **Triggers:** `convex/orders.ts` mutations for status changes, call logs, and admin notes; `app/api/delivery/create-order/route.ts` for dispatch
- **Shares data with:** `call-logging-and-admin-notes.md`, `order-status-lifecycle.md`, `delivery-dispatch-from-orders.md`

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Order workspace | Current: customer, products, totals, tracking, note, calls, status actions | Add richer audit history and deeper editing flows |
| Status controls | Current: guided buttons per current status | Enforced lifecycle with shared rules across drawer and list |
| Tracking view | Current: provider + tracking number + external links when present | Show provider state refresh and courier events |
| Audit visibility | Partial: recent call bars and last note metadata only | Full timeline/history surface from `timeline` and event tables |

---

---

## Security Considerations

- Current: the drawer only works on orders already retrieved through owner-scoped queries; all writes still go through owner-checked mutations in `convex/orders.ts`.
- Policy-locked: do not describe drawer access for admin/staff users; the live access model is owner-only.
- Current: customer name, address, and phone render behind `LockedData` where used in the drawer.
- Current: copy-to-clipboard uses client-side clipboard APIs, so copied customer details leave the app boundary intentionally for the authorized owner.
- Current: external tracking links are generated from provider + tracking number already stored on the order; secrets are not exposed to the client.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T8 | `[ ]` | Expose order timeline/event history in the drawer from stored timeline and event records |
| T5 | `[ ]` | Replace single-value admin note UX with visible history or a clearer audit presentation |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** Not recorded in repo

**Outcome:** The drawer is live in code, but no browser verification result was added during this documentation pass.

## Open Questions

- None currently. The main gaps are known implementation limits, not unresolved product definitions.

---

## Notes

- The copy action currently copies name, phone, and address only; it does not include products or totals.
- `components/pages/orders/views/OrderDetails.tsx` is the source of truth for the visible drawer workflow.

---

## Archive

<!-- No archived notes yet. -->
