# UX Patterns

> Locked interaction patterns — follow these to maintain consistency.

## Navigation

### Layout Structure
- **Sidebar navigation** for dashboard (left side, collapsible on mobile)
- **Top bar** with store selector, notifications, user menu
- **Breadcrumbs** for nested pages: `Stores / My Store / Orders / #1234`

### Page Transitions
- Use Framer Motion for smooth transitions
- Fade + slide from right for page navigation
- No full-page reloads — use client-side routing

### Mobile Behavior
- Bottom tab bar for primary navigation on mobile
- Sidebar becomes slide-out drawer
- Touch targets minimum 44px

## Forms

### Input Fields
- **Labels** always visible above input
- **Placeholder** shows example format, not label duplication
- **Error states** show red border + error message below
- **Validation** on blur for format, on submit for required

### Form Layout
- Single column on mobile, max 2 columns on desktop
- Group related fields with `<fieldset>`
- Primary action right-aligned, secondary actions left

### Submission
- Loading state on submit button (spinner + "Saving...")
- Disable form during submission
- Show success toast on completion
- Redirect or reset form after success

## Pre-Signup Onboarding

### Unauthenticated Entry
- Non-authenticated users start directly on Question 1; do not place a landing CTA or intro step before it.
- Use a 4-step progress bar with `1 / 4` style step text.
- Single-choice questions require one selected option; multi-select questions require at least one selected option.
- After completion, show the authenticated-style `new store` preview and open the Google sign-up modal immediately.
- If the sign-up modal closes, keep the preview visible and show a `Continue with Google` action.

## Loading States

### Skeleton Screens
- Use skeleton loaders matching content layout
- Animate with subtle pulse (opacity 0.5 → 1 → 0.5)
- Show skeleton immediately, then content

### Inline Loading
- Button loading: spinner + disabled state
- Table loading: skeleton rows matching row count
- Card loading: shimmer effect

### Full-Page Loading
- Centered spinner + message: "Loading..."
- Never show blank page during navigation
- Use Next.js `loading.tsx` for route-level loading

## Empty States

### When to Show
- No orders yet
- No products in store
- No delivery providers configured

### What to Include
- Illustration or icon (use Lucide)
- Clear headline: "No orders yet"
- Actionable subtext: "Create your first order to get started"
- Primary CTA button when applicable

### Design
- Center content vertically in available space
- Muted colors for illustration (gray-400)
- Full-width on mobile, centered max-width 400px on desktop

## Error Handling

### Error Messages
- Be specific: "Unable to create order — daily limit exceeded" not "Error occurred"
- Show context: what action failed, why, what to do next
- Never expose internal error details to users

### Error States by Severity
- **Minor** (validation): inline error below field
- **Moderate** (action failed): toast notification
- **Severe** (system down): full-page error with retry button

### Recovery
- Provide clear path to recover: "Try again" or "Contact support"
- Log error to console with full details for debugging
- Never show raw error stack traces

## Accessibility

### Keyboard Navigation
- All interactive elements focusable
- Logical tab order
- Visible focus indicator (ring-2, primary color)

### Screen Reader
- Semantic HTML: `<button>`, `<nav>`, `<main>`, `<article>`
- ARIA labels for icons and non-text elements
- Announce dynamic content changes

### Color & Contrast
- Minimum 4.5:1 for text, 3:1 for UI elements
- Never rely on color alone for meaning
- Support system font size settings
