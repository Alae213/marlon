# Feature: Delivery Redesign and Provider Expansion (Phased)

## What It Does
This feature defines a phased plan to improve delivery operations while protecting near-term execution speed. It keeps v1.1 focused on light polish, then delivers a full v2 redesign across UI, backend, and automation/rules engine. Provider rollout starts with two additional couriers in wave 1, with assignment remaining manual-only by default. The primary optimization goal is assumed as highest delivery success rate until stakeholder confirmation.

## Who Uses It
Internal product and engineering teams for rollout planning, and store operators who configure couriers and dispatch orders from the dashboard.

## User Stories
- As a product owner, I want delivery changes split into phases so we can improve outcomes without slowing current roadmap commitments.
- As an operations manager, I want two new courier integrations in the first v2 wave so we reduce dependency on current providers quickly.
- As a store operator, I want manual courier selection only so I stay in control while new providers are stabilizing.
- As a security-conscious merchant, I want credentials to remain write-only so secrets are never exposed after save.
- As leadership, I want optimization focused on delivery success rate so failed deliveries decline and margins improve.

## Happy Path
1. Team ships light delivery UX polish in the current timeline without backend redesign risk.
2. Team launches v2 wave 1 with redesigned delivery UI, backend service updates, and rules engine foundation.
3. Team onboards two new courier providers using a standard checklist and readiness gates.
4. Operators configure provider credentials (write-only), then manually choose provider for each dispatch.
5. System tracks delivery success metrics and compares provider performance by region and order profile.
6. Team launches v2 wave 2 with deeper automation/rules and additional provider rollout based on wave 1 data.

## Edge Cases
- New provider underperforms in pilot regions: Use controlled rollout and fallback to existing providers.
- Rules engine recommends a provider that is temporarily unavailable: Keep manual override mandatory and block auto-dispatch.
- Credential update mistakes lock out API access: Support safe re-entry flow and provider health checks before dispatch.
- Inconsistent provider SLA/data quality: Normalize status mapping and enforce contract tests per provider.
- Optimization objective changes after launch: Keep rules weightings configurable and versioned.

## Dependencies
- Requires: Existing delivery integrations (ZR Express, Yalidine), store-level credential security model, and order status pipeline.
- Requires: Product analytics for delivery funnel metrics (attempted, shipped, delivered, failed, returned).
- Blocks: Full automation confidence and expanded provider scaling until wave 1 quality gates pass.

## Decision Lock-In (T10)
- Timeline priority: **B** - light polish now, full redesign and provider expansion in v2.
- Redesign scope: **C** - includes UI, backend, and automation/rules engine.
- Provider rollout strategy: **B** - first wave adds 2 new couriers.
- Default assignment logic: **A** - manual selection only.
- Credential/security UX: **A** - write-only credentials.
- Main optimization goal default: **B** - highest delivery success rate.
- Final business sign-off status: **Pending stakeholder confirmation** (default is now locked in implementation until changed).

## Delivery Assumptions Locked for Build
- Write-only credentials remain mandatory in all delivery settings UX and API flows.
- v1.1 scope is limited to copy/UX polish and guidance quality improvements in current settings and dispatch flows.
- v2 recommendations run in **recommendation-only mode**; no automatic dispatch is allowed.
- New provider work in this cycle is scaffolding only (adapters/contracts/rollout gates), with no live provider integrations.
- Success-rate-first analytics taxonomy is canonical: `attempted`, `dispatched`, `delivered`, `failed`, `rts`.

## T11 - v1.1 Light-Polish Backlog and Acceptance Criteria

### LP1 - Credential Save Feedback and Write-Only Confirmation
- Add explicit success feedback after credential save: "Credentials saved" and "Values are hidden for security; re-enter to update."
- Acceptance criteria:
  - Pass if saving valid credentials shows a success state within 2 seconds and the secret fields render masked/empty on next view.
  - Pass if no screen exposes previously saved secret values in plaintext after refresh or navigation.
  - Fail if any credential value is readable after save.

### LP2 - Credential Validation and Recovery Guidance
- Improve inline copy for invalid credential format and failed preflight checks with a one-step remediation hint.
- Acceptance criteria:
  - Pass if each credential validation error shows a specific cause and one actionable next step.
  - Pass if preflight/API auth failure message includes retry guidance without exposing provider secrets.
  - Fail if errors are generic (for example, only "Something went wrong").

### LP3 - Provider Health Visibility Copy Normalization
- Standardize badge labels and help text for provider health states: Healthy, Degraded, Down, Unknown.
- Acceptance criteria:
  - Pass if all delivery settings and dispatch views use the same four status labels.
  - Pass if each label has a tooltip/help text explaining operational impact in one sentence.
  - Fail if alternate labels appear in any delivery UI surface.

### LP4 - Dispatch Failure Reason Clarity
- Rewrite dispatch failure copy to map one reason per error state and include an immediate operator action.
- Acceptance criteria:
  - Pass if top 5 known dispatch failures each display a distinct reason label and a matching next action.
  - Pass if unknown failures show a safe fallback message with support escalation guidance.
  - Fail if two or more different failure causes collapse into the same ambiguous message.

