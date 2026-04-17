# Architecture Decision Log

> Log significant decisions here as they are made.
> Never delete entries — add a "superseded by" note instead.

## Decision Template

**Decision:** [What was decided]
**Date:** [When]
**Context:** [Why this decision needed to be made]
**Options Considered:** [What else was evaluated]
**Rationale:** [Why this option was chosen]
**Consequences:** [What this means going forward]

---

<!-- Decisions logged here during setup and throughout the build -->

**Decision:** Store delivery credentials per store/provider in dedicated encrypted records (`deliveryCredentials`) and keep only non-secret metadata in `siteContent.deliveryIntegration`.
**Date:** 2026-04-14
**Context:** Delivery API previously relied on global environment credentials, which could not support multi-store isolation.
**Options Considered:** (1) Keep global env credentials only, (2) Store plaintext credentials in `siteContent`, (3) Store encrypted credentials in a dedicated table.
**Rationale:** A dedicated encrypted table supports per-store credentials, keeps secret handling out of generic content payloads, and aligns with PRD security expectations.
**Consequences:** `DELIVERY_CREDENTIALS_KEY` is now required for decrypt/encrypt flows in Convex, and delivery integration reads credentials through owner-scoped queries.

---

**Decision:** Gate emergency global credential fallback behind explicit opt-in (`DELIVERY_ALLOW_GLOBAL_CREDENTIAL_FALLBACK=true`).
**Date:** 2026-04-14
**Context:** Some stores may need temporary continuity while migrating credentials, but defaulting to global fallback weakens tenant isolation.
**Options Considered:** (1) Always allow fallback, (2) Remove fallback immediately, (3) Keep fallback but disable by default.
**Rationale:** Opt-in fallback preserves a migration path without silently bypassing per-store credential requirements.
**Consequences:** Missing per-store credentials now fail fast unless fallback is explicitly enabled and provider env credentials are present.

---

**Decision:** Treat delivery credentials as write-only in merchant UI after save.
**Date:** 2026-04-14
**Context:** Prefilling or re-exposing saved provider credentials in the editor increases accidental disclosure risk (screen sharing, shoulder surfing, copied form state).
**Options Considered:** (1) Prefill decrypted values on load, (2) Mask but still reveal on toggle, (3) Never return saved secrets to UI and only accept replacements.
**Rationale:** Write-only handling minimizes exposure while still allowing merchants to rotate/update credentials by submitting new values.
**Consequences:** UI should rely on metadata (`hasCredentials`) for configured state; credential inputs stay blank on edit reload and backend read paths must not return plaintext to client responses.

---

**Decision:** Lock commercial model and tenant governance for MVP around masked-overflow monetization.
**Date:** 2026-04-14
**Status:** Partially superseded by the ownership governance decision on 2026-04-14 below.
**Context:** Phases 1A-1B finalized the core business mechanics that directly affect revenue timing, merchant permissions, and data visibility rules.
**Options Considered:** (1) Keep previous pricing model, (2) Defer monetization mechanics, (3) Adopt unlimited-store model with strict overflow gating and explicit governance locks.
**Rationale:** The selected model creates a low-friction onboarding path while protecting conversion via a hard unlock gate and clear permission boundaries.
**Consequences:** The active MVP policy is now fixed as: unlimited stores per account; per-store daily cap of 5 orders; new overflow masking model with full freeze until unlock; unlock subscription at `2000 DZD/store/month`; fixed reset at `00:00` `Africa/Algiers`; masked overflow auto-delete after 5 days; no customer notification while locked; phone verification required after 5 stores; agencies can both create and be invited to stores; and store admins exist as a role, but owner transfer/removal requires explicit current-owner confirmation per the ownership governance decision logged below.

---

**Decision:** Lock Phase 2 architecture baseline for isolation, events, integrations, retention, and storefront delivery.
**Date:** 2026-04-14
**Context:** Architecture ambiguity across tenancy, auditability, and async integrations would create high rework risk in Convex schema and API contracts.
**Options Considered:** (1) Minimal per-feature local enforcement, (2) Mixed model per team preference, (3) Centralized architecture locks applied platform-wide.
**Rationale:** Platform-wide locks reduce drift and make security and reliability guarantees enforceable across all features.
**Consequences:** Architecture is now locked to: central authorization helper + policy layer; globally unique slugs with reserved-word policy; inline order state plus mandatory audit append; async delivery queue with retry and dead-letter handling; time-boxed PII retention with anonymized analytics; and ISR/static catalog with dynamic checkout paths.

---

