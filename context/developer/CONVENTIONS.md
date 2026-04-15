# Developer Conventions

> This file defines how we write and reshape code in this repo. It is intentionally prescriptive. When code and docs disagree, the repo is truth; update the docs instead of pretending the target state already exists.

## 1) Priority Order

When trade-offs appear, use this order:

1. Tenant safety, auth correctness, and secret handling
2. Correctness of billing, order, and delivery behavior
3. Operational clarity and maintainability
4. Performance on hot paths
5. Developer convenience and local stylistic preference

Do not accept a cleaner abstraction if it weakens store isolation, hides a write inside a read path, or makes operational behavior harder to reason about.

## 2) Status Language

- `Current`: enforced or clearly present in the live repo.
- `Target`: the direction contributors should move toward without claiming the repo already enforces it everywhere.

Use `Target` language when describing patterns that are not yet uniform, especially around auth centralization, file size, and component boundaries.

## 3) Repo Boundaries and Directory Ownership

Each top-level area has a job. Keep logic in the layer that owns it.

```text
app/                 Route entrypoints, layouts, route handlers, global app wiring
components/pages/    Screen-level composition tied to route structure
components/features/ Reusable business features and feature-specific UI behavior
components/primitives/
components/ui/       Low-level shared UI building blocks
contexts/            Cross-cutting React providers only when state truly spans areas
convex/              Backend authority: queries, mutations, auth checks, data invariants
hooks/               Reusable client-side hooks
lib/                 Shared helpers, adapters, formatters, types, pure utilities
tests/               Unit/integration coverage and test helpers
convex/_generated/   Generated Convex types and API surfaces; never hand-edit
context/             Canonical project memory and operating docs
```

Rules:

- `app/` owns routing and request boundaries, not reusable business logic.
- `components/pages/` may know route context and compose multiple features, but should not become a dumping ground for generic primitives.
- `components/features/` owns reusable business interactions for one domain area.
- `components/primitives/` and `components/ui/` stay business-agnostic.
- `convex/` is the source of truth for tenant-scoped business rules and persistent invariants.
- `lib/` may contain pure helpers and integration adapters, but must not become a second backend.

If logic needs store ownership checks, write-time invariants, or trusted reads, it belongs in `convex/` or a server boundary that delegates to `convex/`.

## 4) Naming Defaults

These are the defaults for new code. Do not spread current naming drift further.

### Files and folders

- Route files follow Next.js conventions: `page.tsx`, `layout.tsx`, `route.ts`, `[slug]`.
- Exported React component files use `PascalCase.tsx`.
- Non-component modules use `kebab-case.ts`.
- Hook files use `kebab-case.ts` and export a `useSomething` symbol.
- Convex domain files use concise domain names such as `orders.ts`, `stores.ts`, `products.ts`.
- Test files mirror the subject and end in `.test.ts` or `.test.js`.

For new files, do not introduce `camelCase.ts` filenames.

### Language choice

- Prefer TypeScript for new app, component, hook, `lib/`, and `convex/` code.
- Keep JS only where it matches the surrounding suite or tooling, especially existing Bun test files.
- Do not rewrite stable JS tests to TS unless the task already requires touching that file for behavior reasons.

### Symbols

- Components: `PascalCase`
- Hooks: `useSomething`
- Functions and variables: `camelCase`
- Constants with fixed meaning: `UPPER_SNAKE_CASE`
- Booleans: `is`, `has`, `can`, `should`
- Event handlers: `handleSomething`

### `index.ts`

- Use `index.ts` only for a stable, intentional module surface.
- Do not add barrel files just to shorten imports inside one folder.
- Do not use barrel files to blur layer boundaries.

## 5) Next.js Route and Execution Boundaries

### Current

- The repo uses App Router from `app/`.
- Some admin pages are still client-heavy and carry more state than the target shape.

### Target

- Prefer server components in `app/` when the route does not need browser-only APIs or interactive state.
- Keep route entry files thin: resolve params, fetch, authorize, compose, render.
- Push reusable UI and complex client behavior out of route files and into components, hooks, or backend functions.

Rules:

- Add `"use client"` only when hooks, browser APIs, or client interactivity require it.
- Do not put secret access, trust decisions, or tenant authorization in client components.
- Route handlers under `app/api/` are boundary code: validate input, authenticate, authorize, orchestrate, translate errors.
- Route handlers should not quietly become the permanent home of business rules that belong in `convex/` or dedicated server helpers.
- If a route file grows beyond roughly 150-200 lines because it mixes orchestration, rendering, and local state, extract the next logical seam.

