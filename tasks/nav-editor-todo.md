# Navbar Editor Implementation Plan

> **Version:** 1.0  
> **Date:** 2026-03-15  
> **Status:** Pending Review  
> **Priority:** High

---

## 1. Overview

This document outlines the implementation plan for revamping the **Navbar Editor** component in the Marlon e-commerce editor. The revisions focus on:

- Editable navigation links with drag-and-drop reordering
- Enhanced logo interaction with floating toolbar
- Simplified toolbar with 3 background modes (Light/Dark/Glass)
- Mobile-responsive hamburger menu

---

## 2. Requirements Summary

### 2.1 Navigation Links

| Requirement | Details |
|-------------|---------|
| **Default Links** | 3 fixed: "Shop" (→ `#products`), "FAQ" (→ `/`), "Help" (→ `/`) |
| **Custom Links** | User can add custom links (text + URL) |
| **Max Links** | 3 fixed + unlimited custom (display: first 3 on desktop) |
| **Reordering** | Drag-and-drop on desktop; long-press on mobile |
| **Editability** | Click to edit link text and URL |

### 2.2 Logo

| Requirement | Details |
|-------------|---------|
| **Hover Action** | Show floating toolbar (not tooltip) |
| **Toolbar Actions** | Change (upload new), Delete (remove logo), Crop |
| **Default** | Show package icon if no logo |

### 2.3 Toolbar (Style Options)

| Requirement | Details |
|-------------|---------|
| **Position** | Bottom center of navbar, floats on hover |
| **Background Modes** | Light, Dark, Glass |
| **Light Mode** | White bg + Dark text (text locked) |
| **Dark Mode** | Black bg + Light text (text locked) |
| **Glass Mode** | Transparent + blur(24px) + text color toggle (Dark/Light) |

### 2.4 Mobile Responsiveness

| Requirement | Details |
|-------------|---------|
| **Desktop** | Logo left + Links center + Cart right |
| **Mobile** | Logo left + Cart right + Hamburger right |
| **Hamburger Menu** | Slides from right, contains links list |
| **Drag & Drop** | Disabled on mobile, use long-press to reorder |

---

## 3. Data Model Changes

### 3.1 Backend Schema Update

**File:** `convex/siteContent.ts`

```typescript
interface NavbarContent {
  logoStorageId?: string;
  logoUrl?: string;
  background?: "dark" | "light" | "glass";
  textColor?: "dark" | "light";
  // Glass mode: textColor is editable
  // Light/Dark mode: textColor is locked
  links: NavbarLink[];
  showCart?: boolean;
}

interface NavbarLink {
  id: string;           // unique identifier for drag/drop
  text: string;        // display text
  url: string;         // href
  isDefault: boolean;  // true for Shop/FAQ/Help
  enabled: boolean;
}
```

### 3.2 Frontend Types

**File:** `components/editor/types.ts`

```typescript
export interface NavbarLink {
  id: string;
  text: string;
  url: string;
  isDefault: boolean;
  enabled: boolean;
}

export interface NavbarContent {
  logoStorageId?: string;
  logoUrl?: string;
  background?: "dark" | "light" | "glass";
  textColor?: "dark" | "light";
  links: NavbarLink[];
  showCart?: boolean;
}
```

---

## 4. API Endpoints

### 4.1 New Mutations Required

| Mutation | Parameters | Description |
|----------|------------|-------------|
| `setNavbarStyles` | `storeId`, `background`, `textColor?` | Update background mode (existing) |
| `setNavbarLinks` | `storeId`, `links: NavbarLink[]` | Update links with order |
| `addNavbarLink` | `storeId`, `link: NavbarLink` | Add single link |
| `removeNavbarLink` | `storeId`, `linkId: string` | Remove link by ID |
| `updateNavbarLink` | `storeId`, `linkId`, `text`, `url` | Update link details |
| `setLogoAndSyncFooter` | `storeId`, `logoStorageId` | (existing) |

### 4.2 Updated Default Content

```typescript
export const DEFAULT_NAVBAR: NavbarContent = {
  background: "light",
  textColor: "dark",
  links: [
    { id: "link-1", text: "Shop", url: "#products", isDefault: true, enabled: true },
    { id: "link-2", text: "FAQ", url: "/", isDefault: true, enabled: true },
    { id: "link-3", text: "Help", url: "/", isDefault: true, enabled: true },
  ],
  showCart: true,
};
```

---

## 5. Implementation Tasks

### Phase 1: Backend Updates

| Task | Description | File |
|------|-------------|------|
| 1.1 | Update `NavbarContent` interface with `links` array | `convex/siteContent.ts` |
| 1.2 | Add `setNavbarLinks` mutation | `convex/siteContent.ts` |
| 1.3 | Add `addNavbarLink` mutation | `convex/siteContent.ts` |
| 1.4 | Add `removeNavbarLink` mutation | `convex/siteContent.ts` |
| 1.5 | Add `updateNavbarLink` mutation | `convex/siteContent.ts` |
| 1.6 | Update `DEFAULT_NAVBAR` with new links structure | `convex/siteContent.ts` |
| 1.7 | Run Convex migration (if needed for existing stores) | - |

