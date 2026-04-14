# Marlon Context Upgrade Wizard

Founder-grade decision wizard to turn the current mixed context state (some solid docs, some stubs) into an execution-ready operating manual.

## How to use this wizard

1. Run phases in order (Phase 1 to 5); do not skip ahead.
2. Answer using option letters where possible (example: `Q2: B`); add short notes only when needed.
3. If none fits, choose `Other` and give a one-line decision.
4. After each phase, immediately write decisions into the listed context files.
5. Log every non-trivial choice in `context/project/DECISIONS.md` with date + rationale.
6. Keep unresolved items explicit as "Open Decision" entries in `context/project/TASK-LIST.md`.

Expected session flow:
- Session 1: Phase 1 and 2 (business model + architecture backbone)
- Session 2: Phase 3 (security hardening)
- Session 3: Phase 4 and 5 (operations + roadmap governance)

---

## Phase 1 - Commercial Rules and Scope Locks

**Objective**
- Capture what is already decided by founder direction, then close only the open decisions that materially affect pricing logic, permissions, and go-live risk.

**Why it matters**
- The pricing + permissions pivot changes core business economics and tenancy behavior, so ambiguity here creates both revenue risk and architecture rework.

**Files this phase unlocks/feeds**
- `context/project/SCOPE.md`
- `context/project/ROADMAP.md`
- `context/project/TASK-LIST.md`
- `context/features/subscription-billing.md`
- `context/features/orders-management.md`
- `context/technical/ARCHITECTURE.md`
- `context/technical/DATA_MODELS.md`
- `context/technical/API_CONTRACTS.md`
- `context/project/DECISIONS.md`

### Phase 1A - Captured Decisions (locked now)

1) **Primary segment strategy**
- Solo merchants first.
- Agency owners/resellers second wave.

2) **Agency capability direction**
- One account can own many stores in MVP.
- Store-level admin role will be added via settings.
- Admin has full access for assigned store.

3) **Pricing pivot (replaces old model entirely)**
- Remove current pricing model.
- New baseline: unlimited stores per account.
- Per-store cap: 5 orders/day.
- If a store exceeds 5 orders/day, storefront stays live; incoming orders are accepted; merchant-facing order data is masked (`*****`) until unlock condition is met.

4) **Future monetization timing**
- Paid pricing model to be introduced after MVP proof window in X months.

5) **Isolation requirement**
- Each store is completely isolated.

6) **Scope policy**
- Scope remains flexible (requires explicit guardrail owner in Phase 1B).

**Decision log block (add to `context/project/DECISIONS.md`)**
```md
Date: YYYY-MM-DD
Decision Group: Phase 1A Founder Direction Lock

- D1: Launch segment order = Solo first, Agency second.
  Rationale: <why now>

- D2: Account model = Multi-store ownership + store-level admin role.
  Rationale: <why now>

- D3: Pricing pivot = Unlimited stores + 5 orders/day/store cap + masked overflow orders.
  Rationale: <why now>

- D4: Paid plans introduced after MVP proof window (X months / KPI trigger TBD).
  Rationale: <why now>

- D5: Tenancy model = Full per-store isolation.
  Rationale: <why now>

- D6: Scope policy = Flexible with governance guardrail TBD.
  Rationale: <why now>
```

### Phase 1B - Required Clarifications (critical only)

1) **What unlocks masked orders for merchant visibility/actions?**
- A) Active paid subscription on that store
- B) Identity/business verification completed
- C) One-time top-up payment for overflow batch
- D) Manual admin approval
- E) Other

2) **How is the 5 orders/day limit window calculated?**
- A) Rolling 24-hour window
- B) Calendar day in Algeria timezone (Africa/Algiers)
- C) Merchant-selected timezone calendar day
- D) UTC calendar day
- E) Other

3) **What can merchant do with masked orders before unlock?**
- A) View count only, no order actions
- B) View partial fields (phone last 2 digits), no status updates
- C) Allow status changes but hide customer identity/contact
- D) Full freeze until unlock
- E) Other

