# ESLint Fix Implementation Plan

## Overview
- **Total**: 115 problems (42 errors, 73 warnings)
- **Auto-fixable**: 4 warnings via `--fix`
- **Manual fixes required**: 41 errors + 69 warnings

---

## Phase 1: Quick Wins (Warnings — 5 min)
*Safe, low-risk changes with no logic impact*

### 1.1 Remove unused imports (`@typescript-eslint/no-unused-vars`) — 18 instances

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `components/wilaya-select.tsx` | 18 | `selectedWilaya` unused | Remove `selectedWilaya` state + its `setSelectedWilaya` setter (keep `setSelectedWilaya` in WilayaSelect effect → replace with `useMemo` or store in ref) |
| `contexts/billing-context.tsx` | 3 | `useEffect` unused | Remove from import |
| `convex/orders.ts` | 50 | `e` unused in catch | Replace `e` with `_e` or remove variable |
| `convex/products.ts` | 50 | `e` unused in catch | Replace `e` with `_e` or remove variable |
| `convex/stores.ts` | 8 | `requireAdmin` unused | Remove from destructuring or prefix with `_` |
| `convex/stores.ts` | 212 | `store` unused in `updateStore` | Prefix with `_store` or use destructuring `{ store: _store }` |
| `lib/orders-types.ts` | 6-14 | 9 unused icon imports | Remove all unused icon imports (`CircleDotDashed`, `CircleCheckBig`, `PackageCheck`, `Truck`, `Banknote`, `MessageCircleX`, `Ban`, `BanknoteX`, `LucideIcon`) |

### 1.2 Fix anonymous default export (`import/no-anonymous-default-export`)

| File | Line | Fix |
|------|------|-----|
| `convex/auth.config.ts` | 1 | Assign config to `const authConfig` before exporting |

### 1.3 Remove unused eslint-disable directives (auto-fixable)

| File | Fix |
|------|-----|
| `convex/_generated/api.js` | Run `npx eslint --fix convex/_generated/` |
| `convex/_generated/dataModel.d.ts` | Same |
| `convex/_generated/server.d.ts` | Same |
| `convex/_generated/server.js` | Same |

### 1.4 Remove unused type exports in `convex/siteContent.ts`

| Line | Issue | Fix |
|------|-------|-----|
| 5 | `Doc` imported but unused | Remove import |
| 62 | `SiteContentSection` unused | Remove type alias |

---

## Phase 2: React Hooks Errors (Medium — 15 min)
*Require careful refactoring to preserve behavior*

### 2.1 Fix `react-hooks/set-state-in-effect` — 7 instances

**Pattern**: These all follow the same anti-pattern — calling `setState` synchronously at the top of a `useEffect` body. The React 19 fix is to either:
- Use `useSyncExternalStore` for external data (localStorage)
- Derive state with `useMemo` instead of syncing via effect
- Move the setState into a conditional that only triggers on external changes

| File | Line(s) | Current Pattern | Fix Strategy |
|------|---------|-----------------|--------------|
| `components/wilaya-select.tsx` | 23 | `setSelectedWilaya(wilaya)` in effect | **Remove `selectedWilaya` state entirely**. It's derived from `value` prop — use `useMemo` instead: `const selectedWilaya = useMemo(() => algeriaWilayas.find(w => getWilayaDisplay(w) === value), [value])` |
| `components/wilaya-select.tsx` | 119 | `setCommunes(wilaya?.communes)` in effect | **Use `useMemo`**: Derive `communes` from `wilayaValue` prop directly |
| `components/wilaya-select.tsx` | 127 | `setIsOpen(false)` + `setSearch("")` in effect | **Keep but restructure**: Only call when `disabled` changes to `true`: `if (disabled && isOpen) setIsOpen(false)` or use `usePrevious` hook |
| `contexts/cart-context.tsx` | 42 | `setItems(JSON.parse(stored))` from localStorage | **Acceptable pattern for hydration** — add eslint-disable comment with explanation: `// eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrating from localStorage on mount` |
| `contexts/realtime-context.tsx` | 91 | `setNewNotifications(prev => ...)` merging notifications | **Restructure**: Derive `newNotifications` from `notificationsFromNewOrders` and `lastUpdate` using `useMemo` + keep a `prevNotificationsRef` for comparison |
| `contexts/realtime-context.tsx` | 102 | `setLastUpdate(Date.now())` + `setIsConnected(hasConnection)` | **Split into two effects** or use derived state for `isConnected` |
| `lib/theme/provider.tsx` | 50 | `setThemeState(userTheme)` from userData | **Use `useMemo`** for derived theme, or keep effect but guard: only setState when value actually differs |

