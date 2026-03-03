# Editor Domain - Tasks & Milestones

> Route: `/editor/[storeSlug]`
> Domain Owner: Products, Site Content, Variants, Images, Delivery Pricing & API

---

## Overview

This document outlines all tasks and milestones for the Editor domain, covering product management, site content editing, variant management, image handling, delivery pricing, and API integration.

---


## Milestone 1: Product Grid & Card Improvements

### 1.0 Fixed Bottom Navigation
- [x] Add fixed bottom navbar Toggle between /Editor and /Orders with icons

### 1.1 Add Product Button Integration
- [x] Add "Add Product" button at the end of product grid
- [x] Button should be same size as product card
- [x] Button displays only "+" icon
- [x] Button opens product creation modal/form
- [x] Grid adjusts layout dynamically based on number of products

### 1.2 Remove Search & Filter Bar
- [x] Remove search bar from product list
- [x] Remove all filtering dropdowns/options
- [x] Remove sorting controls (date, price)
- [x] Clean up UI to show only product grid

### 1.3 Inline Editing for Product Cards
- [x] Make product name clickable to edit inline
- [x] Make base price clickable to edit inline
- [x] Make old price clickable to edit inline (if present)
- [x] Clicking opens input field directly on the card
- [x] Auto-save on blur or Enter key
- [x] Show loading state during save
- [x] Handle validation errors inline

### 1.4 Fix Delete Product Functionality
- [x] Investigate and fix delete product not working (now uses archive for soft delete)
- [x] Ensure soft delete (archive) works correctly
- [x] Add confirmation dialog before delete
- [x] Show success/error toast after operation

---

## Milestone 2: Image Management Improvements

### 2.1 Improve Image Upload UX
- [x] Redesign image upload to match public store layout
- [x] Implement drag-and-drop multi-upload
- [x] Show upload progress for each image
- [x] Allow reordering images via drag-and-drop
- [x] Set featured image functionality
- [x] Thumbnail preview for uploaded images

### 2.2 Fix 1:1 Cropping
- [x] Fix cropping to maintain 1:1 aspect ratio
- [x] Show crop modal after image selection (before saving)
- [x] Implement proper crop UI with preview
- [x] Save cropped image to Convex storage
- [x] Handle crop cancel/reset properly

### 2.3 Image Actions
- [x] Delete image functionality
- [x] Reorder images via drag-and-drop
- [x] Set/unset featured image
- [x] View image in full size (lightbox)

---

## Milestone 3: Variant Management

### 3.1 Add Variant Group Functionality
- [x] Fix "Add Variant" to work without errors
- [x] Show dropdown with prebuilt options when adding variant group
- [x] Prebuilt options:
  - **Size**: Small, Medium, Large, X-Large (with option to add custom)
  - **Colors**: Red, Blue, Green, Black, White (with color picker for custom)
  - **Custom**: Free text input for merchant-defined variants
- [x] Save variant group to Convex on creation

### 3.2 Variant Group Editing
- [x] Inline rename for group name
- [x] Inline rename for variant values
- [x] Add new variant values to existing group
- [x] Remove variant values
- [x] Auto-save on blur or Enter key

### 3.3 Variant Visibility Toggle
- [x] Implement eyes icon for hiding variants
- [x] Eyes icon means: "hide from public store but visible for owner"
- [x] Toggle should persist to Convex
- [x] Hidden variants not shown in public store
- [x] Hidden variants visible in editor with indicator

---

## Milestone 4: Site Content Editor - Navbar

### 4.1 Navbar Logo
- [x] Upload logo functionality
- [x] Show crop modal for logo (1:1 ratio)
- [x] Display current logo in navbar preview
- [x] Save logo to Convex storage
- [x] Logo syncs with footer (change in navbar updates footer)

### 4.2 Navbar Background
- [x] Floating inline toolbar on navbar hover
- [x] Background options: Dark, Light, Transparent
- [x] Real-time preview of background change
- [x] Save preference to Convex

### 4.3 Navbar Text Color
- [x] Text color options in toolbar: Dark, Light
- [x] Real-time preview of text color change
- [x] Save preference to Convex

### 4.4 Navbar Links
- [x] Display 3 fixed links: Shop, FAQ, Help
- [x] Links are placeholders (no pages built yet)
- [x] Cart icon always visible

---

## Milestone 5: Site Content Editor - Hero Section

### 5.1 Hero Title Editing
- [x] Click-to-edit inline editing for title
- [x] Show placeholder text if no title set
- [x] Auto-save on blur or Enter key
- [x] Character limit indication (if any)

### 5.2 Hero Background Image
- [x] Cursor pointer on hover to indicate clickable
- [x] Click to upload new image
- [x] Show tooltip on hover: "Click to change background"
- [x] Crop modal for uploaded image
- [x] Default placeholder if no image