4) **What customer communication happens when order is masked on merchant side?**
- A) No customer-facing change (silent)
- B) Customer gets "order received, pending confirmation" notice
- C) Customer gets delay disclaimer at checkout
- D) Block post-order notifications until unlock
- E) Other

5) **Overflow masked orders lifecycle if store never unlocks**
- A) Auto-delete after N days
- B) Auto-cancel and notify customer
- C) Keep indefinitely but inaccessible
- D) Export to owner email only, then purge in app
- E) Other

6) **Anti-abuse control for unlimited stores per account**
- A) Hard cap on new stores/day per account
- B) Progressive trust limits (new account stricter, relaxed over time)
- C) Require phone verification for each new store
- D) Require payment method before creating >N stores
- E) Other

7) **Ownership governance: can a store admin remove original owner?**
- A) No, never
- B) Yes, with owner confirmation
- C) Yes, with platform support approval + audit trail
- D) Yes, unrestricted if admin role exists
- E) Other

8) **Agency reseller model guardrail in MVP**
- A) Agencies can manage only stores they create
- B) Agencies can be invited to client-owned stores
- C) Both models allowed
- D) Reseller workflows deferred; only multi-store ownership now
- E) Other

9) **Trigger for introducing paid plans after MVP proof**
- A) Time-based only (exact X months)
- B) KPI-based only (conversion/order/revenue threshold)
- C) Earliest of time-or-KPI trigger
- D) Founder discretion at review checkpoint
- E) Other

10) **Scope flexibility guardrail owner**
- A) Founder only approves scope exceptions
- B) Founder + product lead must both approve
- C) PM can approve within written limits
- D) Any lead can approve with post-log in decisions
- E) Other

### Phase 1B - Answers Captured

1) **Unlock condition**
- Locked: active subscription at `2000 DZD/month` per store.
- Rule: any store admin can complete payment.

2) **Limit window**
- Locked: fixed calendar-day reset at `00:00` Algeria timezone (`Africa/Algiers`).

3) **Masked orders actions pre-unlock**
- Locked: full freeze until unlock.

4) **Customer communication during lock**
- Locked: no notification until unlock.

5) **If store never unlocks**
- Locked: masked overflow orders auto-delete after 5 days.

6) **Anti-abuse control (unlimited stores)**
- Locked: after 5 stores, require phone verification for each new store.

7) **Ownership governance**
- Locked (superseding update): B — owner transfer/removal requires explicit current owner confirmation.
- Supersedes prior unrestricted admin-removal lock.
- Guardrail: store admin cannot unilaterally remove owner.
- Exceptional path: `platform_admin` break-glass only with strict reason code + immutable audit trail.

8) **Agency reseller model in MVP**
- Locked: both models allowed (agency-created and invited-to-client stores).

9) **Paid plan trigger after MVP proof**
- Locked: whichever comes first (time threshold or KPI threshold).

10) **Scope exception owner**
- Locked: any lead can approve with decision log entry.

**Resolved vs Open**
- Resolved: #1, #2, #3, #4, #5, #6, #7, #8, #9, #10
- Open: none.

**Decision outputs (written after answers)**
- Final overflow/masking + unlock rules in `context/features/subscription-billing.md`
- Masked-order lifecycle + notification behavior in `context/features/orders-management.md`
- Ownership/admin governance in `context/technical/ARCHITECTURE.md`
- Limit-window + lock/unlock state transitions in `context/technical/DATA_MODELS.md`
- Billing/lock enforcement and admin-payment authorization contracts in `context/technical/API_CONTRACTS.md`
- Phase 1 closure note: limit-window decision is finalized and ready to write into `context/features/subscription-billing.md`, `context/technical/DATA_MODELS.md`, and `context/technical/API_CONTRACTS.md`
- Updated MVP boundaries and scope-exception policy in `context/project/SCOPE.md`
- Re-prioritized monetization milestones in `context/project/ROADMAP.md`
- New decision entries with rationale in `context/project/DECISIONS.md`
- New/updated task IDs for unresolved trade-offs in `context/project/TASK-LIST.md`

