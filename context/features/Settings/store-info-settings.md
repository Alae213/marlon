# Feature: Store Info Settings

> **Status:** `in-progress`
> **Phase:** v1
> **Last updated:** 2026-04-16

---

## Summary

Store Info Settings is the merchant-facing profile form inside the editor settings dialog. The live implementation is `components/pages/editor/settings/store-info-settings.tsx`, mounted from `components/pages/editor/components/settings-dialog.tsx`. Current scope is narrow: owners can edit store name, description, and phone, then save with `api.stores.updateStore`. Partial: the slug/public URL is display-only, and the shown `marlon.com/{storeSlug}` domain does not match other editor surfaces that build URLs from `window.location.origin`.

---

## Users

- Store owners updating core store identity from the editor.
- Store owners checking the public storefront URL before previewing or sharing.

---

## User Stories

- As a store owner, I want to update my store name, description, and phone so that my workspace and storefront use current business details.
- As a store owner, I want to see my storefront URL in settings so that I know where the public store lives.

---

## Behaviour

### Happy Path

1. The owner opens the settings dialog from the editor and lands on one of the three mounted tabs in `components/pages/editor/components/settings-dialog.tsx`.
2. The Store Info tab loads the store by slug with `api.stores.getStoreBySlug` and hydrates local form state in `components/pages/editor/settings/store-info-settings.tsx`.
3. The owner edits name, description, or phone and clicks Save Changes.
4. The form calls `api.stores.updateStore` with `storeId`, then shows a short-lived success message.
5. The tab also shows a display-only store URL string using `marlon.com/{storeSlug}`.

### Edge Cases & Rules

- `Current`: only `name`, `description`, and `phone` are editable from this tab.
- `Current`: save is explicit button-driven; there is no autosave on blur for store info.
- `Current`: the form fetches by `storeSlug`, but the write goes through owner-scoped `api.stores.updateStore` using `storeId`.
- `Partial`: the displayed store URL is hardcoded as `marlon.com/{storeSlug}` here, while preview/copy actions in `components/pages/editor/components/products-content.tsx` use the current browser origin.
- `Planned`: richer store identity fields such as editable slug, address, or branding controls are not mounted in this tab today, even though `convex/stores.ts` supports more fields on the mutation.

---

## Connections

- **Depends on:** `components/pages/editor/components/settings-dialog.tsx`, `components/pages/editor/settings/store-info-settings.tsx`, `convex/stores.ts`.
- **Triggers:** store metadata updates consumed by editor and storefront reads.
- **Shares data with:** store creation and lookup flows in `app/page.tsx`, `app/editor/[storeSlug]/page.tsx`, and public storefront routes using `api.stores.getStoreBySlug`.

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Editable fields | `Current`: name, description, phone only | `Planned`: clearer ownership over slug, address, and other business profile fields |
| Save model | `Current`: explicit save button | `Planned`: better dirty-state handling if needed |
| Store URL | `Partial`: display-only and not origin-consistent | `Planned`: one canonical public URL surface across editor/settings |
| Settings placement | `Current`: mounted as one of 3 tabs in the dialog | `Planned`: broader settings IA if more merchant controls are added |

---

---

## Security Considerations

- `Current`: protected updates are enforced server-side by direct owner checks in `convex/stores.ts:updateStore`; UI visibility is not the auth boundary.
- `Current`: `api.stores.getStoreBySlug` is readable by slug and should not be treated as a protected merchant-only read.
- `Current`: this tab does not handle payment credentials or delivery secrets.
- `Policy-locked`: do not infer authorization from `storeSlug` or route access alone; store-scoped writes must stay server-verified by store ownership.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T17 | `[ ]` | Align Store Info with the canonical public URL/slug surface so settings, preview, and copy-link do not disagree about the store URL. |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** -

**Outcome:** Not recorded in repo-backed context yet.

## Open Questions

- Should slug editing remain out of scope for v1 settings, or should this tab eventually own a safe slug-change flow? The repo currently supports slug creation, but not slug editing from this settings surface.

---

## Notes

- Main implementation references: `components/pages/editor/settings/store-info-settings.tsx`, `components/pages/editor/components/settings-dialog.tsx`, `components/pages/editor/components/products-content.tsx`, `convex/stores.ts`.
- This doc intentionally does not describe slug editing as live.

---

## Archive

None.
