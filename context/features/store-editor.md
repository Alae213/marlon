# Feature: Store Editor

> **Status:** `complete`
> **Phase:** v1
> **Last updated:** 2026-04-10

---

## Summary

The store editor is the merchant's command center for managing their store. It includes product management (CRUD, variants, images), site content editing (navbar, hero, footer), and delivery pricing configuration. Access via `/editor/[storeSlug]`.

---

## Users

- **Primary**: Store owners/merchants
- **When**: After creating a store, to add products and configure their store
- **Journey**: Dashboard → Select store → Editor → Add products → Configure delivery

---

## User Stories

- As a merchant, I want to add products with images and variants so customers can buy
- As a merchant, I want to customize my store's look (hero, navbar) so it represents my brand
- As a merchant, I want to set delivery prices per wilaya so customers see accurate shipping costs
- As a merchant, I want to connect my store to a delivery API so I can send orders automatically

---

## Behaviour

### Happy Path

1. **Product Management**
   - Add product: name, description (rich text), base price, old price (optional), images, variants
   - Edit product: inline or modal
   - Product list: grid/list view, search, drag-drop reorder
   - Archive: soft delete (hidden from storefront)

2. **Site Content Editor**
   - Navbar: logo, 3 links (Shop/FAQ/Help - placeholders), cart icon
   - Hero: title, image upload, CTA button text + link, layout toggle (left/center/right)
   - Footer: contact info, social links, logo

3. **Variant Management**
   - Add/edit/hide variant groups (size: S/M/L, color: Red/Blue, custom)
   - Inline rename for group name and variant values

4. **Image Management**
   - Multiple images per product
   - Drag to reorder, set featured, delete, crop

5. **Delivery Pricing**
   - Per-store prices per wilaya + delivery type (stopdesk/domicile)
   - Default data pre-populated, editable

6. **Delivery API Integration**
   - Settings: select provider (ZR Express/Yalidine/None)
   - Fields: API key + token, "Test Connection" button, "Save"
   - If configured: bulk select orders → "Send to Delivery Company" → returns tracking number

### Edge Cases & Rules

- **Slug conflict**: Already handled in dashboard
- **No products**: Storefront works (shows "no products" message)
- **Image upload**: Max 5 images per product
- **Variant limits**: Unlimited groups, max 10 values per group

---

## Connections

- **Depends on**: Store creation, Convex products/siteContent/deliveryPricing tables
- **Triggers**: Public storefront (displays products), Orders page (delivery pricing used)
- **Shares data with**: Delivery API integration

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Rich text editor | Basic | Full |
| Image optimization | None | WebP conversion |
| Bulk product import | Not supported | CSV import |

---

## Security Considerations

- Auth required: Yes (Clerk)
- Input validation: Product names required, prices must be positive
- Rate limiting: None at this level
- Sensitive data: Delivery API credentials stored (needs encryption)

---

## Tasks

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T5 | [x] | Product CRUD (add, edit, delete, archive) |
| T6 | [x] | Product variants (size, color, custom) |
| T7 | [x] | Image management (upload, reorder, crop) |
| T8 | [x] | Site content editor (navbar, hero, footer) |
| T9 | [x] | Delivery pricing per wilaya |
| T10 | [x] | Delivery API integration (ZR Express, Yalidine) |

---

## UAT Status

**UAT Status:** `passed`

**Last tested:** 2026-04-10

**Outcome:** All editor features working - products, variants, images, content, delivery

---

## Open Questions

- [ ] Should delivery API credentials be encrypted at rest?
- [ ] Any need for product categories?

---

## Notes

- Implementation follows PRD: inline editing, drag-drop reorder, rich text descriptions
- Delivery API credentials stored in Convex (per PRD: encrypted at rest)