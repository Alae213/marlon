# CI/CD Pipeline

Operational CI/CD policy for Marlon MVP, aligned with locked Phase 4 reliability-first controls and current Next.js + Convex architecture.

## 1) Environment Model

- `dev`
  - Purpose: local and shared development validation.
  - Data posture: non-production data only.
  - Deployment behavior: auto-deploy from active feature branches.
- `staging`
  - Purpose: pre-production integration and release candidate verification.
  - Data posture: sanitized fixtures and test merchants/stores.
  - Deployment behavior: auto-deploy from `main` after CI gates pass.
- `production`
  - Purpose: live merchant/storefront traffic.
  - Data posture: real tenant/customer data under security controls.
  - Deployment behavior: controlled promote from validated staging release.

Environment isolation is mandatory: no shared secrets across `dev`, `staging`, and `production`.

## 2) Branch and Release Flow

This project uses a reliability-first weekly release train inside a bi-weekly planning rhythm.

- Planning cadence (locked): bi-weekly planning defines the next two weekly execution slices.
- Execution cadence (locked): work is delivered in weekly release candidates.
- Branch model:
  - `main` is the integration branch and single source for release candidates.
  - Short-lived feature branches merge to `main` via reviewed pull requests.
  - Optional `release/YYYY-Www` branch is cut from `main` for a weekly stabilization window when risk is elevated.
- Promotion path: `feature branch` -> `main` -> `staging` verification -> `production` promotion.
- Hotfix flow: production hotfix branch from current production commit, then back-merge to `main` to avoid drift.

## 3) Pipeline Stages and Required Release Gates

No release can promote to production unless all gates pass.

1. Static and build checks
   - Type checks/lint/build for Next.js and Convex functions.
2. Unit test gate (required)
   - Covers business rules, masking/visibility transitions, and lock-state calculations.
3. Integration test gate (required)
   - Covers API/webhook contracts, idempotency behavior, and queue-driven delivery interactions.
4. Core checkout e2e gate (required)
   - Must validate end-to-end storefront checkout -> order creation -> merchant visibility behavior.
   - Must include at least one locked-overflow scenario and one normal unlocked scenario.
5. Deployment verification gate (required, post-deploy)
   - Staging verify first, then production verify after promotion.

If any required gate fails, promotion is blocked.

## 4) Rollback and Mitigation Policy

Rollback policy is locked as: feature-flag disable first, rollback second.

- Step 1: Disable the impacted feature flag or traffic path to stop new failures.
- Step 2: Validate checkout/order creation health recovery.
- Step 3: If risk remains, execute deployment rollback to last known-good release.
- Step 4: Keep rollback scope minimal and preserve forensic logs/audit trails.
- Step 5: Open incident timeline and postmortem workflow for any Sev1/Sev2 event.

## 5) Secrets Handling in CI/CD

Secrets handling follows Phase 3/4 trust controls.

- Secrets are managed only in environment secret managers (Vercel + Convex), never in repository files.
- CI jobs receive secrets through scoped runtime injection; no plaintext secret printing is allowed.
- Separate secret sets per environment (`dev`, `staging`, `production`) are mandatory.
- Production secrets are accessible only to protected branches/environments and approved deploy identities.
- Pull-request jobs from untrusted forks must not receive production or staging secrets.
- Secret rotation must be documented with impact notes and verified in staging before production.
- Required secret classes include payment/webhook signing material and `DELIVERY_CREDENTIALS_KEY`.

## 6) Deployment Verification Checklist (Checkout/Order Reliability)

Run this checklist for every production promotion.

1. Storefront checkout path responds successfully for a healthy test store.
2. Order creation persists successfully and appears in merchant order list.
3. Daily cap logic still enforces `5/day` with `Africa/Algiers` reset boundary.
4. Overflow lock behavior still masks sensitive fields and freezes blocked actions.
5. Unlock flow still transitions eligible overflow records from masked to visible after verified payment event.
6. Chargily webhook verification and idempotent processing succeed for test events.
7. No elevated error-rate or latency regression on checkout/order creation endpoints.
8. Synthetic checkout monitor and uptime checks are green after deploy.

If any checklist item fails, stop rollout and apply the rollback policy.

## 7) Ownership and Evidence

- Engineering on-call owns release execution and first response.
- Product/ops owner is notified for any checkout-affecting risk.
- Each production release records:
  - commit/version reference,
  - gate results,
  - deployment timestamp,
  - verification checklist outcome,
  - mitigation/rollback actions if any.
