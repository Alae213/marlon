# Surgical Dead-Code Audit

This document identifies unreachable declarations, phantom dependencies, and dead control flows within the Marlon codebase to improve maintainability and reduce technical debt.

### 1. Findings Table

| # | File | Line(s) | Symbol | Category | Risk | Confidence | Action |
|---|------|---------|--------|----------|------|------------|--------|
| 1 | `package.json` | 19 | `chrome-remote-interface` | PHANTOM_DEP | 🔴 HIGH | 100% | DELETE |
| 2 | `proxy.ts` | 1-20 | Entire File | UNREACHABLE_DECL | 🔴 HIGH | 95% | DELETE / RENAME to `middleware.ts` |
| 3 | `components/DeliveryAction.tsx` | 1-190 | Entire File | UNREACHABLE_DECL | 🔴 HIGH | 100% | DELETE |
| 4 | `components/DeliverySettings.tsx` | 1-255 | Entire File | UNREACHABLE_DECL | 🔴 HIGH | 100% | DELETE |
| 5 | `components/ErrorBoundary.tsx` | 1-45 | Entire File | UNREACHABLE_DECL | 🔴 HIGH | 100% | DELETE |
| 6 | `components/NotificationBell.tsx` | 1-150 | Entire File | UNREACHABLE_DECL | 🔴 HIGH | 100% | DELETE |
| 7 | `components/loading.tsx` | 10 | `Loading` | UNREACHABLE_DECL | 🔴 HIGH | 100% | DELETE |
| 8 | `components/locked-overlay.tsx` | 12 | `LockedOverlay` | UNREACHABLE_DECL | 🟡 MEDIUM | 90% | MANUAL_VERIFY |
| 9 | `convex/orders.ts` | 40 | `getOrdersByStatus` | UNREACHABLE_DECL | 🔴 HIGH | 100% | DELETE |
| 10 | `convex/orders.ts` | 69 | `getOrderByNumber` | UNREACHABLE_DECL | 🔴 HIGH | 100% | DELETE |
| 11 | `convex/orders.ts` | 215 | `updateTrackingNumber` | UNREACHABLE_DECL | 🔴 HIGH | 100% | DELETE |
| 12 | `convex/orders.ts` | 245 | `updateOrderNotes` | UNREACHABLE_DECL | 🔴 HIGH | 100% | DELETE |
| 13 | `convex/siteContent.ts` | 113 | `getAllSiteContent` | UNREACHABLE_DECL | 🔴 HIGH | 100% | DELETE |
| 14 | `convex/siteContent.ts` | 384 | `bulkSetDeliveryPricing` | UNREACHABLE_DECL | 🔴 HIGH | 100% | DELETE |
| 15 | `convex/siteContent.ts` | 546 | `initializeSiteContent` | UNREACHABLE_DECL | 🔴 HIGH | 100% | DELETE |
| 16 | `convex/users.ts` | 17 | `getUser` | UNREACHABLE_DECL | 🔴 HIGH | 100% | DELETE |
| 17 | `convex/users.ts` | 72 | `migrateUserThemes` | UNREACHABLE_DECL | 🔴 HIGH | 100% | DELETE |
| 18 | `convex/stores.ts` | 70 | `generateSlugSuggestions` | UNREACHABLE_DECL | 🔴 HIGH | 100% | DELETE |
| 19 | `convex/stores.ts` | 181 | `updateSubscription` | UNREACHABLE_DECL | 🔴 HIGH | 100% | DELETE |
| 20 | `convex/stores.ts` | 217 | `updateDeliveryPricing` | UNREACHABLE_DECL | 🔴 HIGH | 100% | DELETE |
| 21 | `convex/stores.ts` | 253 | `getDeliveryCost` | UNREACHABLE_DECL | 🔴 HIGH | 100% | DELETE |
| 22 | `convex/stores.ts` | 276 | `handleNewOrderSubscription` | UNREACHABLE_DECL | 🔴 HIGH | 100% | DELETE |
| 23 | `convex/stores.ts` | 396 | `getStoreBillingStatus` | UNREACHABLE_DECL | 🔴 HIGH | 100% | DELETE |
| 24 | `convex/schema.ts` | 23, 24 | `address`, `wilaya` (stores) | UNREACHABLE_DECL | 🟡 MEDIUM | 85% | MANUAL_VERIFY |
| 25 | `lib/algeria-data.ts` | 1239, 1246 | `getWilayaById`, `getCommunesByWilayaId` | UNREACHABLE_DECL | 🟡 MEDIUM | 100% | MANUAL_VERIFY |

### 2. Cleanup Roadmap

**Batch 1: High-Confidence Component & File Deletion (RED)**
- **Estimated LOC removed:** ~800 LOC
- **Impact:** Reduced bundle size and project clutter. Removing `DeliveryAction`, `DeliverySettings`, `NotificationBell`, and `ErrorBoundary` clears up the `components/` directory.
- **Refactoring Order:** 
    1. `components/DeliveryAction.tsx`
    2. `components/NotificationBell.tsx`
    3. `components/ErrorBoundary.tsx`
    4. `proxy.ts` (Decision needed: delete or rename to `middleware.ts`)

**Batch 2: Convex API Surface Pruning (RED)**
- **Estimated LOC removed:** ~500 LOC
- **Impact:** Cleaner API surface and better maintainability.
- **Refactoring Order:** 
    1. `convex/orders.ts`
    2. `convex/stores.ts`
    3. `convex/siteContent.ts`
    4. `convex/users.ts`

**Batch 3: Schema & Utility Refinement (YELLOW)**
- **Estimated LOC removed:** ~50 LOC
- **Impact:** Aligning database schema with UI reality.
- **Refactoring Order:** 
    1. `convex/schema.ts` (requires verification of existing production data)
    2. `lib/algeria-data.ts` (internal utility pruning)

### 3. Executive Summary

| Metric | Count |
|--------|-------|
| Total findings | 25 |
| High-confidence deletes | 20 |
| Estimated LOC removed | ~1,350 |
| Estimated dead imports | 1 (Package) |
| Files safe to delete entirely | 5 |
| Estimated build time improvement | Negligible (but better dev DX) |

**Assessment:**
The codebase is in good health but contains several "feature-creep leftovers"—components and API endpoints built for planned features that were never integrated. The background logic in Convex is notably bloated with unused mutations and queries.

**Top-3 Highest-Impact Actions:**
1. **Prune Convex API:** Delete the 15+ unused Convex functions to prevent confusion for future developers.
2. **Remove Orphan Components:** Delete `DeliveryAction`, `DeliverySettings`, and `NotificationBell` to simplify the component library.
3. **Resolve `proxy.ts`:** Rename to `middleware.ts` if intended to be active for Clerk protection, otherwise delete.
