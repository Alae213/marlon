# Feature: Billing Locking and Subscriptions

> **Status:** `in-progress`
> **Phase:** v1
> **Last updated:** 2026-04-16

---

## Summary

`context/project/OVERVIEW.md` and `context/project/SCOPE.md` are the canonical product truth for billing in v1: unlimited stores, a per-store cap of `5 orders/day`, masked overflow orders, `2000 DZD / store / month` unlocks, no customer-facing lock notice, and 5-day masked-overflow retention. `Current`: the live runtime is behind that locked policy and still uses `stores` fields such as `subscription`, `orderCount`, `firstOrderAt`, `paidUntil`, and `lockedAt`, with a 30-day trial and 50-order lock model in `convex/stores.ts` and `contexts/billing-context.tsx`. Implementation work is required before runtime matches product truth.

---

## Users

- Store owners who see billing state, lock messaging, and payment prompts around merchant routes.
- Runtime billing helpers that read or patch subscription state on the `stores` record.

---

## User Stories

- As a store owner, I want billing status to be accurate so that trial, active, and locked states match what the product actually enforces.
- As the platform, I want one canonical billing path so that lock and unlock behavior is predictable and secure.

---

## Behaviour

### Happy Path

1. `convex/stores.ts:createStore` creates stores with `subscription: "trial"`, `orderCount: 0`, and a 30-day `trialEndsAt` value.
2. Merchant orders UI wraps content with `BillingProvider` in `app/orders/[storeSlug]/page.tsx`.
3. `contexts/billing-context.tsx` reads the store doc and derives `trial`, `active`, or `locked` state from `subscription`, `firstOrderAt`, `paidUntil`, and the 50-order threshold.
4. Billing-related UI components such as `components/features/billing/billing-section.tsx` and `components/pages/layout/locked-overlay.tsx` render messaging and payment prompts from that derived state.
5. Subscription patches can be written through `convex/stores.ts:updateSubscription`, which currently requires owner auth.

### Edge Cases & Rules

- `Canonical`: `context/project/OVERVIEW.md` and `context/project/SCOPE.md` define the v1 billing policy; feature docs should defer to those files when runtime disagrees.
- `Current`: the live billing model is still trial/subscription based on `stores`, not the locked `2000 DZD/store/month` plus `5/day` overflow policy.
- `Current`: `convex/stores.ts:handleNewOrderSubscription` exists and encodes the 30-day trial plus 50-order locking logic, but it is not wired into the live order-create path.
- `Partial`: `LockedOverlay` and `BillingSection` exist, but they are not the clearly mounted, end-to-end enforcement path for all merchant access.
- `Current`: UI copy in `components/features/billing/billing-section.tsx`, `components/pages/layout/locked-overlay.tsx`, and `components/features/payment/payment-modal.tsx` still reflects `9,900 DZD` annual pricing.
- `Partial`: `cleanupLockedStoreOrders` in `convex/stores.ts` handles old orders for long-locked stores, but this is not the canonical masked-overflow retention model.

---

## Connections

- **Depends on:** `convex/stores.ts`, `contexts/billing-context.tsx`, `app/orders/[storeSlug]/page.tsx`, `components/features/billing/billing-section.tsx`, `components/pages/layout/locked-overlay.tsx`, `components/features/payment/payment-modal.tsx`.
- **Triggers:** lock overlays, payment CTAs, subscription state rendering, and attempted unlock updates.
- **Shares data with:** `stores` billing fields, payment initiation/webhook routes under `app/api/chargily`, and billing notes in `context/technical/API_CONTRACTS.md`.

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Billing source of truth | `Canonical`: `context/project/OVERVIEW.md` and `context/project/SCOPE.md` define the product policy; `Current`: runtime still derives state from legacy `stores` billing fields | Runtime fully enforces the canonical policy without doc/runtime drift |
| Lock rule | `Canonical`: `5/day` accepted overflow with merchant-side masking/freeze and 5-day retention; `Current`: runtime still uses 30-day trial plus 50-order lock logic | Runtime lock behavior matches the canonical overflow model end to end |
| Enforcement path | `Current`: state is derived in UI and helpers, but not unified across runtime | One clear server-owned enforcement and unlock path |
| Pricing policy | `Canonical`: `2000 DZD / store / month`; `Current`: runtime copy and flows still reflect `9,900 DZD` annual messaging in places | Code, docs, and payment flows all use the same canonical price and cadence |

---

---

## Security Considerations

- `Current`: lock overlays are presentation only and do not replace server-side authorization.
- `Partial`: inconsistent billing logic can create trust and enforcement gaps if different paths derive different lock states.
- `Current`: `updateSubscription` is owner-gated in `convex/stores.ts`, which matters when webhook-based activation tries to call it without owner auth.
- `Partial`: until one canonical billing runtime exists, docs must distinguish live behavior from policy targets.
- `Policy-locked`: payment success should not be treated as a trusted unlock signal without verified server-side processing.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T22 | `[x]` | Replace the legacy trial/50-order billing runtime with the canonical `OVERVIEW.md`/`SCOPE.md` policy across store state, merchant access, and unlock enforcement. |
| T30 | `[x]` | Implement the canonical `5/day` overflow masking, 5-day retention, and `2000 DZD / store / month` unlock flow in runtime billing logic. |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** -

**Outcome:** Not recorded in repo-backed context yet.

## Open Questions

- None. The canonical product truth is locked in `context/project/OVERVIEW.md` and `context/project/SCOPE.md`; the remaining issue is runtime implementation, not policy selection.

---

## Notes

- Main implementation references: `convex/stores.ts`, `contexts/billing-context.tsx`, `app/orders/[storeSlug]/page.tsx`, `components/features/billing/billing-section.tsx`, `components/pages/layout/locked-overlay.tsx`, `components/features/payment/payment-modal.tsx`.
- This doc treats `context/project/OVERVIEW.md` and `context/project/SCOPE.md` as canonical product truth and records the current billing runtime as behind that target.

---

## Archive

None.
