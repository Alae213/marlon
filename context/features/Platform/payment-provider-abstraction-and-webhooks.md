# Feature: Payment Provider Abstraction and Webhooks

> **Status:** `completed`
> **Phase:** v1
> **Last updated:** 2026-04-16

---

## Summary

Payment provider abstraction exists in `lib/payment-service.ts`, with provider implementations for Chargily and SofizPay and a shared `createCheckout` / `verifyWebhook` interface. `Current`: the abstraction is real and checkout creation is now server-owned. `Partial`: webhook hardening is still incomplete, and the flow can still fall back to demo/mock success when provider credentials are absent.

---

## Users

- Store owners initiating payment from merchant billing UI.
- Server routes creating provider checkouts and receiving payment callbacks.

---

## User Stories

- As a store owner, I want payment initiation to go through the configured provider so that I can attempt to unlock or subscribe without manual handling.
- As the platform, I want webhook processing to be trustworthy so that payment callbacks do not activate stores based on unverified or spoofed data.

---

## Behaviour

### Happy Path

1. `components/features/payment/payment-modal.tsx` posts only `storeId` to `POST /api/chargily/create-payment`.
2. `app/api/chargily/create-payment/route.ts` authenticates the actor, uses the centralized store-access-backed Convex payment flow, and derives canonical checkout inputs from trusted store/runtime data.
3. `convex/payments.ts` creates a `paymentAttempts` row before contacting the provider, capturing server-owned amount, actor role, idempotency key, and store snapshot metadata for future reconciliation.
4. The provider implementation creates a provider checkout when credentials exist, or may return a mock/demo success response when they do not.
5. Provider callbacks still land at `POST /api/chargily/webhook`, where `app/api/chargily/webhook/route.ts` parses JSON and reacts to `payment.succeeded` or `payment.completed`.
6. Webhook now verifies provider signatures, checks for duplicates/replays, records `paymentEvidence`, and calls the internal trusted activation path.

### Edge Cases & Rules

- `Current`: the abstraction layer in `lib/payment-service.ts` supports Chargily and SofizPay, and both providers include webhook verification helpers.
- `Current`: the mounted payment UI now sends only `storeId`, and the route treats it as a routing hint rather than trusted checkout data.
- `Current`: `app/api/chargily/create-payment/route.ts` now derives amount, store name, actor role, and provider metadata on the server and persists a `paymentAttempts` record before provider checkout creation.
- `Current`: provider metadata now carries `paymentAttemptId`, `idempotencyKey`, and canonical store snapshot fields to support later webhook reconciliation.
- `Current`: webhook route now verifies provider signatures using `provider.verifyWebhook(...)` and validates HMAC-SHA256 before processing.
- `Current`: webhook route checks for duplicate events via `paymentEvidence` providerPaymentId dedupe and recent event ID replay detection within a 24-hour window.
- `Current`: on successful verification, route records immutable `paymentEvidence` and calls `activateStoreFromVerifiedPayment` internal mutation.
- `Current`: `demo/mock payment success still exists when provider credentials are absent for local development; production should disable mock flows.
- `Planned`: T34 defines a split model where `paymentAttempts` store server-owned checkout intent, `paymentEvidence` stores immutable verified provider proof, and `storeBillingPeriods` record the resulting unlock window.
- `Policy-locked`: payment evidence should activate billing only after verification and dedupe; evidence capture alone must not widen merchant access.

---

## Connections

- **Depends on:** `lib/payment-service.ts`, `components/features/payment/payment-modal.tsx`, `app/api/chargily/create-payment/route.ts`, `app/api/chargily/webhook/route.ts`, `convex/stores.ts`.
- **Triggers:** provider checkout creation, webhook ingest, and attempted subscription activation.
- **Shares data with:** `stores.subscription`, `stores.paidUntil`, payment provider environment variables in `context/technical/ENVIRONMENT.md`, and billing docs in `context/features/Platform/billing-locking-and-subscriptions.md`.

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Provider abstraction | `Current`: shared provider interface exists in code | `Current`: keep abstraction if multiple providers remain supported |
| Payment initiation | `Current`: route derives canonical checkout fields server-side and records `paymentAttempts` | `Planned`: promote this into the final stable merchant unlock contract after billing cutover |
| Webhook trust | `Current`: route verifies signatures, deduplicates, replays, records evidence, and calls trusted activation | `Policy-locked`: verified webhooks should be the only trusted unlock trigger |
| Fallback behavior | `Partial`: demo/mock responses exist when credentials are absent | `Planned`: no production unlock path should depend on mock success |

---

---

## Security Considerations

- `Current`: provider API keys stay server-side in `lib/payment-service.ts`; the client does not receive raw payment secrets.
- `Current`: payment creation now requires authenticated store access and does not trust client-supplied amount, store name, or provider metadata.
- `Current`: the webhook route now verifies provider signatures, checks for duplicates/replays, records evidence, and calls a trusted internal activation path.
- `Current`: webhook unlock flow now uses `internalMutation` paths that bypass owner-gated checks (for verified provider events only).

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T16 | `[~]` | Replace current payment initiation and webhook handling with a server-owned hardened unlock flow. |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** -

**Outcome:** Not recorded in repo-backed context yet.

## Open Questions

- No additional repo-backed open questions beyond the unresolved canonical billing policy already tracked in `context/features/Platform/billing-locking-and-subscriptions.md`.

---

## Notes

- Main implementation references: `lib/payment-service.ts`, `components/features/payment/payment-modal.tsx`, `app/api/chargily/create-payment/route.ts`, `app/api/chargily/webhook/route.ts`, `convex/payments.ts`, `convex/stores.ts`.
- The live webhook route is Chargily-specific, even though the provider abstraction already includes SofizPay support points.
- T34 schema direction: cutover should create additive `paymentAttempts`, `paymentEvidence`, and `storeBillingPeriods` records before removing any legacy `stores` billing dependencies.
- T36 landed the checkout-creation half of that plan with owner-authorized `paymentAttempts` creation and provider linkage persistence; T37 still owns verified webhook evidence and activation hardening.

---

## Archive

None.