### Next: Phase 2 kickoff

Phase 1B capture is complete. No open decisions remain in Phase 1.
Proceed with Phase 2 focused questions in the next section (unchanged).

---

## Phase 2 - Architecture and Data Boundaries

**Objective**
- Commit to concrete system boundaries for tenancy, data lifecycle, APIs, and integration patterns.

**Why it matters**
- Prevents costly rework in Convex schema, route contracts, and delivery/payment integration flows.

**Files this phase unlocks/feeds**
- `context/technical/ARCHITECTURE.md`
- `context/technical/DATA_MODELS.md`
- `context/technical/API_CONTRACTS.md`
- `context/features/orders-management.md`
- `context/features/store-editor.md`
- `context/project/DECISIONS.md`

**Focused question set**
1) **Tenant isolation enforcement model**
- A) Enforce `storeId` in every query/mutation only
- B) Enforce both `userId` and `storeId` everywhere
- C) Central authorization helper + policy layer
- D) Mixed approach per feature
- E) Other

2) **Slug strategy**
- A) Global uniqueness forever (current direction)
- B) Global uniqueness with reserved-word policy
- C) Unique per user only
- D) Mutable slugs with permanent redirects
- E) Other

3) **Order/audit event architecture**
- A) Inline writes in business mutations only
- B) Append-only event log plus derived order state
- C) Hybrid: inline state + mandatory audit append
- D) External event bus now
- E) Other

4) **Delivery integration execution model**
- A) Synchronous provider calls from user actions
- B) Async job queue with retry + dead-letter handling
- C) Manual push/export only in MVP
- D) Provider-by-provider (mixed)
- E) Other

5) **Data retention policy (PII and logs)**
- A) Keep all indefinitely for merchant history
- B) Time-box PII retention, keep anonymized analytics
- C) Merchant-configurable retention windows
- D) Regulatory-minimum retention only
- E) Other

6) **Public storefront performance strategy**
- A) Mostly SSR with selective caching
- B) ISR/static for catalog + dynamic checkout paths
- C) Fully dynamic rendering
- D) CDN-cached API responses + client hydration
- E) Other

### Phase 2 - Answers Captured (Locked)

- 1C Tenant isolation = central authorization helper + policy layer
- 2B Slug strategy = global uniqueness + reserved-word policy
- 3C Order architecture = inline state + mandatory audit append
- 4B Delivery integration = async queue with retry + dead-letter
- 5B Data retention = time-box PII + anonymized analytics
- 6B Storefront performance = ISR/static catalog + dynamic checkout

**Resolved vs Open**
- Resolved: #1, #2, #3, #4, #5, #6
- Open: none.

**Decision outputs (ready to write)**
- `context/technical/ARCHITECTURE.md`
- `context/technical/DATA_MODELS.md`
- `context/technical/API_CONTRACTS.md`
- `context/features/orders-management.md`
- `context/features/public-storefront.md`
- `context/project/DECISIONS.md`

Next: Phase 3 kickoff.

---

## Phase 3 - Security, Privacy, and Trust Controls

**Objective**
- Define enforceable security rules for authz, secret handling, webhooks, PII access, and abuse prevention.

**Why it matters**
- Marlon handles merchant and customer personal data; weak rules create legal, reputational, and operational risk.

**Files this phase unlocks/feeds**
- `context/developer/SECURITY.md`
- `context/technical/ENVIRONMENT.md`
- `context/technical/API_CONTRACTS.md`
- `context/features/orders-management.md`
- `context/project/DECISIONS.md`

**Focused question set**
1) **Internal roles model**
- A) Owner-only access per store
- B) Owner + staff roles (limited order actions)
- C) Owner + manager + operator roles
- D) Role model deferred post-MVP
- E) Other

2) **Webhook trust policy (Chargily and future providers)**
- A) Signature verification required; reject unsigned
- B) Signature + IP allowlist
- C) Signature + replay protection window
- D) Basic endpoint secret only
- E) Other

