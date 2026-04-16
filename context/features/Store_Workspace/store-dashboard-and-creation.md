# Feature: Store Dashboard and Creation

> **Status:** `in-progress`
> **Phase:** v1
> **Last updated:** 2026-04-16

---

## Summary

The store dashboard is the signed-in landing surface for creating a first store and reopening an existing one. Current runtime behavior lives mainly in `app/page.tsx` and `convex/stores.ts`: a merchant can create one store with name + slug, then enter the editor at `/editor/[storeSlug]`. Multi-store messaging exists in project-level docs, but live runtime is still single-store only.

---

## Users

- Signed-in store owners starting their first store from `app/page.tsx`.
- Signed-in store owners returning to reopen an existing store card.
- Not yet agencies or staff users; owner-only is the live access model.

---

## User Stories

- As a store owner, I want to create my first store quickly so that I can start editing products and storefront content.
- As a store owner, I want to reopen my store from the dashboard so that I can continue working without searching for URLs.

---

## Behaviour

### Happy Path

1. A signed-in user lands on `app/page.tsx` and `api.stores.getUserStores` loads store cards.
2. If the user has no store yet, the New Store tile opens the creation modal in `app/page.tsx`.
3. The modal collects only `name` and `slug`, checks slug availability with `api.stores.isSlugAvailable`, and submits `api.stores.createStore`.
4. Convex inserts a `stores` row with owner ID, slug, trial subscription defaults, and timestamps in `convex/stores.ts`.
5. The new store appears on the dashboard and opens via `/editor/[storeSlug]`.

### Edge Cases & Rules

- `Current`: live limit is one store per user. `MAX_STORES_PER_USER = 1` in `convex/stores.ts`, and `app/page.tsx` blocks the second-store path with an `Agency Mode` coming-soon modal.
- `Current`: slug availability is checked client-side before submit in `app/page.tsx`, then checked again in `convex/stores.ts` before insert.
- `Partial`: slug generation and validation do not fully agree. `generateSlug` allows Arabic characters while `validateSlug` only accepts `[a-z0-9-]`, and `handleNameChange` compares against `generateSlug(slug)` instead of the generated slug from the name.
- `Current`: creation UI only surfaces a generic error on mutation failure, so backend-specific reasons are mostly hidden from merchants.
- `Current`: store creation does not initialize default site-content rows, even though `convex/siteContent.ts` includes `initializeSiteContent`.

---

## Connections

- **Depends on:** Clerk auth in `app/page.tsx`, Convex store queries in `convex/stores.ts`.
- **Triggers:** editor entry at `app/editor/[storeSlug]/page.tsx`.
- **Shares data with:** site content and product flows that resolve stores by slug.

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Store count | `Current`: one store per owner at runtime | `Planned`: project docs describe unlimited stores and agency support |
| Creation form | `Current`: name + slug only | `Planned`: richer onboarding if needed |
| Agency flow | `Current`: blocking coming-soon modal only | `Planned`: real multi-store and agency workspace flow |
| Store bootstrap | `Partial`: store row is created, default site content is not initialized automatically | `Planned`: store creation should provision required content rows |

---

---

## Security Considerations

- `Current`: store ownership checks for create and update flows are owner-scoped in `convex/stores.ts`; do not document admin/staff access as live.
- `Current`: `getUserStores` and `subscribeToUserStores` in `convex/stores.ts` trust caller-supplied `userId` in some paths, which is a tenant-isolation gap.
- `Current`: editor routing resolves a store by slug in `app/editor/[storeSlug]/page.tsx`; slug is routing data, not proof of access.
- `Current`: store creation uses server auth for owner assignment, but slug checks are not a substitute for authorization.
- `Policy-locked`: security baseline requires server-side store isolation by exact store access checks; current gaps should be treated as must-fix, per `context/developer/SECURITY.md`.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T-PLACEHOLDER | `[ ]` | TASK-LIST.md not updated in this pass. Follow-ups should sync to real global T-numbers before implementation. |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** -

**Outcome:** Not recorded in repo-backed context yet.

## Open Questions

- No additional open questions in repo-backed source. The main mismatch is already known: project-level unlimited-store positioning does not match live single-store runtime.

---

## Notes

- Main implementation references: `app/page.tsx`, `convex/stores.ts`, `app/editor/[storeSlug]/page.tsx`.
- Dashboard cards currently show minimal store metadata; the important live action is opening the editor.

---

## Archive

None.
