# Feature: Runtime Canonical Alignment Plan

## What It Does
This plan aligns live runtime behavior with the canonical product truth already locked in `context/project/OVERVIEW.md`, `context/project/SCOPE.md`, and `context/project/DECISIONS.md`. It sequences the work needed to replace the old billing model, remove the single-store runtime limit, introduce role and invite foundations safely, and harden payment and webhook trust so unlocks are reliable and defensible.

## Who Uses It
- Product and engineering during MVP hardening.
- QA and release planning when validating canonical-policy rollout.
- Future feature work touching billing, store access, agencies, invites, and payments.

## User Stories
- As a merchant, I want runtime pricing and lock behavior to match what the product promises so that billing feels predictable and trustworthy.
- As a multi-store operator, I want to create and manage more than one store under one account so that the platform supports the canonical tenancy model.
- As a store owner, I want to invite collaborators with limited permissions so that store operations do not depend on a single account.
- As the platform, I want unlock activation to happen only from verified server-side payment evidence so that spoofed or replayed webhooks cannot change store state.

## Happy Path
1. Secure store access, internal payment activation, and webhook evidence primitives are shipped first.
2. Runtime billing switches from the legacy trial and 50-order model to the canonical `2000 DZD / store / month`, `5 orders/day`, masked-overflow model.
3. Dashboard and backend store creation move from one-store-only to unlimited stores per account.
4. Store membership roles and invite flows are added on top of the multi-store foundation.
5. Any store admin can initiate payment, verified webhooks unlock the correct store, and masked overflow is retained for 5 days then deleted if still locked.

## Edge Cases
- Legacy stores on the old trial model need an explicit migration path so lock state does not flip unpredictably during rollout.
- Daily cap logic must use `Africa/Algiers`; UTC-only resets would create merchant-facing policy drift.
- Overflow orders must remain accepted in checkout while merchant-side reads, exports, and details stay masked until unlock.
- Multi-store support must not widen tenant access accidentally; owner-only checks cannot simply be removed before membership enforcement exists.
- Payment routes must fail closed when provider credentials, verification material, or canonical store context are missing.
- Invite and role foundations must preserve the governance lock that owner transfer or removal requires explicit current-owner confirmation.

## Dependencies
- Requires: `context/project/OVERVIEW.md`, `context/project/SCOPE.md`, `context/project/DECISIONS.md`
- Requires: `context/features/Platform/billing-locking-and-subscriptions.md`
- Requires: `context/features/Platform/payment-provider-abstraction-and-webhooks.md`
- Requires: `context/features/Platform/tenant-access-and-store-ownership.md`
- Requires: `context/features/Scaffolded/agency-mode.md`
- Blocks: release of canonical billing, unlimited stores, role-aware access, and trusted unlock activation

## Phases

## T34 - Schema Delta and Migration Spec

Purpose: define and land the minimum schema expansion needed to cut runtime billing and tenancy over to the canonical policy without changing access scope during rollout.

### Proposed Tables and Field Changes

#### 1) `stores` - keep, but narrow it back to store identity + compatibility markers

- Keep as the canonical store record.
- Keep existing identity fields such as `ownerId`, `name`, `slug`, profile/contact fields, and `status` during migration.
- Add planned canonical billing fields:
  - `billingState`: `active | overflow_locked | unlock_pending | archived`
  - `billingStateUpdatedAt`
  - `billingPolicyVersion`: start with `v1_canonical_overflow`
  - `billingCompatibilityMode`: `legacy_trial | canonical`
  - `currentUnlockPeriodId` optional reference to the active store billing period record
  - `membershipMode`: `owner_only | memberships_enabled`
- Keep legacy fields (`subscription`, `orderCount`, `firstOrderAt`, `trialEndsAt`, `paidUntil`, `lockedAt`) through compatibility mode only; do not use them as the post-cutover source of truth.

#### 2) `storeBillingPeriods` - new

One row per store billing cycle or unlock window.

- Key fields:
  - `storeId`
  - `status`: `pending | active | expired | canceled`
  - `startedAt`, `endsAt`
  - `activatedAt` optional
  - `activatedByUserId` optional
  - `activationSource`: `migration | verified_webhook | internal_admin`
  - `priceDzd`: fixed captured amount for that period
  - `policyVersion`
  - `evidencePaymentAttemptId` optional
  - `notes` optional
- Indexes: by `storeId`, by `storeId + status`, by `endsAt`
- Why: separates time-bounded paid access from the mutable `stores` document.

