## Agent 4 — Styling & Polish Plan

- [x] Review current editor page layout and identify hero/page areas needing the sunglasses background pattern.
- [x] Add reusable background pattern utility to `app/globals.css` with light/dark friendly tokens.
- [x] Apply the pattern class to the editor page sections per Figma (hero/page wrap) and adjust spacing/typography for responsive alignment.
- [x] Verify visual consistency for RTL and dark mode; note any follow-ups.

### Review

- Added the sunglasses-pattern utility in `app/globals.css` and wrapped the editor shell/hero fallback with it.
- Smoothed responsive spacing/typography for the preview bar, hero controls, and upload rows while keeping RTL-aware alignment.
- Not run automated tests (styling-only change).

## Agent 3 — Product Section Plan

- [x] Confirm product section requirements from brief/PRD for grid view and inline editing scope.
- [x] Audit current product grid markup (heading, cards, hover controls, add card, inline fields).
- [x] Outline styling updates to match Figma cues (typography, spacing, aspect ratio, hover alignment, dashed add card using Card variant).
- [x] Update section heading and container spacing in `app/editor/[storeSlug]/page.tsx` product area.
- [x] Refine product card layout/hover treatments and image aspect handling without touching data flow.
- [x] Align inline editing inputs/labels for name and price rows to new layout.
- [x] Keep list view and non-product sections stable while ensuring grid changes don’t regress behavior.
- [x] Self-review, note dependencies on Agent 2 components (e.g., placeholders), and summarize changes.

### Review (Agent 3)

- Refreshed product heading weight/size and tightened grid spacing to mirror Figma hierarchy.
- Restyled grid cards with consistent 3:4 imagery, refined inline edit inputs, and hover control pill; dashed add-card now uses `Card` with keyboard activation.
- TODO: replace temporary image fallback with `ImagePlaceholder` once Agent 2 provides it; data flow/list view unchanged. Tests not run (UI-only changes).