### 2.2 Fix `react-hooks/refs` — 1 instance

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `components/ui/table.tsx` | 67 | `key={sessionRef.current}` accessed during render | **Store in state**: Add `const [sessionKey, setSessionKey] = useState(sessionRef.current)` and sync via effect, OR remove the `key` prop if the ref-based session tracking isn't needed for animations |

---

## Phase 3: TypeScript `any` Replacement (High — 20 min)
*Requires understanding Convex types*

### 3.1 Fix `@typescript-eslint/no-explicit-any` — 19 instances

**Strategy**: Import proper Convex types from `_generated/dataModel` and use `GenericId` or `GenericDocument` patterns.

| File | Lines | Context | Fix |
|------|-------|---------|-----|
| `convex/orders.ts` | 5 | `assertOrderOwnership(ctx: { db: any; auth: any }, orderId: any)` | Import `GenericCtx` or use inline types: `ctx: { db: DatabaseReader; auth: Auth }` from Convex. Use `Id<"orders">` for `orderId` |
| `convex/orders.ts` | 26 | `assertStoreOwnership(ctx: { db: any; auth: any }, storeId: any)` | Same — `Id<"stores">` for `storeId` |
| `convex/orders.ts` | 394 | `filter((_: any, i: number) => ...)` | Remove type annotation: `filter((_, i) => ...)` |
| `convex/orders.ts` | 397 | `reduce((sum: number, p: any) => ...)` | Use proper product type from order schema |
| `convex/products.ts` | 6 | `assertProductOwnership(ctx: { db: any; auth: any }, productId: any)` | Same pattern as orders |
| `convex/products.ts` | 27 | `assertStoreOwnership(ctx: { db: any; auth: any }, storeId: any)` | Same |
| `convex/products.ts` | 42 | `resolveProductImages(ctx: any, ...)` | Use Convex `ActionCtx` or `QueryCtx` type |
| `convex/stores.ts` | 6-8 | `assertStoreOwnership(ctx: { db: any; auth: any }, storeId: any, requireAdmin = false)` | Same pattern — `Id<"stores">` for `storeId` |

**Convex type pattern**:
```typescript
import { Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";

async function assertOrderOwnership(
  ctx: MutationCtx,
  orderId: Id<"orders">
) { ... }
```

---

## Execution Order

1. **Run auto-fix first**: `npx eslint . --fix` (handles 4 warnings)
2. **Phase 1** — Remove unused imports/vars (straightforward, no risk)
3. **Phase 3** — Replace `any` types (high confidence with Convex types)
4. **Phase 2** — Fix React hooks errors (needs careful testing)

---

## Verification

After each phase:
```bash
npx eslint . --no-cache
```

Target: **0 errors, 0 warnings** after all phases.

---

## Risk Assessment

| Phase | Risk | Reason |
|-------|------|--------|
| Phase 1 | 🟢 Low | Removing unused code only |
| Phase 2 | 🟡 Medium | Refactoring effects could change render behavior |
| Phase 3 | 🟢 Low | Type-only changes, no runtime impact |

### Phase 2 Mitigation
- Test each file after refactoring effects
- For `cart-context.tsx` and `realtime-context.tsx`, prefer eslint-disable with explanation over risky refactors if the hydration pattern is intentional
- Verify theme switching still works after `provider.tsx` changes