#### 3) `paymentAttempts` - new

Server-owned payment intent/checkout record.

- Key fields:
  - `storeId`
  - `initiatedByUserId`
  - `provider`: `chargily | sofizpay`
  - `purpose`: `store_unlock`
  - `status`: `created | provider_pending | succeeded | failed | expired | canceled`
  - `amountDzd`, `currency`
  - `billingPeriodStart`, `billingPeriodEnd` optional planned coverage window
  - `providerCheckoutId` optional
  - `providerReference` optional
  - `idempotencyKey`
  - `requestSnapshot` with server-derived store slug/name, actor role, and policy version
  - `resolvedMembershipId` optional
  - `createdAt`, `updatedAt`, `expiresAt` optional
- Indexes: by `storeId`, by `initiatedByUserId`, by `provider + providerCheckoutId`, by `idempotencyKey`
- Guardrail: client never supplies authoritative amount or target store state.

#### 4) `paymentEvidence` - new

Immutable normalized evidence captured from provider callbacks or reconciled provider reads.

- Key fields:
  - `paymentAttemptId`
  - `storeId`
  - `provider`
  - `providerEventId` optional
  - `providerPaymentId` optional
  - `eventType`
  - `verificationStatus`: `verified | rejected | pending_review`
  - `verificationMethod`: `signature | provider_fetch | manual_reconciliation`
  - `signatureCheckedAt` optional
  - `receivedAt`
  - `eventCreatedAt` optional provider timestamp
  - `payloadHash`
  - `payloadRedacted`
  - `duplicateOfEvidenceId` optional
  - `appliedAt` optional
  - `appliedBillingPeriodId` optional
- Indexes: by `paymentAttemptId`, by `storeId + receivedAt`, unique-by-provider event identifiers where available
- Why: keeps webhook receipts/evidence immutable and auditable without mutating the payment attempt log.

#### 5) `storeMemberships` - new

Server-owned account-to-store access record.

- Key fields:
  - `storeId`
  - `userId`
  - `role`: `owner | admin | staff`
  - `status`: `active | revoked | pending_acceptance`
  - `createdAt`, `updatedAt`
  - `grantedByUserId`
  - `revokedAt` optional
  - `revokedByUserId` optional
  - `source`: `owner_bootstrap | invite_accept | migration`
  - `permissionsVersion`
- Indexes: unique active membership by `storeId + userId`, plus `userId + status` and `storeId + role`
- Guardrail: owner remains singular by policy even if legacy `stores.ownerId` stays present for compatibility.

#### 6) Optional deferred table: `storeInvites` - not part of cutover

- Keep invite lifecycle out of T34 runtime cutover.
- `storeMemberships` must be sufficient for migrated owners and future accepted invites, but invite issuance/acceptance remains a later task.

### Migration Sequencing and Safeguards

1. Additive schema only.
   - Introduce new tables and additive `stores` fields first.
   - Do not drop or repurpose legacy billing fields yet.

2. Backfill owner membership safely.
   - Create one `storeMemberships` row per existing store owner with `role=owner`, `status=active`, `source=migration`.
   - Keep runtime auth on `stores.ownerId` until parity checks confirm every store has exactly one active owner membership.

3. Backfill canonical compatibility markers.
   - Stamp all current stores with `billingCompatibilityMode=legacy_trial` and `membershipMode=owner_only`.
   - Populate `billingState` from current reality conservatively: active stores remain `active`; legacy locked stores can map to `overflow_locked` only after manual rule review.

4. Start dual-write for payment initiation and verified evidence.
   - New checkout creation writes `paymentAttempts`.
   - Verified callbacks append `paymentEvidence` first, then activate `storeBillingPeriods`, then update additive `stores.billingState` pointers.
   - Legacy `stores.subscription`/`paidUntil` may be mirrored during rollout, but only as compatibility output.

5. Start dual-read behind explicit flags.
   - Internal tooling compares legacy derived state against canonical derived state per store.
   - Cut over reads in order: internal admin views -> billing settings UI -> merchant lock enforcement -> cleanup jobs.

6. Enable membership-aware auth without widening access.
   - Central access helpers must still accept `stores.ownerId` as the effective authority until `membershipMode=memberships_enabled` for that store.
   - Admin/staff behavior stays disabled until policy helpers are live and tested.

7. Runtime cutover store by store or cohort by cohort.
   - Move stores from `legacy_trial` to `canonical` only when owner membership exists, billing pointer fields are populated, and payment evidence path is verified.
   - Use fail-closed behavior: on canonical-read inconsistency, fall back to owner-only/locked-safe behavior rather than broad access or auto-unlock.

