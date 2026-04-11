# Design System

> Single source of truth for all visual design decisions.
> Based on Apple Human Interface Guidelines + Frosted UI typography scale.
> Version: 1.0.0

---

## Design Principles

1. **Clarity**: Text should be legible, hierarchy should be clear
2. **Consistency**: Use tokens for everything - no hardcoded values
3. **Focus**: Dark areas for attention, light areas for content

---

## Color Palette

### Primary Brand

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#0070F3` | Buttons, links, emphasis (Apple systemBlue) |
| `--color-primary-foreground` | `#FFFFFF` | Text on primary |

### Gray Scale (Apple systemGray)

| Token | Hex | Apple Equivalent | Usage |
|-------|-----|------------------|-------|
| `--system-50` | `#FAFAFA` | systemGray6 (lightest) | Page background |
| `--system-100` | `#F5F5F5` | systemGray5 | Card backgrounds, surfaces |
| `--system-200` | `#E5E5E5` | systemGray4 | Borders, dividers |
| `--system-300` | `#A3A3A3` | systemGray3 | Placeholder text, icons |
| `--system-400` | `#737373` | systemGray2 | Secondary text |
| `--system-500` | `#525252` | systemGray | Tertiary text |
| `--system-600` | `#404040` | - | Body text |
| `--system-700` | `#171717` | systemGray (darkest) | Primary text, headings |
| `--system-800` | `#0A0A0A` | - | Deep surfaces |
| `--system-900` | `#000000` | - | Never use (too harsh) |

### Semantic Colors (Apple Semantic)

| Token | Hex | Apple Name | Usage |
|-------|-----|------------|-------|
| `--color-success` | `#34C759` | systemGreen | Success states, positive |
| `--color-success-bg` | `#34C7591A` | - | Success background (10% opacity) |
| `--color-warning` | `#FF9500` | systemOrange | Warning states |
| `--color-warning-bg` | `#FF95001A` | - | Warning background (10% opacity) |
| `--color-error` | `#FF3B30` | systemRed | Error states, destructive |
| `--color-error-bg` | `#FF3B301A` | - | Error background (10% opacity) |
| `--color-info` | `#5AC8FA` | systemTeal | Info states |
| `--color-info-bg` | `#5AC8FA1A` | - | Info background (10% opacity) |

### Legacy Status Colors (Keep for Order Status - Don't Change)

| Token | Hex | Usage |
|-------|-----|-------|
| `--status-success` | `#1BC57D` | Order succeeded (keep hardcoded) |
| `--status-warning` | `#FA9A34` | Order pending |
| `--color-destructive` | `#DC2626` | Error/destructive (standard red) |

### Brand Color (Green - Keep Existing)

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-brand` | `#00853F` | Brand accent, selected states |

---

## Typography

### Font Stack

| Token | Font | Usage |
|-------|------|-------|
| `--font-sans` | Inter, system-ui, sans-serif | Primary font |
| `--font-arabic` | IBM Plex Sans Arabic, Noto Sans Arabic | Arabic text |

### Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `--font-normal` | 400 | Body text, regular |
| `--font-medium` | 500 | Emphasis, labels |
| `--font-semibold` | 600 | Headings, buttons |
| `--font-bold` | 700 | Rarely used |

### Type Scale (Only What Marlon Needs)

| Token | Size | Line Height | Letter Spacing | Usage |
|-------|------|-------------|----------------|-------|
| `--text-caption` | 12px (0.75rem) | 16px (1) | 0 | Labels, badges, timestamps |
| `--text-body-sm` | 14px (0.875rem) | 20px (1.4) | 0 | Secondary body, form labels |
| `--text-body` | 16px (1rem) | 24px (1.5) | 0 | **Primary body copy** (most used) |
| `--text-heading-sm` | 18px (1.125rem) | 24px (1.3) | -0.01em | Emphasized body |
| `--text-heading` | 20px (1.25rem) | 28px (1.4) | -0.01em | Section headings, card titles |
| `--text-modal` | 24px (1.5rem) | 32px (1.3) | -0.02em | Modal headings |
| `--text-page` | 36px (2.25rem) | 44px (1.2) | -0.03em | Page titles, hero |

