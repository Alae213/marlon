# Feature: Additional Courier Providers

> **Status:** `deferred`
> **Phase:** v1.1
> **Last updated:** 2026-04-16

---

## Summary

Additional courier providers are only partially represented in the repo today. Current: settings, schema, and provider normalization recognize Yalidine, ZR Express, Andrson, and Noest. Partial: only Yalidine and ZR Express have real adapter, dispatch, and contract-test support. Andrson and Noest remain placeholder providers in settings and normalization, not production-ready integrations. Canonical implementation detail already lives in `context/features/Settings/delivery-provider-settings.md`, `context/features/Delivery_Internal/delivery-provider-adapters.md`, `context/features/Delivery_Internal/delivery-provider-rollout-gates.md`, and `context/features/Delivery_Internal/delivery-provider-recommendation-engine.md`.

---

## Users

- Store owners configuring courier providers in settings.
- Internal maintainers deciding whether placeholder providers should stay visible before adapter support exists.

---

## User Stories

- As a store owner, I want the provider list to reflect which couriers actually work today.
- As a maintainer, I want schema visibility and runtime support to stay aligned so placeholder providers are not mistaken for live dispatch options.

---

## Behaviour

### Happy Path

1. The settings UI exposes provider choices for Yalidine, ZR Express, Andrson, and Noest.
2. Provider values are normalized through `lib/delivery-provider.ts`, and settings/schema storage also accepts those names.
3. Live dispatch and test flows only succeed for Yalidine and ZR Express because those are the only providers with real adapter wiring and tests.

### Edge Cases & Rules
- `Current`: `lib/delivery-provider.ts` normalizes `andrson` and `noest`, and `convex/schema.ts` allows them in settings records.
- `Current`: `lib/delivery/adapter-registry.ts` registers only ZR Express and Yalidine adapters.
- `Current`: contract tests in `tests/unit/delivery-provider-contract.test.js` cover only ZR Express and Yalidine.
- `Partial`: Andrson and Noest can appear configured in settings metadata, but `toDeliveryApiProvider()` returns `null` for them and runtime adapter support is missing.
- `Planned`: the primary correction is already tracked as `T15` in `context/project/TASK-LIST.md`.

---

## Connections

This is a synthesis doc that points to the canonical provider implementation docs.

- **Depends on:** `components/pages/editor/settings/delivery-integration-settings.tsx`, `convex/schema.ts`, `convex/siteContent.ts`, `lib/delivery-provider.ts`, `lib/delivery/adapter-registry.ts`
- **Triggers:** provider configuration, connection testing, and delivery dispatch
- **Shares data with:** `context/features/Settings/delivery-provider-settings.md`, `context/features/Delivery_Internal/delivery-provider-adapters.md`, `context/features/Delivery_Internal/delivery-provider-rollout-gates.md`, `context/features/Delivery_Internal/delivery-provider-recommendation-engine.md`

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Recognized provider names | `Current`: Yalidine, ZR Express, Andrson, and Noest appear in settings/schema/normalization | `Current`: runtime support matches the visible provider list |
| Live adapters | `Current`: Yalidine and ZR Express only | `Planned`: either ship Andrson and Noest adapters or remove/gate them |
| Test coverage | `Current`: contract tests exist for the two real adapters | `Planned`: coverage expands only when new adapters become real |
| Documentation source of truth | `Current`: canonical detail lives in the linked Settings and Delivery_Internal docs | `Current`: keep this page as a short synthesis only |

---

---

## Security Considerations

- `Current`: live courier API calls stay server-side through the real adapters only.
- `Partial`: placeholder providers in settings can create false confidence if docs imply they are production-ready.
- `Policy-locked`: do not treat schema acceptance or UI visibility as proof that a provider is safe for dispatch.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T15 | `[ ]` | Remove unsupported courier providers from the live settings surface or clearly gate them until real adapters and dispatch/test support exist. |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** -

**Outcome:** No browser UAT result is recorded in repo-backed context. Repo-backed unit tests cover only Yalidine and ZR Express adapter contracts.

## Open Questions

- Should Andrson and Noest remain visible as placeholders, or should provider visibility be reduced to the two working integrations until more adapters ship?

---

## Notes

- This page is intentionally short and defers detailed implementation truth to the canonical feature docs already present under `Settings` and `Delivery_Internal`.
- Main code references: `lib/delivery-provider.ts`, `lib/delivery/adapter-registry.ts`, `tests/unit/delivery-provider-contract.test.js`.

---

## Archive

None.
