# Marlon Documentation

Multi-tenant COD e-commerce SaaS for Algerian entrepreneurs. Built with Next.js + Convex + Clerk + Chargily Pay.

Each domain has its own **PRD.md** (specs) and **tasks.md** (progress tracking).

## Domain Docs

| Domain | Scope | Links |
|--------|-------|-------|
| **[Editor](./Editor/)** | Products, site content, variants, images, delivery pricing & API | [PRD](./Editor/PRD.md) · [Tasks](./Editor/tasks.md) |
| **[Orders](./Orders/)** | Order list, status machine, detail panel, call log, audit trail | [PRD](./Orders/PRD.md) · [Tasks](./Orders/tasks.md) |
| **[Public](./Public/)** | Public storefront, product detail, cart, checkout, confirmation | [PRD](./Public/PRD.md) · [Tasks](./Public/tasks.md) |
| **[Billing](./Billing/)** | Billing state machine, locked state, Chargily integration | [PRD](./Billing/PRD.md) · [Tasks](./Billing/tasks.md) |
| **[Global](./Global/)** | Auth, landing page, dashboard, store admin layout, integrations, NFRs | [PRD](./Global/PRD.md) · [Tasks](./Global/tasks.md) |

## How to Use

- **Working on a feature?** → Open that domain's PRD for specs, tasks for progress
- **Need the full picture?** → Root `PRD.md` and `tasks.md` have short overviews linking here
- **Adding a new domain?** → Create a new folder with PRD.md + tasks.md, add a row above
