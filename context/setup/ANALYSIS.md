# Code Analysis

> Exploration report for the current `resume`-mode project.
> Verified against the repo on 2026-04-15.

## Analysis Summary

**Analysis Date:** 2026-04-15
**Confidence Score:** 9/10
**Analyst:** OpenCode + repo inspection

---

## Tech Stack Detected

### Frontend
- Framework: Next.js 16 App Router with React 19
- Styling: Tailwind CSS 4 + project design tokens
- Component library: shadcn/Radix-style primitives plus custom components

### Backend
- Runtime: Next.js route handlers + Convex functions
- API style: App Router API routes with Convex queries/mutations behind the app
- Server: Next.js server runtime

### Database
- Database: Convex
- ORM: none detected
- Hosting: Convex deployment model referenced by env and code

### Auth
- Provider: Clerk
- Strategy: Clerk session auth in the app plus Convex auth integration

### Third-Party Services
- Chargily Pay: payment creation + webhook route
- SofizPay: payment service abstraction present
- ZR Express: delivery adapter implemented
- Yalidine: delivery adapter implemented
- Vercel Analytics / Speed Insights: enabled in app layout

---

## Project Structure

```text
.
|- app/
|  |- [slug]/
|  |- editor/[storeSlug]/
|  |- orders/[storeSlug]/
|  `- api/
|     |- chargily/
|     |- delivery/
|     |- orders/
|     `- webhooks/
|- components/
|  |- features/
|  |- pages/
|  |- primitives/
|  `- ui/
|- context/
|  |- design/
|  |- developer/
|  |- features/
|  |- ops/
|  |- project/
|  |- setup/
|  `- technical/
|- convex/
|- contexts/
|- hooks/
|- lib/
|- public/
`- tests/
   |- helpers/
   |- integration/
   `- unit/
```

---

## Features Detected

### Public storefront
- **Location**: `app/[slug]/page.tsx`, `app/[slug]/product/[productId]/page.tsx`
- **Status**: partial
- **Description**: Public store page and product detail page for browsing and ordering.
- **Dependencies**: Next.js routes, Convex product/store data, storefront theme/content.
- **Issues**: Lint currently fails in the product page due to invalid hook usage.

### Store editor
- **Location**: `app/editor/[storeSlug]/page.tsx`, `components/pages/editor/`
- **Status**: partial
- **Description**: Merchant editor for store content, products, settings, and delivery configuration.
- **Dependencies**: Clerk auth, Convex store/product/site content mutations, delivery credential support.
- **Issues**: Active UI work is in progress in several editor files.

### Orders management
- **Location**: `app/orders/[storeSlug]/page.tsx`, `components/pages/orders/`
- **Status**: partial
- **Description**: Merchant order list, detail view, dispatch actions, filters, and export flows.
- **Dependencies**: Convex orders data, delivery API route, analytics updates.
- **Issues**: Tests reveal a regression in `orders.updateOrderStatus` timeline event insertion.

### Delivery integration foundations
- **Location**: `app/api/delivery/create-order/route.ts`, `lib/delivery/`, `convex/deliveryAnalytics.ts`
- **Status**: partial
- **Description**: Store-scoped credential loading, synchronous dispatch route, provider adapters, analytics, rollout utilities.
- **Dependencies**: Convex credentials tables, delivery adapters, Clerk auth, environment secrets.
- **Issues**: Only ZR Express and Yalidine adapters are implemented; idempotency/queueing remain planned.

### Billing and unlock flow
- **Location**: `app/api/chargily/`, `lib/payment-service.ts`, `convex/stores.ts`
- **Status**: partial
- **Description**: Payment provider abstraction and Chargily webhook route for store activation/unlock.
- **Dependencies**: Payment env vars, Convex store subscription updates.
- **Issues**: Webhook hardening is incomplete; current route does not provide full signature/replay protection.

---

## Code Quality Assessment

- **Buildable**: unknown (production build not run during this verification)
- **Has errors**: yes
- **Missing pieces**:
  - `app/api/orders/create/route.ts` is still a mock route
  - delivery queueing, retry scheduling, DLQ handling, and idempotency are planned but not live
  - payment webhook trust hardening is incomplete
  - route protection and role/governance docs are ahead of the current codebase
- **TODO/FIXME count**: 10 matches repo-wide (`grep`), including templates and sample hooks

### Validation snapshot
- `npm run lint`: fails with 9 errors and 39 warnings
- `npm test`: 16 passing, 1 failing integration test (`orders.updateOrderStatus` timeline event path)

---

## Documentation Found

- `context/project/`: overview, scope, roadmap, decisions, and task tracking
- `context/technical/`: architecture, API contracts, data models, environment, delivery foundations
- `context/features/`: product feature specs and rollout plans
- `context/design/`: design tokens, component inventory, UX patterns
- `context/developer/`: conventions, onboarding, testing, workflow, security
- `context/ops/`: CI/CD, infrastructure, monitoring
- `PRD.md`: product requirements input

---

## Open Questions

- Which business policy is canonical today for locking/unlock: the older trial/50-order runtime model or the newer `5/day` masked-overflow planning docs?
- Should `andrson` and `noest` remain visible in UI/docs before adapters exist?
- Is Clerk optional in local development by design, or only a temporary fallback?
- Should webhook hardening be documented as planned only until verification and replay protection are implemented?

---

## Verification Status

| Item | Status | Verified By |
|------|--------|-------------|
| Tech stack | verified | OpenCode repo inspection |
| Features | verified | OpenCode route/component scan |
| Code status | verified | `npm run lint` + `npm test` |
| Problems | verified | OpenCode repo inspection |

---

## Notes

- This repo is clearly in `resume` mode: source code, tests, and populated context docs all exist.
- `context/` is the main project memory layer because `README.md` is effectively empty.
- The biggest context risk is not missing docs; it is authoritative docs overstating what the current code actually implements.
