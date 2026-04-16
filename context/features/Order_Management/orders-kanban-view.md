# Feature: Orders Kanban View

> **Status:** `deferred`
> **Phase:** v1
> **Last updated:** 2026-04-16

---

## Summary

The kanban or "By State" view is not implemented beyond a placeholder. `components/pages/orders/views/KanbanView.tsx` renders the same view toggle used by the list and then shows a centered `Coming Soon` panel. Planned: a grouped-by-status operations view. Current: only the placeholder exists, so this feature should be treated as deferred for v1 docs.

---

## Users

- Intended future users are store owners who want to work orders by status lane.
- Current users only see the placeholder after switching away from the list view.

---

## User Stories

- As a store owner, I want a kanban-style status view so that I can work orders by stage instead of by table row.
- As a product team, we want the docs to reflect that this is not live yet so that users are not misled.

---

## Behaviour

### Happy Path

1. The owner clicks `By State` from the orders page tabs.
2. `app/orders/[storeSlug]/page.tsx` renders `components/pages/orders/views/KanbanView.tsx`.
3. The screen shows a placeholder message and lets the owner switch back to `List`.

### Edge Cases & Rules

- Current: there are no kanban columns, drag-and-drop controls, or status-grouped cards.
- Current: this view does not query or derive order data.
- Current: the placeholder is visible to signed-in owners because the route itself is live.
- Planned: any future implementation must match the live owner-scoped access model rather than assume future admin/staff policies.

---

## Connections

This is a deferred alternate presentation of the same orders surface.

- **Depends on:** `app/orders/[storeSlug]/page.tsx`, `components/pages/orders/views/KanbanView.tsx`
- **Triggers:** none today beyond local view-mode switching
- **Shares data with:** `orders-list-and-filters.md`, `order-status-lifecycle.md`

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Availability | Current: placeholder only | Real kanban board |
| Data handling | Current: no order data rendered | Grouped lanes with live order cards |
| Actions | Current: switch back to list only | Status-aware actions with parity to list and drawer |
| Documentation posture | Current: explicitly deferred | Update when implementation exists |

---

---

## Security Considerations

- Current: access to the route is still gated by the signed-in owner order page.
- Policy-locked: any future kanban implementation must keep owner-scoped server checks and must not document future role-based access as already live.
- Current: no new write surface or data exposure exists here because the component is only a placeholder.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T7 | `[>]` | Build a real kanban-by-status orders view with parity to the list for data and actions |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** Not recorded in repo

**Outcome:** Current behavior is only the placeholder; no further UAT applies until implementation exists.

## Open Questions

- None right now. The status is simply deferred, not undefined.

---

## Notes

- The view toggle is already wired in `app/orders/[storeSlug]/page.tsx`, so users can reach the placeholder today.
- This doc intentionally avoids describing any grouped-card behavior as live.

---

## Archive

<!-- No archived notes yet. -->
