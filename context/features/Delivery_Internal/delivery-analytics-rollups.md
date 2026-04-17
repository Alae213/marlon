# Feature: Delivery Analytics Rollups

> **Status:** `in-progress`
> **Phase:** v1
> **Last updated:** 2026-04-16

---

## Summary

Delivery Analytics Rollups are live in Convex through `deliveryAnalyticsEvents` and `deliveryAnalyticsRollups`. Current: dispatch and some order lifecycle paths write delivery events in `app/api/delivery/create-order/route.ts` and `convex/orders.ts`, and `convex/deliveryAnalytics.ts` maintains daily rollups. Partial: analytics shape and formulas are not fully aligned across live writes, backfill, summary reads, and scoring helpers.

---

## Users

- Internal delivery/reporting code that needs per-store courier performance counts.
- Maintainers evaluating provider performance and rollout readiness from delivery event data.

---

## User Stories

- As a maintainer, I want delivery events aggregated by day/provider/region so that courier performance can be summarized without replaying every order each time.
- As a future recommendation or rollout flow, I want stable attempted/dispatched/delivered/failed/RTS metrics so that later decision helpers are based on one consistent definition.

---

## Behaviour

### Happy Path

1. `app/api/delivery/create-order/route.ts` records `attempted`, then either `dispatched` or `failed` through `api.deliveryAnalytics.recordDeliveryEvent`.
2. `convex/orders.ts:updateOrderStatus` records terminal delivery outcomes (`delivered`, `failed`, `rts`) when order status maps to a delivery event, and `updateTrackingNumber` can also emit `dispatched`.
3. `convex/deliveryAnalytics.ts` writes an event row and increments one exact day/provider/region rollup, plus a provider-global row for the same day when a region is present.

### Edge Cases & Rules

- `Current`: schema tables are defined in `convex/schema.ts` as `deliveryAnalyticsEvents` and `deliveryAnalyticsRollups`.
- `Partial`: `convex/orders.ts:380` bulk status updates do not mirror single-order delivery analytics writes, so bulk changes can leave rollups incomplete.
- `Partial`: `convex/performanceBackfill.ts:144` rebuilds exact day/provider/region rows only; it does not also create the provider-global `region: undefined` rows that live writes create in `convex/deliveryAnalytics.ts`.
- `Partial`: `convex/deliveryAnalytics.ts:getDeliveryPerformanceSummary` calculates `successRate` as `delivered / completed`, while `lib/delivery/recommendation-engine.ts` and `lib/delivery/rollout-gates.ts` use attempted-order denominators.
- `Partial`: repo search shows `getDeliveryPerformanceSummary` defined but not used by runtime code today.
- `Partial`: `convex/orders.ts:updateTrackingNumber` can emit `dispatched` analytics from manual tracking edits even if no prior `attempted` event exists for that order.

---

## Connections

- **Depends on:** `convex/deliveryAnalytics.ts`, `convex/orders.ts`, `app/api/delivery/create-order/route.ts`, `convex/performanceBackfill.ts`.
- **Triggers:** rollup updates used by future delivery scoring or rollout utilities.
- **Shares data with:** `lib/delivery/recommendation-engine.ts`, `lib/delivery/rollout-gates.ts`, `context/features/Order_Management/delivery-dispatch-from-orders.md`.

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Event capture | `Current`: route and some order mutations emit delivery analytics | `Current`: keep server-owned event writes |
| Rollup writes | `Current`: live writes maintain daily rows | `Current`: keep daily rollups, but align live and backfill output |
| Formula consistency | `Partial`: summary, rollout, and recommendation math differ | `Planned`: one canonical formula per metric |
| Coverage completeness | `Partial`: bulk status changes and manual tracking can skew event sequences | `Planned`: all lifecycle paths emit consistent analytics |

---

---

## Security Considerations

- `Current`: live analytics writes happen from server-side delivery and order flows, not from public storefront UI.
- `Partial`: `convex/deliveryAnalytics.ts:137` does not itself assert store ownership, so this mutation relies on trusted caller paths rather than an internal-only enforcement boundary.
- `Current`: analytics payloads store provider, region, order ID, tracking number, reason, and source; they do not store full customer address payloads.
- `Policy-locked`: analytics helpers must not become a backdoor for cross-store writes or for exposing sensitive delivery credential state.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T3 | `[ ]` | Bring bulk order lifecycle updates to parity with single-order analytics and audit side effects. |
| T23 | `[ ]` | Align delivery analytics rollup shape and success-rate formulas across live writes, backfill, and scoring helpers. |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** -

**Outcome:** Integration coverage exists in `tests/integration/delivery-analytics-status-events.test.js`, but no browser-level validation is recorded here.

## Open Questions

- Should `convex/deliveryAnalytics.ts:getDeliveryPerformanceSummary` become a real runtime consumer surface, or should it be removed if the recommendation/rollout path stays dormant?

---

## Notes

- Main code references: `convex/deliveryAnalytics.ts`, `convex/performanceBackfill.ts`, `convex/orders.ts`, `app/api/delivery/create-order/route.ts`.
- The most important truth gap is not that analytics are absent; it is that they are live but inconsistent enough to make downstream scoring/governance unreliable without cleanup.

---

## Archive

None.
