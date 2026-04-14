# Monitoring & Observability

Operational monitoring baseline for Marlon MVP, aligned to locked Phase 4 reliability controls and current checkout/lock-unlock architecture.

## 1) Observability Stack (Required)

- Error tracking: Sentry (or equivalent) for frontend, API route, Convex function, and webhook exceptions.
- Uptime monitoring: external uptime checks for storefront, merchant app, and critical API ingress endpoints.
- Synthetic checkout monitor: scheduled end-to-end probe that executes a real checkout/order creation flow in a dedicated test store.

Minimum instrumentation scope:
- Checkout/order create endpoint.
- Chargily webhook ingest endpoint.
- Unlock activation path.
- Merchant orders read path (masked vs unmasked behavior).

## 2) First 90-Day SLO Priority

Primary SLO (locked priority): checkout/order creation success.

- Objective: protect buyer-to-order conversion before adding new surface area.
- SLI scope: successful `POST` checkout requests that produce persisted orders and valid merchant visibility state.
- Error budget policy: any material burn-rate spike pauses non-critical releases until stability is restored.
- Secondary supporting indicators: checkout latency, webhook processing delay, masked-overflow transition correctness.

## 3) Alert Classes and On-Call Expectations

Severity classes:
- `Sev1` Critical
  - Active checkout/order creation outage or widespread failure.
  - Immediate on-call response, incident channel opened, escalation started.
- `Sev2` High
  - Significant degradation (error-rate spike, synthetic checkout failing repeatedly, webhook backlog threatening unlock flow).
  - On-call responds quickly, mitigation initiated, escalation if unresolved in defined window.
- `Sev3` Medium
  - Partial feature degradation with workaround available.
  - Handled in working hours unless trend worsens.
- `Sev4` Low
  - Non-urgent defects, noise tuning, dashboard hygiene.
  - Tracked in backlog.

On-call and escalation baseline:
- One primary on-call engineer per week release slice.
- One secondary backup for handoff and escalation.
- Escalate to product/operations owner for `Sev1` and for `Sev2` incidents affecting billing/unlock or merchant trust.

## 4) Key Dashboards and Metrics

### A) Checkout and Order Reliability Dashboard
- Checkout request volume, success rate, p95 latency.
- Order creation success/failure counts by store and route version.
- Idempotency conflict rate and retry outcomes.
- Synthetic checkout pass/fail timeline.

### B) Lock/Unlock Lifecycle Dashboard
- Stores entering locked-overflow state per day.
- Masked overflow order count and age distribution.
- Unlock activations by day and unlock success rate.
- Overflow auto-delete events (5-day policy) and exceptions.

### C) Webhook Health Dashboard
- Chargily webhook receive -> verify -> process funnel conversion.
- Signature verification failures, replay-window rejects, duplicate-event ignores.
- Webhook processing latency and backlog depth.
- Unlock activation success after verified payment event.

### D) Delivery/Queue Reliability Dashboard (Supportive)
- Dispatch queue depth, retry counts, DLQ entries.
- Provider failure-rate trends and dead-letter aging.

## 5) Logging and Trace Expectations

- Structured logs only (requestId/storeId/orderId/eventId correlation keys).
- Immutable audit trail is preserved for lock/unlock, order mutations, and webhook processing decisions.
- Sensitive fields remain masked; secrets are never logged.
- Log retention supports incident reconstruction and postmortems.

## 6) Incident Response Flow

1. Detect via alert or synthetic failure.
2. Classify severity (`Sev1`-`Sev4`) and assign incident owner.
3. Stabilize using locked mitigation order: feature-flag disable first, rollback second.
4. Validate checkout/order creation recovery with live and synthetic checks.
5. Communicate status updates at regular intervals for active incidents.
6. Close incident only after metrics stabilize and risk is contained.

## 7) Postmortem Expectations

Postmortems are required for all `Sev1` and any recurring `Sev2` incidents.

- Publish within 2 business days.
- Include: timeline, customer impact, trigger/root cause, mitigation steps, detection gaps, and concrete prevention actions.
- Assign owners and due dates for corrective actions.
- Track follow-up actions in `context/project/TASK-LIST.md` when material work is required.

## 8) Backup and Restore Objectives

Locked baseline targets:
- Backups: hourly snapshots for production data stores.
- Restore objective: service/data restoration within 4 hours.

Operational expectations:
- Backup job health is monitored and alerted on failures.
- Restore drills are run on a regular cadence in non-production.
- Restore verification must include checkout/order creation integrity and lock/unlock state consistency.
