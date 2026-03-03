# Marlon Development Summary

## March 3, 2026

**Routes (PRD-aligned):**
- `/` - Landing/Dashboard (auth-aware)
- `/editor/[storeSlug]` - Editor + Settings dialog
- `/orders/[storeSlug]` - Orders
- `/[slug]` - Public storefront
- `/[slug]/[productId]` - Product detail

**Completed:** Route restructure, settings dialog, build ✅

## Today - Completed Milestones

**Milestone 2: Image Management** ✅
- Enhanced `@/components/image-cropper.tsx`: drag-drop reordering, Lightbox, zoom, grip indicator

**Milestone 3: Variant Management** ✅
- Prebuilt options dropdown (Size, Colors, Custom)
- Eyes icon for hiding variants (persists to Convex)

**Milestone 4: Site Content Editor - Navbar** ✅
- `convex/siteContent.ts`: Added `setNavbarStyles`, `setLogoAndSyncFooter` mutations
- Editor UI: Navbar preview with hover toolbar (background: light/dark/transparent, text: dark/light)
- Logo upload with 1:1 crop modal, syncs to footer

**Milestone 5: Site Content Editor - Hero** ✅
- Added `setHeroStyles` mutation to Convex
- Hero section in editor: title inline edit, CTA button text edit, background image upload, layout toggle (left/center/right)
- Auto-save on blur/Enter

**Milestone 6: Site Content Editor - Footer** ✅
- Added `setFooterStyles` mutation to Convex
- Footer preview: synced logo from navbar, phone/email inline edit, copyright inline edit, social link toggles (Facebook, Instagram, Twitter, WhatsApp)

**Milestone 7: Delivery Pricing Configuration** ✅
- Added `getDeliveryPricing`, `setDeliveryPricing`, `bulkSetDeliveryPricing` to Convex
- 58 Algerian wilayas in scrollable table
- Home delivery & Office delivery prices per wilaya
- Per-store independent pricing, auto-save on blur

**Milestone 8: Delivery API Integration** ✅
- Added `getDeliveryIntegration`, `setDeliveryIntegration`, `testDeliveryConnection` to Convex
- Provider selection: None, ZR Express, Yalidine
- API Key/Token inputs with auto-save
- Test Connection button with result feedback

**Milestone 9: Data Models & Backend** ✅
- Schema verified: users, stores, products, orders, siteContent, deliveryPricing tables
- Convex functions: queries (getProducts, getStore, getDeliveryPricing, etc.), mutations (createProduct, updateProduct, archiveProduct, etc.)
- Real-time subscriptions via Convex queries

**Milestone 10: Polish & UX Improvements** ✅
- Added `ToastProvider` context (`contexts/toast-context.tsx`) with toast notifications
- Integrated `ToastProvider` into `app/layout.tsx`
- Added ARIA labels for accessibility (aria-label on buttons)
- Keyboard navigation: Enter to save, Escape to cancel
- Loading states: `isSaving`, `isUploadingLogo` states present

**Settings Modal Improvements** ✅
- Delivery Pricing Tab: All 58 wilayas in scrollable table, auto-save on blur, default prices 600/400 DA
- Delivery API Tab: Connected to Convex functions, provider selection, API credentials, test connection
- Fixed useEffect import error

**Next:** Testing checklist, Milestone 8.3 (Order Shipping via API)
