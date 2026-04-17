# Feature: Marketing Workspace

> **Status:** `deferred`
> **Phase:** v1.1
> **Last updated:** 2026-04-16

---

## Summary

Marketing Workspace is exposed in navigation but not actually built. Current: `/marketing/[storeSlug]` exists, `components/primitives/core/layout/bottom-navigation.tsx` links to it, and `app/marketing/[storeSlug]/page.tsx` renders only `Coming soon` plus the shared bottom nav. Partial: there is no real marketing workspace, store lookup, auth guard, or backend surface behind that route. This also contradicts `context/project/SCOPE.md`, which marks the marketing suite out of scope for v1.

---

## Users

- Current: store owners who click the Marketing item from the bottom nav.
- Planned: merchants using real campaign or promotion tooling, if a marketing workspace is ever shipped.

---

## User Stories

- As a store owner, I need navigation to reflect what is actually usable so I do not land on a dead-end page.
- As a maintainer, I need visible merchant navigation to match MVP scope and implemented backend support.

---

## Behaviour

### Happy Path

1. A merchant sees `Marketing` in `components/primitives/core/layout/bottom-navigation.tsx`.
2. Clicking it navigates to `/marketing/[storeSlug]`.
3. `app/marketing/[storeSlug]/page.tsx` renders a centered `Coming soon` message and re-renders the bottom navigation.

### Edge Cases & Rules
- `Current`: the route reads `storeSlug` from params only; it does not fetch the store or verify ownership.
- `Current`: there is no dedicated marketing UI beyond placeholder text.
- `Current`: there is no backend surface, mutation, query, or auth-aware loader for a marketing workspace.
- `Partial`: the nav exposure makes Marketing look live even though `context/project/SCOPE.md` lists the marketing suite as out of scope for v1.
- `Policy-locked`: do not describe campaigns, discount engines, referrals, or email tools as shipped behavior.

---

## Connections

This placeholder route is only connected to navigation today.

- **Depends on:** `components/primitives/core/layout/bottom-navigation.tsx`, `app/marketing/[storeSlug]/page.tsx`
- **Triggers:** navigation from editor/orders/marketing bottom-nav surfaces
- **Shares data with:** `context/features/Store_Workspace/store-preview-and-navigation.md`, `context/project/SCOPE.md`

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Route | `Current`: `/marketing/[storeSlug]` exists | `Planned`: route backed by real marketing workspace state |
| Navigation exposure | `Partial`: visible in bottom nav despite being a placeholder | `Current`: nav only exposes live or clearly gated workspaces |
| Backend support | `Current`: none | `Planned`: real store lookup, auth guard, and marketing data surfaces |
| Scope alignment | `Partial`: runtime exposes a marketing entry point while scope docs defer the marketing suite | `Current`: scope, docs, and navigation agree |

---

---

## Security Considerations

- `Current`: the page itself does not perform store ownership or auth checks.
- `Current`: no sensitive data is loaded because the route is only placeholder text.
- `Partial`: visible navigation to an unguarded merchant route can imply a workspace boundary that does not really exist yet.
- `Policy-locked`: future marketing features must not rely on route params alone for merchant access.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T27 | `[ ]` | Hide or clearly gate the Marketing nav item until a real marketing workspace, auth boundary, and backend surface exist. |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** -

**Outcome:** No browser UAT result is recorded in repo-backed context. Source review shows a visible nav link and a placeholder page only.

## Open Questions

- Should Marketing stay visible as a teaser, or should it disappear until the feature moves back into active scope?

---

## Notes

- Main implementation references: `components/primitives/core/layout/bottom-navigation.tsx`, `app/marketing/[storeSlug]/page.tsx`.
- This doc treats Marketing as deferred even though a route exists, because the route is only a placeholder and the project scope still defers the marketing suite.

---

## Archive

None.
