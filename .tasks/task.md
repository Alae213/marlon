# Task: Split Editor Page into Components

## Context

`app/editor/[storeSlug]/page.tsx` is **1886 lines** containing 7 components in a single file. This causes:
- Poor maintainability and readability
- Unnecessary re-renders (all components re-render together)
- Difficulty in testing individual pieces
- Violation of single-responsibility principle

## Goal

Extract all sub-components into `components/editor/` with proper separation of concerns, fix identified bugs, and improve performance.

---

## File Structure (Target)

```
components/editor/
├── index.ts                          # Barrel export
├── products-content.tsx              # Main products grid/list + inline editing
├── product-form.tsx                  # Add/Edit product modal form
├── product-card.tsx                  # Single product card (grid view)
├── product-list-item.tsx             # Single product row (list view)
├── delete-confirm-overlay.tsx        # Delete confirmation overlay
├── navbar-editor.tsx                 # Navbar preview + style controls + logo upload
├── hero-editor.tsx                   # Hero section preview + inline edit + layout toggle
├── footer-editor.tsx                 # Footer section preview + inline edit + social links
├── settings-dialog.tsx               # Settings dialog shell with tabs
├── preferences-settings.tsx          # Theme toggle + preview
├── delivery-pricing-settings.tsx     # Wilaya pricing table
├── delivery-integration-settings.tsx # Courier API credentials + test
├── store-info-settings.tsx           # Store name/description/phone form
├── hooks/
│   ├── use-image-upload.ts           # Shared uploadToConvexStorage logic
│   └── use-inline-edit.ts            # Shared inline editing state/logic
└── types.ts                          # Shared interfaces (Variant, Product, NavbarContent, etc.)
```

---

## Implementation Steps

### Step 1: Create `components/editor/types.ts`

Extract all interfaces from lines 36-92:

```ts
// Move these interfaces:
- Variant (line 36-39)
- VariantOption (line 41-44)
- NavbarContent (line 46-56)
- HeroContent (line 58-65)
- FooterContent (line 67-76)
- Product (line 78-92)
- ProductFormData (line 1213-1221)
```

### Step 2: Create `components/editor/hooks/use-image-upload.ts`

Extract `uploadToConvexStorage` (lines 322-388) into a custom hook:

```ts
// Hook signature:
export function useImageUpload(storeId: Id<"stores">) {
  const generateUploadUrl = useMutation(api.siteContent.generateUploadUrl);
  
  const uploadToStorage = async (dataUrl: string): Promise<string> => { ... };
  
  const resolveImageStorageIds = async (images: string[]): Promise<string[]> => {
    return Promise.all(images.map(img => 
      img.startsWith("data:") ? uploadToStorage(img) : img
    ));
  };
  
  return { uploadToStorage, resolveImageStorageIds };
}
```

**Fixes to apply:**
- Remove excessive `console.log` statements (lines 325-376)
- Keep only error logging

### Step 3: Create `components/editor/hooks/use-inline-edit.ts`

Extract inline editing state and handlers (lines 108-213):

```ts
export function useInlineEdit(updateProduct: ...) {
  const [editingField, setEditingField] = useState<...>(null);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const startEditing = (...) => { ... };
  const saveInlineEdit = async () => { ... };
  const handleKeyDown = (e: React.KeyboardEvent) => { ... };
  
  return { editingField, editValue, isSaving, startEditing, saveInlineEdit, handleKeyDown, setEditingField, setEditValue };
}
```

### Step 4: Create `components/editor/product-card.tsx`

Extract grid view product card (lines 760-908):

```tsx
// Props:
interface ProductCardProps {
  product: Product;
  editingField: EditingFieldState;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onStartEditing: (productId: string, field: string, value: string | number) => void;
  onSaveEdit: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onEdit: (product: Product) => void;
  onToggleArchive: (productId: string, currentStatus?: boolean) => void;
  onDelete: (productId: string) => void;
  deletingProductId: string | null;
  onCancelDelete: () => void;
  onConfirmDelete: (productId: string) => void;
}
```

### Step 5: Create `components/editor/product-list-item.tsx`

Extract list view product row (lines 921-985):

```tsx
// Props:
interface ProductListItemProps {
  product: Product;
  onEdit: (product: Product) => void;
  onToggleArchive: (productId: string, currentStatus?: boolean) => void;
}
```

### Step 6: Create `components/editor/delete-confirm-overlay.tsx`

Extract delete confirmation overlay (lines 887-907):

```tsx
// Props:
interface DeleteConfirmOverlayProps {
  onCancel: () => void;
  onConfirm: () => void;
}
```

