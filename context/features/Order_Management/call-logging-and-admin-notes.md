# Feature: Call Logging and Admin Notes

> **Status:** `in-progress`
> **Phase:** v1
> **Last updated:** 2026-04-16

---

## Summary

Call logging and private admin notes are live from the order details drawer. `app/orders/[storeSlug]/page.tsx` wires `addCallLog` and `upsertAdminNote`, while `components/pages/orders/views/OrderDetails.tsx` exposes buttons for call outcomes and a textarea for one private note value. `convex/orders.ts` stores both embedded order fields and normalized event rows. Current: owners can log calls and keep a note. Partial: the UI exposes fewer call outcomes than the backend types support, and notes are upserts rather than a note history.

---

## Users

- Store owners contacting customers and leaving internal order-handling context.
- Owners reviewing recent call attempts from the list or drawer before deciding the next action.

---

## User Stories

- As a store owner, I want to record call outcomes on an order so that I can track follow-up attempts.
- As a store owner, I want a private order note so that I can keep internal handling context out of the customer flow.

---

## Behaviour

### Happy Path

1. The owner opens an order drawer and taps a call outcome button or edits the admin note field.
2. `app/orders/[storeSlug]/page.tsx` sends `api.orders.addCallLog` or `api.orders.upsertAdminNote`.
3. `convex/orders.ts` patches the order record, appends timeline entries, inserts `orderCallEvents` or `orderTimelineEvents`, and updates the order digest.

### Edge Cases & Rules

- Current: the drawer exposes `answered`, `no_answer`, and `refused` buttons only.
- Partial: backend types in `lib/orders-types.ts` also support `wrong_number`, but the drawer has no button for it.
- Current: the list and drawer both show compact call-history bars based on the embedded `callLog` array.
- Current: `addCallLog` accepts optional notes server-side, but the current drawer UI does not collect a call note.
- Current: `upsertAdminNote` stores one trimmed `adminNoteText` value plus last-updated metadata.
- Partial: saving a new admin note overwrites the previous note; there is no user-visible note history.

---

## Connections

This feature is embedded in the drawer and reflected lightly in the list.

- **Depends on:** `components/pages/orders/views/OrderDetails.tsx`, `components/pages/orders/views/ListView.tsx`, `convex/orders.ts`, `lib/orders-types.ts`
- **Triggers:** timeline and call event writes in `convex/orders.ts`
- **Shares data with:** `order-details-drawer.md`, `orders-list-and-filters.md`

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Call outcomes | Partial: three quick-action outcomes in drawer | Full outcome coverage with notes and richer follow-up states |
| Call history | Current: recent bars + hover details from embedded `callLog` | Full event history UI from `orderCallEvents` |
| Admin note model | Current: single upserted note with last-updated timestamp | Multi-entry note history or comment thread |
| Audit visibility | Partial: backend records more than UI exposes | Timeline and note history visible in drawer |

---

---

## Security Considerations

- Current: both mutations are owner-scoped through `assertOrderOwnership` in `convex/orders.ts`.
- Policy-locked: do not document admin/staff note access as live; the repo still enforces owner-only order access.
- Current: admin notes are private operational data stored on the order; they are not exposed through public storefront flows in the code reviewed here.
- Current: call and note text should be treated as sensitive operational content; the current code keeps writes server-side and does not place them in URLs.
- Partial: call/note history is not yet surfaced cleanly in UI, so operators rely on compact indicators and last-updated metadata rather than a full audit presentation.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T4 | `[ ]` | Expand call logging UI to support all backend outcomes and optional call notes |
| T5 | `[ ]` | Add visible admin-note history or another explicit audit surface instead of single-value overwrite |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** Not recorded in repo

**Outcome:** The repo shows working call-log and note mutations, but no current browser test result is documented.

## Open Questions

- None. The remaining issues are implementation gaps already confirmed in code.

---

## Notes

- The local page state appends a synthetic call entry immediately after a successful mutation in `app/orders/[storeSlug]/page.tsx`; the durable source remains `convex/orders.ts`.
- Backend event tables (`orderCallEvents`, `orderTimelineEvents`) are ahead of the current UI.

---

## Archive

<!-- No archived notes yet. -->
