# AGENTS.md - Marlon Development Guide

## CRITICAL: Follow Instructions Exactly

- **DO NOT** deviate from PRD or make assumptions without asking first
- **DO NOT** use localStorage or mock data for production features - use Convex from the start
- **DO NOT** change route structures without explicit user approval
- **Single source of truth**: The `doc/` folder is the only source of truth for all features and specs. Before adding or updating any feature, ensure it is documented in the relevant `doc/` domain PRD first.
- When in doubt: **ASK** before proceeding

## Forbidden **DO NOT READ**:
- node_modules/
- .next/
- public/

## Overview

Marlon is a multi-tenant SaaS platform for Algerian entrepreneurs to create and manage COD-based online stores. The project uses Next.js, TypeScript, Tailwind CSS, and will integrate with Convex (backend), Clerk (auth), and Chargily Pay (payments).


## Code Style Guidelines

### General Principles

- Use functional components with hooks over class components
- Prefer composition over inheritance
- Keep components small and focused (single responsibility)
- Use early returns to reduce nesting

### TypeScript

- **Always enable strict mode** (`strict: true` in tsconfig.json)
- Define explicit return types for functions when non-obvious
- Use `interface` for object shapes, `type` for unions/aliases
- Avoid `any` - use `unknown` when type is truly unknown
- Use generic types to maintain type safety

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
}

function getItems<T>(items: T[]): T[] {
  return items;
}
```

### Naming Conventions

- **Components**: PascalCase (e.g., `ProductCard`, `OrderList`)
- **Files**: kebab-case for non-component files, PascalCase for components
- **Variables/functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Boolean variables**: Use `is`, `has`, `can`, `should` prefixes

### Imports

- Use absolute imports with `@/` prefix (configured in tsconfig.json)
- Group imports: external, internal, relative

```typescript
import { useState } from "react";
import { useStore } from "@/hooks/useStore";
import { formatPrice } from "../utils/format";
```

### Styling

- **Icons**: Always use Lucide icons library (`lucide-react`). Never create custom icons from scratch.
 Tailwind CSS v4 exclusively - no inline style={} unless dynamic values_require it.
. Global CSS variables defined in app/globals.css using @theme inline block.
. Dark mode: use dark: variant (respects prefers-color-scheme).
. RTL: this is an Arabic-first app. Use logical properties (ps-4, pe-4, ms-auto,
me-auto, start-0, end-0) instead of physical left/right properties.

### React / Next.js Patterns

- Use ** Server Componpnts ** by default. Only add"use client" when state, effects, or browser APIs are needed.
- Use export default function for page/layout components (not arrow functions).
- Colocate components with their pages when page-specific; share in app/components/
- Prefer named exports for non-page components.
- Use Next.js <Image> for all images, <Link>

### React/Next.js Patterns

- Use the App Router (`app/` directory)
- Use Server Components by default, add `'use client'` only when needed
- Keep server-side data fetching in Server Components

```typescript
// Server Component (default)
export default async function DashboardPage() {
  const data = await fetchData();
  return <Dashboard data={data} />;
}

// Client Component - only when needed
'use client';
export function ProductForm() {
  const [state, setState] = useState();
}
```

### Tailwind CSS

- Use utility classes for styling (Tailwind v4)
- Extract repeated patterns into components
- Support dark mode with `dark:` prefix

### Error Handling

- Use try/catch for async operations with meaningful error messages
- Display user-friendly error messages in UI

```typescript
try {
  await createOrder(orderData);
} catch (error) {
  console.error('Unexpected error:', error);
  toast.error('Failed to create order. Please try again.');
}
```

### State Management

- Use `useState` for component-local state
- Use Context for global UI state
- Use Convex for server state and real-time data

### File Organization

```
app/          # Next.js App Router pages
components/   # React components
hooks/        # Custom React hooks
lib/          # Utility functions
types/        # TypeScript type definitions
```

### API Patterns (Convex)

- All database operations go through Convex functions
- Use queries for data fetching, mutations for writes
- Always filter by `storeId` for multi-tenant isolation (per PRD security requirement)
- Validate input using Zod schemas

### Authentication (Clerk)

- Use Clerk for authentication (Google OAuth only per PRD)
- Protect routes with proxy.ts (NOT middleware.ts - deprecated in Next.js 16)
- Always verify user ownership for store access

### Database (Convex)

- Define schemas in `schema.ts`
- Use relationships via ID references
- Soft delete pattern (status field) over hard delete

### Payments (Chargily)

- Create payment intents server-side via Convex actions
- Handle webhooks for payment confirmation
- Never expose API keys in client code

### General Best Practices

- Add proper TypeScript types to all function parameters
- Write self-documenting code with clear variable names
- Extract constants (magic numbers) into named constants
- Handle loading and error states in UI

## Tech Stack Summary

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **Backend**: Convex (real-time DB)
- **Auth**: Clerk (Google OAuth)
- **Payments**: Chargily Pay
- **Delivery APIs**: ZR Express, Yalidine
- **Hosting**: Vercel

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS v4](https://tailwindcss.com/docs/upgrade-guide)
- [Convex Documentation](https://docs.convex.dev)
- [Clerk Documentation](https://clerk.com/docs)
- [PRD.md](./PRD.md) - Product requirements and feature specifications

## Operational Principles

### 1. Plan First (Default)
- Enter plan mode for any non-trivial task (three or more steps, or involving architectural decisions).
- If something goes wrong, stop and re-plan immediately rather than continuing blindly.
- Use plan mode for verification steps, not just implementation.
- Write detailed specifications upfront to reduce ambiguity.

### 2. Subagent Strategy
- Use subagents liberally to keep the main context window clean.
- Offload research, exploration, and parallel analysis to subagents.
- For complex problems, allocate more compute via subagents.
- Assign one task per subagent to ensure focused execution.

### 3. Self-Improvement Loop
- After any correction from the user, update tasks/lessons.md with the relevant pattern.
- Create rules for yourself that prevent repeating the same mistake.
- Iterate on these lessons rigorously until the mistake rate declines.
- Review lessons at the start of each session when relevant to the project.

### 4. Verification Before Done
- Never mark a task complete without proving it works.
- Diff behavior between main and your changes when relevant.
- Ask: "Would a staff engineer approve this?"
- Run tests, check logs, and demonstrate correctness.

### 5. Demand Elegance (Balanced)
- For non-trivial changes, pause and ask whether there is a more elegant solution.
- If a fix feels hacky, implement the solution you would choose knowing everything you now know.
- Do not over-engineer simple or obvious fixes.
- Critically evaluate your own work before presenting it.

### 6. Autonomous Bug Fixing
- When given a bug report, fix it without asking for unnecessary guidance.
- Review logs, errors, and failing tests, then resolve them.
- Avoid requiring context switching from the user.
- Fix failing CI tests proactively.

## Task Management

1. **Plan First**: Write the plan to tasks/todo.md with checkable items.
2. **Verify Plan**: Review before starting implementation.
3. **Track Progress**: Mark items complete as you go.
4. **Explain Changes**: Provide a high-level summary at each step.
5. **Document Results**: Add a review section to tasks/todo.md.
6. **Capture Lessons**: Update tasks/lessons.md after corrections.

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Minimize code impact.
- **No Laziness**: Identify root causes. Avoid temporary fixes. Apply senior developer standards.
- **Minimal Impact**: Touch only what is necessary. Avoid introducing new bugs.

## Commands

- `/compact` - Use this command to request compact summaries and concise responses


