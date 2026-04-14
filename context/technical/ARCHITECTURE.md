# Architecture

Canonical runtime architecture for Marlon MVP, aligned with locked Phase 1-4 decisions.

## 1) System Context

- Clients: public storefront users (COD buyers) and authenticated merchant users (owner/admin/staff) in the same Next.js application.
- App runtime: Next.js on Vercel for UI routes, API/webhook ingress, and edge/middleware checks.
- Backend and data plane: Convex for business logic, realtime subscriptions, and primary data storage.
- Identity: Clerk (Google OAuth) for authentication; Convex receives trusted actor identity from Clerk session context.
- External integrations:
  - Chargily Pay for store unlock subscription payment (`2000 DZD/store/month`).
  - Delivery providers (ZR Express, Yalidine) via adapter layer.
- Platform policy baseline:
  - Multi-tenant by store with strict tenant isolation.
  - Global unique store slugs with reserved-word denylist.
  - Public catalog performance via ISR/static, checkout/order paths dynamic.

## 2) Runtime Components

- Next.js Web App
  - Storefront catalog/product routes rendered with ISR/static caching.
  - Checkout/order placement, admin actions, and payment webhook paths remain dynamic.
- API/Webhook Layer
  - Receives checkout submissions, billing/unlock events, and delivery dispatch requests.
  - Applies request validation, rate limits, signature verification (for webhooks), and idempotency guards.
- Authorization Core (Convex)
  - Central auth helper + policy layer is mandatory for all protected queries/mutations/actions.
  - Resolves actor role (owner/admin/staff) and store membership before any store-scoped access.
  - Resolves platform governance role (`platform_admin`) for exceptional platform-scoped interventions only.
- Order Service (Convex)
  - Hybrid model: inline order state write plus mandatory append to immutable audit log.
  - Enforces locked-state masking/freeze behavior for overflow orders.
- Billing/Lock Service (Convex)
  - Tracks per-store daily quota (`5/day`, reset at `00:00 Africa/Algiers`).
  - Transitions lock/unlock state and unlock window from verified payment events.
- Delivery Integration Service
  - Stores delivery metadata in `siteContent.deliveryIntegration`.
  - Stores secrets in encrypted `deliveryCredentials` records only (AES-GCM key from env).
  - Uses provider adapter interface + registry/service boundaries (`lib/delivery/*`) for extensible provider support.
  - Recommendation engine foundation runs in recommendation-only mode (manual dispatch remains required).
  - Uses async dispatch queue with retry and dead-letter queue (DLQ).
- Delivery Analytics Service
  - Persists canonical events in `deliveryAnalyticsEvents` (`attempted`, `dispatched`, `delivered`, `failed`, `rts`).
  - Produces store-level summary views by provider and region for success-rate-first optimization.
- Background Workers/Schedulers
  - Delivery job retries, DLQ handling, overflow lifecycle cleanup, retention/anonymization jobs.

## 3) Request/Data Flows

### A) Storefront order creation
1. User loads storefront catalog/product pages from ISR/static output.
2. Checkout submits to dynamic path with customer/order payload.
3. Backend resolves `storeSlug` (global unique + reserved-word policy already enforced at creation).
4. Billing/lock policy checks store daily usage (`5/day`, `Africa/Algiers` calendar reset).
5. Order is created with inline state; audit append is written in the same logical operation.
6. If within cap: normal merchant-visible order.
7. If overflow: order is accepted, but merchant-side sensitive fields/actions are masked/frozen until unlock.
8. Customer-facing flow remains unchanged (no lock notification).

### B) Overflow lock and freeze behavior
1. When store usage exceeds daily cap, new incoming orders enter overflow-protected mode.
2. Merchant views show masked customer identity/contact/address and disabled order actions for locked overflow records.
3. Masking policy is full (no exceptions) until store unlock is active.
4. Overflow masked records auto-delete after 5 days if unlock does not occur.
5. Analytics derived from deleted/expired records are retained only in anonymized form.

### C) Unlock payment webhook
1. Store admin initiates unlock payment for a specific store (`2000 DZD/store/month`).
2. System creates a payment intent/session bound to store and actor permissions.
3. Chargily webhook hits backend callback.
4. Webhook path verifies signature and replay window, then enforces idempotent event handling.
5. On verified success, store unlock state is activated for the paid window and an immutable audit event is appended.
6. Merchant access to previously frozen overflow data/actions is restored for retained records.

