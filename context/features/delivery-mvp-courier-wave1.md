# Feature: MVP Courier Wave 1 (Yalidine, ZR Express, Andrson, Noest Express)

## What It Does
This feature integrates four MVP couriers into the existing delivery module with safe, store-scoped credential handling, robust dispatch reliability controls, and normalized cross-provider tracking statuses. It is sequenced to ship one implementation task at a time, with risk controls for idempotency, retries, rate limits, and provider outages. The rollout preserves manual dispatch authority while capturing analytics needed to compare providers by success rate and operational stability.

## Who Uses It
Store owners and staff who configure delivery providers and dispatch COD orders, plus internal operations and support teams monitoring delivery health and provider performance.

## User Stories
- As a store owner, I want to connect one or more couriers with write-only credentials so secrets are never exposed after save.
- As an operator, I want dispatch to fail safely with clear reasons when credentials, coverage, or order data are invalid.
- As support, I want normalized statuses and provider error taxonomy so troubleshooting is consistent across couriers.
- As product, I want reliable delivery analytics by provider/region so we can optimize for success rate.
- As engineering, I want idempotent dispatch and bounded retries so duplicate shipments and runaway retries are prevented.

## Happy Path
1. Team maps provider docs and finalizes adapter contracts for Yalidine, ZR Express, Andrson, and Noest Express.
2. Merchant configures provider credentials in secure, write-only settings UI.
3. Merchant dispatches an order and system performs preflight checks (store auth, credential presence, payload validity, provider availability).
4. Dispatch request is sent through provider adapter with idempotency key and retry policy.
5. System records normalized dispatch + tracking events and updates order delivery state.
6. Merchant sees status and tracking updates in a single normalized model regardless of provider.
7. Ops monitors provider success/failure metrics and rate-limit/retry pressure to guide rollout.

## Edge Cases
- Duplicate dispatch clicks/network retries: enforce store+order+provider idempotency key and dedupe window.
- Same order sent to wrong courier after reassignment: block second live dispatch unless previous job is canceled/failed.
- Missing or expired credentials: preflight fail with actionable remediation and no provider call attempt.
- Provider API timeout with unknown outcome: mark as uncertain, queue reconciliation check before retrying.
- Provider-specific validation failures (phone/address/commune formats): normalize and validate before adapter call; return field-level errors.
- Rate limit bursts (429): apply provider-specific backoff/jitter and temporary circuit break.
- Webhook arrives before dispatch acknowledgement: accept and correlate by external reference; update normalized state idempotently.
- Partial provider outage by region: surface degraded status, block affected dispatches, and recommend manual fallback provider.
- Status drift across polling/webhook channels: use monotonic status precedence and ignore stale regressions.
- Credential rotation during in-flight jobs: pin credential version per job; use new version only for new dispatches.

## Dependencies
- Requires: `context/features/delivery-v2-rollout-plan.md` (manual assignment + recommendation-only baseline).
- Requires: `context/features/delivery-credentials-safety.md` (store-scoped encrypted credentials and write-only UX).
- Requires: Existing delivery adapter/service boundaries in `lib/delivery/*` and Convex delivery analytics schema.
- Blocks: Wave-2 automation depth and provider auto-assignment decisions.

## T26 Scope Freeze + Acceptance Gates

### Scope Freeze
- In scope: lock MVP courier wave 1 to exactly four providers: Yalidine, ZR Express, Andrson, and Noest Express.
- In scope: document and freeze wave-1 boundaries, explicit done criteria, and non-negotiable operating constraints in this feature file.
- Out of scope: adding any provider beyond the four listed above.
- Out of scope: implementing provider integration contracts, adapters, status normalization details, rollout execution, or UAT execution (covered by T27-T45).

### Acceptance Gates (T26 Sign-off)
- Gate 1: This file contains an explicit scope freeze section naming only Yalidine, ZR Express, Andrson, and Noest Express as MVP wave-1 providers.
- Gate 2: This file contains explicit in-scope and out-of-scope bullets that prevent scope creep into T27+ implementation tasks.
- Gate 3: This file contains explicit non-negotiable constraints for manual assignment, write-only credentials, and success-rate-first default.
- Gate 4: `context/project/TASK-LIST.md` marks T26 as completed and preserves stable task numbering.

### Non-Negotiable Constraints
- Manual assignment only: no automatic courier assignment in MVP wave 1.
- Write-only credentials: secrets are never revealed after save and must remain store-scoped.
- Success-rate-first default: provider comparison and recommendations prioritize delivery success rate over cost/speed until formally changed.

## Backlog Reconciliation (T10-T18)
- T10: Keep as `[-]` blocked for stakeholder optimization-goal sign-off; continue implementation under locked default (success-rate-first).
- T11: Keep task number; mark as `[x]` once backlog hygiene pass confirms shipped UX polish matches acceptance criteria.
- T12: Keep task number; mark as `[x]` once analytics taxonomy verification is complete against production event schema.
- T13: Keep task number; mark as `[x]` after architecture doc/code parity check.
- T14: Keep task number; mark as `[x]` after onboarding checklist + contract test scaffold validation.
- T15/T16: Supersede with T33-T36 (four specific courier integrations instead of generic provider #1/#2); set T15/T16 to `[>]` with note "superseded by 4-provider MVP wave".
- T17: Keep as active dependency for manual-only assignment UX/policy guardrails (not superseded).
- T18: Defer to post-MVP as `[>]` until wave-1 stability metrics exist for scorecard baselining.

## Tasks (T-numbers)
- T26: Lock wave-1 courier scope, acceptance criteria, and rollout gates.
- T27: Build provider documentation matrix (auth, endpoints, payload schema, statuses, errors, limits, sandbox/prod gaps).
- T28: Publish canonical courier capability map and unknowns log (required vs optional fields, coverage constraints, pickup flow differences).
- T29: Define normalized status model + precedence rules across all four couriers.
- T30: Define dispatch error taxonomy and user-facing remediation messages.
- T31: Implement credential UX hardening (write-only edit flow, rotation flow, per-store provider enable/disable, audit events).
- T32: Implement credential security controls (encrypted storage, access boundaries, secret redaction, key-rotation hooks).
- T33: Implement Yalidine adapter with contract tests and sandbox fixtures.
- T34: Implement ZR Express adapter with contract tests and sandbox fixtures.
- T35: Implement Andrson adapter with contract tests and sandbox fixtures.
- T36: Implement Noest Express adapter with contract tests and sandbox fixtures.
- T37: Implement dispatch preflight guardrails (authz, lock-state checks, payload validation, coverage and serviceability checks).
- T38: Implement dispatch idempotency + dedupe persistence (request hashing, replay-safe response, duplicate suppression telemetry).
- T39: Implement retries/rate-limit resilience (provider policy table, exponential backoff with jitter, circuit break, DLQ routing).
- T40: Implement webhook/polling ingestion normalization with idempotent upserts and stale-event rejection.
- T41: Implement status reconciliation worker for uncertain/timeout outcomes and late provider confirmations.
- T42: Implement analytics events and provider reliability dashboards (attempted/dispatched/delivered/failed/rts + latency/failure buckets).
- T43: Add synthetic/provider health checks and alert thresholds (error spikes, 429 spikes, queue lag, DLQ growth).
- T44: Run pilot rollout by store/region feature flags with rollback playbook and support runbook.
- T45: Execute UAT checklist covering core flows + critical edge cases for each courier; capture sign-off evidence.
