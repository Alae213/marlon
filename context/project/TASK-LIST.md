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
| T1 | `[ ]` | Enforce allowed order status transitions in Convex and reuse the same rules in Orders UI | `context/features/Order_Management/order-status-lifecycle.md` | `STATUS_TRANSITIONS` exists but is not enforced server-side |
| T2 | `[ ]` | Make Orders list select-all act on filtered rows instead of all loaded rows | `context/features/Order_Management/orders-list-and-filters.md` | Current checkbox selects `ordersData`, not `filteredOrders` |
| T3 | `[ ]` | Bring bulk order lifecycle updates to parity with single-order analytics and audit side effects | `context/features/Order_Management/order-status-lifecycle.md` | `bulkUpdateOrderStatus` does not mirror all single-update analytics behavior |
| T4 | `[ ]` | Expand call logging UI to support all backend outcomes and optional call notes | `context/features/Order_Management/call-logging-and-admin-notes.md` | UI exposes fewer outcomes than backend types support |
| T5 | `[ ]` | Replace single-value admin note handling with visible history or another explicit audit surface | `context/features/Order_Management/call-logging-and-admin-notes.md` | Current note model is an upsert, not note history |
| T6 | `[ ]` | Unify delivery dispatch and status progression so tracking, status, and analytics stay consistent | `context/features/Order_Management/delivery-dispatch-from-orders.md` | Dispatch metadata and status advancement are split across route and UI layers |

---

## Backlog

Tasks that are planned but not started yet. Ordered by priority.

| # | Status | Task | Feature | Notes |
|---|--------|------|---------|-------|
| T7 | `[>]` | Build a real kanban-by-status orders view with parity to the list | `context/features/Order_Management/orders-kanban-view.md` | Current component is a coming-soon placeholder |
| T8 | `[ ]` | Expose order timeline and event history in the details experience | `context/features/Order_Management/order-details-drawer.md` | Backend writes timeline and event rows, but UI does not show them |
| T9 | `[ ]` | Build a real anonymous public order submission path with server-side validation and abuse controls, and stop calling owner-only `api.orders.createOrder` from public UI | `context/features/Public/checkout-and-order-submission.md` | Current PDP and cart checkout UIs call an owner-scoped mutation, so anonymous checkout is not truly live |
| T10 | `[ ]` | Scope cart persistence by storefront so one store does not reuse another store's local cart state | `context/features/Public/cart-sidebar.md` | `contexts/cart-context.tsx` persists everything under the global `cart` key |
| T11 | `[ ]` | Add explicit minimal public queries for storefront slug, content, pricing, and products instead of returning broad raw records | `context/features/Public/storefront-content-rendering.md` | Public reads currently use generic `getStoreBySlug`, `getSiteContentResolved`, and delivery pricing queries |
| T12 | `[ ]` | Replace placeholder public navbar, footer, and hero CTA affordances with real links/actions or remove them from runtime | `context/features/Public/storefront-content-rendering.md` | Catalog and PDP still render placeholder navigation labels and a non-functional hero CTA |
| T13 | `[ ]` | Apply product variant price modifiers consistently in PDP pricing, cart totals, and submitted public order lines | `context/features/Public/public-product-detail.md` | PDP stores the selected variant label, but totals still use `basePrice` only |
| T14 | `[ ]` | Make the delivery pricing editor and storefront use one canonical format and access path | `context/features/Settings/delivery-pricing-settings.md` | Runtime currently mixes duplicated APIs, hardcoded wilaya labels, and storefront fallback logic |
| T15 | `[ ]` | Remove unsupported courier providers from the live settings surface or clearly gate them until adapters exist | `context/features/Settings/delivery-provider-settings.md` | Only Yalidine and ZR Express are operational today; Andrson and Noest are still placeholder/TBD |
| T16 | `[ ]` | Replace current payment initiation and webhook handling with a server-owned hardened unlock flow | `context/features/Settings/billing-and-unlock-settings.md` | Runtime still mixes `9,900 DZD` trial/50-order behavior with incomplete webhook hardening and non-canonical unlock flows |
| T17 | `[ ]` | Align store settings, preview, and share surfaces on one canonical public URL/slug presentation | `context/features/Settings/store-info-settings.md` | Store Info shows `marlon.com/{slug}` while editor preview/copy-link use the current browser origin |

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
