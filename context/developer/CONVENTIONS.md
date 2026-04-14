# Code Conventions

> Claude follows these on every task without being reminded.

## Naming

### Files & Folders
- **Pages**: `kebab-case` — `order-details.tsx`, `delivery-settings.tsx`
- **Components**: `PascalCase` — `OrderCard.tsx`, `DeliveryModal.tsx`
- **Utilities/Hooks**: `camelCase` — `useDeliveryStatus.ts`, `formatPrice.ts`
- **Convex Functions**: `snake_case` — `create_order`, `update_delivery_status`
- **Constants**: `UPPER_SNAKE_CASE` — `MAX_DAILY_ORDERS`, `DEFAULT_CURRENCY`

### Variables & Functions
- Use descriptive names: `pendingOrderCount` over `count`
- Booleans: prefix with `is`, `has`, `should` — `isLocked`, `hasPermission`
- Event handlers: prefix with `handle` — `handleSubmit`, `handleClose`
- Mutations: suffix with `Action` — `createStoreAction`, `unlockStoreAction`

### Database
- Convex tables: `snake_case` — `stores`, `orders`, `delivery_providers`
- Document fields: `camelCase` — `createdAt`, `storeId`, `courierProvider`

## File & Folder Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/        # Dashboard routes (merchant app)
│   ├── (storefront)/       # Public storefront routes
│   └── api/                # API routes (webhooks)
├── components/
│   ├── ui/                 # Shared primitives (Button, Input, Modal)
│   ├── features/           # Feature-specific components
│   └── layouts/            # Shell, Sidebar, Nav
├── lib/
│   ├── convex/             # Convex client & typed queries
│   ├── providers/          # Context providers
│   └── utils/              # Utility functions
├── hooks/                  # Custom React hooks
└── types/                  # TypeScript type definitions
```

### Component Organization
```
components/features/orders/
├── OrderList.tsx
├── OrderCard.tsx
├── OrderDetail.tsx
└── index.ts                # Barrel export
```

## Patterns

### Data Fetching (Convex)
```typescript
// Queries: useQuery(functionName, args)
const orders = useQuery(api.orders.list, { storeId });

// Mutations: useMutation(functionName)
const createOrder = useMutation(api.orders.create);

// Real-time: useQuery auto-subscribes
// For one-time: useQuery with { subscription: false }
```

### State Management
- **Global UI state**: React Context — `CartProvider`, `ToastProvider`
- **Server state**: Convex queries (auto-cached, real-time)
- **Local component state**: `useState`, `useReducer`

### Form Handling
- Use `react-hook-form` for complex forms
- Zod for validation schemas
- Server-side validation in Convex mutations

### Error Boundaries
- Wrap feature sections with error boundaries
- Log errors to console in development
- Show user-friendly messages via toast

## Comments

### When to Comment
- **Complex business logic**: Explain WHY, not WHAT
- **Non-obvious workarounds**: Document the issue being solved
- **API contracts**: Document expected inputs/outputs
- **Temporarily disabled code**: Use `// TODO: ` or `// FIXME: `

### What NOT to Comment
- Obvious code that reads like prose
- Auto-generated boilerplate
- Commented-out code (delete it, use git if needed)

### Docstrings (Convex Functions)
```typescript
// Creates a new order for a store
// Throws if store is locked or daily cap exceeded
// Returns: { orderId, status }
```

## Formatting

### Linter / Formatter
- **ESLint**: Configured with `@eslint/config-next`
- **Prettier**: Configured via `.prettierrc`
- **Run before commit**: `npm run lint` and `npm run typecheck`

### Pre-Commit Hooks
- Husky + lint-staged configured
- Lint and typecheck must pass before commit

### Import Order
```typescript
// 1. External libraries
import { useState } from 'react';
import { convex } from 'convex';

// 2. Internal absolute imports
import { useStore } from '@/hooks/useStore';
import { Button } from '@/components/ui';

// 3. Relative imports
import { OrderCard } from './OrderCard';
```