## 6) Component Design Rules

The repo already has large screen components. New work should reduce that pressure, not normalize it.

Rules:

- Keep page-level components focused on composition, view state, and route-aware wiring.
- Keep feature components focused on one business capability.
- Keep primitives focused on visual structure and interaction mechanics, not domain rules.
- Prefer explicit props over hidden context dependencies unless the state is genuinely cross-cutting.
- Prefer pure formatting helpers and small leaf components before introducing another provider.
- Local browser persistence is allowed only for non-sensitive UI preferences and must use namespaced keys such as `marlon-*`.
- Do not mix fetching, bulk actions, export logic, local persistence, and large render trees in one component if you can extract a coherent hook or child component.

File boundary guidance:

- If a component exceeds roughly 300 lines or spans multiple concerns, start splitting it.
- Extract in this order when possible: pure helpers, leaf components, hooks, then larger subviews.
- Large legacy files may remain temporarily, but touched areas should move toward smaller seams.

Current examples that should be treated as legacy pressure, not target shape:

- `app/orders/[storeSlug]/page.tsx`
- `components/pages/orders/views/ListView.tsx`

## 7) Convex Function Design Rules

Convex is the trusted backend for tenant-scoped behavior. Write code there as if it is the only line that matters, because for auth and invariants it is.

### Current

- Convex functions are grouped mostly by domain in top-level files under `convex/`.
- Some files are already large and mix multiple concerns.

### Target

- Keep domain grouping, but split deliberately when a file becomes too large or mixes unrelated workflows.
- Centralize auth and policy checks more aggressively over time.

Rules:

- Use `query` for reads and `mutation` for writes. Do not hide writes in read paths.
- Validate external inputs with `v` at the function boundary.
- Perform auth and store access checks before expensive data work.
- Prefer shared authorization helpers over duplicating ownership logic in each function.
- Keep store-scoped logic keyed by `storeId`; slug is a routing identifier, not authorization proof.
- Put write-time invariants in the same mutation that changes the data.
- If a write changes a derived model used by hot reads, update that derived model in the same logical flow.
- Keep adapter-specific logic and normalization in helpers, not scattered across multiple mutations.
- If a Convex file grows beyond roughly 400-500 lines or mixes unrelated read/write/admin/cleanup flows, split it by capability or subdomain.
- Do not hand-edit `convex/_generated/`; regenerate it through the supported Convex workflow.

Current legacy pressure example:

- `convex/orders.ts`

## 8) Tenant-Safe Coding Rules

These conventions reinforce, not replace, `context/developer/SECURITY.md`.

- Every store-scoped read or write must verify access on the server side.
- Never trust `storeSlug`, client role claims, hidden form fields, or request metadata as proof of authorization.
- UI visibility is not authorization.
- Do not pass decrypted credentials, raw secrets, or secret-derived debug info into client code.
- Public or semi-public endpoints must fail closed when auth, store resolution, or credentials are missing.
- When adding new store-scoped behavior, prefer patterns that can migrate cleanly to a more centralized policy layer.

If code touches auth, payments, delivery credentials, webhooks, or tenant data, read `context/developer/SECURITY.md` first.

## 9) Data Shaping and Read Models

Marlon is an operations product. Shape data for the access pattern instead of forcing every screen to read full documents all the time.

Rules:

- Use full documents for authoritative writes and detail views.
- Use lighter read models for hot list views, counters, and repeated dashboard queries.
- Prefer index-backed reads over broad collection scans.
- Keep list views narrow; do not ship fields the UI does not need.
- When introducing a derived model, define which mutation paths are responsible for keeping it in sync.
- Avoid re-deriving the same expensive data in many components when the backend can publish a stable shape once.

Current example of the right direction:

- `orderDigests` for lighter high-frequency order list reads

## 10) Imports and Module Boundaries

Rules:

- Use the `@/` alias for repo-root imports unless a short relative import inside the same local slice is clearer.
- Keep imports grouped in this order when practical: framework, third-party, internal `@/`, then relative.
- Use `import type` for type-only imports.
- Do not create circular convenience imports between layers.
- Do not import page-layer code into primitives.
- Do not reach across layers just to avoid passing props.

If an import feels convenient but makes the dependency graph harder to explain, it is probably the wrong import.

## 11) Implementation Discipline

### Clean code rules