8. Legacy field retirement last.
   - Remove legacy `stores.subscription`, `orderCount`, `firstOrderAt`, `trialEndsAt`, `paidUntil`, and `lockedAt` only after all merchant reads, payments, and cleanup paths rely solely on canonical records.

### Compatibility Notes for Legacy Trial/Subscription Stores

- Legacy stores must not lose paid time during migration. If a store has a future `paidUntil`, seed one `storeBillingPeriods` record covering the remaining window with `activationSource=migration`.
- Legacy trial stores stay in `billingCompatibilityMode=legacy_trial` until the canonical overflow counter and masking logic are live; do not reinterpret an unfinished trial as a paid canonical period.
- Existing `subscription` labels may remain visible to old UI during rollout, but new logic should treat them as compatibility data only.
- Stores already in a legacy locked state need manual review rules before conversion because the old 50-order lock is not equivalent to canonical overflow masking.
- For pre-cutover stores, merchant access should remain owner-only even after membership rows are backfilled; creating owner memberships is a data foundation step, not a permission expansion.

### Payment Evidence and Membership Modeling Rules

- Payment evidence is append-only and immutable; activation consumes verified evidence but never rewrites the raw receipt.
- `paymentAttempts` capture intent and provider linkage; `paymentEvidence` captures what the provider proved.
- A store unlock becomes effective only when a verified evidence record is linked to a `paymentAttempt` and activates exactly one `storeBillingPeriods` row.
- `storeMemberships` model store access only. They should not carry billing flags, provider IDs, or unlock authority beyond role-based permission checks.
- Initial cutover must not widen current access: migrated owner membership mirrors the existing owner only; no extra admin/staff rows are created during T34.
- Until T35/T39/T40 land, authorization must continue to default to the stricter of the two models: legacy owner-only or canonical membership helper.

### Phase 1 - Trusted Platform Primitives
Outcome: security-critical primitives exist before wider tenancy and billing changes land.

- Build a central store-access helper path for merchant and internal server actions.
- Add durable payment attempt and webhook receipt records, idempotency, and internal activation plumbing.
- Stop trusting client-supplied billing inputs such as amount, store name, or unlock target.
- Remove any production unlock dependency on demo/mock payment success.

Risks:
- Breaking existing owner flows while centralizing authorization.
- Shipping partial payment hardening that rejects valid provider callbacks.

Affected files and areas:
- `convex/schema.ts`
- `convex/stores.ts`
- `convex/users.ts`
- `convex/siteContent.ts`
- `app/api/chargily/create-payment/route.ts`
- `app/api/chargily/webhook/route.ts`
- `lib/payment-service.ts`
- `context/developer/SECURITY.md`

### Phase 2 - Canonical Billing and Locking Cutover
Outcome: runtime enforcement matches canonical commercial policy per store.

- Replace the old 30-day trial, 50-order cap, and `9,900 DZD` copy with the canonical billing model.
- Enforce `5 orders/day` per store with reset at `00:00 Africa/Algiers`.
- Accept overflow orders while masking or freezing merchant-side overflow access until unlock.
- Delete still-masked overflow data after 5 days.

Risks:
- Lock-state regressions on active stores during data migration.
- Sensitive overflow data leaking through exports, drawers, analytics, or logs.

Affected files and areas:
- `convex/schema.ts`
- `convex/stores.ts`
- `convex/orders.ts`
- `app/api/orders/create/route.ts`
- `contexts/billing-context.tsx`
- `components/features/billing/billing-section.tsx`
- `components/pages/layout/locked-overlay.tsx`
- `components/features/payment/payment-modal.tsx`
- `components/pages/orders/`

### Phase 3 - Multi-Store Account Foundations
Outcome: one account can own and access multiple stores without breaking tenant boundaries.

- Remove the one-store-per-owner runtime cap.
- Update dashboard, creation flow, and store selection UX for multiple stores.
- Add server-owned account-to-store membership records needed for future admin and agency flows.
- Keep solo-first UX while making multi-store behavior real.

Risks:
- Existing queries and subscriptions may leak or miss stores if they still trust caller-supplied identity.
- Dashboard and routing assumptions may still expect a single default store.

Affected files and areas:
- `app/page.tsx`
- `convex/stores.ts`
- `convex/schema.ts`
- `contexts/realtime-context.tsx`
- `app/editor/[storeSlug]/page.tsx`
- `app/orders/[storeSlug]/page.tsx`

