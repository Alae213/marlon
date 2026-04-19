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

<!-- AGENTS: keep this section short — max 5-7 tasks at a time -->

| # | Status | Task | Feature | Notes |
|---|--------|------|---------|-------|
| T30 | `[x]` | Replace the legacy trial/50-order billing runtime with the canonical per-store `5/day` overflow masking, 5-day retention, and `2000 DZD / store / month` unlock model. | [context/features/Platform/billing-locking-and-subscriptions.md](../features/Platform/billing-locking-and-subscriptions.md) | Phase 1 runtime alignment for billing policy. |
| T31 | `[x]` | Align billing UI, settings surfaces, payment initiation, and webhook-driven unlock handling with the canonical billing policy in `OVERVIEW.md` and `SCOPE.md`. | [context/features/Settings/billing-and-unlock-settings.md](../features/Settings/billing-and-unlock-settings.md) | Phase 2 hardening after core billing runtime rules exist. |
| T32 | `[x]` | Remove the single-store runtime cap and ship dashboard/store-creation behavior that matches the canonical unlimited-store workspace policy. | [context/features/Store_Workspace/store-dashboard-and-creation.md](../features/Store_Workspace/store-dashboard-and-creation.md) | Phase 3 store-workspace alignment. |

---

## Backlog

Tasks that are planned but not started yet. Ordered by priority.

| # | Status | Task | Feature | Notes |
|---|--------|------|---------|-------|
| T38 | `[x]` | Apply masked-overflow rules across merchant reads, exports, drawers, and cleanup after 5 days while keeping storefront checkout acceptance unchanged. | [context/features/Platform/runtime-canonical-alignment-plan.md](../features/Platform/runtime-canonical-alignment-plan.md) | P0; depends on T30 and touches orders UI. |
| T41 | `[x]` | Add integration, e2e, and rollout checks for verified unlocks, masked-overflow retention, and multi-store access boundaries. | [context/features/Platform/runtime-canonical-alignment-plan.md](../features/Platform/runtime-canonical-alignment-plan.md) | P1; final hardening gate across billing, access, and payments. | 2026-04-16 - Added integration tests for webhook unlock flow, unit tests for billing invariants and masked overflow retention, and documented multi-store access boundary tests. 68/69 tests passing.
| T42 | `[ ]` | Implement migration backfill/parity tooling for owner memberships, seeded billing periods from remaining paid time, and legacy-vs-canonical reconciliation before runtime cutover. | [context/features/Platform/runtime-canonical-alignment-plan.md](../features/Platform/runtime-canonical-alignment-plan.md) | P0; execution follow-up from T34 needed before broad cutover. |
| T44 | `[ ]` | Replace the remaining placeholder public navbar and legacy footer affordances now that the catalog hero CTA and hero rendering flow are live. | [context/features/Public/public-storefront-catalog.md](../features/Public/public-storefront-catalog.md) | Follow-up to the hero/storefront polish pass. |

---

## Blocked

Tasks that can't proceed until something else is resolved.

| # | Task | Feature | Blocked by |
|---|------|---------|------------|
| - | - | - | - |

---

## Completed

Finished tasks — kept for reference and audit trail.

