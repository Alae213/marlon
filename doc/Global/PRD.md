# Global PRD

> Domain owner for: Auth, Landing Page, Dashboard, Store Admin Layout, Integrations, NFRs
> Routes: `/` (landing), `/` (dashboard when authenticated), `/editor/[storeSlug]` and `/orders/[storeSlug]` (admin layout)

---

## Summary

Cross-cutting platform concerns: authentication via Clerk, the landing page, the home dashboard with store management, the persistent store admin layout, delivery API integrations, and non-functional requirements.

---

## Authentication (PRD §3)

- Provider: Clerk — Google OAuth only (no email/password)
- Flow: Landing → "Sign in with Google" popup → redirect to dashboard
- User data stored: `clerkId`, `email`, `name`, `profileImageUrl`, `createdAt`
- Authorization: middleware enforces `userId` ownership; users cannot access other users' stores (403)
- JWT session tokens, auto-refresh
- Webhook syncs user data to Convex on creation

## Landing Page (PRD §1)

- White background, centered minimal layout
- Single large light-grey card labeled "new store" with circular plus icon (top-left)
- Small logo centered at top
- Clicking "new store" triggers Google sign-in if not authenticated, then redirects to dashboard

## Home Dashboard (PRD §2)

### Layout
- White background, centered
- Logo + profile avatar (top)
- "New store" card always first in grid
- Store cards grid: name, thumbnail, subscription badge (Free / Active / Locked)
- Click store card → enter store admin

### Create Store Flow
1. Click "new store" card
2. Dialog: Store Name (required) + Store Slug (auto-generated, editable, lowercase alphanumeric + hyphens, unique globally)
3. Click "Create"
4. System creates store, empty product catalog, default site content
5. Redirect to editor

### Edge Cases
- Slug conflict: show error "This slug is taken. Try another." + 3 auto-suggestions
- 0 stores: show only the "new store" card

## Store Admin Layout (PRD §3)

### Persistent UI (after store creation)
- **Top sticky bar**: Left: Logo → on hover shows back arrow → click → dashboard. Right: Profile menu (settings, logout)
- **Bottom floating nav toggle**: Editor | Orders
- **"View Store" button**: persistent, always visible, opens public storefront in new tab (works even with 0 products)

## Integrations

### Clerk
- Google OAuth only
- JWT session tokens, auto-refresh
- Webhook syncs user data to Convex on creation

### Delivery APIs (ZR Express, Yalidine)
- Optional per store
- Used server-side only via Convex actions
- Credentials encrypted at rest
- Fallback: manual status change if not configured

## Non-Functional Requirements

- Page load: < 2s LCP
- API response: < 500ms p95
- Real-time updates: < 100ms (Convex subscriptions)
- Uptime: 99.9% (Vercel + Convex SLA)
- Images: lazy load, WebP, responsive
- Browser support: Chrome, Firefox, Safari, Edge (last 2 versions); iOS Safari, Chrome Mobile

---

## Tech Stack

- **Frontend**: Next.js (App Router)
- **Backend/DB**: Convex (real-time subscriptions, tenant isolation via `storeId`)
- **Auth**: Clerk (Google OAuth only)
- **Payments**: Chargily Pay
- **Hosting**: Vercel
- **Delivery APIs**: ZR Express, Yalidine (optional per store)

---

## Relevant Data Models

### User
```
clerkId, email, name, profileImageUrl, createdAt
```

### Store (global fields)
```
storeId, userId, name, slug, thumbnailUrl, createdAt
```

---

## KPIs

- Time to first store: < 10 min
- Time to first product: < 5 min
- Order confirmation rate: % of new → confirmed
- Order completion rate: % of confirmed → shipped
- Paid store rate: target 50% of stores hitting 50 orders/month
- MRR target Y1: 200K DZD/month
- MRR target Y2: 3,000 stores × 50% paid × 2,000 DZD = 3M DZD/month