### Phase 4 - Roles, Invites, Admin Pay, and Release Hardening
Outcome: canonical collaboration and unlock permissions are live on top of the secure multi-store model.

- Introduce `owner | admin | staff` permissions with a minimal v1 policy matrix.
- Add invite, accept, revoke, and membership management foundations for client-owned and agency-operated stores.
- Allow any store admin to initiate and complete unlock payments for that store.
- Add release tests, auditability, and rollout checks for verified webhooks, masking, and role-sensitive actions.

Risks:
- Permission drift across Convex functions, route handlers, and UI visibility.
- Owner-transfer logic accidentally broadening beyond the governance lock.

Affected files and areas:
- `convex/stores.ts`
- `convex/users.ts`
- `convex/siteContent.ts`
- `app/page.tsx`
- `app/orders/[storeSlug]/page.tsx`
- `app/editor/[storeSlug]/page.tsx`
- `components/features/payment/payment-modal.tsx`
- invite and membership UI surfaces to be introduced
- tests covering payment, access, and masked-overflow behavior

## Tasks (T-numbers)
- T34: Define schema changes and migration plan for canonical billing state, payment evidence, and store memberships. Completed on 2026-04-16 with additive Convex schema scaffolding plus internal migration preview/backfill helpers; runtime cutover remains in T35-T40.
- T35: Completed on 2026-04-16 with centralized Convex store-access helpers, owner-first dual-auth resolution, and internal-only payment activation scaffolding that does not widen merchant runtime access.
- T36: Completed on 2026-04-16 with owner-authorized server checkout creation, durable `paymentAttempts`, and provider metadata/idempotency persistence for later webhook reconciliation.
- T37: Harden webhook ingestion with signature verification, replay checks, dedupe, receipt persistence, and internal unlock activation.
- T38: Apply masked-overflow protection to merchant reads, exports, and cleanup after 5 days.
- T39: Add server-backed store memberships and remove the one-store cap for multi-store accounts.
- T40: Add invite, accept, revoke, and membership-management foundations for agency and client collaboration.
- T41: Add integration, e2e, and rollout checks for verified unlocks, masking, retention, and multi-store access.

### Immediate Follow-up Tasks Derived from T34

- T35 must implement a strict dual-auth helper that prefers owner-only semantics until membership mode is explicitly enabled per store.
- T36 must create `paymentAttempts` from server-derived store context and persist provider linkage/idempotency.
- T37 must persist immutable `paymentEvidence`, enforce replay protection, and activate `storeBillingPeriods` only from verified evidence.
- T39 must backfill owner memberships before removing the single-store guard and before any non-owner role is honored.

### T34 Delivered Scaffold

- `convex/schema.ts` now includes additive `stores` compatibility fields plus new `storeBillingPeriods`, `paymentAttempts`, `paymentEvidence`, and `storeMemberships` tables.
- `convex/canonicalBillingMigrations.ts` now provides internal preview and batched migration helpers to backfill owner memberships, stamp store compatibility markers, and seed billing periods from future legacy `paidUntil` values.
- Legacy locked stores are intentionally left for manual review before any canonical `overflow_locked` mapping so schema rollout does not reinterpret the old 50-order lock automatically.

### T35 Delivered Access Primitives

- `convex/storeAccess.ts` now centralizes store-scoped role checks and keeps owner-only behavior unless `membershipMode=memberships_enabled` for that store.
- `convex/storeAccessLib.ts` now contains the pure owner/admin/staff resolution logic used to fail closed during the transition period and support narrow unit coverage.
- Touched merchant write paths in `convex/stores.ts`, `convex/orders.ts`, `convex/products.ts`, and `convex/siteContent.ts` now reuse the shared helper instead of open-coded owner checks.
- `convex/stores.ts` now exposes an internal-only payment activation mutation for future verified webhook/server-owned unlock flows without granting new user-facing access.

### T36 Delivered Payment Initiation Hardening

- `app/api/chargily/create-payment/route.ts` now authenticates the caller, requires a store-scoped Convex token, and derives checkout inputs on the server instead of trusting client amount or store-name fields.
- `convex/payments.ts` now creates `paymentAttempts` from centralized store-access checks, capturing actor role, store snapshot, idempotency key, and provider linkage before and after provider checkout creation.
- `lib/payment-service.ts` now forwards server-owned provider metadata such as `paymentAttemptId` so T37 can reconcile verified callbacks without trusting client payloads.