3) **Sensitive data visibility policy in locked state**
- A) Full masking as PRD, no exceptions
- B) Partial reveal for last N recent orders
- C) Reveal-by-action with payment prompt
- D) Merchant-configurable masking level
- E) Other

4) **Secrets management model**
- A) Vercel/Convex environment secrets only
- B) Add managed secret vault now
- C) Hybrid (env vars + vault for high-risk keys)
- D) Local encrypted file workflow for now
- E) Other

5) **Abuse and fraud controls for fake COD orders**
- A) Basic rate limits only
- B) Rate limits + phone reputation/blocklist
- C) Rate limits + behavioral scoring
- D) Manual moderation queue for suspicious orders
- E) Other

6) **Auditability requirement level**
- A) Immutable logs, internal access only
- B) Immutable logs + merchant-export capability
- C) Immutable logs + signed audit trail
- D) Best-effort logs only in MVP
- E) Other

### Phase 3 - Answers Captured (Locked)

- 1B Internal roles (superseded/expanded) = `owner + admin + staff` store roles, with `platform_admin` for exceptional platform governance
- 2C Webhook trust = signature verification + replay protection window
- 3A Sensitive visibility in locked state = full masking, no exceptions
- 4A Secrets = Vercel/Convex environment secrets only
- 5B Fraud controls = rate limits + phone reputation/blocklist
- 6B Auditability = immutable logs + merchant export capability

**Resolved vs Open**
- Resolved: #1, #2, #3, #4, #5, #6
- Open: none.

**Decision outputs (ready to write)**
- `context/developer/SECURITY.md`
- `context/technical/ENVIRONMENT.md`
- `context/technical/API_CONTRACTS.md`
- `context/features/orders-management.md`
- `context/project/DECISIONS.md`

Next: Phase 4 kickoff.

---

## Phase 4 - Operations, Reliability, and Delivery Discipline

**Objective**
- Establish how Marlon is deployed, monitored, alerted, recovered, and safely shipped.

**Why it matters**
- Without operational discipline, launch reliability and incident response become founder bottlenecks.

**Files this phase unlocks/feeds**
- `context/ops/INFRASTRUCTURE.md`
- `context/ops/CI_CD.md`
- `context/ops/MONITORING.md`
- `context/developer/TESTING.md`
- `context/developer/WORKFLOW.md`
- `context/project/DECISIONS.md`

**Focused question set**
1) **Environment strategy at launch**
- A) Dev + production only
- B) Dev + staging + production
- C) Per-feature preview + production
- D) Staging only for high-risk changes
- E) Other

2) **Release gate strictness**
- A) Unit tests required only
- B) Unit + integration required
- C) Unit + integration + core e2e checkout path required
- D) Manual QA signoff only
- E) Other

3) **Rollback policy**
- A) Immediate rollback on payment/order flow degradation
- B) Time-boxed hotfix first, then rollback
- C) Feature-flag disable first, rollback second
- D) Case-by-case incident commander decision
- E) Other

4) **Observability stack**
- A) Basic logs + platform dashboards
- B) Add error tracking (Sentry) + alerts
- C) Add error tracking + uptime + synthetic checkout monitor
- D) Full APM stack from day one
- E) Other

5) **SLO priority for first 90 days**
- A) Uptime first
- B) Checkout/order creation success first
- C) Dashboard responsiveness first
- D) Balanced SLOs
- E) Other

6) **Backup and restore target**
- A) Daily backups, restore within 24h
- B) Hourly backups, restore within 4h
- C) Near-real-time replication, restore within 1h
- D) Provider default only
- E) Other

### Phase 4 - Answers Captured (Locked)

- 1B Environment = dev + staging + production
- 2C Release gates = unit + integration + core checkout e2e
- 3C Rollback = feature-flag disable first, rollback second
- 4C Observability = error tracking + uptime + synthetic checkout monitor
- 5B SLO priority = checkout/order creation success first
- 6B Backup/restore = hourly backups, restore within 4h

