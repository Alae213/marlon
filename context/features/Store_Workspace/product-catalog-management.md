# Feature: Product Catalog Management

> **Status:** `in-progress`
> **Phase:** v1
> **Last updated:** 2026-04-16

---

## Summary

The product catalog editor lets a store owner create, edit, list, and archive products from the main editor surface. The live flow is centered in `components/pages/editor/components/products-content.tsx`, backed by `convex/products.ts`, with storefront reads from `app/[slug]/page.tsx` and `app/[slug]/product/[productId]/page.tsx`.

---

## Users

- Store owners managing products inside `/editor/[storeSlug]`.
- Storefront shoppers consuming the resulting product list and product detail pages.

---

## User Stories

- As a store owner, I want to add and edit products so that my storefront catalog stays current.
- As a store owner, I want to archive products without deleting historical data so that old items stop showing in the storefront.

---

## Behaviour

### Happy Path

1. The editor page in `app/editor/[storeSlug]/page.tsx` resolves a store and mounts `ProductsContent`.
2. `ProductsContent` loads active products with `api.products.getProducts` and renders cards plus add/edit dialogs.
3. Submitting `ProductForm` calls `api.products.createProduct` or `api.products.updateProduct` from `components/pages/editor/components/products-content.tsx`.
4. Convex writes product fields such as name, description, price, images, variants, archive state, and sort order in `convex/products.ts`.
5. The public storefront reads active products from `api.products.getProducts`, showing them in `app/[slug]/page.tsx` and product detail routes.

### Edge Cases & Rules

- `Current`: archive is soft-delete only. `archiveProduct` sets `isArchived: true` in `convex/products.ts`.
- `Partial`: the backend supports `unarchiveProduct`, but the current editor UI only loads active products and does not expose archived-product recovery.
- `Current`: catalog listing hides archived products because `getProducts` only returns active or legacy-unset rows.
- `Current`: add/edit form requires only name and base price in `components/pages/editor/components/product-form.tsx`.
- `Current`: product sort order is assigned on create in `convex/products.ts`, but this editor surface does not expose merchant-facing drag reorder controls.

---

## Connections

- **Depends on:** store resolution in `app/editor/[storeSlug]/page.tsx`, image upload helper in `components/pages/editor/hooks/use-image-upload.ts`.
- **Triggers:** storefront catalog and product detail rendering in `app/[slug]/page.tsx` and `app/[slug]/product/[productId]/page.tsx`.
- **Shares data with:** variants, product images, cart/order creation.

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| CRUD | `Current`: create and update are live | `Planned`: richer validation, categories, and stronger workflows |
| Archive | `Current`: soft-delete hides items from storefront | `Planned`: clearer archived-state management and recovery UX |
| Restore from UI | `Partial`: backend mutation exists, editor recovery UI does not | `Planned`: merchant-visible archived catalog management |
| Catalog controls | `Partial`: basic product cards and modal editing | `Planned`: deeper organization and merchandising controls |

---

---

## Security Considerations

- `Current`: create, update, archive, and unarchive mutations in `convex/products.ts` verify store ownership through owner-scoped checks.
- `Current`: storefront reads are public by store slug and should not be treated as protected merchant data.
- `Current`: image handling passes through `api.siteContent.generateUploadUrl`, which currently has no owner check in `convex/siteContent.ts`.
- `Policy-locked`: server-side store isolation is required for all store-scoped writes; current owner-only enforcement is the live model.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T-PLACEHOLDER | `[ ]` | TASK-LIST.md not updated in this pass. Sync catalog follow-ups to real T-numbers before execution. |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** -

**Outcome:** Not recorded in repo-backed context yet.

## Open Questions

- No additional open questions in repo-backed source. The main known gap is missing archived-product restore UI despite backend support.

---

## Notes

- Main implementation references: `components/pages/editor/components/products-content.tsx`, `components/pages/editor/components/product-form.tsx`, `convex/products.ts`.
- Storefront reads active products only, so archived items disappear from both catalog and PDP routes unless fetched through a different path.

---

## Archive

None.
