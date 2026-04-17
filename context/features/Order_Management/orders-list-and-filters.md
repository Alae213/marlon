# Feature: Orders List and Filters

> **Status:** `in-progress`
> **Phase:** v1
> **Last updated:** 2026-04-16

---

## Summary

The orders list is the live primary order-management UI. In `app/orders/[storeSlug]/page.tsx` it loads all store orders, then `components/pages/orders/views/ListView.tsx` handles search, date and status filtering, sorting, row selection, CSV export, status changes, bulk delete, and delivery dispatch shortcuts. Current: this is the main working surface, including a dedicated desktop `Call` column for call-history slots while mobile cards keep the call indicator alongside status. Partial: selection and bulk behavior still have consistency gaps.

---

## Users

- Store owners managing day-to-day order operations from the `/orders/[storeSlug]` page.
- Owners reviewing customer, product, status, and delivery state before opening the details drawer.

---

## User Stories

- As a store owner, I want to find matching orders quickly by name, phone, number, date, and state so that I can act on the right orders fast.
- As a store owner, I want to run list-level actions like export, dispatch, selection, deletion, and status changes so that I can process many orders from one screen.

---

## Behaviour

### Happy Path

1. The page loads the store via slug, resolves `storeId`, and queries `api.orders.getOrders` in `app/orders/[storeSlug]/page.tsx`.
2. `ListView` derives `filteredOrders` in-memory from the loaded set using search, date filter, hidden statuses, active status filter, and sort controls in `components/pages/orders/views/ListView.tsx`.
3. The owner can select rows, export selected or filtered orders to CSV, change a row status from the dropdown, open the details drawer, bulk delete selected rows, or dispatch confirmed orders.

### Edge Cases & Rules

- Current: search matches `orderNumber`, `customerName`, and `customerPhone`; it does not search product names or notes.
- Current: hidden-status preferences persist in `localStorage` under `marlon-hidden-statuses`.
- Partial: the header checkbox selects all loaded orders via `ordersData.map(...)` in `app/orders/[storeSlug]/page.tsx`, not only the currently filtered rows shown in the table.
- Partial: per-row status dropdowns expose all statuses directly, so list actions can bypass the guided sequence shown in the drawer.
- Current: CSV export uses `filteredOrders` for "Export All" and selected loaded rows for "Export Selected".
- Current: if filters remove every row, the table shows `No orders found`.
- Current: desktop rows show call-history slots in a dedicated `Call` column; mobile cards keep the call indicator inside the status presentation.

---

## Connections

This feature is the top-level entry point for the rest of Order Management.

- **Depends on:** `app/orders/[storeSlug]/page.tsx`, `components/pages/orders/views/ListView.tsx`, `convex/orders.ts`
- **Triggers:** `order-details-drawer.md`, `order-status-lifecycle.md`, `delivery-dispatch-from-orders.md`
- **Shares data with:** `call-logging-and-admin-notes.md` via `callLog` indicators and order records

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Primary view | Current: list/table is the real production UI | Add alternate operational views without losing list parity |
| Filtering | Current: search, status filter, date filter, hidden statuses, sort | Server-backed filtering, richer search, saved views |
| Selection | Partial: multi-select works, but select-all targets all loaded rows | Select-all should respect filtered rows and visible result count |
| Bulk actions | Current: delete, export, dispatch selected | Bulk status updates with full analytics/timeline parity |

---

---

## Security Considerations

- Current: list reads go through owner-scoped Convex queries in `convex/orders.ts`; access is enforced by `assertStoreOwnership`, not by UI visibility.
- Policy-locked: document only owner access. Admin/staff role access is planned in `context/developer/SECURITY.md`, not live.
- Current: customer name and phone are masked through `LockedData` in `components/pages/orders/views/ListView.tsx`, but exported CSV still contains full order/customer fields for authorized owners.
- Current: bulk delete and status changes rely on server-side ownership checks per order in `convex/orders.ts`.
- Current: delivery quick actions call an authenticated route that re-resolves store ownership server-side in `app/api/delivery/create-order/route.ts`.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T2 | `[ ]` | Make list "select all" act on filtered rows instead of all loaded orders |
| T8 | `[ ]` | Expose order timeline/event history in the details experience so list actions have visible audit follow-through |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** Not recorded in repo

**Outcome:** Live code shows the feature is implemented, but this doc refresh did not add a browser test record.

## Open Questions

- None currently. The remaining issues here are implementation gaps already visible in the repo.

---

## Notes

- `components/pages/orders/views/ListView.tsx` is the source of truth for the current table behaviors.
- The page still loads the full order list with `api.orders.getOrders`; the lighter `getOrderDigests` query exists in `convex/orders.ts` but is not wired into this screen.

---

## Archive

<!-- No archived notes yet. -->
