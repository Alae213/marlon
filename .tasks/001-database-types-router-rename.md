# Task 001: Database & Types - Rename "hold" to "router"

## LLM Agent Directives

You are updating the order status types throughout the codebase. Rename "hold" status to "router" for clearer terminology.

**Goals:**
1. Rename "hold" to "router" in types and all related code

**Rules:**
- DO NOT add new features
- DO NOT refactor unrelated code
- RUN `bun run typecheck` after each change
- VERIFY no imports break after changes

---

## 0.1 Rename "hold" to "router" in types

**File:** `lib/orders-types.ts`

FIND:
```typescript
// Order status types
export type OrderStatus = 
  | "new" 
  | "confirmed" 
  | "packaged" 
  | "shipped" 
  | "succeeded" 
  | "canceled" 
  | "blocked"
  | "hold";
```

CHANGE TO:
```typescript
// Order status types
export type OrderStatus = 
  | "new" 
  | "confirmed" 
  | "packaged" 
  | "shipped" 
  | "succeeded" 
  | "canceled" 
  | "blocked"
  | "router";
```

FIND:
```typescript
// Status labels for display
export const STATUS_LABELS: Record<OrderStatus, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }> = {
  new: { label: "New", variant: "info" },
  confirmed: { label: "Confirmed", variant: "default" },
  packaged: { label: "Packaged", variant: "default" },
  shipped: { label: "Shipped", variant: "warning" },
  succeeded: { label: "Succeeded", variant: "success" },
  canceled: { label: "Canceled", variant: "danger" },
  blocked: { label: "Blocked", variant: "danger" },
  hold: { label: "On Hold", variant: "warning" },
};
```

CHANGE TO:
```typescript
// Status labels for display
export const STATUS_LABELS: Record<OrderStatus, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }> = {
  new: { label: "New", variant: "info" },
  confirmed: { label: "Confirmed", variant: "default" },
  packaged: { label: "Packaged", variant: "default" },
  shipped: { label: "Shipped", variant: "warning" },
  succeeded: { label: "Succeeded", variant: "success" },
  canceled: { label: "Canceled", variant: "danger" },
  blocked: { label: "Blocked", variant: "danger" },
  router: { label: "Router", variant: "warning" },
};
```

FIND:
```typescript
// Status transition map - what statuses can each status transition to
export const STATUS_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  new: ["confirmed", "canceled", "blocked", "hold"],
  confirmed: ["packaged", "canceled", "blocked", "hold"],
  packaged: ["shipped", "canceled"],
  shipped: ["succeeded", "canceled"],
  succeeded: [],
  canceled: ["new"], // Can reopen
  blocked: ["new"], // Can reopen
  hold: ["new", "confirmed", "canceled"],
};
```

CHANGE TO:
```typescript
// Status transition map - what statuses can each status transition to
export const STATUS_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  new: ["confirmed", "canceled", "blocked", "router"],
  confirmed: ["packaged", "canceled", "blocked", "router"],
  packaged: ["shipped", "canceled"],
  shipped: ["succeeded", "router", "canceled"],
  succeeded: [],
  canceled: ["new"], // Can reopen
  blocked: ["new"], // Can reopen
  router: ["new", "confirmed", "canceled"],
};
```

VERIFY: `bun run typecheck` passes.

---

## 0.2 Update status colors in ListView

**File:** `components/order-page/ListView.tsx`

FIND:
```typescript
const statusColors: Record<OrderStatus, { dot: string }> = {
  new: { dot: "bg-blue-500" },
  confirmed: { dot: "bg-gray-500" },
  packaged: { dot: "bg-gray-500" },
  shipped: { dot: "bg-yellow-500" },
  succeeded: { dot: "bg-green-500" },
  canceled: { dot: "bg-red-500" },
  blocked: { dot: "bg-red-500" },
  hold: { dot: "bg-yellow-500" },
};
```

CHANGE TO:
```typescript
const statusColors: Record<OrderStatus, { dot: string }> = {
  new: { dot: "bg-blue-500" },
  confirmed: { dot: "bg-gray-500" },
  packaged: { dot: "bg-gray-500" },
  shipped: { dot: "bg-yellow-500" },
  succeeded: { dot: "bg-green-500" },
  canceled: { dot: "bg-red-500" },
  blocked: { dot: "bg-red-500" },
  router: { dot: "bg-yellow-500" },
};
```

FIND:
```typescript
const statuses: OrderStatus[] = ["new", "confirmed", "packaged", "shipped", "succeeded", "canceled", "blocked", "hold"];
```

CHANGE TO:
```typescript
const statuses: OrderStatus[] = ["new", "confirmed", "packaged", "shipped", "succeeded", "canceled", "blocked", "router"];
```

SEARCH for any other "hold" references in the codebase and update them to "router".

VERIFY: `bun run typecheck` passes.

---

## Phase N: Verify

RUN these commands:
```bash
bun run typecheck
```

---

## Checklist

- [ ] "hold" renamed to "router" in types
- [ ] Status transitions updated
- [ ] Status labels updated
- [ ] Status colors updated in ListView
- [ ] `bun run typecheck` passes

---

## Do NOT Do

- Do NOT add new features
- Do NOT change API response shapes
- Do NOT keep "hold" status anywhere - must rename to "router"
