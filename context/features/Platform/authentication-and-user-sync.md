# Feature: Authentication and User Sync

> **Status:** `in-progress`
> **Phase:** v1
> **Last updated:** 2026-04-16

---

## Summary

Authentication is live through Clerk, with app wiring in `app/layout.tsx`, request-time protection in `proxy.ts`, and user-profile sync into Convex through `app/api/webhooks/clerk/route.ts`. `Current`: Clerk is the real auth provider. `Partial`: route protection is inconsistent, and merchant authorization still relies mainly on direct Clerk identity checks against `stores.ownerId` rather than Convex `users` rows.

---

## Users

- Store owners signing in to access the dashboard and merchant surfaces.
- Server-side webhook processing that keeps Convex `users` rows roughly aligned with Clerk accounts.

---

## User Stories

- As a store owner, I want to sign in once with Clerk so that I can access my stores and merchant tools.
- As the platform, I want Clerk user changes mirrored into Convex so that profile-linked features such as theme preference have a persisted user record.

---

## Behaviour

### Happy Path

1. `app/layout.tsx` mounts `ClerkProvider` when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is configured.
2. Signed-in and signed-out UI branches render through Clerk components such as `SignedIn`, `SignedOut`, `SignIn`, and `RedirectToSignIn` in `app/page.tsx` and `app/orders/[storeSlug]/page.tsx`.
3. Clerk sends user lifecycle webhooks to `app/api/webhooks/clerk/route.ts`, which verifies them with Svix and calls `api.users.syncUser` or `api.users.deleteUser`.
4. Convex mutations and actions that enforce tenant access usually compare `ctx.auth.getUserIdentity().subject` directly with `stores.ownerId`, for example in `convex/stores.ts` and `convex/siteContent.ts`.

### Edge Cases & Rules

- `Current`: Clerk is optional at boot; if the publishable key is missing or a placeholder, `app/layout.tsx` skips `ClerkProvider`, so Clerk-dependent UX is effectively disabled.
- `Partial`: `proxy.ts` only protects `/dashboard(.*)` and `/store(.*)`. The real merchant routes `app/editor/[storeSlug]/page.tsx` and `app/orders/[storeSlug]/page.tsx` are not covered by middleware.
- `Partial`: `app/orders/[storeSlug]/page.tsx` adds page-level Clerk guards, but `app/editor/[storeSlug]/page.tsx` does not.
- `Current`: Convex `users` rows in `convex/users.ts` store profile/theme data, but store access does not depend on those rows.
- `Planned`: any future central policy layer or role model should be documented separately once it is live; it is not the current runtime.

---

## Connections

- **Depends on:** `app/layout.tsx`, `proxy.ts`, `app/api/webhooks/clerk/route.ts`, `convex/users.ts`.
- **Triggers:** creation, update, and deletion of Convex `users` rows from Clerk webhook events.
- **Shares data with:** `stores.ownerId` in `convex/stores.ts`, Clerk user identity in Convex auth context, and user profile fields in the `users` table.

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Auth provider | `Current`: Clerk is wired and live | `Planned`: could stay on Clerk, but that is an implementation choice rather than an unresolved feature gap |
| Route protection | `Partial`: middleware and page guards are inconsistent across merchant routes | `Planned`: one clear protection path for all merchant routes |
| User sync | `Current`: Clerk webhook upserts/deletes Convex `users` rows | `Planned`: only expand if more runtime features truly depend on `users` data |
| Authorization source | `Current`: direct Clerk identity checks against `stores.ownerId` | `Planned`: any broader policy model must not be documented as live until implemented |

---

---

## Security Considerations

- `Current`: Clerk webhook verification happens server-side in `app/api/webhooks/clerk/route.ts` using `CLERK_WEBHOOK_SECRET` and `svix`.
- `Current`: store authorization is mainly enforced by comparing Clerk identity subject to `stores.ownerId`; this is the live access model today.
- `Partial`: middleware protection is incomplete because `proxy.ts` does not cover `/editor/*` or `/orders/*`.
- `Current`: UI-only signed-in states are not sufficient authorization; protected Convex writes still need server-side owner checks.
- `Policy-locked`: do not treat future `owner | admin | staff` policy ideas as live security posture until they exist in code.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T18 | `[ ]` | Protect the real merchant routes (`/editor/*`, `/orders/*`) with one reliable auth enforcement path instead of the current mixed middleware/page-guard setup. |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** -

**Outcome:** Not recorded in repo-backed context yet.

## Open Questions

- No additional repo-backed open questions. The main gaps here are implementation and enforcement gaps, not unresolved product behavior.

---

## Notes

- Main implementation references: `app/layout.tsx`, `proxy.ts`, `app/page.tsx`, `app/orders/[storeSlug]/page.tsx`, `app/editor/[storeSlug]/page.tsx`, `app/api/webhooks/clerk/route.ts`, `convex/users.ts`.
- `convex/users.ts` is a synced profile store, not the primary authorization source for merchant access today.

---

## Archive

None.