### Step 7: Create `components/editor/product-form.tsx`

Extract `ProductForm` component (lines 1223-1350):

**Fixes to apply:**
- Move `EditorVariant` interface outside the component (line 1224-1227)
- Move `convertToEditorFormat` outside the component (line 1229-1235)
- Add proper validation (currently just `if (!name || !basePrice) return;` with no feedback)

### Step 8: Create `components/editor/navbar-editor.tsx`

Extract navbar preview section (lines 482-578):

```tsx
// Props:
interface NavbarEditorProps {
  storeId: Id<"stores">;
  navbarContent: NavbarContent | undefined;
  isUploadingLogo: boolean;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
```

**Fixes to apply:**
- Extract `handleSetNavbarStyle` into this component
- Extract `handleSelectLogoFile` into this component
- Extract `handleApplyLogoCrop` into this component
- Move `navbarBgClass` and `navbarTextClass` computations here

### Step 9: Create `components/editor/hero-editor.tsx`

Extract hero section (lines 582-741):

```tsx
// Props:
interface HeroEditorProps {
  storeId: Id<"stores">;
  heroContent: HeroContent | undefined;
  editingField: EditingFieldState;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onStartEditing: (field: string, value: string) => void;
  onSaveEdit: () => void;
}
```

**Fixes to apply:**
- Add user-facing error feedback for background upload (line 728 — currently only `console.error`)
- Extract hero background upload handler into this component

### Step 10: Create `components/editor/footer-editor.tsx`

Extract footer section (lines 991-1169):

```tsx
// Props:
interface FooterEditorProps {
  storeId: Id<"stores">;
  footerContent: FooterContent | undefined;
  navbarContent: NavbarContent | undefined;
  editingField: EditingFieldState;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onStartEditing: (field: string, value: string) => void;
  onSaveEdit: () => void;
}
```

### Step 11: Create `components/editor/preferences-settings.tsx`

Extract `PreferencesSettings` (lines 1352-1429) — no changes needed, just move.

### Step 12: Create `components/editor/delivery-pricing-settings.tsx`

Extract `DeliveryPricingSettings` (lines 1523-1614):

**Fixes to apply:**
- Move `wilayas` array outside the component (line 1539-1546) — it's a constant
- Fix `defaultValue` → controlled `value` with state synced via `useEffect` (lines 1591, 1598)
- Add `key={wilaya + JSON.stringify(pricing)}` to force re-render when data loads

### Step 13: Create `components/editor/delivery-integration-settings.tsx`

Extract `DeliveryIntegrationSettings` (lines 1616-1781):

**Fixes to apply:**
- Add `useEffect` to sync state when `deliveryIntegration` query resolves (critical bug — lines 1626-1628)

### Step 14: Create `components/editor/store-info-settings.tsx`

Extract `StoreInfoSettings` (lines 1783-1850):

**Fixes to apply:**
- Add `useEffect` to sync state when `store` query resolves (critical bug — lines 1786-1788)

### Step 15: Create `components/editor/settings-dialog.tsx`

Extract `SettingsDialog` (lines 1431-1521):

```tsx
// Props:
interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: Id<"stores">;
  storeSlug: string;
  initialTab?: string;
}
```

### Step 16: Create `components/editor/products-content.tsx`

Extract `ProductsContent` (lines 94-1211) — this becomes the main orchestrator:

**Fixes to apply:**
- Remove unused queries: `_deliveryPricing`, `_deliveryIntegration` (lines 138-146)
- Remove unused mutations: `_setDeliveryPricing`, `_setDeliveryIntegration`, `_testDeliveryConnection` (lines 151-153)
- Remove unused state: `_isSaving`, `_setIsSaving` (line 111)
- Remove unused variable: `_isLoading` (line 157)
- Remove unused import: `_setViewMode` (line 96) — use `viewMode` directly or remove if not needed
- Fix race condition in edit modal: await `handleUpdateProduct` before closing (line 1197-1199)
- Use `useCallback` for all handlers passed to children
- Use `Id<"stores">` type for `storeId` prop instead of `string`
- Fix `parseInt` → `parseInt(..., 10)` (lines 192, 258)

### Step 17: Create `components/editor/index.ts`

Barrel export:
```ts
export { ProductsContent } from './products-content';
export { ProductForm } from './product-form';
export { NavbarEditor } from './navbar-editor';
export { HeroEditor } from './hero-editor';
export { FooterEditor } from './footer-editor';
export { SettingsDialog } from './settings-dialog';
export { PreferencesSettings } from './preferences-settings';
export { DeliveryPricingSettings } from './delivery-pricing-settings';
export { DeliveryIntegrationSettings } from './delivery-integration-settings';
export { StoreInfoSettings } from './store-info-settings';
```

