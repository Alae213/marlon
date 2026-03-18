# Products Content Redesign Plan

> Goal: Upgrade `products-content.tsx` and its child components to match the project's own design system and UI contracts — without changing the stack or breaking functionality.

---

## Phase 1: Color Token Migration (Highest Impact, Zero Risk)

**Files:** `product-card.tsx`, `products-content.tsx`, `product-form.tsx`, `bottom-navigation.tsx`

Replace every hardcoded hex color with the project's `--system-*` token scale or semantic tokens already defined in `globals.css`.

| Old (hardcoded) | New (token) |
|---|---|
| `#171717` | `var(--system-700)` |
| `#fafafa` | `var(--system-50)` |
| `#525252` | `var(--system-400)` |
| `#a3a3a3` | `var(--system-300)` |
| `#d4d4d4` | `var(--system-200)` |
| `#e5e5e5` | `var(--system-200)` |
| `#f5f5f5` | `var(--system-50)` |
| `#737373` | `var(--system-300)` |
| `#0a0a0a` | `var(--system-700)` |
| `#171717` (dark bg) | `var(--system-700)` |
| `#262626` | `var(--system-600)` |
| `#404040` | `var(--system-500)` |
| `#17CFAA` | `var(--success)` |
| `#16a34a` | `var(--success)` |
| `#d97706` | `var(--warning)` |
| `#dc2626` | `var(--destructive)` |
| `#fee2e2` | `var(--destructive)` at low opacity |
| `#7f1d1d` | `var(--destructive)` at low opacity |

**Dark mode:** Replace `dark:bg-[#0a0a0a]`, `dark:border-[#262626]`, etc. with dark-mode token equivalents using the existing `.dark` CSS variable overrides.

**Scope:** Touch only className strings. No logic changes.

---

## Phase 2: Typography Consistency

**Files:** `product-card.tsx`, `product-form.tsx`

The project defines `body-base`, `title-xl`, `label-xs` typography classes in `globals.css`. Child components use raw Tailwind (`font-normal`, `font-medium`, `text-sm`) instead.

| Location | Current | Replace With |
|---|---|---|
| `product-card.tsx:71` product name | `font-normal text-[...]` | `body-base text-[var(--system-700)]` |
| `product-card.tsx:92` price | `font-medium text-[...]` | `body-base font-semibold text-[var(--system-700)]` |
| `product-card.tsx:114` old price | `text-sm text-[#a3a3a3]` | `label-xs text-[var(--system-300)]` |
| `product-form.tsx:69,74,85,89` labels | `text-sm` | `label-xs` |
| `product-card.tsx:95` price value | (add) | `font-variant-numeric: tabular-nums` via class |

---

## Phase 3: Loading & Error States

**Files:** `products-content.tsx`

Add skeleton loading for the product grid when `products` is `undefined`, and an error state when queries fail.

- **Products loading:** Show 4 skeleton cards (gray rectangles matching card aspect ratio) in the same grid layout.
- **Store name loading:** Show a gray pulse bar instead of falling back to `storeSlug`.
- **Query error:** Show an inline error message with a retry button in the products area.

No new components needed — use simple Tailwind classes (`animate-pulse`, `bg-[var(--system-200)]`, `rounded`).

---

## Phase 4: Modal Upgrade to Match UI Contracts

**Files:** `products-content.tsx` (swap Modal import), `modal.tsx` (update or deprecate)

The AGENTS.md UI contracts specify:
```
bg-[image:var(--gradient-popup)] [corner-shape:squircle] rounded-[48px]
bg-[--system-100] backdrop-blur-[12px]
style={{ boxShadow: "var(--shadow-xl-shadow)" }}
from="top" with spring transition
```

The project already has `@/components/animate-ui/components/radix/dialog.tsx` with animated Dialog primitives.

**Approach:** Replace the `<Modal>` usage in `products-content.tsx` with the animated `<Dialog>` system, applying the AGENTS.md contract classes to `DialogContent`. This is a drop-in replacement — same open/close props, same children.

---

## Phase 5: Layout Fixes

**Files:** `products-content.tsx`

| Issue | Fix |
|---|---|
| `h-screen` | Change to `min-h-dvh` |
| `w-[300px]` URL bar | Change to `w-full max-w-[300px]` |
| `w-[150px]` side columns | Change to `w-[120px] sm:w-[150px]` |
| `h-[96vh]` | Change to `h-[calc(100dvh-80px)]` or similar responsive calc |
| Empty `<div className="flex-1" />` spacers | Remove and use `justify-between` on parent |

---

## Phase 6: Code Cleanup

**Files:** `products-content.tsx`, `product-card.tsx`

- Remove unused `CopyIcon` import (line 7)
- Replace `style={{}}` static values with Tailwind classes where possible (lines 231-234, 253, 336)
- Add semantic HTML: wrap browser chrome in `<header>`, scrollable content in `<main>`
- Remove duplicate `handleDeleteProduct` (it's identical to `handleToggleArchive` with `currentStatus=false` — consolidate or clarify intent)

---

## Phase 7: Add Product Button Polish

**Files:** `products-content.tsx`

The dashed-border "Add Product" button (line 395-400) uses hardcoded dark-mode hex. After Phase 1 token migration, add:
- Hover scale effect (`hover:scale-[1.02]`)
- Subtle icon animation on hover (`group-hover:rotate-90 transition-transform`)
- Consistent border-radius with the product cards

---

## Execution Order

```
Phase 1 (colors)     → No risk, instant visual consistency
Phase 2 (typography) → No risk, fixes weight mismatch
Phase 3 (loading)    → Low risk, additive only
Phase 4 (modal)      → Low risk, uses existing animate-ui system
Phase 5 (layout)     → Low risk, responsive improvements
Phase 6 (cleanup)    → Zero risk, dead code removal
Phase 7 (polish)     → Zero risk, micro-interactions
```

**Total estimated changes:** ~150 lines touched across 4 files, zero new dependencies, zero logic changes.

---

## Verification Checklist

- [ ] All `--system-*` tokens used, no raw hex in className
- [ ] Typography classes (`body-base`, `label-xs`, `title-xl`) used consistently
- [ ] Loading skeletons visible when Convex queries are pending
- [ ] Modal uses animated Dialog with glassmorphism + squircle corners
- [ ] Layout responsive at 375px, 768px, 1024px, 1440px
- [ ] No unused imports
- [ ] `lsp_diagnostics` shows zero errors
- [ ] Existing product CRUD flows still work (add, edit, archive, delete)
