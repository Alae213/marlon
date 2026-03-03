# Marlon Development Summary

## March 3, 2026

**Routes (PRD-aligned):**
- `/` - Landing/Dashboard (auth-aware)
- `/editor/[storeSlug]` - Editor + Settings dialog
- `/orders/[storeSlug]` - Orders
- `/[slug]` - Public storefront
- `/[slug]/[productId]` - Product detail

**Completed:** Route restructure, settings dialog, build ✅

## Today

**Milestone 2: Image Management Improvements** - ✅ Completed
- Enhanced `@/components/image-cropper.tsx`:
  - Added drag-and-drop reordering for images
  - Added Lightbox component for full-size image viewing
  - Added zoom button to image thumbnails
  - Added grip indicator for draggable images
- Fixed missing imports in `@/app/editor/[storeSlug]/page.tsx`: added `Input` and `Textarea` imports

**Next:** Milestone 3: Variant Management
