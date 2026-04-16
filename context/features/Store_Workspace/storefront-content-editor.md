# Feature: Storefront Content Editor

> **Status:** `in-progress`
> **Phase:** v1
> **Last updated:** 2026-04-16

---

## Summary

The storefront content editor is the top part of the store editor that lets an owner adjust basic navbar and hero presentation. The live editing surface is composed in `components/pages/editor/components/products-content.tsx`, with focused controls in `components/pages/editor/components/navbar-editor.tsx` and `components/pages/editor/components/hero-editor.tsx`, backed by `convex/siteContent.ts`.

---

## Users

- Store owners customizing their public storefront look and top-of-page messaging.
- Storefront visitors consuming the resulting navbar and hero content.

---

## User Stories

- As a store owner, I want to change my logo and hero copy so that the storefront reflects my brand.
- As a store owner, I want to control navbar appearance and cart visibility so that the storefront layout matches my needs.

---

## Behaviour

### Happy Path

1. `ProductsContent` loads resolved `navbar` and `hero` sections through `api.siteContent.getSiteContentResolved`.
2. `NavbarEditor` lets the owner upload/crop a logo, switch between light and dark navbar modes, and toggle cart visibility.
3. `HeroEditor` lets the owner edit hero title text, CTA label text, hero layout, and hero background image.
4. Navbar and hero mutations write or upsert `siteContent` rows in `convex/siteContent.ts`.
5. The public storefront in `app/[slug]/page.tsx` reads those sections and renders the updated navbar and hero.

### Edge Cases & Rules

- `Current`: navbar logo upload, navbar theme mode, and cart toggle are live through `setNavbarLogo` and `setNavbarStyles` in `convex/siteContent.ts`.
- `Current`: hero title, CTA label, layout, and background image are live through `setHeroStyles`.
- `Partial`: navbar links shown in both editor preview and storefront are placeholders from hard-coded arrays in `components/pages/editor/components/navbar-editor.tsx` and `app/[slug]/page.tsx`; link editing is not live.
- `Partial`: hero CTA destination is not editable in the current editor. The backend default object still has `ctaLink`, but the editor/storefront flow does not expose or fully use it.
- `Partial`: footer content is legacy. `ProductsContent` calls `removeAllOwnedFooterContent` on mount, while `app/[slug]/page.tsx` still renders footer data if present.
- `Partial`: navbar/hero contract drift exists across backend defaults, editor types, and storefront rendering, so fields should be documented conservatively.

---

## Connections

- **Depends on:** `components/pages/editor/components/navbar-editor.tsx`, `components/pages/editor/components/hero-editor.tsx`, `convex/siteContent.ts`.
- **Triggers:** public storefront rendering in `app/[slug]/page.tsx` and product detail navbar rendering in `app/[slug]/product/[productId]/page.tsx`.
- **Shares data with:** shared upload helper in `components/pages/editor/hooks/use-image-upload.ts` and legacy footer cleanup mutations.

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Navbar branding | `Current`: logo, light/dark style, cart toggle | `Planned`: richer nav composition |
| Navbar links | `Partial`: placeholder links only | `Planned`: editable links with real destinations |
| Hero editing | `Current`: title, CTA label, layout, background image | `Planned`: fuller content controls and stronger schema consistency |
| Footer editing | `Partial`: legacy content still exists in storefront code but is being removed, not actively edited | `Planned`: either remove footer surface fully or replace with a supported editor |

---

---

## Security Considerations

- `Current`: several content mutations in `convex/siteContent.ts` such as `updateSiteContent`, `setNavbarStyles`, `setNavbarLogo`, `deleteNavbarLogo`, `setHeroStyles`, and `generateUploadUrl` do not enforce owner checks.
- `Current`: owner-scoped security is the live posture elsewhere; do not describe admin/staff content editing as live.
- `Current`: upload URL generation is available without a store authorization check, which is a must-fix gap under `context/developer/SECURITY.md`.
- `Current`: contract drift between backend defaults and frontend rendering increases risk of stale or inconsistent content behavior.
- `Policy-locked`: store-scoped content writes should resolve the target store server-side and verify owner access before mutation.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T-PLACEHOLDER | `[ ]` | TASK-LIST.md not updated in this pass. Sync content-editor follow-ups to real T-numbers before execution. |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** -

**Outcome:** Not recorded in repo-backed context yet.

## Open Questions

- No additional open questions in repo-backed source. The known unresolved areas are contract drift and whether legacy footer support will be fully removed or replaced.

---

## Notes

- Main implementation references: `components/pages/editor/components/products-content.tsx`, `components/pages/editor/components/navbar-editor.tsx`, `components/pages/editor/components/hero-editor.tsx`, `convex/siteContent.ts`, `app/[slug]/page.tsx`.
- `initializeSiteContent` exists in `convex/siteContent.ts`, but store creation does not currently call it.

---

## Archive

None.