### Semantic Typography Classes

Use these instead of raw sizes:

```css
.text-caption { font-size: var(--text-caption); line-height: 16px; }
.text-body-sm { font-size: var(--text-body-sm); line-height: 20px; }
.text-body { font-size: var(--text-body); line-height: 24px; }
.text-heading-sm { font-size: var(--text-heading-sm); line-height: 24px; letter-spacing: -0.01em; }
.text-heading { font-size: var(--text-heading); line-height: 28px; letter-spacing: -0.01em; }
.text-modal { font-size: var(--text-modal); line-height: 32px; letter-spacing: -0.02em; }
.text-page { font-size: var(--text-page); line-height: 44px; letter-spacing: -0.03em; }
```

---

## Spacing

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-xs` | 4px | Tight spacing, icon gaps |
| `--spacing-sm` | 8px | Component internal spacing |
| `--spacing-md` | 16px | **Standard spacing** (most used) |
| `--spacing-lg` | 24px | Section spacing |
| `--spacing-xl` | 32px | Large section gaps |
| `--spacing-2xl` | 48px | Page-level spacing |

---

## Radius

| Token | Value | Apple Equivalent | Usage |
|-------|-------|------------------|-------|
| `--radius-sm` | 6px | small | Buttons, inputs |
| `--radius-md` | 10px | medium | Cards, modals |
| `--radius-lg` | 16px | large | Large cards, panels |
| `--radius-xl` | 20px | extra-large | Special elements |
| `--radius-full` | 9999px | capsule | Pills, avatars |

---

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgb(0 0 0 / 0.05)` | Subtle elevation |
| `--shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` | Cards, dropdowns |
| `--shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` | Modals, popovers |
| `--shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)` | Large overlays |

---

## Component-Specific Dark Areas (DO NOT CHANGE - Keep Hardcoded)

These areas use dark gradients for attention. **Keep existing hardcoded values:**

| Component | Current Style | Location |
|-----------|---------------|----------|
| Settings Dialog | `bg-[image:var(--gradient-popup)]` | `components/pages/editor/components/settings-dialog.tsx` |
| OrderDetails Sheet | `linear-gradient(0deg, #1D1E1F 0%, #353737 100%)` | `components/pages/orders/views/OrderDetails.tsx` |
| Bottom Navigation | Dark background | `components/primitives/core/layout/bottom-navigation.tsx` |
| Editor Browser Area | Dark/preview area | `app/editor/[storeSlug]/page.tsx` |
| Payment Modal | Dark card | `components/features/payment/payment-modal.tsx` |
| Locked Overlay | Dark theme | `components/pages/layout/locked-overlay.tsx` |

**Rule**: Any component with existing dark styling - do NOT refactor to tokens. Keep hardcoded.

---

## Usage Rules

### Do

```tsx
// ✅ CORRECT - Use design tokens
<div className="text-body text-[--system-700]">
<button className="bg-[--color-primary] text-[--color-primary-foreground]">
<div className="bg-[--system-100] border border-[--system-200]">
```

### Don't

```tsx
// ❌ WRONG - Hardcoded values
<div className="text-[#171717]">
<button className="bg-[#0070F3]">
<div className="bg-[#f5f5f5] border-[#e5e5e5]">
```

### Exceptions (Keep Hardcoded)

- Dark gradient areas (listed above)
- Status badge colors for order states (#1BC57D, #FA9A34, #F44055)
- Brand color (#00853f) in image-cropper and variant-editor

---

## Migration Guide

1. **Phase 1**: Update globals.css with new tokens
2. **Phase 2**: Create design-tokens.ts for TypeScript access
3. **Phase 3**: Fix components using grep + replace
4. **Phase 4**: Skip dark areas (keep as-is)

---

## Archive

- v0.1 (2024): Initial system with black/white grays
- v1.0 (2026): Apple design tokens + Frosted UI typography