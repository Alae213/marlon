# Infrastructure

Canonical infrastructure spec for Marlon MVP, aligned with locked runtime and environment contracts.

## 1) Runtime Topology

- Web and API ingress: Next.js 16 app on Vercel serves storefront/admin routes and API/webhook handlers.
- Core backend and data plane: Convex Cloud hosts business logic (queries/mutations/actions), realtime subscriptions, and primary data.
- Identity boundary: Clerk provides Google OAuth authn and signed identity context consumed by Next.js + Convex auth bridge.
- Payment boundary: provider abstraction selected by `PAYMENT_PROVIDER` (`chargily` active default, `sofizpay` optional) with webhook-driven unlock lifecycle.
- Delivery boundary: provider adapters for ZR Express and Yalidine use per-store encrypted credentials from Convex; async retries + DLQ handle provider failures.

## 2) Environment Boundaries

- `dev`: feature development and integration checks using non-production stores/data; supports mock payment/provider behavior when secrets are intentionally absent.
- `staging`: release-candidate validation with sanitized fixtures and full webhook/checkout contract checks before promotion.
- `production`: live merchant and buyer traffic; strict secret isolation, guarded releases, and incident controls.
- Responsibility split: Vercel owns app runtime/deploy surface, Convex owns function/data runtime, Clerk/payment/delivery providers own external service SLAs.
- Rule: no secret reuse across environments; promotion path is `feature branch -> main -> staging -> production`.

## 3) Data and Storage Boundaries

- System-of-record data: Convex tables store stores, memberships, products/site content, orders, billing events, and delivery analytics.
- Sensitive delivery credentials: stored only in encrypted `deliveryCredentials` records (AES-GCM via `DELIVERY_CREDENTIALS_KEY`); UI/API expose metadata-only flags.
- Audit and governance evidence: immutable append-only logs for order mutations, lock/unlock transitions, webhook decisions, and ownership governance actions.
- Logs/telemetry: structured application and webhook logs plus monitoring metrics retained for incident reconstruction; secrets and raw sensitive fields are never logged.

## 4) Network and Trust Boundaries

- Public web ingress: `https://marlon.com` serves storefront and authenticated merchant UI.
- Public API ingress (Next.js route handlers): checkout/order paths and integration endpoints are internet-facing and require validation + rate-limit controls.
- Webhook ingress: signed callbacks from Clerk and payment providers terminate at Next.js handlers and must pass signature, replay-window, and idempotency checks.
- Internal service paths: Next.js handlers call Convex functions; Convex functions call payment/delivery provider APIs over HTTPS using server-only secrets.
- Tenant trust rule: every store-scoped read/write resolves actor auth and `storeId` policy in backend authorization layer (never UI-only enforcement).

## 5) Domains, DNS, and Routing Model

- Primary domain: `marlon.com` (with `www` redirect policy managed in Vercel DNS/project settings).
- App surface: storefront and merchant UI routes are hosted under the same Next.js domain and separated by auth + role checks.
- API surface: `marlon.com/api/*` for first-party API and webhook routes.
- Webhook paths (current canonical):
  - `marlon.com/api/chargily/webhook`
  - `marlon.com/api/webhooks/clerk`
- Route policy: catalog/product pages can use static/ISR strategy; checkout, order creation, admin mutations, and webhooks remain dynamic.

## 6) Secret Ownership and Location

- Canonical ownership and variable contract are defined in `context/technical/ENVIRONMENT.md`.
- Vercel secret store: app/webhook/provider variables used by Next.js runtime (`CLERK_WEBHOOK_SECRET`, payment provider keys, public app URLs, provider selection flags).
- Convex env store: backend encryption root (`DELIVERY_CREDENTIALS_KEY`) and Convex runtime-sensitive values.
- Ownership model: platform operations owns deployment config, platform security owns encryption/incident-only fallback controls, service owners issue/rotate provider credentials.

## 7) Backup, Restore, and Disaster Expectations

- Backup baseline: production data backups run hourly.
- Restore objective: service/data restoration target is within 4 hours (RTO ceiling) for critical incidents.
- Validation expectation: restore drills run in non-production and verify checkout/order integrity plus lock/unlock state consistency.
- Incident sequence: contain impact (feature-flag disable first), restore service/data, validate critical user journeys, then complete postmortem actions.

## 8) Operational Risks and Guardrails

- Risk: webhook forgery/replay can grant incorrect unlocks. Guardrail: mandatory signature verification, replay-window checks, and idempotent processing.
- Risk: tenant data leakage across stores. Guardrail: centralized authorization by `storeId`, strict role checks, and no fallback credential use in normal operation.
- Risk: delivery provider outages/latency. Guardrail: async queue, retries, DLQ, and provider failure monitoring.
- Risk: secret exposure or drift. Guardrail: managed secret stores only, periodic rotation, environment isolation, and no secret logging.
- Risk: checkout reliability regression. Guardrail: required CI/CD gates (unit/integration/core checkout e2e), synthetic monitors, and rollback policy.
