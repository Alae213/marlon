# AGENTS.md — Marlon

## Project
Multi-tenant SaaS for Algerian COD e-commerce. Stack: Next.js 16 (App Router), TypeScript (strict), Tailwind CSS v4, Convex, Clerk (Google OAuth only), Chargily Pay, Vercel.

---

## WORKFLOW (MANDATORY)

1. **Discover** → brainstorm architecture/security first
2. **Plan** → write structured plan to `tasks/todo.md`
3. **Wait** → NO CODE until user says **"Proceed"**
4. **Execute** → step-by-step: Types → Backend → UI
5. **Verify** → prove it works before marking done
6. **Git** → Conventional Commits, then update `ARCHITECTURE.md` or `.agent/MEMORY.md`

---

## HARD RULES

- `doc/` is the single source of truth — document before implementing
- No `localStorage` or mock data — use Convex from day one
- No route changes without explicit approval
- No scope creep — implement exactly what is requested (YAGNI)
- No `any` — use strict types/interfaces (`unknown` if truly dynamic)
- No silent errors — handle or throw, never swallow
- No raw stack traces exposed to client
- No secrets/PII in logs
- No hardcoded user-facing strings — use i18n
- No custom icons — use `lucide-react` only
- No `border` styles on public routes
- No `style={{}}` unless value is dynamic
- Always use `'use client'` only when state/effects/browser APIs are needed
- Always close listeners/sockets/streams (memory leaks)
- Always filter by `storeId` for multi-tenant isolation
- Always validate input with Zod in Convex functions
- Always use `proxy.ts` for route protection (NOT `middleware.ts` — deprecated in Next.js 16)
- Always use `Promise.all()` when resolving multiple Convex `storageId`s
- Never send raw `storageId` to frontend — resolve via `ctx.storage.getUrl(id)`
- Destructive commands (`rm -rf`, `DROP TABLE`) require explicit confirmation
- Scripts/migrations must be idempotent (`IF NOT EXISTS`)
- Refactoring = ZERO logic change

---

## CODE STANDARDS

- Language: English — code, variables, comments, commits
- Components: PascalCase; files: kebab-case (non-component), PascalCase (component)
- Variables/functions: camelCase; constants: UPPER_SNAKE_CASE
- Booleans: `is`, `has`, `can`, `should` prefixes
- Imports order: external → internal (`@/`) → relative
- Server Components by default; `export default function` for pages/layouts
- Named exports for all non-page components
- Soft delete (status field) over hard delete in Convex
- Comments explain the WHY, not the WHAT
- No placeholders like `// ... existing code ...` — output complete files or exact patches

---

## UI CONTRACTS

### Modal/Dialog
- Components: `Dialog`, `DialogPortal`, `DialogOverlay`, `DialogHeader`, `DialogTitle` from `@/components/animateContent`
- Classes: `bg-[image:var(--gradient-popup)] [corner-shape:squircle] rounded-[48px] bg-[--system-100] backdrop-blur-[12px]`
- Shadow: `style={{ boxShadow: "var(--shadow-xl-shadow)" } as any}`
- Animation: `from="top"` with `spring` transition
- Glass elements: `bg-white/10`, `hover:bg-white/20`

### Public Routes (Storefront)
- Typography: `display-5xl`, `headline-2xl`, `title-xl`, `body-base`, `label-xs`
- Colors: `var(--system-50)` → `var(--system-700)` only — no hardcoded hex
- No borders; Button from `@/components/core/button`

### Fonts
- Primary: Inter Variable (`--font-inter`)
- Arabic fallback: `SF Pro Text` / `SF Pro Display` → `system-ui`

---

## FORBIDDEN PATHS (DO NOT READ)
- `node_modules/`
- `.next/`
- `public/`

---

## SELF-IMPROVEMENT
- After any user correction → update `tasks/lessons.md`
- Review `tasks/lessons.md` at session start when relevant
- After each session → document major changes in `ARCHITECTURE.md`
s

- **Simplicity First**: Make every change as simple as possible. Minimize code impact.
- **No Laziness**: Identify root causes. Avoid temporary fixes. Apply senior developer standards.
- **Minimal Impact**: Touch only what is necessary. Avoid introducing new bugs.

## Commands

- `/compact` - Use this command to request compact summaries and concise responses


