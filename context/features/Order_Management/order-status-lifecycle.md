# Feature: Order Status Lifecycle

> **Status:** `partially-complete`
> **Phase:** v1
> **Last updated:** 2026-04-25

---

## Summary

Order status changes now use a shared canonical COD lifecycle foundation. `lib/order-lifecycle.ts` defines canonical statuses, legacy-status normalization, actor-specific transition rules, and validation helpers, while `lib/order-confirmation.ts` adds call-evidence and risk-flag rules. `lib/order-cod-payment.ts` defines the COD cash substate model separately from merchant subscription payments. `convex/orders.ts` enforces merchant transitions server-side for single and bulk status writes, requires answered-call evidence before confirmation, treats call outcomes as lifecycle evidence, owns dispatch/provider status writes for live delivery integrations, derives COD collection/reconciliation state from order lifecycle outcomes, and writes normalized timeline metadata for status/call/note/dispatch/provider changes. Partial remains correct because the UI still reads mostly from embedded order history until a fuller normalized timeline read path replaces it.

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

1. The owner logs call outcomes or changes a status from either the drawer footer or a row dropdown in the list.
2. `app/orders/[storeSlug]/page.tsx` calls `api.orders.updateOrderStatus`.
3. `convex/orders.ts` validates the requested canonical status against the merchant transition table and confirmation evidence before writing.
4. `convex/orders.ts` patches `status`, appends a legacy `timeline` entry, inserts an `orderTimelineEvents` record, updates the digest, and records delivery analytics for mapped terminal delivery outcomes.

### Edge Cases & Rules

- Current: canonical statuses are `new`, `awaiting_confirmation`, `confirmed`, `cancelled`, `blocked`, `dispatch_ready`, `dispatched`, `in_transit`, `delivered`, `delivery_failed`, `refused`, `unreachable`, `returned`, `cod_collected`, and `cod_reconciled`.
- Current: legacy statuses are normalized for reads and current-state validation: `packaged -> dispatch_ready`, `shipped -> in_transit`, `succeeded -> delivered`, `canceled -> cancelled`, and `router -> returned`.
- Current: the list dropdown and drawer actions use the shared merchant transition table instead of exposing every status.
- Current: row dropdowns no longer expose courier-owned dispatch actions (`dispatch_ready` or `dispatched`); dispatch must go through the server-owned delivery action.
- Current: failed row status changes show safe merchant feedback and clear only that order's pending state so other rows remain usable.
- Current: `confirmed` is hidden from list/drawer actions and rejected server-side until the order has answered-call evidence.
- Current: `addCallLog` validates call outcomes and can move `answered -> awaiting_confirmation`, `refused -> refused`, `wrong_number -> blocked`, and three `no_answer` attempts -> `unreachable` when the current state allows it.
- Current: server-owned dispatch can move `confirmed -> dispatched` only after a successful delivery-provider call returns tracking metadata.
- Current: server-owned dispatch can also recover old `dispatch_ready` orders by creating the courier order and moving them to `dispatched`.
- Current: provider status sync maps active shipment states to `dispatched`/`in_transit` and COD outcomes to `delivered`, `delivery_failed`, `refused`, `unreachable`, or `returned`.
- Current: orders and order digests have a dedicated `codPaymentStatus` substate: `pending_collection`, `collected`, `not_collected`, `reconciliation_pending`, and `reconciled`.
- Current: new/active orders start as `pending_collection`; delivered orders become `reconciliation_pending`; refused, unreachable, failed, cancelled, blocked, and returned orders become `not_collected`; COD collection and reconciliation move through `collected` and `reconciled`.
- Current: `api.orders.reconcileCodPayment` requires a `cod_collected` order with collected COD before writing `cod_reconciled`; subscription payment tables and webhooks remain separate.
- Current: `updateOrderStatus`, `bulkUpdateOrderStatus`, `getOrdersByStatus`, and `getOrderDigests` accept canonical status values through a Convex validator.
- Partial: the stored `orders.status` schema remains string-compatible until a data migration/backfill can safely convert old production rows.
- Current: repeated updates to the same status are skipped when there is no new note.
- Current: `orderTimelineEvents` includes optional `actorId`, `actorRole`, `source`, `previousStatus`, and `nextStatus` metadata for new timeline writes.
- Current: status, call, note, dispatch, provider-sync, COD reconciliation, and bulk status changes append normalized timeline events.
- Current: bulk status updates now emit the same delivery outcome analytics as single status updates for delivered/failed/RTS-mapped outcomes.
- Current: delivery analytics writes require owner-scoped store access and reject order/store mismatches before writing events or rollups.
- Current: the order drawer shows full loaded lifecycle, call-note, admin-note, dispatch, courier-sync, and correction history from the order history available on the loaded order.
- Current: merchant-facing order states are action-oriented: public COD orders start as `Needs Call`, answered calls move to `Awaiting Confirmation`, confirmed orders are dispatched through explicit courier/manual flows, and delivered orders stay merchant-final.
- Current: no-answer attempts no longer auto-mark orders unreachable; the fourth no-answer attempt creates a visible attention prompt so the merchant chooses whether to keep trying or mark unreachable.

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
| Status controls | Current: single-order and row-level status change UI exists with allowed merchant next actions, disabled reasons, confirmation notes, and explicit courier/manual dispatch actions | Provider-owned status sync can be fully automated from courier webhooks |
| Transition policy | Current: shared transition policy plus answered-call confirmation gate is enforced server-side; no-answer threshold is a merchant prompt, not an automatic terminal state | Backfilled canonical storage with provider/system transition gates |
| Audit trail | Current: timeline arrays and metadata-rich `orderTimelineEvents` are written; drawer shows full loaded lifecycle/call/note/dispatch/sync history | Fully normalized timeline read path replaces embedded history dependence |
| COD payment state | Current: delivered is merchant-final and treated as COD collected unless courier sync records a payment issue; reconciliation does not change the row status | Full courier settlement import/export and accounting reconciliation |
| Analytics parity | Current: single and bulk/status delivery outcomes plus dispatch/sync attempts write analytics/audit side effects where applicable | Bulk and single flows behave consistently |

