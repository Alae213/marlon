## Editor Page Tasks

Here is a breakdown of tasks to improve the `app/editor/[storeSlug]/page.tsx` page by focusing on UI and layout enhancements as per the provided Figma design:

### Implementation Tasks - Ordered by Scope and Specificity

### 1. Apply the Boxed Layout (Main Layout Changes)
- Update the layout wrapper in `app/editor/[storeSlug]/page.tsx` to use a centered, boxed container (`max-w-screen-md` or `mx-auto`).
- Add relevant Tailwind classes to ensure consistency across all screen sizes.
- **Files involved**: 
  - `app/editor/[storeSlug]/page.tsx`

---

### 2. Add Background Pattern
- Integrate the background pattern (sunglasses design) into the editor page.
- Use reusable classes or `globals.css` for site-wide styling.
- **Files involved**:
  - `app/editor/[storeSlug]/page.tsx`
  - `app/globals.css` (for reusable background definitions)

---

### 3. Enhance Shared Components
- **Button Component**:
  - Add support for a `rounded-full` variant with hover effects (e.g., `hover:scale-105`).
  - **Files involved:**
    - `components/core/button.tsx`
    - `components/core/button.module.css` (if scoped CSS is used)

- **Card Component**:
  - Add a `variant="dashed"` style to support the "+ Add Product" button card.
  - **Files involved:**
    - `components/core/card.tsx`
    - `components/core/card.module.css` (if scoped CSS is used)

- **ImagePlaceholder Component**:
  - Create an `ImagePlaceholder` component for placeholders, including a default graphic and customizable gradient.
  - **Files involved:**
    - `components/core/image-placeholder.tsx` (new file, shared component)

---

### 4. Header Section
- Adjust the header layout to match the Figma design with logo on the left, navigation links in the center, and profile picture on the right.
- Leverage existing shared components like `Link` and `UserButton` for better consistency, while adding utility classes for alignment and spacing.
- **Files involved:**
  - `app/editor/[storeSlug]/page.tsx`

---

### 5. Hero Section Layout
- Add the hero layout, including:
  - The centralized hero title ("Be Your self or be Better") styled in bold and large typography.
  - Add the `Find your Soul` button using the revamped `Button` component.
  - Incorporate a repeating sunglasses-themed background pattern and add proper spacing above/below.
- **Files involved:**
  - `app/editor/[storeSlug]/page.tsx`

---

### 6. Products Section
- Add the heading "Our Products" styled as per Figma design (`text-2xl font-bold`).
- Update individual product card layout:
  - Standardize spacing, alignment, aspect ratio.
  - Enhance product title and pricing format.
  - Inline editing for title, base price, and old price fields.
- Add "+ Add Product" card with updated `Card` component featuring dashed border style.
- Use the new `ImagePlaceholder` shared component for product image placeholders.
- **Files involved:**
  - `app/editor/[storeSlug]/page.tsx`
  - `components/core/card.tsx`

---

### 7. Footer Section
- Create a footer layout as per the Figma design:
  - **Left:** Store logo in a circular avatar box with accompanying text.
  - **Center:** Contact details (phone, email) with inline editing support.
  - **Right:** Social media buttons for Facebook, Instagram, Twitter, and WhatsApp with active/inactive states represented by border styles.
  - Ensure alignment, responsive spacing, and background consistency.
- **Files involved:**
  - `app/editor/[storeSlug]/page.tsx`

---

### Final Task: Test and Refine
- Verify that all updates are fully responsive.
- Test for seamless dark mode support using Tailwind's `dark:` utilities.
- Fix any design or alignment issues found during testing.
- **Files involved:**
  - `app/editor/[storeSlug]/page.tsx`
  - Updated shared components

---

## Integration Tasks: Wrap Editor Content with Reference Browser Shell

Use the reference `components/editor/Canvas.tsx` shell structure to wrap the existing editor content in `app/editor/[storeSlug]/page.tsx` without changing business logic.

1) **Review reference shell**
   - Inspect `components/editor/Canvas.tsx` for structure: outer full-screen wrapper, framed container (gradient + shadow), top bar (left/center/right), ScrollArea viewport, scrollbar.
   - Note Tailwind classes and style tokens (`var(--gradient-popup)`, `var(--shadow-xl-shadow)`, `var(--shadow-inside-shadow)`, `var(--system-xxx)`).

2) **Review current page content**
   - Inspect `app/editor/[storeSlug]/page.tsx` for main sections: header, toolbar, navbar editor, hero editor, products, footer, modals, bottom navigation.

3) **Decide on wrapping strategy**
   - Create an `EditorShell` wrapper component (recommended) or inline the shell.
   - Define shell slots: top bar (left/center/right) and viewport area for existing content.

4) **Map actions and controls**
   - Decide which current controls go into the top bar (preview link, settings, logo/home, user avatar).
   - Replace reference-specific buttons (Undo/Copy/Delete/View) with current equivalents.

5) **Plan content placement**
   - Move existing editor sections (header through footer) into the shell’s ScrollArea viewport.
   - Keep modals and BottomNavigation as siblings if they rely on portals/fixed positioning.

6) **Asset and token check**
   - Ensure style tokens used by the shell exist (they do in `globals.css`).
   - Swap or supply icons/assets (window icon, favicon) if needed, or remove them.

7) **Responsive and overflow plan**
   - Preserve the ScrollArea for vertical scrolling; keep padding/rounding from the reference shell.
   - Verify RTL and dark-mode compatibility.

8) **Non-goals / stability**
   - Do not change data fetching, mutations, inline-edit logic, or routing.
   - Only adjust layout wrappers and placements.

9) **Validation pass**
   - After wrapping, visually verify the frame/top bar/scroll behavior and that inner sections remain intact.
   - Check small screens for padding/spacing and ensure BottomNavigation still appears.