### Step 18: Rewrite `app/editor/[storeSlug]/page.tsx`

Slim down to ~50 lines:

```tsx
"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Loader2 } from "lucide-react";
import { RealtimeProvider } from "@/contexts/realtime-context";
import { ProductsContent } from "@/components/editor";

export default function EditorPage() {
  const params = useParams();
  const storeSlug = params?.storeSlug as string;
  
  const store = useQuery(
    api.stores.getStoreBySlug,
    storeSlug ? { slug: storeSlug } : "skip"
  );
  
  const storeId = store?._id as Id<"stores"> | undefined;
  
  if (!store && storeSlug) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-[#171717] dark:text-[#fafafa]" />
      </div>
    );
  }
  
  if (!storeId) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] p-12 text-center">
          <p className="text-[#737373]">المتجر غير موجود</p>
        </div>
      </div>
    );
  }
  
  return (
    <RealtimeProvider storeId={storeId}>
      <ProductsContent storeId={storeId} storeSlug={storeSlug} />
    </RealtimeProvider>
  );
}
```

---

## Bug Fixes Summary

| # | Bug | Location | Fix |
|---|-----|----------|-----|
| 1 | Edit modal closes before mutation completes | Line 1197-1199 | `await handleUpdateProduct(updated)` |
| 2 | Delivery pricing inputs use `defaultValue` with async data | Lines 1591, 1598 | Controlled state + `useEffect` sync |
| 3 | Delivery integration state never syncs with query result | Lines 1626-1628 | `useEffect` on `deliveryIntegration` |
| 4 | Store info state never syncs with query result | Lines 1786-1788 | `useEffect` on `store` |
| 5 | `parseInt` without radix | Lines 192, 258, 1592, 1599 | `parseInt(val, 10)` |
| 6 | No user feedback on hero background upload error | Line 728 | Add error state + toast |
| 7 | No user feedback on logo upload error | Line 409 | Add error state + toast |

## Performance Fixes Summary

| # | Issue | Fix |
|---|-------|-----|
| 1 | 8 Convex queries, 3 unused | Remove `_deliveryPricing`, `_deliveryIntegration` queries |
| 2 | 5 unused mutations/actions | Remove `_setDeliveryPricing`, `_setDeliveryIntegration`, `_testDeliveryConnection` |
| 3 | No `useCallback` on handlers | Wrap all handlers in `useCallback` |
| 4 | `formatPrice` recreated every render | Move outside component |
| 5 | `wilayas` array recreated every render | Move outside component |

## Verification Checklist

- [ ] All components render without errors
- [ ] Inline editing works (name, price, old price)
- [ ] Hero title/CTA inline editing works
- [ ] Footer phone/email/copyright inline editing works
- [ ] Product create modal works
- [ ] Product edit modal works (and shows errors on failure)
- [ ] Product archive/unarchive works
- [ ] Product delete with confirmation works
- [ ] Logo upload + crop works
- [ ] Hero background upload works (with error feedback)
- [ ] Navbar style toggles work
- [ ] Hero layout toggles work
- [ ] Settings dialog opens/closes
- [ ] Theme toggle works
- [ ] Delivery pricing saves on blur
- [ ] Delivery integration provider switch works
- [ ] Delivery credentials save on blur
- [ ] Delivery connection test works
- [ ] Store info save works
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No ESLint errors
- [ ] LSP diagnostics clean

---

## Execution Order

1. Create `types.ts` (no dependencies)
2. Create `hooks/use-image-upload.ts` (depends on types)
3. Create `hooks/use-inline-edit.ts` (depends on types)
4. Create leaf components in parallel:
   - `delete-confirm-overlay.tsx`
   - `product-card.tsx`
   - `product-list-item.tsx`
   - `preferences-settings.tsx`
5. Create section editors in parallel:
   - `navbar-editor.tsx`
   - `hero-editor.tsx`
   - `footer-editor.tsx`
6. Create settings components in parallel:
   - `delivery-pricing-settings.tsx`
   - `delivery-integration-settings.tsx`
   - `store-info-settings.tsx`
   - `settings-dialog.tsx`
7. Create `product-form.tsx`
8. Create `products-content.tsx` (depends on all above)
9. Create `index.ts` barrel export
10. Rewrite `page.tsx`
11. Run `npx tsc --noEmit` to verify
12. Run `lsp_diagnostics` on key files
