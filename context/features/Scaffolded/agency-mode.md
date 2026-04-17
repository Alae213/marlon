# Feature: Agency Mode

> **Status:** `implemented`
> **Phase:** v1.1
> **Last updated:** 2026-04-16

---

## Summary

T33 delivers the agency-ready access foundations from canonical product docs:

- **Direct store ownership:** agencies can create and own unlimited stores (already working post-T32)
- **Invited client-store access:** basic invite flow with accept/revoke
- **Role hierarchy:** owner → admin → staff with appropriate permissions
- **Admin unlock:** any admin can pay to unlock a store (per canonical policy)

**No longer blocking:** The placeholder "Agency Mode" coming-soon flow has been removed.

---

## Users

- Current: signed-in store owners who already have one store and try to create another from the dashboard.
- Planned: agencies or resellers managing multiple stores, once a real multi-store policy and workspace exist.

---

## User Stories

- As a merchant with one store, I need the dashboard to tell me clearly that multi-store access is not live yet.
- As a maintainer, I need one canonical policy for store limits so product docs and runtime do not disagree.

---

## Behaviour

### Happy Path (Implemented)

1. A signed-in user can create unlimited stores directly.
2. Store creation auto-bootsstraps owner membership.
3. Store owner can invite users with admin/staff roles.
4. Invited users can accept and become active members.
5. Admins can initiate store unlock payments.
6. Owner can transfer ownership to another active member (with confirmation).
7. Owner can revoke staff/admin access.

### Access Level Mapping

| Role | Create Stores | Invite Users | Pay to Unlock | Transfer Ownership | Revoke Access |
|------|-------------|-------------|-------------|---------------|------------------|---------------|
| Owner | Yes | Yes | Yes | Yes | Yes |
| Admin | - | Yes | Yes | - | Yes (staff only) |
| Staff | - | - | - | - | - |

### Edge Cases & Rules
- Invitations expire after 7 days.
- Cannot revoke owner access.
- Ownership transfer requires the new owner to be an active member.

---

## Connections

Agency messaging is anchored in the dashboard and enforced in Convex, while project-level docs still describe a broader tenancy model.

- **Depends on:** `app/page.tsx`, `convex/stores.ts`
- **Triggers:** the second-store attempt path from the signed-in dashboard
- **Shares data with:** `context/features/Store_Workspace/store-dashboard-and-creation.md`, `context/project/OVERVIEW.md`, `context/project/SCOPE.md`

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Store count policy | ✅ Implemented - unlimited stores | Runtime fully supports the canonical store policy |
| Agency entrypoint | ✅ Implemented - invite flow, roles, admin unlock | Already delivered in T33 |
| Product documentation | ✅ Aligned - runtime matches docs | Runtime and feature docs aligned |

---

---

## Security Considerations

- ✅ Owner role is protected - cannot be revoked
- ✅ Invitations expire after 7 days
- ✅ Ownership transfer requires new owner to be active member
- ✅ Admin unlock permission aligns with canonical "any admin can pay to unlock"
- ✅ Role hierarchy enforced via `assertStoreRole`

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T26 | `[x]` | Implement the canonical agency/store policy from `OVERVIEW.md` and `SCOPE.md` so runtime no longer blocks multi-store use behind a coming-soon placeholder. |
| T33 | `[x]` | Ship the agency-ready access foundations described in canonical product docs: direct store ownership, invited client-store access, and removal of the current placeholder modal path. |

---

---

## User Acceptance Tests

**UAT Status:** `passed`

**Last tested:** 2026-04-16

**Outcome:** Convex deployment successful. Membership queries/mutations deployed. Admin unlock permission changed from owner to admin. Store creation auto-bootstraps owner membership.

## Open Questions

- None. The canonical source is already explicit in `context/project/OVERVIEW.md` and `context/project/SCOPE.md`; the remaining work is implementation.

---

## Notes

- Main implementation references: `app/page.tsx`, `convex/stores.ts`.
- This doc records runtime lag against canonical product truth instead of treating policy choice as unresolved.
- T34 sequencing note: multi-store rollout depends on backfilling owner memberships first, then enabling membership-aware auth, then removing the one-store cap in T39.

---

## Archive

None.