### LP5 - Retry Guidance and Cooldown Messaging
- Add retry timing guidance for transient failures (rate limit, timeout, temporary outage) without enabling auto-dispatch.
- Acceptance criteria:
  - Pass if transient failure states show retry window guidance (for example, "Retry in 30-60 seconds").
  - Pass if retry CTA remains manual and never triggers automatic reassignment.
  - Fail if UI implies or performs automatic dispatch.

### LP6 - Manual-Only Assignment Guardrails
- Add persistent helper copy in dispatch flow: assignment is manual, recommendations are advisory only.
- Acceptance criteria:
  - Pass if dispatch screen displays manual-control guidance before provider confirmation.
  - Pass if recommendation UI text includes "suggestion only" wording in all recommendation states.
  - Fail if any UI text implies recommendations auto-apply.

### LP7 - Success-Rate-First KPI Labeling Hygiene
- Align KPI labels in delivery-facing UI and docs to canonical taxonomy (`attempted`, `dispatched`, `delivered`, `failed`, `rts`).
- Acceptance criteria:
  - Pass if all delivery KPI labels in scope exactly match canonical names.
  - Pass if no conflicting synonym (for example, "shipped" replacing "dispatched") appears in v1.1 screens.
  - Fail if at least one KPI label conflicts with taxonomy.

### LP8 - Empty, Loading, and Error State Guidance
- Add user-facing copy for no-data, loading delay, and recoverable error states in delivery settings/dispatch pages.
- Acceptance criteria:
  - Pass if each in-scope delivery page defines all three states (empty/loading/error) with operator guidance.
  - Pass if loading state appears before 500 ms spinner threshold and error state includes retry path.
  - Fail if any page falls back to blank containers or raw system errors.

## 3-Phase Implementation Plan
### Phase 1 - Now (v1.1)
- Ship light delivery UX polish only (no architecture rewrite).
- Add delivery health visibility: provider uptime/error badges, dispatch failure reasons, and retry guidance.
- Standardize metrics capture so v2 decisions are data-backed from day one.

### Phase 2 - v2 Wave 1
- Deliver full delivery module redesign (UI + backend + rules engine base).
- Integrate two new courier providers behind feature flags and regional rollout controls.
- Keep dispatch assignment manual-only while rules engine runs in recommendation mode.
- Track core KPIs: delivery success rate, first-attempt success, return-to-sender rate, and dispatch turnaround.

### Phase 3 - v2 Wave 2
- Expand rules engine depth (smarter recommendations, configurable business rules, exception paths).
- Add next set of providers based on wave 1 scorecard and commercial fit.
- Improve automation readiness with stricter reliability thresholds and governance guardrails.

## Provider Onboarding Checklist Template
- Commercial readiness: signed terms, pricing model, SLA expectations, support contact matrix.
- Technical readiness: API docs validated, sandbox credentials issued, required endpoints confirmed.
- Data contract: status mapping, error code mapping, tracking format, webhook or polling behavior.
- Security: write-only credential flow verified, key rotation process documented, audit logging enabled.
- Reliability: contract tests passing, retry/idempotency behavior verified, rate-limit behavior profiled.
- Operations: pilot region/store list approved, rollback plan documented, support playbook trained.
- KPI baseline: pre-launch benchmarks captured and post-launch success thresholds agreed.

## Risks and Mitigations
- Risk: v2 scope is broad and may slip.
  - Mitigation: strict phase gates, lock wave 1 to two providers, defer non-critical automation depth to wave 2.
- Risk: New providers reduce operational consistency.
  - Mitigation: enforce onboarding checklist, contract tests, and staged rollout by region.
- Risk: Manual-only assignment limits scaling speed.
  - Mitigation: run rules engine in shadow/recommendation mode to build confidence safely.
- Risk: Optimization objective may change late.
  - Mitigation: keep objective weights configurable and avoid hard-coding provider ranking logic.
- Risk: Credential handling errors disrupt dispatch.
  - Mitigation: preflight credential validation and clear in-product remediation guidance.

## Most Critical Unresolved Decision
- Decision: Final confirmation of the main business optimization goal for delivery logic.
- Recommended default: **B - Highest delivery success rate**.
- Why this default: It directly improves merchant trust, reduces costly failed attempts/returns, and is the safest objective for early multi-provider expansion.

## Tasks (T-numbers)
- T10: Finalize and approve this phased delivery redesign and provider expansion spec.
- T11: Define v1.1 light-polish delivery UX backlog and acceptance criteria.
- T12: Implement delivery analytics instrumentation for success-rate-first optimization.
- T13: Design v2 delivery architecture (UI, backend service boundaries, rules engine base).
- T14: Build provider onboarding framework (checklist, contract tests, rollout gates).
- T15: Integrate courier provider #1 for v2 wave 1 with feature-flagged rollout.
- T16: Integrate courier provider #2 for v2 wave 1 with feature-flagged rollout.
- T17: Launch manual-only assignment with rules engine recommendation mode.
- T18: Prepare v2 wave 2 provider scorecard and automation-readiness criteria.

## Delivery v2 Progress Snapshot
- T10: Blocked pending final stakeholder sign-off on optimization objective.
- T11: Completed in planning context on 2026-04-14 with v1.1 light-polish backlog and pass/fail acceptance criteria.
- T12: Backlog (not started in this planning artifact).
- T13: Backlog (not started in this planning artifact).
- T14: Backlog (not started in this planning artifact).