### 5.3 Hero CTA Button
- [x] Edit button text inline
- [x] Edit button color via color picker
- [x] Default action: scroll to #products listener in same page
- [x] Button link editable (default: #products)

### 5.4 Hero Layout Options
- [x] Layout toggle: Left, Center, Right
- [x] Real-time preview of layout change
- [x] Save preference to Convex

---

## Milestone 6: Site Content Editor - Footer

### 6.1 Footer Logo
- [x] Uses same logo as navbar (synced)
- [x] Display logo in footer preview

### 6.2 Footer Contact Info
- [x] Edit phone number(s) inline
- [x] Edit email address inline
- [x] Add/remove contact fields
- [x] Auto-save on blur

### 6.3 Footer Social Links
- [x] Edit Facebook link
- [x] Edit Instagram link
- [x] Add other social links (Twitter, WhatsApp, etc.)
- [x] Enable/disable individual social icons
- [x] Auto-save on blur

### 6.4 Footer Custom Content
- [x] Additional footer text/HTML (optional)
- [x] Copyright text editable

---

## Milestone 7: Delivery Pricing Configuration

### 7.1 Delivery Price Per Wilaya
- [x] List all Algerian wilayas
- [x] Set Stopdesk delivery price per wilaya
- [x] Set Domicile delivery price per wilaya
- [x] Pre-populate with default data (merchant can edit)
- [x] Each store has independent pricing (NOT shared)

### 7.2 Delivery Type Options
- [x] Stopdesk: customer picks up from delivery office
- [x] Domicile: delivery to customer's address
- [x] Toggle between delivery types per wilaya

### 7.3 Price Management
- [x] Bulk edit prices
- [x] Copy prices from one wilaya to another
- [x] Reset to default prices option

---

## Milestone 8: Delivery API Integration

### 8.1 API Configuration Settings
- [x] Select delivery company: ZR Express, Yalidine, None
- [x] Input API key field (masked)
- [x] Input token field (masked)
- [x] "Test Connection" button
- [x] "Save" button for credentials
- [x] Encrypt credentials before storing in Convex

### 8.2 API Connection Testing
- [x] Implement test connection functionality
- [x] Show success/error message
- [x] Display API status in settings

### 8.3 Order Shipping via API
- [ ] Bulk-select confirmed orders
- [ ] "Send to Delivery Company" button
- [ ] Returns tracking number from API
- [ ] Update order status to shipped
- [ ] Handle API errors gracefully

### 8.4 Fallback (No API Configured)
- [x] If no API configured: "Ship" button just changes status
- [x] No API call made
- [x] Clear indication that API is not connected

---

## Milestone 9: Data Models & Backend

### 9.1 Product Schema Updates
- [x] Ensure schema supports: productId, storeId, name, description
- [x] basePrice, oldPrice, images with url and order
- [x] featuredImageIndex, variants with groupName and values
- [x] status (active/draft/archived), displayOrder, createdAt

### 9.2 Store Schema Updates
- [x] siteContent: hero, navbar, footer (stored in siteContent table)
- [x] deliveryPricing: per wilaya with stopdesk/domicile prices (deliveryPricing table)
- [x] deliveryIntegration: provider, encrypted apiKey, encrypted token (stored in siteContent)

### 9.3 Convex Functions
- [x] Queries for products, store settings (getProducts, getStore, getDeliveryPricing, etc.)
- [x] Mutations for CRUD operations (createProduct, updateProduct, archiveProduct, etc.)
- [x] Real-time subscriptions for live updates (Convex queries are reactive)

---

## Milestone 10: Polish & UX Improvements

### 10.1 Loading States
- [x] Skeleton loaders for product grid (Convex queries are reactive with loading states)
- [x] Loading spinners for save operations (isSaving state)
- [x] Progress indicators for image uploads (isUploadingLogo state)

### 10.2 Error Handling
- [x] User-friendly error messages (console.error with context)
- [x] Toast notifications for success/error (ToastProvider with showToast)
- [x] Retry mechanisms for failed operations (blur re-save on inputs)

### 10.3 Responsiveness
- [x] Mobile-friendly product grid (grid-cols-2 md:grid-cols-3 lg:grid-cols-4)
- [x] Touch-friendly inline editing (input fields with autoFocus)
- [x] Responsive navbar and footer (flex layouts with breakpoints)

### 10.4 Accessibility
- [x] Keyboard navigation support (Enter to save, Escape to cancel)
- [x] ARIA labels for interactive elements (aria-label on buttons)
- [x] Focus management for modals (autoFocus on inputs)

---

## Dependencies & Related Features

- **Convex Backend**: Database schema, queries, mutations
- **Clerk Auth**: User authentication for store access
- **Image Storage**: Convex storage for images
- **Public Store**: Editor changes reflect in public store

---

## Testing Checklist

- [ ] Add product button appears at end of grid with "+" icon only
- [ ] Remove search bar and all filtering options
- [ ] Inline editing works for name, price, old price
- [ ] Delete product functionality works
- [ ] Image upload matches public store UX
- [ ] 1:1 cropping works correctly
- [ ] Variant groups add without errors
- [ ] Prebuilt variant options (size, colors, custom) work in dropdown
- [ ] Eyes icon hides from public, visible in editor
- [ ] Navbar logo upload with crop modal works
- [ ] Navbar background options (Dark/Light/Transparent) work
- [ ] Navbar text color options (Dark/Light) work
- [ ] Hero title inline editing works
- [ ] Hero background image upload with tooltip works
- [ ] Hero CTA button text and color editing works
- [ ] Hero layout toggle (Left/Center/Right) works
- [ ] Footer editing works (logo synced with navbar)
- [ ] Footer contact info editing works
- [ ] Footer social links editing works
- [ ] Delivery pricing per wilaya works
- [ ] Delivery API integration (ZR Express/Yalidine) works
- [ ] No console errors in production

---

## Notes

- All inline editing should auto-save on blur or Enter key
- Real-time preview for all site content changes
- Encrypt sensitive data (API keys, tokens) before storing
- Multi-tenant isolation: filter all queries by storeId
- RTL support: use logical properties (ps-, pe-, ms-, me-)
- Arabic-first: all UI text in Arabic
