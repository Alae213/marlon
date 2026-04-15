# Onboarding

> Start here if you are new to the repo or returning after context drift.

## Read These First

1. `context/project/OVERVIEW.md` - what the product is and why it exists.
2. `context/project/SCOPE.md` - what is intentionally in and out of scope.
3. `context/project/TASK-LIST.md` - what is active right now.
4. `context/technical/ENVIRONMENT.md` - canonical env contract.
5. `context/developer/CONVENTIONS.md` - how to write code that fits the repo.
6. `context/developer/SECURITY.md` - required before auth, payments, delivery, or external API work.

## What This Repo Is Today

- Next.js App Router frontend rooted at `app/`.
- Shared UI and page composition under `components/`.
- Convex backend logic and schema under `convex/`.
- Bun-based test suite under `tests/`.
- Context docs under `context/` are part of the product memory, not optional extras.

## Prerequisites

### Required

- Node.js 20+.
- npm 10+ for dependency install and main scripts.
- Bun 1.x because `npm test` delegates to `bun test`.
- Git.
- Access to the required environment values for the environment you are working against.

### Useful but optional

- Convex dashboard access if you will work on backend data or deployments.
- Clerk dashboard access if you will work on auth or webhook setup.
- Vercel project access if you will manage deployed environment values.

## Environment Setup

### Canonical source of truth

- Use `context/technical/ENVIRONMENT.md` as the contract.
- Do not copy variables from stale docs, old screenshots, or memory.
- This repo does not currently provide a checked-in `.env.example`; create or update `.env.local` manually from the canonical contract.

### Baseline variables most local work needs

- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` if you need auth-enabled flows
- `CLERK_WEBHOOK_SECRET` if you are testing Clerk webhooks
- `PAYMENT_PROVIDER` plus the matching provider variables if you are testing payment flows
- `DELIVERY_CREDENTIALS_KEY` if you are working on encrypted delivery credentials in Convex

### Payment-provider specifics

- If `PAYMENT_PROVIDER=chargily`, you usually also need `CHARGILY_API_KEY` and `CHARGILY_WEBHOOK_URL`.
- If `PAYMENT_PROVIDER=sofizpay`, you usually also need `SOFIZPAY_API_KEY`, `SOFIZPAY_API_URL`, and `SOFIZPAY_WEBHOOK_URL`.
- `NEXT_PUBLIC_APP_URL` should match the URL the browser is using for return/callback flows.

## First Run

1. Install dependencies with npm.
2. Create or update `.env.local` using `context/technical/ENVIRONMENT.md`.
3. Start the frontend with `npm run dev` for normal UI work.
4. Start frontend plus Convex dev with `npm run dev:all` if you need a local Convex session as well.

### Script reality

- `npm run dev` runs the React Grab/OpenCode helper and then starts Next.js.
- `npm run dev:all` starts Convex dev in the background, then the same helper, then Next.js.
- `npm run lint` invokes ESLint directly.
- `npm test` runs Bun tests.
- There is no dedicated `typecheck` script at the moment.

## How to Validate Your Setup

- Open the app locally and confirm the home route renders.
- Visit a route that depends on live data, such as the editor or orders area, and confirm it does not fail immediately on missing config.
- If auth is configured for your environment, verify sign-in renders instead of silently falling back.
- Run lint and tests once before starting meaningful work so you know whether failures are pre-existing.

## Repo Map

```text
app/                 App Router pages, layouts, and API route handlers
components/pages/    screen-level views and route composition
components/features/ reusable business UI slices
components/primitives/ and components/ui/ shared UI building blocks
contexts/            React providers such as toast/cart/billing
convex/              schema, auth, queries, mutations, backend helpers
lib/                 domain helpers and adapters used by app/routes
hooks/               reusable hooks
tests/               unit and integration coverage, plus helpers
context/             project memory, specs, architecture, process docs
```

## Where To Look For Common Work

- Orders UI: `app/orders/` and `components/pages/orders/`
- Store/editor flows: `app/editor/` and `components/pages/editor/`
- Delivery integration UI: `components/features/delivery/`
- Delivery and order backend logic: `convex/orders.ts`, `convex/deliveryProvider.ts`, `lib/delivery-api.ts`, `app/api/delivery/`
- Auth and user sync: `app/api/webhooks/` and Convex auth files

## Common Troubleshooting

### The app starts but key flows fail immediately

- Most often this is env drift. Re-check `context/technical/ENVIRONMENT.md` and compare it to `.env.local`.

### Auth appears disabled locally

- The app intentionally skips Clerk wiring when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is missing or still a placeholder value.

### Delivery or payment behavior looks fake or mocked

- Some providers intentionally fall back to demo/mock behavior when required keys or URLs are missing. That is expected in partial local setups and is documented in `context/technical/ENVIRONMENT.md`.

### Tests fail even though app dependencies installed cleanly

- Make sure Bun is installed; the test runner is not Node's built-in test runner or Vitest CLI, even though Vitest is listed in dependencies.

### Convex reads or route handlers fail

- Confirm `NEXT_PUBLIC_CONVEX_URL` points to a valid deployment and that you started the right dev flow for the kind of backend work you are doing.

## Working Style Expectations

- Read context before changing behavior.
- Match existing architecture unless there is a clear reason to improve it.
- Prefer small, reviewable diffs.
- Update context docs when implementation or decisions change.
