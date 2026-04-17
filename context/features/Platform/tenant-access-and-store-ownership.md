# Feature: Tenant Access and Store Ownership

> **Status:** `in-progress`
> **Phase:** v1
> **Last updated:** 2026-04-16

---

## Summary

Tenant access is mostly owner-only today, with many live checks comparing Clerk identity directly to `stores.ownerId` in `convex/stores.ts` and `convex/siteContent.ts`. `Current`: this owner-based model is the real runtime. `Partial`: enforcement is fragmented, some important reads and writes are too broad, and there is no centralized policy layer.

---

## Users

- Store owners accessing store-scoped dashboard, editor, content, delivery, and order data.
- Server-side merchant flows that need to verify the caller owns the target store.

---

## User Stories

- As a store owner, I want only my own stores and store data to be visible to me so that merchant data stays isolated.
- As the platform, I want every store-scoped write to verify ownership on the server so that UI routing or client parameters cannot bypass tenant boundaries.

---

## Behaviour

### Happy Path

1. A merchant route resolves a store by slug or ID, for example through `convex/stores.ts:getStoreBySlug` or `convex/stores.ts:getStore`.
2. Protected write paths call owner helpers such as `assertStoreOwnership` in `convex/stores.ts` or `assertStoreOwner` in `convex/siteContent.ts` before patching data.
3. The operation proceeds only when the current Clerk identity subject matches `stores.ownerId` for the target store.

### Edge Cases & Rules

- `Current`: the live access model is owner-only. Do not document `owner | admin | staff` as if it is enforced today.
- `Partial`: `convex/stores.ts:getUserStores` and `convex/stores.ts:subscribeToUserStores` trust caller-supplied `userId` in some paths, which weakens tenant isolation.
- `Partial`: several store-scoped content mutations in `convex/siteContent.ts`, including `updateSiteContent`, `generateUploadUrl`, `setNavbarStyles`, `deleteNavbarLogo`, `setNavbarLogo`, and `setHeroStyles`, do not perform owner checks.
- `Partial`: `convex/siteContent.ts:getDeliveryCredentialsForOwnerRuntime` does verify ownership, but it is still a client-callable Convex query that returns decrypted credentials.
- `Current`: public storefront reads such as `getStoreBySlug` and `getSiteContentResolved` are intentionally open for catalog rendering, but that does not justify broad merchant reads or writes elsewhere.

---

## Connections

- **Depends on:** `convex/stores.ts`, `convex/siteContent.ts`, `app/editor/[storeSlug]/page.tsx`, `app/orders/[storeSlug]/page.tsx`, `app/api/delivery/create-order/route.ts`.
- **Triggers:** owner-gated store updates, delivery configuration writes, content edits, upload URL generation, and store list subscriptions.
- **Shares data with:** `stores.ownerId`, `siteContent`, `deliveryCredentials`, `deliveryPricing`, and owner-scoped order/product operations.

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Access model | `Current`: owner-only checks tied to `stores.ownerId` | `Planned`: broader role-aware policy only when it is truly implemented |
| Enforcement shape | `Partial`: many functions enforce ownership, but not all store-scoped paths do | `Planned`: centralized, consistent server-side enforcement |
| Store list reads | `Partial`: some queries trust caller-supplied `userId` | `Current` target for hardening: derive owner identity on the server |
| Secret access | `Partial`: owner-gated credential read exists, but decrypted values are still returned by a client-callable query | `Policy-locked`: decrypted credentials should stay on server-only paths |

---

---

## Security Considerations

- `Current`: store boundary is the real tenant boundary, and most protected paths enforce it by checking `stores.ownerId` against Clerk identity.
- `Partial`: store-list queries that trust a client-supplied `userId` violate the expected server-derived tenant boundary.
- `Partial`: unauthenticated or under-checked store-scoped mutations in `convex/siteContent.ts` are must-fix issues because they can widen cross-store access.
- `Partial`: returning decrypted delivery credentials from a client-callable query conflicts with the live security baseline in `context/developer/SECURITY.md`.
- `Policy-locked`: UI visibility, slug knowledge, and client parameters are never authorization proof.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T19 | `[ ]` | Stop trusting caller-supplied `userId` in store-list queries and subscriptions, and derive the owner identity on the server. |
| T20 | `[ ]` | Lock down store-scoped `siteContent` mutations and upload URL generation with owner checks. |
| T21 | `[ ]` | Move decrypted delivery credential access to a server-only or internal path instead of a client-callable query. |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** -

**Outcome:** Not recorded in repo-backed context yet.

## Open Questions

- No additional repo-backed open questions. The access model is known; the unresolved work is hardening fragmented enforcement.

---

## Notes

- Main implementation references: `convex/stores.ts`, `convex/siteContent.ts`, `contexts/realtime-context.tsx`, `app/editor/[storeSlug]/page.tsx`, `app/orders/[storeSlug]/page.tsx`, `app/api/delivery/create-order/route.ts`.
- `stores.ownerId` is the real source of tenant ownership today. Convex `users` rows are not the deciding access layer for store operations.

---

## Archive

None.
