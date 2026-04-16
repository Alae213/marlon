# Feature: Store Preview and Navigation

> **Status:** `in-progress`
> **Phase:** v1
> **Last updated:** 2026-04-16

---

## Summary

The store editor includes live navigation affordances for previewing the public storefront, copying the storefront URL, and moving between editor areas. These controls are implemented mainly in `components/pages/editor/components/products-content.tsx` and `components/primitives/core/layout/bottom-navigation.tsx`. Preview and copy-link are live; the Marketing destination is still a placeholder path.

---

## Users

- Store owners moving between the main editor, orders, home, and public preview surfaces.
- Store owners copying their storefront URL for sharing or testing.

---

## User Stories

- As a store owner, I want to preview my storefront in a new tab so that I can verify what shoppers see.
- As a store owner, I want persistent bottom navigation so that I can move between store workspaces quickly.

---

## Behaviour

### Happy Path

1. In `ProductsContent`, the browser-chrome header shows the current store slug, a copy-link action, preview button, and settings shortcut.
2. Clicking Preview opens `/${storeSlug}` in a new tab from `components/pages/editor/components/products-content.tsx`.
3. Clicking copy writes the public storefront URL to the clipboard and briefly swaps the icon state.
4. The bottom navigation renders Home, Editor, Orders, and Marketing destinations through `components/primitives/core/layout/bottom-navigation.tsx`.
5. Public storefront routes render from `app/[slug]/page.tsx` and `app/[slug]/product/[productId]/page.tsx`.

### Edge Cases & Rules

- `Current`: preview is a real public storefront open action from the editor header.
- `Current`: copy-link uses `window.location.origin` plus `storeSlug`, so it copies the current environment's origin.
- `Current`: bottom navigation highlights the active area and links to `/editor/[storeSlug]` and `/orders/[storeSlug]`.
- `Partial`: Marketing appears in bottom navigation, but there is no confirmed live marketing workspace in the store editor docs for this feature set; it should be treated as coming soon.
- `Current`: editor access still resolves by `storeSlug` in `app/editor/[storeSlug]/page.tsx`, with no explicit owner check at the page layer.

---

## Connections

- **Depends on:** `components/pages/editor/components/products-content.tsx`, `components/primitives/core/layout/bottom-navigation.tsx`.
- **Triggers:** storefront routes `app/[slug]/page.tsx`, `app/[slug]/product/[productId]/page.tsx`, and orders/editor routes.
- **Shares data with:** store lookup by slug in `convex/stores.ts` and settings modal entry points.

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Preview | `Current`: opens the public storefront in a new tab | `Planned`: more explicit preview workflow if needed |
| Copy link | `Current`: clipboard copy is live | `Planned`: richer share actions if needed |
| Bottom navigation | `Current`: Home, Editor, Orders links are wired | `Planned`: more complete multi-workspace navigation |
| Marketing tab | `Partial`: visible in nav, not documented as a live Store Workspace surface | `Planned`: real marketing workspace |

---

---

## Security Considerations

- `Current`: editor page lookup uses `api.stores.getStoreBySlug` in `app/editor/[storeSlug]/page.tsx`; this route-level lookup alone is not authorization.
- `Current`: `getStoreBySlug` and other store queries in `convex/stores.ts` can expose store existence by slug without owner gating.
- `Current`: owner-scoped mutation checks still protect many downstream writes, but navigation and preview surfaces should not be documented as role-aware workspaces.
- `Policy-locked`: protected merchant surfaces must rely on server-side access checks by store, not only route slugs or UI visibility.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T-PLACEHOLDER | `[ ]` | TASK-LIST.md not updated in this pass. Sync navigation follow-ups to real T-numbers before execution. |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** -

**Outcome:** Not recorded in repo-backed context yet.

## Open Questions

- No additional open questions in repo-backed source. The main unresolved point is when Marketing will move from visible placeholder navigation to a documented live workspace.

---

## Notes

- Main implementation references: `components/pages/editor/components/products-content.tsx`, `components/primitives/core/layout/bottom-navigation.tsx`, `app/editor/[storeSlug]/page.tsx`, `app/[slug]/page.tsx`.
- This doc intentionally treats Marketing as partial/coming soon rather than a completed workspace.

---

## Archive

None.
