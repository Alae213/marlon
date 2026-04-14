# Task List

> The single source of truth for what needs to be done.
> Updated by Claude after every meaningful piece of work.
> Each task links to the feature file it belongs to.
>
> **Status keys:**
> `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` blocked · `[>]` deferred

---

## How Tasks Are Numbered

Tasks are numbered globally across the whole project: T1, T2, T3...
They never get renumbered — a completed task keeps its number forever.
This means you can reference "T12" in a commit message or conversation and
it always points to the same thing.

---

## Active Sprint

Tasks currently being worked on or up next.

<!-- Claude: keep this section short — max 5-7 tasks at a time -->

| # | Status | Task | Feature | Notes |
|---|--------|------|---------|-------|
| T24 | `[ ]` | Align `context/developer/SECURITY.md` with Phase 3 launch controls | context | Enforce owner/staff boundaries, immutable logs/export, webhook trust model, secret handling, and fraud controls |
| T29 | `[x]` | Define canonical status normalization contract | [context/features/delivery-mvp-courier-wave1.md](../features/delivery-mvp-courier-wave1.md) | Prevent stale regressions from out-of-order provider updates |
| T30 | `[x]` | Define dispatch error taxonomy + operator remediation UX | [context/features/delivery-mvp-courier-wave1.md](../features/delivery-mvp-courier-wave1.md) | Validation/auth/rate-limit/provider-down/unknown-outcome flows with clear recovery steps |
| T31 | `[x]` | Implement credential UX hardening for 4 providers | [context/features/delivery-mvp-courier-wave1.md](../features/delivery-mvp-courier-wave1.md) | Keep write-only secrets, safe rotation flow, and per-store provider toggles |

---

## Backlog

Tasks that are planned but not started yet. Ordered by priority.