**Decision:** Lock Phase 3 security and trust controls for launch.
**Date:** 2026-04-14
**Status:** Partially superseded by the ownership governance decision on 2026-04-14 below.
**Context:** Security posture needed explicit launch-level controls for roles, webhook trust, secret handling, fraud resistance, and audit evidence.
**Options Considered:** (1) Lightweight MVP controls with deferred hardening, (2) Full enterprise-grade stack immediately, (3) Practical launch controls with strict non-negotiables.
**Rationale:** Chosen controls balance speed and defensibility while preventing common failure modes in payments, PII handling, and COD abuse.
**Consequences:** Security is now locked to: `owner | admin | staff` role model with limited admin/staff actions by policy; webhook signature verification with replay protection window; full masking in locked state with no exceptions; Vercel/Convex environment-secret model; rate limits plus phone reputation/blocklist for fraud; immutable logs with merchant export capability.

---

**Decision:** Lock Phase 4 operations and release discipline for reliability-first delivery.
**Date:** 2026-04-14
**Context:** Operational inconsistency would make incidents and regressions expensive during early growth.
**Options Considered:** (1) Minimal ops overhead during MVP, (2) Heavy enterprise process at launch, (3) Focused reliability controls with enforceable release gates.
**Rationale:** The selected operating model protects checkout reliability without overloading the team with unnecessary process.
**Consequences:** Operations are now locked to: dev/staging/production environments; release gates requiring unit + integration + core checkout e2e coverage; rollback policy of feature-flag disable first then rollback; monitoring stack of error tracking + uptime + synthetic checkout monitor; first-90-day SLO priority on checkout/order creation success; hourly backups with restore target within 4 hours.

---

**Decision:** Lock Phase 5 roadmap governance and economic steering model.
**Date:** 2026-04-14
**Context:** Product sequencing and investment decisions needed explicit governance rules tied to retained revenue and reliability constraints.
**Options Considered:** (1) Founder-judgment-only planning, (2) Time-only review cycles, (3) Metric-led governance with explicit conflict and kill rules.
**Rationale:** Metric-led governance improves consistency in prioritization while preserving practical execution cadence.
**Consequences:** Governance is now locked to: north-star metric `net revenue retained (after churn)`; one controlled pricing experiment per quarter; reliability/security first when backlog priorities conflict; out-of-scope revisit only when reliability baseline and support bandwidth are both met; initiative kill rule = missed KPI + high maintenance burden; planning cadence = bi-weekly planning with weekly execution.

---

**Decision:** Supersede ownership governance to require explicit current-owner confirmation for owner transfer/removal (Policy B), with exceptional break-glass path for `platform_admin` only.
**Date:** 2026-04-14
**Context:** Prior captured governance allowed unrestricted admin owner removal, which creates unacceptable account-takeover and tenant-control risk.
**Options Considered:** (1) No owner removal by admin, (2) Owner confirmation required, (3) Platform support approval only, (4) Unrestricted store-admin removal.
**Rationale:** Policy B preserves operational flexibility while making ownership change non-unilateral and auditable. Limited break-glass support covers legal/safety incidents without weakening default protections.
**Consequences:** Supersedes prior unrestricted owner-removal lock in wizard/phase captures. Store role model is now `owner | admin | staff`, platform governance role is `platform_admin`, admin cannot unilaterally remove owner, ownership transfer/removal must include explicit current-owner confirmation, and all governance actions (including break-glass reason code + ticket reference) must remain in immutable audit trail.

---

**Decision:** Use an additive canonical cutover model that separates store identity, unlocked billing periods, payment intent, payment evidence, and memberships before retiring legacy billing fields.
**Date:** 2026-04-16
**Context:** T34 required a concrete schema plan for replacing the legacy owner-centric trial/subscription runtime without causing accidental access expansion or ambiguous unlock state during migration.
**Options Considered:** (1) Keep overloading `stores` with all billing/payment/access state, (2) Big-bang replacement of legacy fields with new ones, (3) Add normalized compatibility-first tables and cut over in stages.
**Rationale:** The additive staged model minimizes migration risk, preserves auditability, and lets rollout fail closed. Splitting `paymentAttempts`, `paymentEvidence`, `storeBillingPeriods`, and `storeMemberships` keeps trust boundaries clear: intent is not proof, proof is not access, and access is not billing state.
**Consequences:** Canonical rollout now assumes: `stores` keeps compatibility markers and legacy fields temporarily; `storeBillingPeriods` becomes the paid/unlocked source of truth; `paymentAttempts` is server-owned checkout state; `paymentEvidence` is append-only verified proof; `storeMemberships` starts as owner-mirroring only; legacy trial/subscription stores must be backfilled and reconciled before runtime cutover; and non-owner access must remain disabled until later authorization tasks are complete.