### Phase 2: Frontend Types & Utils

| Task | Description | File |
|------|-------------|------|
| 2.1 | Update `NavbarContent` and `NavbarLink` types | `components/editor/types.ts` |
| 2.2 | Add `generateId()` utility for link IDs | `components/editor/utils.ts` |

### Phase 3: NavbarEditor Component

| Task | Description | File |
|------|-------------|------|
| 3.1 | Remove old toolbar (hover on navbar) | `components/editor/navbar-editor.tsx` |
| 3.2 | Implement floating toolbar at bottom center | `components/editor/navbar-editor.tsx` |
| 3.3 | Implement 3 background modes (Light/Dark/Glass) | `components/editor/navbar-editor.tsx` |
| 3.4 | Add Glass mode text color toggle | `components/editor/navbar-editor.tsx` |
| 3.5 | Lock text color in Light/Dark modes | `components/editor/navbar-editor.tsx` |

### Phase 4: Navigation Links

| Task | Description | File |
|------|-------------|------|
| 4.1 | Render default 3 links + custom links | `components/editor/navbar-editor.tsx` |
| 4.2 | Implement drag-and-drop reordering (desktop) | `components/editor/navbar-editor.tsx` |
| 4.3 | Implement long-press reorder (mobile) | `components/editor/navbar-editor.tsx` |
| 4.4 | Add link edit modal/inline editor | `components/editor/navbar-editor.tsx` |
| 4.5 | Add "Add Link" button | `components/editor/navbar-editor.tsx` |
| 4.6 | Add "Delete Link" button for custom links | `components/editor/navbar-editor.tsx` |

### Phase 5: Logo Toolbar

| Task | Description | File |
|------|-------------|------|
| 5.1 | Replace tooltip with floating toolbar on hover | `components/editor/navbar-editor.tsx` |
| 5.2 | Add "Change" button → opens file picker | `components/editor/navbar-editor.tsx` |
| 5.3 | Add "Delete" button → removes logo | `components/editor/navbar-editor.tsx` |
| 5.4 | Add "Crop" button → opens ImageCropper | `components/editor/navbar-editor.tsx` |

### Phase 6: Mobile Responsiveness

| Task | Description | File |
|------|-------------|------|
| 6.1 | Add hamburger menu button (mobile only) | `components/editor/navbar-editor.tsx` |
| 6.2 | Implement slide-from-right drawer | `components/editor/navbar-editor.tsx` |
| 6.3 | Move links to drawer on mobile | `components/editor/navbar-editor.tsx` |
| 6.4 | Keep cart icon visible on mobile | `components/editor/navbar-editor.tsx` |

### Phase 7: Styling & Polish

| Task | Description | File |
|------|-------------|------|
| 7.1 | Glass mode: `backdrop-filter: blur(24px)` | `components/editor/navbar-editor.tsx` |
| 7.2 | Toolbar styling (glass effect, centered) | `components/editor/navbar-editor.tsx` |
| 7.3 | Drag handle styling | `components/editor/navbar-editor.tsx` |
| 7.4 | Mobile drawer animations | `components/editor/navbar-editor.tsx` |

---

## 6. UI/UX Specifications

### 6.1 Toolbar (Floating at Bottom Center)

```
┌─────────────────────────────────────────────────────────┐
│  Logo    [Link 1] [Link 2] [Link 3] ...      [Cart]   │
│                                                         │
│                                                         │
│                                              ┌────────┐ │
│                                              │ 🎨 Light│ │
│                                              │ 🌙 Dark │ │
│                                              │ ✨ Glass│ │
│                                              └────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Toolbar States:**

- **Light Mode:** Light bg + Dark text (no text toggle)
- **Dark Mode:** Dark bg + Light text (no text toggle)
- **Glass Mode:** Transparent + blur(24px) + text toggle [Dark|Light]

### 6.2 Logo Toolbar (On Hover)

```
┌──────┐
│  🖼  │  ← Hover logo → Shows: [تغيير] [حذف] [قص]
└──────┘
```

### 6.3 Mobile Layout

```
┌─────────────────────────────────┐
│ [Logo]                      [🛒] [☰]   ← Header only
└─────────────────────────────────┘

When hamburger clicked:
┌─────────────────────────────────┐
│                         [✕]    │
│  Shop                          │
│  FAQ                           │
│  Help                          │
│  ────────                      │
│  + إضافة رابط                   │
└─────────────────────────────────┘
     ↑
  Slides from right
```

### 6.4 Link Reorder (Desktop)

```
[≡] Shop     [≡] FAQ     [≡] Help    [+ Add]
```

- Drag handle (≡) on left of each link
- Hover shows reorder cursor

### 6.5 Link Reorder (Mobile)

```
Shop        [↑] [↓]
FAQ         [↑] [↓]
Help        [↑] [↓]
────────────
+ إضافة رابط
```

- Long-press link to enter reorder mode
- Arrow buttons appear on right

---

## 7. Component State Structure

```typescript
interface NavbarEditorState {
  // Style
  background: "light" | "dark" | "glass";
  textColor: "dark" | "light";
  
