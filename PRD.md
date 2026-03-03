# Marlon PRD

> **Full specs have been split into domain-specific docs.** See [`doc/README.md`](./doc/README.md) for the index.

## Overview

Marlon is a multi-tenant SaaS platform for Algerian entrepreneurs to create and manage COD-based online stores with zero technical knowledge. Pay-when-you-succeed: 50 free orders/month per store, then 2000 DZD/month.

## Tech Stack

Next.js (App Router) · Convex (real-time DB) · Clerk (Google OAuth) · Chargily Pay (DZD) · Vercel · Tailwind v4

## Domain Docs

| Domain | What it covers |
|--------|---------------|
| [Editor](./doc/Editor/PRD.md) | Products, site content, variants, images, delivery pricing & API |
| [Orders](./doc/Orders/PRD.md) | Order list, status machine, detail panel, call log, audit trail |
| [Public](./doc/Public/PRD.md) | Public storefront, product detail, cart, checkout, confirmation |
| [Billing](./doc/Billing/PRD.md) | Billing state machine, locked state, Chargily integration |
| [Global](./doc/Global/PRD.md) | Auth, landing page, dashboard, store admin layout, integrations, NFRs |

## URL Structure

```
marlon.com                          → Landing / Dashboard
marlon.com/editor/[storeSlug]       → Store Editor
marlon.com/orders/[storeSlug]       → Order Management
marlon.com/[storeSlug]              → Public Storefront
marlon.com/[storeSlug]/[productId]  → Product Detail
```

## Target Users

| Persona | Core Need |
|---------|-----------|
| Solo Merchant ("Fatima") | Simple store + COD order management |
| Influencer ("Yacine") | Fast setup, no transaction fees |
| Agency Owner ("Riad") | Multi-store dashboard, cheap per-store cost |

## Out of Scope (MVP)

Templates/themes, custom domains, Arabic/French UI, analytics, mobile app, online payments, inventory, customer accounts, marketing tools, public API, auto-renewal billing.