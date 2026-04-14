# Delivery v2 Foundations

## Scope

This document captures the implementation foundations added for T12-T14 without introducing live integrations for new providers.

## v1.1 Light Polish (T11)

- Delivery integration settings copy is clarified to explain write-only credential behavior.
- Field-level guidance and validation feedback remain in place, with explicit save/test failure messaging.
- Success/error UX now returns actionable provider-specific outcomes from credential test actions.

## Delivery Analytics Instrumentation (T12)

- New Convex table: `deliveryAnalyticsEvents`.
- Canonical event taxonomy:
  - `attempted`
  - `dispatched`
  - `delivered`
  - `failed`
  - `rts`
- Event dimensions:
  - `storeId` (required)
  - `provider`
  - `region` (wilaya when available)
  - `orderId` (string when available)
  - `trackingNumber` (when available)
  - `source`, `reason`
- Instrumentation hooks:
  - `POST /api/delivery/create-order`: records `attempted`, then `dispatched` or `failed`.
  - `orders.updateOrderStatus`: records `delivered`, `failed`, or `rts` on terminal status changes.
  - `orders.updateTrackingNumber`: records `dispatched`.
- Summary query: `deliveryAnalytics.getDeliveryPerformanceSummary` (overall, by provider, by region).

## v2 Architecture Foundations (T13)

- Delivery provider adapter interface introduced in `lib/delivery/contracts.ts`.
- Existing ZR Express and Yalidine logic moved behind concrete adapters:
  - `lib/delivery/adapters/zr-express-adapter.ts`
  - `lib/delivery/adapters/yalidine-adapter.ts`
- Adapter registry introduced in `lib/delivery/adapter-registry.ts`.
- Service boundary introduced in `lib/delivery/service.ts` and wired via `lib/delivery-api.ts`.
- Recommendation engine base introduced in `lib/delivery/recommendation-engine.ts`.
  - Runs in `recommendation_only` mode.
  - Does not auto-dispatch.

## Provider Onboarding Framework (T14)

- Code checklist artifact: `lib/delivery/provider-onboarding.ts`.
- Rollout gate configuration and evaluator: `lib/delivery/rollout-gates.ts`.
- Provider contract test scaffolding:
  - `tests/helpers/delivery-provider-contract.js`
  - `tests/unit/delivery-provider-contract.test.js`

## Business Decision Still Pending

- Final stakeholder sign-off on optimization objective is still pending.
- Current implementation default remains success-rate-first until changed.
