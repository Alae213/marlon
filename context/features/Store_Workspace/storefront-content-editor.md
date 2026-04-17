# Feature: Storefront Content Editor

> **Status:** `in-progress`
> **Phase:** v1
> **Last updated:** 2026-04-16

---

## Summary

The storefront content editor is the top part of the store editor that lets an owner adjust basic navbar and hero presentation. The live editing surface is composed in `components/pages/editor/components/products-content.tsx`, with focused controls in `components/pages/editor/components/navbar-editor.tsx` and `components/pages/editor/components/hero-editor.tsx`, backed by `convex/siteContent.ts`. The navbar remains popover-driven, while the hero now uses direct-manipulation editing on the preview surface itself.

---

## Users

- Store owners customizing their public storefront look and top-of-page messaging.
- Storefront visitors consuming the resulting navbar and hero content.

---

## User Stories

- As a store owner, I want to change my logo and hero presentation directly on the preview surface so that the storefront reflects my brand without filling out a form-like settings row.
- As a store owner, I want to control navbar appearance and cart visibility so that the storefront layout matches my needs.

---

## Behaviour

### Happy Path

1. `ProductsContent` loads resolved `navbar` and `hero` sections through `api.siteContent.getSiteContentResolved`.
2. `NavbarEditor` lets the owner upload/crop a logo, switch between light and dark navbar modes, and toggle cart visibility.
3. `HeroEditor` shows hover-highlighted editable regions for the background image, title, and CTA, using blue outline/selection states inspired by the navbar editor interaction language.
4. Clicking the hero background starts image upload directly, then opens an adjustment dialog with desktop/phone previews plus zoom and focal controls before saving one responsive image.
5. Clicking the title or CTA opens a floating mini panel for text, color, and shared font/alignment controls. Font and alignment changes made in either panel apply to both title and CTA.
6. Navbar and hero mutations write or upsert `siteContent` rows in `convex/siteContent.ts`.
7. The public storefront in `app/[slug]/page.tsx` reads those sections and renders the updated navbar and hero.

### Edge Cases & Rules

- `Current`: navbar logo upload, navbar theme mode, and cart toggle are live through `setNavbarLogo` and `setNavbarStyles` in `convex/siteContent.ts`.
- `Current`: hero title, CTA text, title/CTA colors, shared font family, shared alignment, background image, focal point, and zoom are live through `setHeroStyles`.
- `Current`: hero text limits are enforced in the editor at 40 characters for the title and 18 characters for the CTA.
- `Current`: default hero content is available even when no stored hero section exists yet. The editor preview falls back to `Meet E-commerce` / `Again`, `Buy Now`, and `/Hero-bg.jpg`.
- `Partial`: navbar links shown in both editor preview and storefront are placeholders from hard-coded arrays in `components/pages/editor/components/navbar-editor.tsx` and `app/[slug]/page.tsx`; link editing is not live.
- `Current`: hero CTA destination is not merchant-editable; the public catalog hero scrolls to the products section by design.
- `Partial`: footer content is legacy. `ProductsContent` calls `removeAllOwnedFooterContent` on mount, while `app/[slug]/page.tsx` still renders footer data if present.
- `Partial`: navbar links and footer handling still drift from the more polished hero behavior.

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
| Hero editing | `Current`: direct preview editing for title, CTA, colors, shared font/alignment, and responsive background image positioning | `Planned`: richer navigation/footer composition and a tighter typed public/editor contract |
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
| T43 | `[x]` | Rework the workspace hero editor and public storefront hero to use shared defaults, direct-manipulation editing, shared font/alignment controls, CTA scroll behavior, and improved visual rendering. |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** -

**Outcome:** Not recorded in repo-backed context yet.

## Open Questions

- No additional open questions in repo-backed source. The main unresolved areas are placeholder navbar links, legacy footer handling, and whether the hero should later gain merchant-editable CTA destinations.

---

## Notes

- Main implementation references: `components/pages/editor/components/products-content.tsx`, `components/pages/editor/components/navbar-editor.tsx`, `components/pages/editor/components/hero-editor.tsx`, `convex/siteContent.ts`, `app/[slug]/page.tsx`, `lib/hero-content.ts`.
- `initializeSiteContent` exists in `convex/siteContent.ts`, but store creation does not currently call it.

---

## Archive

None.
