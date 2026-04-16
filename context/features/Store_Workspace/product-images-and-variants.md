# Feature: Product Images and Variants

> **Status:** `in-progress`
> **Phase:** v1
> **Last updated:** 2026-04-16

---

## Summary

Product images and variants are edited inside the product form used by the store editor. Image crop/upload/reorder/remove flows are live through `components/features/shared/image-cropper.tsx` and `components/pages/editor/hooks/use-image-upload.ts`; variant editing exists through `components/features/shared/inline-variant-editor.tsx`, but some variant controls are UI-only or not fully reflected in storefront behavior.

---

## Users

- Store owners creating or updating product presentation inside the editor.
- Storefront shoppers viewing product galleries and choosing variant options on product detail pages.

---

## User Stories

- As a store owner, I want to upload and arrange product images so that products look presentable in the storefront.
- As a store owner, I want to define option groups like size or color so that shoppers can select basic variants.

---

## Behaviour

### Happy Path

1. In `components/pages/editor/components/product-form.tsx`, the merchant opens the shared `ImageUploader` and `InlineVariantEditor`.
2. Product images can be selected, cropped, marked featured by moving to index `0`, reordered by drag, or removed in `components/features/shared/image-cropper.tsx`.
3. On save, `useImageUpload().resolveImageStorageIds` uploads new data URLs through `api.siteContent.generateUploadUrl` and passes existing URLs through.
4. `convex/products.ts` normalizes stored product images to direct URLs before persisting the product.
5. Variant groups and options are saved with the product and rendered as selectable options on `app/[slug]/product/[productId]/page.tsx`.

### Edge Cases & Rules

- `Current`: product image upload, crop, reorder, featured-image swap, zoom, and removal are live in the editor UI.
- `Current`: product images end up stored as direct URLs in `convex/products.ts`, not durable storage IDs, after normalization.
- `Partial`: variant group hide/show in `components/features/shared/inline-variant-editor.tsx` uses `isHidden`, but product types and Convex mutations do not persist that field.
- `Partial`: variant options support `priceModifier` in types and backend schema, but the current editor UI does not expose merchant editing for price modifiers.
- `Current`: storefront product detail lets buyers select variant option names, but pricing still uses `product.basePrice` rather than variant price adjustments.

---

## Connections

- **Depends on:** `components/features/shared/image-cropper.tsx`, `components/features/shared/inline-variant-editor.tsx`, `components/pages/editor/hooks/use-image-upload.ts`.
- **Triggers:** product create/update mutations in `convex/products.ts`.
- **Shares data with:** storefront PDP at `app/[slug]/product/[productId]/page.tsx` and cart/order payloads.

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Product images | `Current`: crop, upload, reorder, remove, and featured-first ordering work | `Planned`: stronger storage consistency and cleanup semantics |
| Variant groups | `Current`: create, rename, add/remove option names | `Planned`: richer inventory/visibility rules |
| Variant visibility | `Partial`: UI toggle exists, persistence/runtime behavior does not | `Planned`: end-to-end hidden-state support |
| Variant price modifiers | `Partial`: backend shape exists, merchant-facing editing/runtime pricing are not complete | `Planned`: fully supported price-adjusted variants |

---

---

## Security Considerations

- `Current`: product create/update writes remain owner-scoped in `convex/products.ts`.
- `Current`: upload URL generation uses `api.siteContent.generateUploadUrl` from `components/pages/editor/hooks/use-image-upload.ts`; that mutation currently has no owner or store check in `convex/siteContent.ts`.
- `Current`: image storage semantics differ across surfaces. Product images are normalized to direct URLs in `convex/products.ts`, while navbar and hero content persist storage IDs and resolve URLs later in `convex/siteContent.ts`.
- `Policy-locked`: uploads and store-scoped writes should fail closed when auth or tenant context is missing; current unauthenticated upload URL generation is a documented gap.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T-PLACEHOLDER | `[ ]` | TASK-LIST.md not updated in this pass. Sync image/variant follow-ups to real T-numbers before execution. |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** -

**Outcome:** Not recorded in repo-backed context yet.

## Open Questions

- No additional open questions in repo-backed source. Known gaps are documented above: hidden variants and price modifiers are not fully merchant-ready.

---

## Notes

- Main implementation references: `components/features/shared/image-cropper.tsx`, `components/features/shared/inline-variant-editor.tsx`, `components/pages/editor/components/product-form.tsx`, `convex/products.ts`.
- Be careful not to describe variant visibility or price-adjusted variant pricing as fully live.

---

## Archive

None.
