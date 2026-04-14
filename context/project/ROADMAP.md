# Roadmap

> Operational roadmap aligned to locked Phase 1-5 decisions and current delivery reality.

## Governance Locks (Non-Negotiable)

- Reliability/security first: when priorities conflict, hardening work wins.
- Planning cadence: bi-weekly planning, weekly execution slices.
- Out-of-scope revisit gate: only after reliability baseline is met and support bandwidth is healthy.
- Pricing cadence: one controlled pricing experiment per quarter.
- North-star metric: net revenue retained (after churn).

## 1) Immediate: Context-Writing Sprint (Canonical Alignment)

**Milestone outcome:** Context becomes the trusted source of product truth for build, QA, and release decisions.

- Align `OVERVIEW.md`, `SCOPE.md`, and this roadmap with locked commercial/governance rules.
- Finalize canonical docs for architecture/security/operations so implementation gates are testable.
- Resolve setup-era placeholders and remove untrusted completion claims.

**Decision gate to exit sprint:**
- Canonical context docs are internally consistent and accepted as the planning source.
- Active sprint tasks for context population/alignment are completed.

## 2) MVP Hardening + Build Alignment Milestones

**Milestone A - Reliability baseline operationalized**
- Release gates enforce unit + integration + core checkout e2e coverage.
- Monitoring/alerts and rollback playbook are active for checkout and order creation paths.
- Data protection controls (masking, retention/deletion windows, immutable logs) are verified.

**Gate A:** Proceed only when checkout/order reliability meets baseline and security controls are passing.

**Milestone B - Locked MVP policy fully enforced in product behavior**
- Per-store daily cap (`5/day`, `Africa/Algiers` reset) and masked-overflow freeze/unlock behavior are consistent.
- Unlock economics (`2000 DZD/store/month`) and webhook trust controls are stable in production flow.
- Tenant isolation and role-policy enforcement are consistent across store, orders, billing, and delivery surfaces.

**Gate B:** Proceed only when policy audits show no critical gaps between locked decisions and runtime behavior.

**Milestone C - Build plan aligned to retained-revenue outcomes**
- Weekly execution is prioritized by reliability/security impact first, then retained-revenue impact.
- Delivery-v2 and adjacent initiatives remain sequenced behind reliability gates, not parallelized by default.
- KPI review ties each active initiative to north-star contribution or protective risk reduction.

**Gate C:** MVP is considered hardened when reliability baseline is sustained and support load remains manageable.

## 3) Post-MVP: Monetization and Plan-Evolution Gate

**Milestone outcome:** Expansion begins only when operational trust and support capacity are proven.

- Run at most one controlled pricing experiment per quarter with explicit success/fail thresholds.
- Re-evaluate deferred scope only after reliability baseline + support bandwidth gate is met.
- Continue/stop decisions follow kill rule: missed KPI plus high maintenance burden ends the initiative.

**Decision gate for expansion:**
- Reliability baseline sustained over the review window.
- Support bandwidth can absorb new surface area without degrading core operations.
- Experiment evidence supports improvement in net revenue retained after churn.