| # | Status | Task | Feature | Notes |
|---|--------|------|---------|-------|
| T10 | `[-]` | Finalize and approve phased delivery redesign + provider expansion spec | [context/features/delivery-v2-rollout-plan.md](../features/delivery-v2-rollout-plan.md) | Stakeholder sign-off pending on optimization objective |
| T11 | `[ ]` | Define v1.1 light-polish delivery UX backlog and acceptance criteria | [context/features/delivery-v2-rollout-plan.md](../features/delivery-v2-rollout-plan.md) | Phase 1 delivery UX polish scope |
| T12 | `[ ]` | Implement delivery analytics instrumentation for success-rate-first optimization | [context/features/delivery-v2-rollout-plan.md](../features/delivery-v2-rollout-plan.md) | Canonical success-rate-first analytics taxonomy |
| T13 | `[ ]` | Design v2 delivery architecture (UI, backend, rules engine base) | [context/features/delivery-v2-rollout-plan.md](../features/delivery-v2-rollout-plan.md) | Redesign scope C baseline architecture |
| T14 | `[ ]` | Build provider onboarding framework (checklist, contract tests, rollout gates) | [context/features/delivery-v2-rollout-plan.md](../features/delivery-v2-rollout-plan.md) | Foundation for provider readiness gates |
| T15 | `[>]` | Integrate courier provider #1 for v2 wave 1 with feature-flagged rollout | [context/features/delivery-v2-rollout-plan.md](../features/delivery-v2-rollout-plan.md) | Superseded by T33-T36 |
| T16 | `[>]` | Integrate courier provider #2 for v2 wave 1 with feature-flagged rollout | [context/features/delivery-v2-rollout-plan.md](../features/delivery-v2-rollout-plan.md) | Superseded by T33-T36 |
| T17 | `[ ]` | Launch manual-only assignment with rules recommendation mode | [context/features/delivery-v2-rollout-plan.md](../features/delivery-v2-rollout-plan.md) | Manual assignment with recommendation mode |
| T18 | `[>]` | Prepare v2 wave 2 provider scorecard and automation-readiness criteria | [context/features/delivery-v2-rollout-plan.md](../features/delivery-v2-rollout-plan.md) | Deferred until wave-1 stability data exists |
| T32 | `[ ]` | Implement credential security controls | [context/features/delivery-mvp-courier-wave1.md](../features/delivery-mvp-courier-wave1.md) | Encryption boundaries, redaction rules, access policy, key-rotation hooks |
| T33 | `[-]` | Integrate Yalidine adapter + contract tests | [context/features/delivery-mvp-courier-wave1.md](../features/delivery-mvp-courier-wave1.md) | Blocked pending sandbox credentials and latest provider docs/limits |
| T34 | `[-]` | Integrate ZR Express adapter + contract tests | [context/features/delivery-mvp-courier-wave1.md](../features/delivery-mvp-courier-wave1.md) | Blocked pending sandbox credentials and latest provider docs/limits |
| T35 | `[-]` | Integrate Andrson adapter + contract tests | [context/features/delivery-mvp-courier-wave1.md](../features/delivery-mvp-courier-wave1.md) | Blocked pending sandbox credentials and latest provider docs/limits |
| T36 | `[-]` | Integrate Noest Express adapter + contract tests | [context/features/delivery-mvp-courier-wave1.md](../features/delivery-mvp-courier-wave1.md) | Blocked pending sandbox credentials and latest provider docs/limits |
| T37 | `[ ]` | Add dispatch preflight edge-case guardrails | [context/features/delivery-mvp-courier-wave1.md](../features/delivery-mvp-courier-wave1.md) | Missing creds, invalid address/phone, unsupported region, duplicate live dispatch prevention |
| T38 | `[ ]` | Add dispatch idempotency + dedupe persistence | [context/features/delivery-mvp-courier-wave1.md](../features/delivery-mvp-courier-wave1.md) | Replay-safe response handling and duplicate suppression telemetry |
| T39 | `[ ]` | Add retries and rate-limit resilience policy | [context/features/delivery-mvp-courier-wave1.md](../features/delivery-mvp-courier-wave1.md) | Per-provider retry/backoff table, circuit-breaker, dead-letter handling |
| T40 | `[ ]` | Normalize webhook/polling status ingestion | [context/features/delivery-mvp-courier-wave1.md](../features/delivery-mvp-courier-wave1.md) | Idempotent upserts, out-of-order handling, stale event rejection |
| T41 | `[ ]` | Build uncertain-outcome reconciliation worker | [context/features/delivery-mvp-courier-wave1.md](../features/delivery-mvp-courier-wave1.md) | Recover from timeout/unknown provider outcomes safely |
| T42 | `[ ]` | Ship courier analytics instrumentation + dashboards | [context/features/delivery-mvp-courier-wave1.md](../features/delivery-mvp-courier-wave1.md) | Track attempted/dispatched/delivered/failed/RTS with reason buckets |
| T43 | `[ ]` | Add provider health monitoring + alert thresholds | [context/features/delivery-mvp-courier-wave1.md](../features/delivery-mvp-courier-wave1.md) | Error/429 spikes, queue lag, degraded-provider flags |
| T44 | `[ ]` | Execute feature-flagged pilot rollout by region/store | [context/features/delivery-mvp-courier-wave1.md](../features/delivery-mvp-courier-wave1.md) | Progressive rollout, rollback playbook, support readiness |
| T45 | `[ ]` | Run UAT checklist + capture sign-off evidence | [context/features/delivery-mvp-courier-wave1.md](../features/delivery-mvp-courier-wave1.md) | Provider-by-provider happy path + critical edge-case validation |

---

## Blocked

Tasks that can't proceed until something else is resolved.

| # | Task | Feature | Blocked by |
|---|------|---------|------------|
| T10 | Finalize and approve phased delivery redesign + provider expansion spec | [context/features/delivery-v2-rollout-plan.md](../features/delivery-v2-rollout-plan.md) | Stakeholder sign-off on optimization objective |
| T33 | Integrate Yalidine adapter + contract tests | [context/features/delivery-mvp-courier-wave1.md](../features/delivery-mvp-courier-wave1.md) | Sandbox credentials + latest provider docs/limits |
| T34 | Integrate ZR Express adapter + contract tests | [context/features/delivery-mvp-courier-wave1.md](../features/delivery-mvp-courier-wave1.md) | Sandbox credentials + latest provider docs/limits |
| T35 | Integrate Andrson adapter + contract tests | [context/features/delivery-mvp-courier-wave1.md](../features/delivery-mvp-courier-wave1.md) | Sandbox credentials + latest provider docs/limits |
| T36 | Integrate Noest Express adapter + contract tests | [context/features/delivery-mvp-courier-wave1.md](../features/delivery-mvp-courier-wave1.md) | Sandbox credentials + latest provider docs/limits |

