# Feature: Delivery Provider Adapters

> **Status:** `in-progress`
> **Phase:** v1
> **Last updated:** 2026-04-16

---

## Summary

Delivery Provider Adapters are the server-side courier integrations behind dispatch and tracking in `lib/delivery/`. Current: `lib/delivery/adapter-registry.ts` registers real adapters for ZR Express and Yalidine, and `app/api/delivery/create-order/route.ts` dispatches through them via `lib/delivery-api.ts`. Partial: normalization, schema, and settings also recognize Andrson and Noest, but there are no runtime adapters or live dispatch/test support for those providers.

---

## Users

- Store owners who configure a supported courier and dispatch orders from Orders.
- Server-side delivery runtime in `app/api/delivery/create-order/route.ts` and `lib/delivery/service.ts`.

---

## User Stories

- As a store owner, I want configured courier providers to dispatch orders through one consistent server path so that Orders does not need provider-specific logic.
- As a maintainer, I want provider-specific request/response mapping isolated per adapter so that adding or fixing a courier does not rewrite the dispatch route.

---

## Behaviour

### Happy Path

1. A store owner selects a provider in `components/pages/editor/settings/delivery-integration-settings.tsx`, and `convex/siteContent.ts` persists the primary provider plus `enabledProviders`.
2. `app/api/delivery/create-order/route.ts` loads the store's configured provider, normalizes it with `lib/delivery-provider.ts`, and converts supported values to API providers with `toDeliveryApiProvider()`.
3. `lib/delivery-api.ts` sends the request through `DeliveryService`, which resolves the adapter from `createDefaultDeliveryAdapterRegistry()` and calls either `lib/delivery/adapters/zr-express-adapter.ts` or `lib/delivery/adapters/yalidine-adapter.ts`.

### Edge Cases & Rules

- `Current`: only `zr_express` and `yalidine` exist as real adapter contracts in `lib/delivery/contracts.ts`.
- `Current`: adapter registry wiring is explicit in `lib/delivery/adapter-registry.ts`; unsupported providers are not dynamically loaded.
- `Partial`: `lib/delivery-provider.ts` normalizes `andrson` and `noest`, and `convex/schema.ts` allows them in settings/credential records, but `toDeliveryApiProvider()` returns `null` for both.
- `Current`: the live dispatch route is settings/default driven. It prefers the store's saved provider in `app/api/delivery/create-order/route.ts:204` and only falls back to a request hint when the store has no supported provider.
- `Current`: `convex/siteContent.ts:testDeliveryConnection` only contains real request logic for ZR Express and Yalidine; unsupported providers end with `Unsupported provider.`

---

## Connections

- **Depends on:** `lib/delivery/adapter-registry.ts`, `lib/delivery/service.ts`, `lib/delivery/contracts.ts`, `app/api/delivery/create-order/route.ts`.
- **Triggers:** courier create-order and tracking status requests through provider adapters.
- **Shares data with:** `convex/siteContent.ts`, `components/pages/editor/settings/delivery-integration-settings.tsx`, `context/features/Settings/delivery-provider-settings.md`.

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Live adapters | `Current`: ZR Express and Yalidine only | `Planned`: either add real adapters for additional providers or hide placeholders until they exist |
| Provider normalization | `Partial`: settings/schema recognize Andrson and Noest beyond live runtime support | `Current`: normalization and runtime support match exactly |
| Selection strategy | `Current`: saved store provider drives dispatch | `Planned`: optional recommendation/governance layer may influence selection, but it is not live today |
| Contract coverage | `Current`: unit contract tests cover the two real adapters in `tests/unit/delivery-provider-contract.test.js` | `Planned`: broader provider matrix and failure-mode coverage |

---

---

## Security Considerations

- `Current`: adapters are only reached from server-side code; the browser does not call courier APIs directly.
- `Current`: the dispatch route re-checks auth and store ownership before loading provider config.
- `Current`: credentials are loaded server-side and passed into adapters from protected runtime paths, not from public metadata.
- `Partial`: unsupported providers are still visible in settings, so documentation and UI must not imply live dispatch support where no adapter exists.
- `Policy-locked`: do not treat provider normalization or schema visibility as proof that a courier is production-ready.

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

**Outcome:** Repo-backed adapter tests exist in `tests/unit/delivery-provider-contract.test.js`, but no browser UAT result is recorded here.

## Open Questions

- None beyond the already-tracked adapter mismatch: Andrson and Noest are config-visible, but no live adapter implementation exists for them.

---

## Notes

- Main code references: `lib/delivery/adapter-registry.ts`, `lib/delivery/service.ts`, `lib/delivery/adapters/zr-express-adapter.ts`, `lib/delivery/adapters/yalidine-adapter.ts`, `lib/delivery-provider.ts`.
- The route-level provider type in `lib/delivery-api.ts` still includes only supported runtime providers; there is no dormant Andrson or Noest adapter file in the repo.

---

## Archive

None.
