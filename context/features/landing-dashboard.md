# Feature: Landing Page & Dashboard

> **Status:** `complete`
> **Phase:** v1
> **Last updated:** 2026-04-10

---

## Summary

The landing page serves as both the entry point and the main dashboard for merchants. It displays the user's store grid, allows creating new stores, and shows subscription status badges (Free/Active/Locked). Google OAuth sign-in is required before accessing the dashboard.

---

## Users

- **Primary**: Merchants (solo sellers, influencers, agency owners)
- **When**: On first visit (landing), on every return (dashboard)
- **Journey**: Landing → Sign in → Dashboard → Create/Manage stores

---

## User Stories

- As a merchant, I want to see all my stores in one place so I can quickly access any store I manage
- As a new merchant, I want to create a store quickly so I can start selling in minutes
- As a merchant, I want to see my subscription status so I know if I'm on free or paid tier
- As a returning merchant, I want to sign in with Google so I don't need to remember passwords

---

## Behaviour

### Happy Path

1. **Unauthenticated Visit**
   - User visits `/`
   - Sees white background with centered layout
   - Sees logo at top, "New Store" card below
   - Clicks "New Store" → Clerk OAuth popup opens
   - After auth, redirects to dashboard

2. **Dashboard View**
   - User sees logo + profile avatar (top right)
   - Grid of store cards (always with "New Store" card first)
   - Each store card shows: thumbnail, name, subscription badge

3. **Create Store Flow**
   - Click "New Store" card
   - Dialog appears: Store Name + Store Slug (auto-generated)
   - Slug is editable (lowercase, alphanumeric, hyphens)
   - Click "Create" → store created with empty product catalog
   - Redirects to `/editor/[storeSlug]`

### Edge Cases & Rules

- **Slug conflict**: Show error "This slug is taken. Try another." + 3 auto-suggestions
- **0 stores**: Show only the "New Store" card
- **Locked stores**: Badge shows "Locked" in red
- **Active stores**: Badge shows "Active" with expiry date in green

---

## Connections

- **Depends on**: Clerk authentication, Convex stores table
- **Triggers**: Store creation flow → Store Editor
- **Shares data with**: Subscription billing (status badge)

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Store limit | Unlimited | Unlimited |
| Store templates | None | Theme selection |
| Custom domains | Not supported | Supported |

---

## Security Considerations

- Auth required: Yes (Clerk Google OAuth)
- Input validation: Store name required, slug must be unique globally
- Rate limiting: None at this level
- None identified

---

## Tasks

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T1 | [x] | Landing page layout with Clerk auth |
| T2 | [x] | Store grid with cards |
| T3 | [x] | Create store modal with slug validation |
| T4 | [x] | Subscription badge display |

---

## UAT Status

**UAT Status:** `passed`

**Last tested:** 2026-04-10

**Outcome:** All features working - landing, auth flow, store creation, badge display

---

## Open Questions

- [ ] Any mobile responsiveness issues?
- [ ] Should "New Store" card position be configurable?

---

## Notes

- Implementation follows PRD exactly: white background, centered minimal layout, plus icon on "New Store" card
- Uses Clerk @clerk/nextjs for authentication
- Store subscription status synced from Convex billing system