- Keep validation, authorization, transformation, persistence, and presentation in separate functions when the seams are real.
- A function that both decides and mutates is usually doing too much; split decision logic from write logic.
- Name functions after the business outcome they produce, not the mechanism they use.
- Getter-shaped names must not write, send, or log.
- Avoid boolean flags that switch a function into a second mode; split the modes into separate functions.
- Pass required inputs explicitly; do not read distant mutable state when a parameter would make the dependency obvious.

### Implementation hygiene rules

- Validate untrusted input at the boundary, normalize once, and pass the normalized shape inward.
- Keep side effects at the edge of a function; compute first, then write, navigate, log, or notify.
- Return early on invalid or terminal cases; do not bury the main path inside nested `if` blocks.
- Remove temporary debug code before calling work complete.
- Do not leave dead branches, commented-out code, or unused exports in touched files.
- When touching a file, fix obvious nearby type holes, stale names, and unused props if the fix is low-risk.

### Maintainability rules

- Prefer one clear owner for each rule, state value, and side effect.
- Extract repeated business rules before extracting repeated markup.
- Do not create catch-all helpers such as `utils`, `helpers`, `processData`, or `handleItem`.
- A shared helper must have a stable purpose used by more than one caller, not just save a few lines in one file.
- Keep module APIs small; export the minimum surface needed by other files.
- If a module needs a long usage comment to be safe, redesign the API instead.

### Readability rules

- Keep the happy path visually dominant.
- Prefer explicit intermediate names when an expression hides business meaning.
- Group related statements together: input checks, derived values, side effects, returned view.
- Keep conditionals and JSX branches shallow; extract a helper or child component before the branch becomes hard to scan.
- Prefer a few explicit props over an options bag until the call sites prove a stable object shape.
- Do not pass unused props, data, or callbacks through layers "just in case".

### Local design rules

- Match the style already established in the file unless it conflicts with a rule here.
- Keep file-local helpers close to their single caller; promote them only after a second real use.
- Derive display-only values near the render site unless the derivation is reused or expensive.
- Use inline styles only for truly dynamic values that cannot be expressed through existing classes, tokens, or variants.
- Reuse the same icon family and action meaning within one feature.
- Do not introduce a provider, hook, or abstraction for state that is still local to one component tree.

### Refactoring heuristics

- Refactor when a change is risky because the code hides ownership, duplicates rules, or mixes unrelated concerns.
- Split at natural seams in this order: pure helper, leaf component, hook, subview, then larger module extraction.
- If you can describe one block with "and", look for a split point.
- If a branch needs a comment to explain what it is doing, first try to extract it into a named helper.
- If a component or function grows because of one optional mode, extract that mode instead of adding more flags.
- Stop once the touched area is clear and safe; do not turn a small task into a speculative rewrite.

## 12) Errors, Comments, and TODOs

### Errors and logging

- Translate low-level failures into stable, user-meaningful responses at the boundary.
- Do not leak internals, secrets, or PII in thrown messages returned to clients.
- Keep logging minimal in production paths and never log secrets or decrypted credentials.
- Temporary `console` logging is acceptable during development work, but remove or reduce it before calling the change complete.

### Comments

- Comment why an invariant, workaround, security check, or business rule exists.
- Do not narrate obvious JSX, variable assignments, or straightforward transforms.
- Delete dead code instead of commenting it out.

### TODOs

- Use TODOs sparingly.
- A TODO must name a concrete follow-up, not a vague wish.
- Do not leave TODOs that hide unsafe behavior, security debt, or broken edge cases.
- Prefer recording real follow-up work in `context/project/TASK-LIST.md` when the item matters beyond one file.

## 13) Working in Legacy Code

Rules:

- Do not rename, reshuffle, or reformat untouched areas just to satisfy style preferences.
- When touching a large legacy file, improve one seam at a time.
- Safe first extractions are: pure helpers, formatting utilities, focused hooks, and small leaf components.
- If a file is messy but stable and your task is small, keep the diff scoped.
- If a file is actively blocking safe work, refactor only the portion needed to make the change clear and reliable.

The standard is: leave touched code better than you found it, but do not hide behavior changes inside cosmetic churn.

## 14) Verification Discipline

- Do not claim repo-wide consistency unless you verified it.
- Do not describe target-state architecture as already live.
- When changing auth, billing, delivery, or store-scoped reads/writes, verify the exact path you touched.
- Prefer narrow evidence over broad claims.
- Say "moved toward target" when the repo is still mixed.