  // Links
  links: NavbarLink[];
  editingLinkId: string | null;
  
  // Logo
  logoToolbarOpen: boolean;
  
  // Mobile
  mobileMenuOpen: boolean;
  mobileReorderMode: boolean;
  
  // Toolbar visibility
  styleToolbarOpen: boolean;
}
```

---

## 8. User Flows

### 8.1 Change Background Mode

```
1. User hovers over navbar
2. Floating toolbar appears at bottom center
3. User clicks "Glass"
4. Navbar becomes transparent + blur
5. Text color toggle appears (Dark/Light)
6. User selects "Light"
7. Text color updates to white
8. Mutation: setNavbarStyles({ storeId, background: "glass", textColor: "light" })
```

### 8.2 Reorder Links (Desktop)

```
1. User hovers over link
2. Drag handle (≡) appears
3. User drags link to new position
4. Links array reorders
5. On drop: Mutation setNavbarLinks({ storeId, links: newOrder })
```

### 8.3 Add Custom Link

```
1. User clicks "+ إضافة رابط"
2. Modal opens with fields: النص, الرابط
3. User enters: "العروض الخاصة" → "/offers"
4. User clicks "إضافة"
5. New link added to links array
6. Mutation: addNavbarLink({ storeId, link: { id, text, url, isDefault: false } })
```

### 8.4 Logo Actions

```
1. User hovers over logo
2. Toolbar appears: [تغيير] [حذف] [قص]
3. User clicks "قص" (Crop)
4. ImageCropper modal opens
5. User crops image
6. On confirm: uploadToStorage → setLogoAndSyncFooter
```

---

## 9. Edge Cases

| Scenario | Handling |
|----------|----------|
| Delete last custom link | Allow, keep 3 default links |
| Delete default link | Disable delete button for default links |
| Empty custom URL | Validate: show error, require valid URL |
| Very long link text | Truncate with ellipsis (max 20 chars display) |
| Glass mode + light hero | Ensure contrast is acceptable |
| Mobile + many links | Scrollable in drawer if > 5 |

---

## 10. Testing Checklist

- [ ] Light/Dark/Glass modes render correctly
- [ ] Glass mode shows text color toggle
- [ ] Light mode locks text to dark
- [ ] Dark mode locks text to light
- [ ] Drag-and-drop works on desktop
- [ ] Long-press reorder works on mobile
- [ ] Default links cannot be deleted
- [ ] Custom links can be added/edited/deleted
- [ ] Logo toolbar appears on hover
- [ ] Crop/Delete/Change logo work
- [ ] Mobile hamburger menu slides from right
- [ ] Mobile shows logo + cart + hamburger
- [ ] Desktop shows logo + links + cart

---

## 11. Dependencies

- `@dnd-kit/core` - Drag and drop (or `@hello-pangea/dnd` for React 18)
- `framer-motion` - Animations (already installed)
- `lucide-react` - Icons (already installed)
- `ImageCropper` - Existing component (reused)
- `useImageUpload` - Existing hook (reused)

---

## 12. Files to Modify

| File | Changes |
|------|---------|
| `convex/siteContent.ts` | Add mutations, update types |
| `components/editor/types.ts` | Update NavbarContent type |
| `components/editor/utils.ts` | Add generateId utility |
| `components/editor/navbar-editor.tsx` | Full rewrite |
| `components/editor/index.ts` | Export new types if needed |

---

## 13. Implementation Order

1. **Backend first** — Schema + Mutations
2. **Types** — Frontend interfaces
3. **Core UI** — Basic navbar with new data
4. **Style toolbar** — 3 background modes
5. **Links** — Display + Add + Edit + Delete
6. **Drag & drop** — Desktop + Mobile
7. **Logo toolbar** — Hover actions
8. **Mobile** — Hamburger menu
9. **Polish** — Animations, styling

---

## 14. Estimated Complexity

| Phase | Complexity | Est. Time |
|-------|------------|-----------|
| Backend | Medium | 1-2 hours |
| Types & Utils | Low | 30 min |
| Core UI | Medium | 2-3 hours |
| Style Toolbar | Medium | 2 hours |
| Links + Drag | High | 3-4 hours |
| Logo Toolbar | Medium | 1-2 hours |
| Mobile | Medium | 2-3 hours |
| Polish | Low | 1 hour |
| **Total** | - | **~14-17 hours** |

---

## 15. Open Questions (For Follow-up)

- [ ] Should we use a DnD library or native HTML5 drag?
- [ ] Do we need link click analytics?
- [ ] Should we support RTL for Arabic links?
- [ ] Maximum custom link URL length?

---

> **Ready for implementation?** Reply with "Proceed" to start building.