### D) Delivery dispatch
1. Merchant triggers dispatch from orders UI.
2. Authorization policy verifies actor permission for store/order dispatch action.
3. Delivery API logs `attempted` analytics event for store/provider/region dimensions.
4. Worker/API loads provider metadata + decrypts per-store credentials from `deliveryCredentials`.
5. If credentials missing: fail-safe error; global fallback allowed only when `DELIVERY_ALLOW_GLOBAL_CREDENTIAL_FALLBACK=true`.
6. Provider adapter executes call through delivery service boundary; terminal failures go to DLQ.
7. Dispatch outcome logs `dispatched` or `failed` analytics event and appends immutable audit entries.
8. Later terminal order statuses are normalized into `delivered`, `failed`, or `rts` analytics events.

## 4) Authorization and Tenant Isolation

- Single enforcement model: central authorization helper + policy layer; no feature-level ad hoc auth bypasses.
- Every store-scoped read/write requires:
  - authenticated actor,
  - resolved store membership,
  - role-based permission check for requested action.
- Tenant boundary key is `storeId`; slug is only a routing identifier and must resolve to one store globally.
- Slug governance:
  - global uniqueness,
  - reserved-word denylist,
  - collision-safe creation path.
- Locked role model:
  - Store: `owner`, `admin`, `staff`.
  - Platform: `platform_admin`.
- Role baseline and constraints:
  - `owner`: full store authority including required confirmation for ownership transfer/removal.
  - `admin`: broad operational control, but cannot unilaterally remove/transfer current owner.
  - `staff`: limited operational actions; no billing/governance authority.
  - `platform_admin`: break-glass governance path only, with strict reason-code and audit requirements.
- Ownership governance lock:
  - Owner transfer/removal requires explicit current owner confirmation.
  - Admin-only owner removal is forbidden.
  - Break-glass override is exceptional and must generate immutable governance audit events.
- Locked-state visibility rules are authorization policy outputs (not front-end-only masking).

## 5) Data Ownership Boundaries

- `stores`: canonical store identity, slug, commercial state, lock/unlock counters and windows.
- `storeMemberships` (or equivalent): actor-to-store role bindings and permission resolution source.
- `products`, `siteContent`, `deliveryPricing`: merchant-managed storefront/editor data, scoped to store.
- `orders`: operational state (status, totals, delivery state) with inline latest snapshot.
- `orderAudit` (append-only): immutable timeline of status changes, edits, call outcomes, lock/unlock, dispatch attempts.
- `ownerTransferRequests` (append + state machine): ownership governance workflow evidence (requested, confirmed, executed, canceled, expired, break-glass).
- `deliveryCredentials`: encrypted per-store/provider secrets; never embedded in generic content blobs.
  - metadata only in `siteContent.deliveryIntegration` (`provider`, `hasCredentials`, `lastUpdatedAt`).
  - secrets are write-only to UI after save.
- `billingEvents`/`webhookReceipts` (or equivalent): payment event idempotency and replay-defense evidence.
- Governance boundary:
  - ownership changes require two-step confirmation artifacts,
  - all exceptional `platform_admin` interventions carry reason code + ticket reference + immutable audit append.
- Retention boundary:
  - PII retained on a time-boxed policy,
  - masked overflow records purged after 5 days when still locked,
  - analytics retained only in anonymized aggregates.

## 6) Reliability and Failure Strategy

- Async external integrations by default (delivery queue) to isolate provider latency/failures from user actions.
- Retry + DLQ for delivery dispatch; operations can inspect/replay DLQ jobs with audit trace.
- Webhook resilience:
  - signature verification mandatory,
  - replay protection window,
  - idempotent processing.
- Anti-abuse controls in request paths: rate limits plus phone reputation/blocklist checks for COD fraud resistance.
- Environment topology: `dev`, `staging`, `production` with isolated secrets/config.
- Rollback policy: disable feature flag first, full rollback second.
- Monitoring requirements: error tracking + uptime + synthetic checkout monitor.
- Reliability target priority (first 90 days): checkout/order creation success.
- Data protection ops: hourly backups with restore target within 4 hours.

## 7) Performance Strategy

- Rendering split:
  - ISR/static for catalog and product discovery routes,
  - dynamic execution for checkout, order placement, auth-gated admin, and webhook endpoints.
- Realtime admin UX uses Convex subscriptions for order/editor updates.
- Keep hot request paths minimal:
  - avoid synchronous external provider calls during checkout,
  - move integration work to queue workers.
- Enforce index-first access for high-cardinality lookups (`slug`, `storeId`, date windows, queue status).
- Apply API rate limits on public submit and integration endpoints to protect p95 latency under abuse bursts.
- Synthetic checkout monitoring is part of performance SLO guardrails.

## 8) Open Implementation Notes

- PII retention duration is locked as time-boxed, but exact durations per PII category still need final codification in `context/technical/DATA_MODELS.md`.
- Delivery retry policy constants (max attempts, backoff schedule, DLQ replay policy) should be finalized in `context/technical/API_CONTRACTS.md`.
