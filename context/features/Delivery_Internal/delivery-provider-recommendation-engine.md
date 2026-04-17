# Feature: Delivery Provider Recommendation Engine

> **Status:** `deferred`
> **Phase:** v1
> **Last updated:** 2026-04-16

---

## Summary

The Delivery Provider Recommendation Engine is not live runtime behavior today. Current: `lib/delivery/recommendation-engine.ts` contains a pure scoring helper, `lib/delivery-api.ts` re-exports it as `getProviderRecommendation()`, and `tests/unit/delivery-recommendation-engine.test.js` covers basic ranking. Deferred: the live dispatch route still uses the store's configured/default provider, not recommendation-driven selection or automated switching.

---

## Users

- Internal delivery utility code only.
- Future maintainers deciding whether provider selection should become server-owned and metrics-driven.

---

## User Stories

- As a maintainer, I want a deterministic scoring helper so that provider comparison logic can be tested before it affects live dispatch.
- As a product owner, I want provider selection changes to be deliberate and server-owned so that courier routing does not silently drift from configured store settings.

---

## Behaviour

### Happy Path

1. A caller passes provider performance snapshots into `recommendProvider()` in `lib/delivery/recommendation-engine.ts`.
2. The helper computes `successRate`, `failureRate`, `rtsRate`, and a weighted score for each provider.
3. It returns sorted scores and the top provider, but no live route consumes that result today.

### Edge Cases & Rules

- `Current`: the helper supports only `mode: "recommendation_only"`.
- `Current`: it scores only the live adapter contract providers from `lib/delivery/contracts.ts`, which are `zr_express` and `yalidine`.
- `Deferred`: no Next.js route, Convex query/action, or dispatch runtime path calls the recommendation helper.
- `Current`: provider selection in `app/api/delivery/create-order/route.ts` is based on saved store settings plus optional provider hint, not recommendation output.
- `Partial`: scoring math uses attempted-order denominators, which does not currently match `getDeliveryPerformanceSummary()` success-rate math in `convex/deliveryAnalytics.ts`.
- `Policy-locked`: do not document automated provider switching, silent failover, or recommendation-driven dispatch as live behavior.

---

## Connections

- **Depends on:** `lib/delivery/recommendation-engine.ts`, `lib/delivery-api.ts`, `lib/delivery/contracts.ts`.
- **Triggers:** nothing in live runtime today.
- **Shares data with:** `lib/delivery/rollout-gates.ts`, `convex/deliveryAnalytics.ts`, `app/api/delivery/create-order/route.ts`.

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Runtime usage | `Deferred`: helper exists but is not wired into dispatch | `Planned`: either add a real server-owned decision surface or remove the helper |
| Data source | `Deferred`: no live fetch path for provider metrics | `Planned`: server-owned metrics input, if adopted |
| Selection behavior | `Current`: saved provider/default drives dispatch | `Planned`: recommendation can influence selection only after an explicit product/security decision |
| Automation | `Deferred`: no auto-switching or launch governance driven by this helper | `Planned`: any automation would need separate rollout controls |

---

---

## Security Considerations

- `Current`: the helper is a pure local function and does not touch credentials, auth tokens, or store data by itself.
- `Deferred`: because it is not a live runtime endpoint, there is no current auth boundary to document beyond its repo presence.
- `Policy-locked`: if recommendation becomes real, it should be server-owned; do not trust client-supplied provider metrics to choose courier dispatch.
- `Policy-locked`: do not let a future recommendation surface bypass owner-controlled provider configuration without an explicit product and security decision.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T24 | `[>]` | Decide whether to wire a real server-owned recommendation endpoint into delivery runtime or remove the dormant recommendation helper. |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** -

**Outcome:** Unit coverage exists in `tests/unit/delivery-recommendation-engine.test.js`, but there is no live browser flow because the feature is not wired into runtime.

## Open Questions

- Should recommendation stay as an internal scoring utility, or should it become a real server-owned delivery decision surface?

---

## Notes

- Main code references: `lib/delivery/recommendation-engine.ts`, `lib/delivery-api.ts`, `tests/unit/delivery-recommendation-engine.test.js`.
- The current route-level truth is in `app/api/delivery/create-order/route.ts:206`: saved provider selection wins over request hints when a supported provider is already configured for the store.

---

## Archive

None.