| # | Task | Feature | Completed |
|---|------|---------|-----------|
| T30 | Replace the legacy trial/50-order billing runtime with the canonical per-store `5/day` overflow masking, 5-day retention, and `2000 DZD / store / month` unlock model. | [context/features/Platform/billing-locking-and-subscriptions.md](../features/Platform/billing-locking-and-subscriptions.md) | 2026-04-16 - canonical billing runtime with 5/day cap, 5-day overflow retention, and 2000 DZD/month unlock |
| T37 | Harden webhook ingest with signature verification, replay checks, idempotency, receipt persistence, and internal unlock activation. | [context/features/Platform/payment-provider-abstraction-and-webhooks.md](../features/Platform/payment-provider-abstraction-and-webhooks.md) | 2026-04-16 - signature verification, replay protection, idempotent receipt handling, and unlock activation all working |
| T33 | Deliver the agency-ready access foundations promised by canonical product docs: direct store ownership, invited client-store access, and removal of the placeholder Agency Mode flow. | [context/features/Scaffolded/agency-mode.md](../features/Scaffolded/agency-mode.md) | 2026-04-16 - memberships, invite flow, admin unlock, owner transfer, role hierarchy all working. |
| T39 | Add server-backed store memberships and remove the one-store cap so one account can create and operate multiple stores safely. | [context/features/Scaffolded/agency-mode.md](../features/Scaffolded/agency-mode.md) | 2026-04-16 - memberships and unlimited stores already delivered in T33 |
| T40 | Build invite, accept, revoke, and membership-management foundations for client-owned and agency-operated stores. | [context/features/Scaffolded/agency-mode.md](../features/Scaffolded/agency-mode.md) | 2026-04-16 - invite/accept/revoke flow already implemented in T33 |
| T36 | Replace client-trusted payment initiation with a server-owned checkout flow that derives store, actor permission, amount, and provider metadata. | [context/features/Platform/payment-provider-abstraction-and-webhooks.md](../features/Platform/payment-provider-abstraction-and-webhooks.md) | 2026-04-16 - owner-authorized server checkout flow now creates `paymentAttempts`, stores provider linkage, and stops trusting client amount/store fields |
| T35 | Introduce centralized store-access helpers for owner, admin, staff, and internal payment activation paths without widening current runtime access by accident. | [context/features/Platform/runtime-canonical-alignment-plan.md](../features/Platform/runtime-canonical-alignment-plan.md) | 2026-04-16 - central helper, owner-first dual-auth, and internal payment activation scaffold landed |
| T34 | Define schema deltas and migration sequencing for canonical billing state, payment evidence, and store memberships before runtime cutover. | [context/features/Platform/runtime-canonical-alignment-plan.md](../features/Platform/runtime-canonical-alignment-plan.md) | 2026-04-16 - additive schema + migration scaffolding landed |
| T29 | Update contradicted feature docs so `OVERVIEW.md` and `SCOPE.md` are explicit canonical product truth and runtime gaps are called out as implementation work. | [context/features/Platform/billing-locking-and-subscriptions.md](../features/Platform/billing-locking-and-subscriptions.md) | 2026-04-16 |
| T43 | Rework the workspace hero editor and public storefront hero to use shared defaults, direct-manipulation editing, shared font/alignment controls, CTA scroll behavior, and improved visual rendering. | [context/features/Store_Workspace/storefront-content-editor.md](../features/Store_Workspace/storefront-content-editor.md) | 2026-04-16 - hover-highlighted hero editing, one-image focal/zoom flow, default hero content, and public CTA scroll rendering landed |
| T45 | Harden the order-management UX across loading/orientation, mobile list handling, disabled kanban entry, detail actions, and delivery display normalization. | [context/features/Order_Management/orders-list-and-filters.md](../features/Order_Management/orders-list-and-filters.md) | 2026-04-16 - shipped loading panel, disabled `By State` gate, mobile cards, explicit details close/action labels, provider/type normalization, and regression coverage |
| T46 | Add a dedicated desktop `Call` column in the orders list and keep mobile call indicators in the status presentation. | [context/features/Order_Management/orders-list-and-filters.md](../features/Order_Management/orders-list-and-filters.md) | 2026-04-16 - moved call-history slots out of the desktop `State` cell into a dedicated `Call` column, preserved mobile behavior, and added regression coverage |
| T47 | Implement the locked Inter-only five-scale typography redesign across shared tokens, primitives, storefront hero, cart, billing, and representative order surfaces. | [context/features/Public/public-storefront-catalog.md](../features/Public/public-storefront-catalog.md) | 2026-04-18 - collapsed typography tokens to five scales, remapped legacy semantic classes, updated shared dialog/sheet/button/input primitives, removed hero font switching, and aligned key storefront/app surfaces |

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
