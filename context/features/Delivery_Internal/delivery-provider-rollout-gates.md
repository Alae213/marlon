# Feature: Delivery Provider Rollout Gates

> **Status:** `in-progress`
> **Phase:** v1
> **Last updated:** 2026-04-16

---

## Summary

Delivery Provider Rollout Gates are only partially implemented as internal helpers today. Current: `lib/delivery/rollout-gates.ts` evaluates provider metrics against default thresholds, `lib/delivery/provider-onboarding.ts` defines a rollout checklist, and unit tests cover the threshold helper. Partial: these helpers are not wired into `app/api/delivery/create-order/route.ts` or merchant settings, so they do not currently govern live dispatch. The only real runtime gate in delivery operations today is the emergency global credential fallback switch `DELIVERY_ALLOW_GLOBAL_CREDENTIAL_FALLBACK`.

---

## Users

- Internal maintainers evaluating whether a courier looks ready for broader use.
- Future rollout/governance flows that may need reusable threshold logic.

---

## User Stories

- As a maintainer, I want a reusable threshold evaluator so that provider readiness checks are consistent when we review courier performance.
- As an operator, I want rollout documentation to reflect what is actually enforced so that helper code is not mistaken for live governance.

---

## Behaviour

### Happy Path

1. A caller passes attempted/delivered/failed/RTS counts into `evaluateProviderRolloutGate()` in `lib/delivery/rollout-gates.ts`.
2. The helper compares the metrics to `DEFAULT_PROVIDER_ROLLOUT_GATES` and returns pass/fail plus descriptive failure reasons.
3. Separately, `lib/delivery/provider-onboarding.ts` provides a static checklist for commercial, technical, security, reliability, operations, and analytics readiness.

### Edge Cases & Rules

- `Current`: default thresholds are code-defined only: minimum 50 attempts, minimum 0.8 success rate, maximum 0.15 failure rate, and maximum 0.15 RTS rate.
- `Partial`: the helper is unit-tested in `tests/unit/delivery-rollout-gates.test.js`, but no live runtime path consumes the result.
- `Partial`: rollout-gate math uses attempted-order denominators and is therefore sensitive to the analytics inconsistencies documented in `convex/deliveryAnalytics.ts` and `convex/performanceBackfill.ts`.
- `Current`: `lib/delivery/provider-onboarding.ts` is a static checklist, not an enforced workflow or persisted approval system.
- `Current`: there are no live per-provider launch flags, automatic provider blocking rules, or mature rollout governance controls in the dispatch route.
- `Current`: the only delivery runtime gate with real operational effect today is `DELIVERY_ALLOW_GLOBAL_CREDENTIAL_FALLBACK` in `app/api/delivery/create-order/route.ts`.

---

## Connections

- **Depends on:** `lib/delivery/rollout-gates.ts`, `lib/delivery/provider-onboarding.ts`, `tests/unit/delivery-rollout-gates.test.js`.
- **Triggers:** no live runtime behavior today.
- **Shares data with:** `convex/deliveryAnalytics.ts`, `convex/performanceBackfill.ts`, `lib/delivery/recommendation-engine.ts`.

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Threshold logic | `Current`: helper exists and is tested | `Current`: helper can stay, but only as support logic until wired intentionally |
| Runtime enforcement | `Partial`: no dispatch or settings enforcement uses rollout gates | `Planned`: explicit governance entrypoint if rollout controls become real |
| Onboarding workflow | `Partial`: checklist is static code data | `Planned`: persisted approval flow if needed |
| Feature gates | `Current`: only emergency credential fallback env flag has real runtime effect | `Planned`: separate provider rollout controls, if product chooses to build them |

---

---

## Security Considerations

- `Current`: rollout-gate helpers are not a live authorization or safety boundary; owner/store checks still live elsewhere.
- `Current`: the only real delivery gate with runtime impact is the emergency fallback env flag, which should remain off unless incident-driven.
- `Partial`: because rollout helpers are not enforced, operators must not rely on them as if they already block unsafe providers in production.
- `Policy-locked`: do not describe provider launch governance, per-provider kill switches, or automated rollout blocking as live until a real server-owned enforcement path exists.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T23 | `[ ]` | Align delivery analytics rollup shape and success-rate formulas across live writes, backfill, and scoring helpers. |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** -

**Outcome:** Unit coverage exists in `tests/unit/delivery-rollout-gates.test.js`, but there is no browser UAT because rollout gates are not wired into a user-facing flow.

## Open Questions

- None. The main gap is implementation wiring, not uncertainty about current behavior.

---

## Notes

- Main code references: `lib/delivery/rollout-gates.ts`, `lib/delivery/provider-onboarding.ts`, `app/api/delivery/create-order/route.ts`.
- This doc intentionally does not claim live provider governance beyond the env fallback switch, because the route does not consume rollout helper output today.

---

## Archive

None.
