# Project Scope

## In Scope — v1 (MVP)

### Product and tenancy model
- Multi-tenant SaaS with **unlimited stores per account**.
- Store dashboard and editor flow for creating and operating multiple stores.
- Store-level admin roles; **any store admin can pay** to unlock that store.
- Solo-first go-to-market for launch; agency/reseller workflows included for v1 foundations.

### Commercial model and lock behavior (locked)
- Per-store usage cap: **5 orders/day**.
- Cap reset at fixed time: **00:00 Africa/Algiers**.
- Overflow orders are accepted after cap, but merchant-side overflow order data is **masked/frozen** until unlock.
- Unlock model: **2000 DZD / store / month** subscription.
- Overflow records auto-delete after **5 days** if store remains locked.
- No customer-facing notification that a store is locked.
- Payment flow + webhook processing to activate/unlock store access.

### Agency scope (sequenced)
- Launch priority: solo merchants first.
- Agency/reseller is second in sequencing, but both operation modes are supported:
  - Agencies create and own stores directly.
  - Agencies are invited to client-owned stores and operate with granted permissions.

### Core product features
- Store editor: products, variants, images, content sections, and delivery pricing setup.
- Orders operations: list/table workflow, status transitions, call logging, notes, and audit trail.
- Public storefront: catalog, product detail, cart, checkout, and order confirmation.

### Technical foundations
- Clerk authentication.
- Convex backend with tenant-safe data access patterns.
- Local delivery integrations (ZR Express, Yalidine).
- Configurable Algerian payment provider abstraction for subscription unlocks.

### Governance rule (locked)
- **Reliability and security first:** when scope or prioritization conflicts occur, reliability/security decisions win.

## Out of Scope — v1 (Deferred)

- Store themes/template marketplace and advanced visual customization.
- Custom domains.
- Super-admin control plane and merchant moderation workflows.
- Advanced analytics/reporting dashboards.
- Native mobile apps.
- Live delivery tracking maps.
- Storefront online card payments for customer checkout (customer flow remains COD-first).
- Inventory management and stock alerting.
- Customer accounts and customer order history portals.
- Marketing suite (discount engine, email campaigns, referrals).
- Public merchant API.
- White-label branding/reseller billing consolidation.
- Auto-renewal billing.

## Never In Scope

- International shipping.
- Multi-currency beyond DZD.
- Non-Algerian payment gateway strategy.
- POS integration.

## Open Questions

- None at this time.