---

## Completed

Finished tasks — kept for reference and audit trail.

| # | Task | Feature | Completed |
|---|------|---------|-----------|
| T1 | Populate task list from PRD | Setup | 2026-04-14 |
| T2 | Connect Orders API to Convex mutation | orders | 2026-04-14 |
| T3 | Implement Chargily webhook (unlock store) | billing | 2026-04-14 |
| T4 | Fix Delivery API per-store credentials | delivery | 2026-04-14 |
| T5 | Populate OVERVIEW.md from PRD | context | 2026-04-14 |
| T6 | Populate SCOPE.md (in/out of scope) | context | 2026-04-14 |
| T7 | Populate ROADMAP.md phases | context | 2026-04-14 |
| T8 | Populate DATA_MODELS.md | context | 2026-04-14 |
| T9 | Populate ENVIRONMENT.md delivery credential vars | context | 2026-04-14 |
| T19 | Populate/refresh `context/technical/ARCHITECTURE.md` from locked platform decisions | context | 2026-04-14 |
| T20 | Populate/refresh `context/technical/DATA_MODELS.md` for lock/unlock lifecycle + retention | context | 2026-04-14 |
| T21 | Populate `context/technical/API_CONTRACTS.md` for billing, overflow, and webhook contracts | context | 2026-04-14 |
| T22 | Update `context/features/subscription-billing.md` to locked commercial model | [context/features/subscription-billing.md](../features/subscription-billing.md) | 2026-04-14 |
| T23 | Align `context/features/orders-management.md` with overflow masking lifecycle | [context/features/orders-management.md](../features/orders-management.md) | 2026-04-14 |
| T25 | Fill `context/ops/CI_CD.md` and `context/ops/MONITORING.md` from Phase 4 ops locks | context | 2026-04-14 |
| T26 | Lock MVP courier wave scope + acceptance gates | [context/features/delivery-mvp-courier-wave1.md](../features/delivery-mvp-courier-wave1.md) | 2026-04-14 |
| T27 | Map provider docs into canonical integration matrix | [context/features/delivery-mvp-courier-wave1.md](../features/delivery-mvp-courier-wave1.md) | 2026-04-14 |
| T28 | Publish canonical courier capability map and unknowns log | [context/features/delivery-mvp-courier-wave1.md](../features/delivery-mvp-courier-wave1.md) | 2026-04-14 |
| T29 | Define canonical status normalization contract | [context/features/delivery-mvp-courier-wave1.md](../features/delivery-mvp-courier-wave1.md) | 2026-04-14 |
| T30 | Define dispatch error taxonomy + operator remediation UX | [context/features/delivery-mvp-courier-wave1.md](../features/delivery-mvp-courier-wave1.md) | 2026-04-14 |
| T31 | Implement credential UX hardening for 4 providers | [context/features/delivery-mvp-courier-wave1.md](../features/delivery-mvp-courier-wave1.md) | 2026-04-14 |

---

## How to Add a Task

Claude adds tasks using this format:

```
| T[N] | `[ ]` | [What needs to be done — specific and actionable] | [context/features/feature-name.md](../features/feature-name.md) | [any notes] |
```

Rules:
- One task = one clear, completable action
- Link to the feature file if the task belongs to a feature
- Tasks that span multiple features get a note explaining the dependency
- "Implement @auth" is too vague — "Build login form with email/password validation" is a task
- When a task is done, move it to Completed — never delete tasks

---

## Task States

Claude updates task status automatically as work progresses:

| Symbol | Meaning | When to use |
|--------|---------|-------------|
| `[ ]` | Todo | Not started |
| `[~]` | In progress | Currently being worked on |
| `[x]` | Done | Completed and verified |
| `[-]` | Blocked | Waiting on something else |
| `[>]` | Deferred | Decided to push to later phase |