---

---

## Security Considerations

- Current: all status writes run through owner-scoped `assertOrderOwnership` in `convex/orders.ts`.
- Policy-locked: the live security model is owner-only access; do not document status permissions for future admin/staff roles.
- Current: authorization and merchant lifecycle policy are server-enforced for status writes.
- Current: analytics side effects are server-side; the client does not write delivery analytics directly.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T1 | `[x]` | Enforce allowed status transitions in `convex/orders.ts` and reuse the same rules in list and drawer UI |
| T50 | `[x]` | Implement Phase 3 confirmation and call-outcome lifecycle evidence rules |
| T51 | `[x]` | Implement Phase 4 server-owned dispatch and delivery-provider status sync |
| T52 | `[x]` | Implement Phase 5 COD payment substates and reconciliation guardrails |
| T53 | `[x]` | Implement Phase 6 normalized timeline metadata, bulk analytics parity, protected delivery analytics writes, and drawer activity history |
| T3 | `[x]` | Bring bulk status updates to parity with single-order analytics and audit side effects |
| T59 | `[x]` | Rewrite order table UX and lifecycle edge cases with visible-row selection, action-oriented row states, sync modal retries, manual dispatch, delivered-final COD behavior, and drawer-only audit history |

---

---

## User Acceptance Tests

**UAT Status:** `programmatic-partial`

**Last tested:** 2026-04-27

**Outcome:** Lifecycle/audit, delivery route, COD payment, provider mapper, order table UX, and order drawer regression tests pass. Convex codegen TypeScript and touched-file lint pass.

## Open Questions

- None. The mismatch between guided UI and server enforcement is already a confirmed gap.

---

## Notes

- The route-level dispatch flow now rejects unconfirmed orders before calling the provider and records tracking/status/analytics through one Convex order mutation on success.
- Dispatch setup/provider failures now return structured safe feedback codes and the drawer shows a Courier settings CTA when store setup is missing.
- COD payment substates are customer-order COD state only; platform subscription checkout and webhook unlocks still use `paymentAttempts` and `paymentEvidence`.
- The normalized timeline table is now richer for new writes, but old rows remain valid because the new fields are optional.
- The table-level courier sync action operates on confirmed store orders, auto-retries failed sends up to three times, and records skipped/failed sync attempts in order history.

---

## Archive

<!-- No archived notes yet. -->
