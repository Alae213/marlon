# Feature: Billing and Unlock Settings

> **Status:** `in-progress`
> **Phase:** v1
> **Last updated:** 2026-04-16

---

## Summary

Billing and Unlock Settings is not a mounted settings tab in the current editor dialog. The live settings dialog in `components/pages/editor/components/settings-dialog.tsx` only includes Delivery Pricing, Courier, and Store Info. Partial billing/unlock runtime exists elsewhere: order-area gating uses `contexts/billing-context.tsx`, `components/pages/layout/locked-overlay.tsx`, and `components/features/billing/billing-section.tsx`, while payment initiation and webhook routes live under `app/api/chargily`. Repo truth is internally inconsistent: planning docs describe `2000 DZD/store/month` and `5/day` overflow, but current runtime/UI still reflect `9,900 DZD`, 30-day trial plus 50-order locking, and incomplete webhook hardening.

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
- `Partial`: planning docs and decisions now describe a `2000 DZD/store/month` and `5/day` overflow/unlock model, but that is not the mounted runtime contract yet.
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
| Settings tab | `Current`: not mounted in settings dialog | `Planned`: explicit settings IA only if billing becomes a first-class editor surface |
| Runtime model | `Current`: 30-day trial + 50-order lock logic | `Planned`: canonical model aligned with approved product policy |
| Pricing copy | `Current`: runtime still shows `9,900 DZD` | `Planned`: one canonical price/model across docs, UI, and backend |
| Unlock trust | `Partial`: payment route and webhook exist, but hardening is incomplete | `Policy-locked`: verified webhook evidence should be the only trusted unlock trigger |

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
| T16 | `[ ]` | Replace the current payment initiation and webhook path with a server-owned, hardened unlock flow that matches the real billing policy. |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** -

**Outcome:** Not recorded in repo-backed context yet.

## Open Questions

- Which billing policy is canonical for v1 runtime: the newer `2000 DZD/store/month` plus `5/day` overflow model in planning docs, or the still-mounted `9,900 DZD` trial/50-order subscription flow? The repo currently contains both.

---

## Notes

- Main implementation references: `components/pages/editor/components/settings-dialog.tsx`, `contexts/billing-context.tsx`, `components/features/billing/billing-section.tsx`, `components/pages/layout/locked-overlay.tsx`, `components/features/payment/payment-modal.tsx`, `app/api/chargily/create-payment/route.ts`, `app/api/chargily/webhook/route.ts`, `lib/payment-service.ts`.
- This doc intentionally treats billing/unlock as a cross-cutting partial runtime area, not as a live settings tab.

---

## Archive

None.
