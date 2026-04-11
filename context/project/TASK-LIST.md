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
 | T1 | `[x]` | Populate task list from PRD | Setup | Converting PRD specs to actionable tasks |
 | T2 | `[x]` | Connect Orders API to Convex mutation | orders | Orders already created via client mutation (unused API route is stubbed) |
 | T3 | `[x]` | Implement Chargily webhook (unlock store) | billing | Now activates store via metadata.storeId |
 | T4 | `[~]` | Fix Delivery API per-store credentials | delivery | Currently uses env vars, needs per-store |
 | T5 | `[ ]` | Populate OVERVIEW.md from PRD | context | Current state: empty stub |
 | T6 | `[ ]` | Populate SCOPE.md (in/out of scope) | context | Define v1 boundaries |
 | T7 | `[ ]` | Populate ROADMAP.md phases | context | v1 Core, v1.1 Polish, v2 Expansion |
 | T8 | `[ ]` | Populate DATA_MODELS.md | context | Current: empty stub |

---

## Backlog

Tasks that are planned but not started yet. Ordered by priority.

| # | Status | Task | Feature | Notes |
|---|--------|------|---------|-------|
| — | — | — | — | — |

---

## Blocked

Tasks that can't proceed until something else is resolved.

| # | Task | Feature | Blocked by |
|---|------|---------|------------|
| — | — | — | — |

---

## Completed

Finished tasks — kept for reference and audit trail.

| # | Task | Feature | Completed |
|---|------|---------|-----------|
| — | — | — | — |

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
