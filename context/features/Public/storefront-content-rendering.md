# Feature: Storefront Content Rendering

> **Status:** `in-progress`
> **Phase:** v1
> **Last updated:** 2026-04-16

---

## Summary

Storefront content rendering is the client-side assembly of public navbar, hero, footer, and supporting store data on the public routes. Current: `app/[slug]/page.tsx` and `app/[slug]/product/[productId]/page.tsx` resolve a store by slug, then fetch content snapshots with `convex.query(api.siteContent.getSiteContentResolved, ...)` inside `useEffect`. Partial: the runtime is snapshot-style, not SSR/ISR, and some rendered affordances are placeholders or legacy leftovers.

---

## Users

- Anonymous shoppers consuming storefront branding and page chrome while browsing.
- Store owners indirectly depending on site-content changes to appear correctly on their public storefront.

---

## User Stories

- As an anonymous shopper, I want the storefront's logo, hero, and footer content to render consistently so that the store feels trustworthy and navigable.
- As a store owner, I want public content changes to appear on my storefront without exposing more backend data than necessary.

---

## Behaviour

### Happy Path

1. The public route resolves the store with `api.stores.getStoreBySlug` and waits for `store._id`.
2. The route then uses `convex.query(...)` inside `useEffect` to fetch section records such as `navbar`, `hero`, and `footer` from `api.siteContent.getSiteContentResolved`.
3. `convex/siteContent.ts` resolves asset URLs for supported sections, and the route casts the returned `content` payload into local TS shapes before rendering.

### Edge Cases & Rules
- Current: the public storefront uses client-side snapshot fetching, not SSR, ISR, or a live public subscription model.
- Current: `getSiteContentResolved` resolves navbar logos and hero background images, but footer content is rendered by the page with a narrower legacy shape than the stored data model supports.
- Partial: the catalog route renders a hero CTA button from content, but no click destination is wired.
- Partial: the catalog route and PDP still render placeholder navigation labels instead of a real store-managed navigation system.
- Partial: content objects are cast from `unknown` into local interfaces in the page components, so runtime shape safety is weaker than a dedicated typed public contract.
- Current: if a content section is missing, the page simply omits that section rather than failing the whole storefront render.

---

## Connections

This feature supplies the public content layer used by catalog and PDP pages.

- **Depends on:** `app/[slug]/page.tsx`, `app/[slug]/product/[productId]/page.tsx`, `convex/siteContent.ts`, `convex/stores.ts`
- **Triggers:** `public-storefront-catalog.md`, `public-product-detail.md`
- **Shares data with:** editor-managed `siteContent` records and public delivery-pricing reads in `convex/stores.ts`

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Rendering model | Current: client-side snapshot fetch after route mount | Intentional public rendering strategy with stronger caching/refresh guarantees |
| Content contract | Partial: generic section records are cast into local page types | Minimal, typed public DTOs per section |
| Navigation content | Partial: placeholder labels and dead CTA affordances remain | Fully wired public navigation and CTA destinations |
| Footer support | Partial: only a subset of footer fields is rendered | Footer rendering stays aligned with stored content schema |

---

---

## Security Considerations

- Partial: `getStoreBySlug` and `getSiteContentResolved` are broad unauthenticated reads. They work for public browsing, but they are not yet narrowed to explicit least-privilege public payloads.
- Current: resolved asset URLs come from server-side storage URL generation in `convex/siteContent.ts`; do not document this as a hardened signed-asset policy beyond what the repo actually shows.
- Partial: page components trust casted content shapes from public queries, so runtime hardening depends on keeping public payloads narrow rather than assuming strong client-side shape validation.
- Policy-locked: keep write authorization descriptions owner-only where that is the live server model. Public content rendering does not imply public write access.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T11 | `[ ]` | Add explicit minimal public queries for storefront slug, content, pricing, and products instead of returning broad raw records |
| T12 | `[ ]` | Replace placeholder public navbar, footer, and hero CTA affordances with real links/actions or remove them from runtime |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** Not recorded in repo

**Outcome:** Content rendering is visibly implemented in code, but this doc refresh did not add a browser test record.

## Open Questions

- None currently. The remaining issues are known implementation gaps rather than open product questions.

---

## Notes

- `app/[slug]/page.tsx` additionally strips HTML tags from hero text before rendering, while the PDP navbar path mostly relies on React escaping and local typing.
- Public delivery pricing is fetched separately from site content, so storefront rendering currently spans multiple raw public queries instead of one dedicated public contract layer.

---

## Archive

<!-- No archived notes yet. -->
