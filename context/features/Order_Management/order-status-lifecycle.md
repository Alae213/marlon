# Feature: Order Status Lifecycle

> **Status:** `in-progress`
> **Phase:** v1
> **Last updated:** 2026-04-16

---

## Summary

Order status changes are live but only partially governed. The drawer in `components/pages/orders/views/OrderDetails.tsx` presents a guided next-step flow, while `components/pages/orders/views/ListView.tsx` exposes a full status dropdown for every row. On the backend, `convex/orders.ts` records timeline entries and analytics for single updates, but `STATUS_TRANSITIONS` in `lib/orders-types.ts` is not enforced server-side. Partial is the correct state for this feature.

---

## Users

- Store owners advancing or correcting order states during confirmation, dispatch, delivery, and resolution.
- Owners using the drawer for guided progression or the list for quick row-level changes.

---

## User Stories

- As a store owner, I want clear status actions for a single order so that I can move it through the normal workflow confidently.
- As a store owner, I want status updates to create reliable audit and analytics records so that delivery reporting stays meaningful.

---

## Behaviour

### Happy Path

1. The owner changes a status from either the drawer footer or a row dropdown in the list.
2. `app/orders/[storeSlug]/page.tsx` calls `api.orders.updateOrderStatus`.
3. `convex/orders.ts` patches `status`, appends a legacy `timeline` entry, inserts an `orderTimelineEvents` record, updates the digest, and records delivery analytics for terminal delivery outcomes.

### Edge Cases & Rules

- Current: the drawer guides a normal path of `new -> confirmed -> packaged -> shipped -> succeeded`, with reopen/return branches for `router`, `canceled`, and `blocked`.
- Partial: the list dropdown can jump directly to any status in `statuses`, bypassing the drawer's guided sequence.
- Partial: `STATUS_TRANSITIONS` exists in `lib/orders-types.ts` but is informational only today; the server accepts any status string.
- Current: repeated updates to the same status are skipped when there is no new note.
- Partial: `bulkUpdateOrderStatus` writes order timeline data, but unlike single updates it does not call delivery analytics for delivered/failed/RTS outcomes.

---

## Connections

This feature links UI workflow, backend order writes, and delivery analytics.

- **Depends on:** `components/pages/orders/views/OrderDetails.tsx`, `components/pages/orders/views/ListView.tsx`, `convex/orders.ts`, `lib/orders-types.ts`
- **Triggers:** delivery analytics writes through `api.deliveryAnalytics.recordDeliveryEvent`
- **Shares data with:** `delivery-dispatch-from-orders.md`, `orders-list-and-filters.md`

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Status controls | Current: single-order and row-level status change UI exists | Shared, enforced workflow across all entry points |
| Transition policy | Partial: guided in drawer only | Server-enforced transition validation |
| Audit trail | Current: timeline arrays and `orderTimelineEvents` are written | Timeline becomes fully visible in UI |
| Analytics parity | Partial: single updates record delivery outcome analytics, bulk updates do not | Bulk and single flows behave consistently |

---

---

## Security Considerations

- Current: all status writes run through owner-scoped `assertOrderOwnership` in `convex/orders.ts`.
- Policy-locked: the live security model is owner-only access; do not document status permissions for future admin/staff roles.
- Partial: authorization is server-enforced, but lifecycle policy itself is not server-enforced, so authorized owners can still send unsupported direct jumps.
- Current: analytics side effects are server-side; the client does not write delivery analytics directly.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T1 | `[ ]` | Enforce allowed status transitions in `convex/orders.ts` and reuse the same rules in list and drawer UI |
| T3 | `[ ]` | Bring bulk status updates to parity with single-order analytics and audit side effects |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** Not recorded in repo

**Outcome:** Live code confirms the mixed guided/direct lifecycle model, but there is no current browser test record here.

## Open Questions

- None. The mismatch between guided UI and server enforcement is already a confirmed gap.

---

## Notes

- The route-level dispatch flow sets tracking metadata separately from status changes, so dispatch-related progression is split across multiple layers.
- `bulkUpdateOrderStatus` exists in `convex/orders.ts`, but the current list screen does not expose a bulk status-change UI yet.

---

## Archive

<!-- No archived notes yet. -->
