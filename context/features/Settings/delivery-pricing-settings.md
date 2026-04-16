# Feature: Delivery Pricing Settings

> **Status:** `in-progress`
> **Phase:** v1
> **Last updated:** 2026-04-16

---

## Summary

Delivery Pricing Settings is the editor tab for store-specific delivery fees by wilaya. It is mounted from `components/pages/editor/components/settings-dialog.tsx` and implemented in `components/pages/editor/settings/delivery-pricing-settings.tsx`, backed by `api.siteContent.getDeliveryPricing` and `api.siteContent.setDeliveryPricing`. Current: owners can blur-save home and office prices per row. Partial: the UI hardcodes a short wilaya list, falls back to `600`/`400` DZD when no saved row exists, and storefront/runtime lookups do not appear fully aligned on one canonical pricing format or access path.

---

## Users

- Store owners setting shipping prices for different wilayas.
- Public storefront checkout surfaces that read the saved pricing to estimate delivery.

---

## User Stories

- As a store owner, I want to set home and office delivery pricing by wilaya so that customers see region-based shipping costs.
- As a shopper, I want checkout pricing to reflect the store's configured delivery table so that totals stay predictable.

---

## Behaviour

### Happy Path

1. The owner opens the Delivery Pricing tab from `components/pages/editor/components/settings-dialog.tsx`.
2. The tab queries `api.siteContent.getDeliveryPricing` for the current store.
3. For each hardcoded wilaya row in `components/pages/editor/settings/delivery-pricing-settings.tsx`, the UI shows the saved price if found, otherwise defaults to `600` DZD for home delivery and `400` DZD for office delivery.
4. When the owner leaves an input, the tab calls `api.siteContent.setDeliveryPricing` for that specific field and row.
5. A brief Saved state appears after a successful blur-triggered write.

### Edge Cases & Rules

- `Current`: save happens on input blur, not through a bulk Save button.
- `Current`: only the hardcoded `WILAYAS` array is rendered, including inconsistent naming such as `Bechar` and `Bchar`, and a list that does not cover all Algerian wilayas.
- `Current`: `parseInt(... ) || 0` means blank or invalid input is written as `0`, not as an unset value.
- `Partial`: public storefront code and docs show pricing lookups by Arabic wilaya name, wilaya number, and local fallbacks, so the end-to-end lookup contract is not clearly canonical yet.
- `Partial`: there are duplicated delivery-pricing APIs in both `convex/siteContent.ts` and `convex/stores.ts`; the mounted settings tab uses the `siteContent` path today.

---

## Connections

- **Depends on:** `components/pages/editor/settings/delivery-pricing-settings.tsx`, `convex/siteContent.ts`, `convex/stores.ts`.
- **Triggers:** delivery price estimates used in public checkout and PDP/cart flows.
- **Shares data with:** `components/features/cart/cart-sidebar.tsx`, `app/[slug]/product/[productId]/page.tsx`, and public store queries documented in `context/features/Public/checkout-and-order-submission.md`.

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Editing model | `Current`: row-by-row blur autosave | `Planned`: clearer batch editing or explicit save semantics if needed |
| Defaults | `Current`: local UI fallback of `600` home / `400` office | `Planned`: one server-owned canonical fallback strategy |
| Wilaya source | `Partial`: hardcoded, incomplete list in UI | `Planned`: canonical shared source matching storefront lookups |
| Data contract | `Partial`: duplicated APIs and mixed lookup formats | `Planned`: one canonical pricing path and lookup format across editor and storefront |

---

---

## Security Considerations

- `Current`: writes are owner-scoped in `convex/siteContent.ts:setDeliveryPricing`.
- `Current`: delivery pricing reads are public metadata and should not be documented as protected merchant-only data.
- `Current`: this feature does not expose secrets, but wrong public contracts can still create pricing drift between admin and storefront surfaces.
- `Policy-locked`: protected write paths must continue to resolve the target store on the server and verify ownership; public pricing reads must stay limited to non-secret metadata only.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T14 | `[ ]` | Make the delivery pricing editor and storefront use one canonical format and access path so saved wilaya prices match shopper-visible totals. |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** -

**Outcome:** Not recorded in repo-backed context yet.

## Open Questions

- Which wilaya identifier should be canonical across admin and storefront runtime: English name, Arabic name, numeric code, or a normalized shared key? The repo currently mixes formats.

---

## Notes

- Main implementation references: `components/pages/editor/settings/delivery-pricing-settings.tsx`, `convex/siteContent.ts`, `convex/stores.ts`, `components/features/cart/cart-sidebar.tsx`, `app/[slug]/product/[productId]/page.tsx`.
- This doc calls out pricing drift risk because shopper-facing surfaces currently apply their own lookup/fallback logic.

---

## Archive

None.
