# Feature: Billing and Unlock Settings

> **Status:** `in-progress`
> **Phase:** v1
> **Last updated:** 2026-04-16

---

## Summary

Billing and Unlock Settings is not a mounted settings tab in the current editor dialog. The canonical v1 billing/unlock policy is the locked product truth in `context/project/OVERVIEW.md` and `context/project/SCOPE.md`: unlimited stores, `5 orders/day` per store, masked overflow until unlock, `2000 DZD / store / month`, no customer-facing lock notice, and 5-day masked-overflow retention. `Current`: the live settings dialog in `components/pages/editor/components/settings-dialog.tsx` only includes Delivery Pricing, Courier, and Store Info, while partial billing/unlock runtime elsewhere still reflects `9,900 DZD`, a 30-day trial plus 50-order locking, and incomplete webhook hardening. Implementation work is required to make runtime match canonical product policy.

---

## Users

- Store owners seeing billing state, trial usage, lock overlays, and payment CTAs around the orders experience.
- Backend payment/webhook handlers that attempt to convert payment success into store activation.

---

## User Stories

- As a store owner, I want to understand whether my store is in trial, active, or locked so that I know when I need to pay.
- As a store owner, I want a trustworthy unlock flow so that payment success reliably restores access without manual intervention.

---

## Behaviour

### Happy Path

1. The orders route wraps content in `BillingProvider` from `app/orders/[storeSlug]/page.tsx`.
2. `contexts/billing-context.tsx` reads the store and derives `trial`, `active`, or `locked` state from subscription fields, a 30-day window, and a 50-order limit.
3. Billing UI and lock overlays render through `components/features/billing/billing-section.tsx` and `components/pages/layout/locked-overlay.tsx`.
4. Payment CTA opens `components/features/payment/payment-modal.tsx`, which posts to `POST /api/chargily/create-payment`.
5. The payment route uses `lib/payment-service.ts` to create a provider checkout or a demo/mock response when credentials are missing.
6. Chargily webhook traffic lands at `POST /api/chargily/webhook`, which currently tries to activate the store from payload metadata.

### Edge Cases & Rules

- `Current`: there is no Billing/Unlock tab mounted in `components/pages/editor/components/settings-dialog.tsx`.
- `Current`: runtime/UI copy still shows `9,900 DZD` annual pricing in `components/features/billing/billing-section.tsx`, `components/pages/layout/locked-overlay.tsx`, and `components/features/payment/payment-modal.tsx`.
- `Current`: `contexts/billing-context.tsx` enforces a trial/subscription model with a 30-day window and 50-order lock logic.
- `Canonical`: `context/project/OVERVIEW.md` and `context/project/SCOPE.md` define the product policy when this feature doc and runtime disagree.
- `Current`: the mounted runtime contract is still behind the canonical `2000 DZD/store/month` and `5/day` overflow/unlock policy.
- `Partial`: payment initiation and webhook trust are incomplete; `app/api/chargily/create-payment/route.ts` accepts client-supplied `storeId`/`amount`-style inputs, and `app/api/chargily/webhook/route.ts` parses payloads but does not show durable dedupe, replay protection, or a hardened server-owned activation path.

---

## Connections

- **Depends on:** `components/pages/editor/components/settings-dialog.tsx`, `contexts/billing-context.tsx`, `components/features/billing/billing-section.tsx`, `components/pages/layout/locked-overlay.tsx`, `components/features/payment/payment-modal.tsx`, `app/api/chargily/create-payment/route.ts`, `app/api/chargily/webhook/route.ts`.
- **Triggers:** billing CTA flows, lock overlays, and attempted store activation after provider callbacks.
- **Shares data with:** `convex/stores.ts` subscription fields, payment provider abstraction in `lib/payment-service.ts`, and project-level billing docs in `context/technical/API_CONTRACTS.md` and `context/project/DECISIONS.md`.

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Settings tab | `Current`: not mounted in settings dialog | Billing/unlock IA is explicit only if needed after runtime alignment work ships |
| Runtime model | `Canonical`: `OVERVIEW.md`/`SCOPE.md` define `5/day` overflow + `2000 DZD / store / month`; `Current`: mounted runtime still uses 30-day trial + 50-order lock logic | Runtime matches canonical product policy |
| Pricing copy | `Canonical`: `2000 DZD / store / month`; `Current`: runtime still shows `9,900 DZD` in places | Docs, UI, and backend use one canonical billing message |
| Unlock trust | `Current`: payment route and webhook exist, but hardening is incomplete | Verified server-owned payment evidence is the only trusted unlock trigger |

---

---

## Security Considerations

- `Current`: payment provider secrets stay server-side in `lib/payment-service.ts`; the client does not receive raw API keys.
- `Partial`: provider helpers can return demo/mock payment responses when credentials are absent, so payment flows must not be documented as production-hardened.
- `Partial`: `app/api/chargily/webhook/route.ts` is not yet at the target trust model described in `context/developer/SECURITY.md`; durable replay defense, dedupe, and hardened activation ownership are not evident in the route.
- `Current`: lock UI can mask access in the client, but UI masking is not authorization.
- `Current`: unauthenticated public store metadata reads still exist elsewhere in runtime and should not be confused with protected unlock state.
- `Policy-locked`: payment or unlock state changes must not rely on unverified webhook payloads, client-owned initiation parameters, or route-level assumptions about store access.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T16 | `[x]` | Replace the current payment initiation and webhook path with a server-owned, hardened unlock flow that matches the real billing policy. |
| T31 | `[x]` | Align billing surfaces, payment copy, and unlock settings/runtime affordances with the canonical `OVERVIEW.md`/`SCOPE.md` billing policy. |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** -

**Outcome:** Not recorded in repo-backed context yet.

## Open Questions

- None. `context/project/OVERVIEW.md` and `context/project/SCOPE.md` are the canonical billing policy; the unresolved work is bringing runtime, payment flows, and settings surfaces up to that standard.

---

## Notes

- Main implementation references: `components/pages/editor/components/settings-dialog.tsx`, `contexts/billing-context.tsx`, `components/features/billing/billing-section.tsx`, `components/pages/layout/locked-overlay.tsx`, `components/features/payment/payment-modal.tsx`, `app/api/chargily/create-payment/route.ts`, `app/api/chargily/webhook/route.ts`, `lib/payment-service.ts`.
- This doc treats billing/unlock as a cross-cutting runtime gap against the canonical product policy, not as proof that a live settings tab already exists.

---

## Archive

None.