**Resolved vs Open**
- Resolved: #1, #2, #3, #4, #5, #6
- Open: none.

**Decision outputs (ready to write)**
- 1B Environment topology -> `context/ops/INFRASTRUCTURE.md`
- 2C Release gates + branch protections -> `context/ops/CI_CD.md`
- 2C/5B Test + SLO release criteria -> `context/developer/TESTING.md`
- 3C Rollback runbook and workflow guardrails -> `context/developer/WORKFLOW.md`
- 4C Monitoring stack, alert matrix, synthetic checks -> `context/ops/MONITORING.md`
- Phase 4 decision log entries -> `context/project/DECISIONS.md`

Next: Phase 5 kickoff.

---

## Phase 5 - Economics, Metrics, and Roadmap Governance

**Objective**
- Align metrics, roadmap sequencing, and kill/continue criteria with business outcomes.

**Why it matters**
- Ensures build decisions stay tied to paid conversion, retention, and operational viability.

**Files this phase unlocks/feeds**
- `context/project/ROADMAP.md`
- `context/project/TASK-LIST.md`
- `context/project/OVERVIEW.md`
- `context/project/DECISIONS.md`
- `context/features/*.md` (priority notes only)

**Focused question set**
1) **Primary north-star metric for the next two quarters**
- A) Paid stores count
- B) Store-to-paid conversion rate
- C) Confirmed-order volume
- D) Net revenue retained (after churn)
- E) Other

2) **Pricing experiment appetite**
- A) No experiments until product stability
- B) One controlled experiment per quarter
- C) Continuous pricing tests with guardrails
- D) Segment-based pricing tests only (agency vs solo)
- E) Other

3) **Feature prioritization rule when backlog conflicts**
- A) Revenue impact first
- B) Merchant retention first
- C) Reliability/security first
- D) Fastest-to-ship first
- E) Other

4) **Trigger to revisit currently out-of-scope items**
- A) Reach fixed MRR threshold
- B) Reach paid store count threshold
- C) Reach reliability baseline + support bandwidth
- D) Time-based (every quarter)
- E) Other

5) **Kill criteria for underperforming initiatives**
- A) No measurable lift after 2 weeks
- B) No measurable lift after 1 month
- C) Missed KPI + high maintenance burden
- D) Founder judgment only
- E) Other

6) **Planning cadence**
- A) Weekly reprioritization
- B) Bi-weekly planning + weekly execution
- C) Monthly planning + weekly check-ins
- D) Ad hoc planning
- E) Other

### Phase 5 - Answers Captured (Locked)

Founder lock: `1D,2B,3C,4C,5C,6B`

- 1D North-star metric = net revenue retained after churn
- 2B Pricing experiments = one controlled experiment per quarter
- 3C Backlog conflicts = reliability/security first
- 4C Out-of-scope revisit trigger = reliability baseline met + support bandwidth available
- 5C Kill criteria = missed KPI plus high maintenance burden
- 6B Planning cadence = bi-weekly planning with weekly execution

**Resolved vs Open**
- Resolved: #1, #2, #3, #4, #5, #6
- Open: none.

**Decision outputs (ready to write)**
- 1D North-star metric + success framing -> `context/project/OVERVIEW.md`
- 2B Pricing experiment cadence + guardrails -> `context/project/ROADMAP.md`
- 3C Conflict resolution rule (reliability/security first) -> `context/project/TASK-LIST.md`
- 4C Scope-revisit gate (reliability + support capacity) -> `context/project/ROADMAP.md`
- 5C Initiative sunset rule (KPI miss + maintenance burden) -> `context/project/TASK-LIST.md`
- 6B Operating cadence (bi-weekly planning, weekly execution) -> `context/project/ROADMAP.md`
- Phase 5 decision entries + rationale -> `context/project/DECISIONS.md`
- Priority annotations for impacted initiatives -> relevant `context/features/*.md`

All 5 phases are complete; execution now moves to the context-writing sprint.

---
