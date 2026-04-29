# Design System

> Single source of truth for all visual design decisions.
> Based on the current Marlon token layer and shared primitives.
> Version: 1.2.0

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
| `--color-primary` | `#0070F3` | Buttons, links, emphasis |
| `--color-primary-foreground` | `#FFFFFF` | Text on primary |

### Gray Scale 

| Token | Hex | Apple Equivalent | Usage |
|-------|-----|------------------|-------|
| `--system-50` | `#FAFAFA` | systemGray6 (lightest) | Page background |
| `--system-100` | `#F5F5F5` | systemGray5 | Card backgrounds, surfaces |
| `--system-200` | `#E5E5E5` | systemGray4 | Borders, dividers |
| `--system-300` | `#A3A3A3` | systemGray3 | Placeholder text, icons |
| `--system-400` | `#737373` | systemGray2 | Secondary text |
| `--system-500` | `#353737` | systemGray | Tertiary text |
| `--system-600` | `#262828` | - | Body text |
| `--system-700` | `#1D1E1F` | systemGray (darkest) | Primary text, headings |
| `--system-800` | `#0F1011` | - | Deep surfaces |
| `--system-900` | `#000000` | - | Never use (too harsh) |

### Semantic Colors 

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


### Brand Color 

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-brand` | `#00853F` | Brand accent, selected states |

---

## Typography

### Font Stack

| Token | Font | Usage |
|-------|------|-------|
| `--font-sans` | Nunito, Helvetica Neue, Arial, sans-serif fallback | All Latin UI copy |
| `--font-arabic` | Nunito, Helvetica Neue, Arial, sans-serif fallback | Arabic UI copy; same family for consistency |

### Locked Type Scale

Marlon now uses exactly five semantic scales across storefront and app surfaces.

| Token | Size | Line Height | Weight | Letter Spacing | Usage |
|-------|------|-------------|--------|----------------|-------|
| `--text-caption` | 12px | 16px | 400 | 0 | captions, metadata, compact support text |
| `--text-body-sm` | 14px | 20px | 400 | 0 | form labels, controls, dense UI copy |
| `--text-body` | 16px | 24px | 400 | 0 | default body copy |
| `--text-title` | 24px | 28px | 800 | -0.05em | section titles, dialogs, order/billing headings |
| `--text-display` | clamp(40px, 31.27px + 2.27vw, 56px) | clamp(44px, 52.36px - 1.09vw, 52px) | 900 | -0.08em | hero and marquee headlines |

Rules:

- Nunito only everywhere, including hero/storefront and Arabic UI.
- Only `title` and `display` use negative tracking.
- Arabic `title` and `display` content must remove negative tracking.
- `text-micro-label` is the only uppercase helper; it reuses the caption scale with quiet spacing.

### Semantic Typography Classes

Current semantic classes in `app/globals.css`:

```css
.text-caption
.text-body-sm
.text-body
.text-title
.text-display
.text-micro-label
```

Legacy aliases remain mapped for safety during migration:

- `body-base` -> `text-body`
- `label-xs` -> `text-micro-label`
- `text-heading-sm`, `text-heading`, `text-modal`, `title-xl` -> `text-title`
- `text-page`, `headline-2xl` -> `text-display`

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

## iOS Field Tokens

Shared text entry now follows the **iOS Settings-style inset-grouped field family** by default.

| Token | Value | Usage |
|-------|-------|-------|
| `--field-row-min-height` | `48px` | Minimum height for single-line field rows |
| `--field-textarea-min-height` | `92px` | Default minimum height for multiline text views |
| `--field-padding-x` | `16px` | Horizontal field padding |
| `--field-padding-y` | `12px` | Vertical field padding |
| `--field-label-gap` | `8px` | Label-to-field spacing |
| `--field-support-gap` | `6px` | Field-to-support/error spacing |
| `--field-accessory-gap` | `12px` | Leading/trailing accessory gap |
| `--field-group-radius` | `16px` | Rounded inset-group shape |
| `--field-separator-inset` | `12px` | Inline row label separation |

Color/tone tokens also exist for:
- light and dark field surfaces
- borders and focus rings
- labels, text, placeholders, and supporting text
- error colors in both light and dark variants

These values are implementation inferences tuned to current iOS control behavior on the web, not published Apple pixel specs.

---

## iOS Field Rules

- Canonical field family: **Settings-style inset-grouped rows**
- Default form layout: label above field (`stacked`)
- Optional settings/value layout: label and value inline (`row`)
- Use `Input` for single-line entry only
- Use `Textarea` for longer freeform content only
- Use the shared primitive instead of raw `<input>`/`<textarea>` unless a specialized surface truly requires custom behavior
- Choose semantic input traits deliberately:
  - email: email autocomplete/input mode, no autocapitalize
  - phone: tel autocomplete/input mode, no autocapitalize
  - url/slug: url input mode, no autocapitalize, no spellcheck
  - password: secure field defaults, no spellcheck
  - numeric price/count fields: decimal input mode
- Placeholder copy is secondary guidance; structured forms should prefer persistent labels
- Dark panels keep their existing panel chrome, but fields inside them should use the shared `dark` variant rather than custom one-off styling

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

1. **Phase 1**: Keep new work on the five semantic scales only.
2. **Phase 2**: Prefer semantic classes and shared primitives over raw `text-*` Tailwind sizes.
3. **Phase 3**: Use legacy aliases only as a transition aid; remove them when touching older surfaces.
4. **Phase 4**: Preserve existing hardcoded dark-area surfaces unless the task explicitly changes them.
5. **Phase 5**: When touching existing raw text-entry controls, migrate them to the shared `Input` or `Textarea` and choose `light` or `dark` explicitly for the host surface.

---

## Archive

- v0.1 (2024): Initial system with black/white grays
- v1.0 (2026): Apple-inspired color tokens + mixed Frosted UI typography
- v1.1 (2026-04-18): Inter-only five-scale typography system shared across app and storefront
- v1.2 (2026-04-18): Shared iOS-style field tokens, light/dark field variants, and field migration rules
- v1.3 (2026-04-29): Nunito-only typography direction replaces the previous Inter-only rule
