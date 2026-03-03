# Editor PRD

> Domain owner for: Products, Site Content, Variants, Images, Delivery Pricing & API
> Route: `/editor/[storeSlug]`

---

## Summary

The Editor is where merchants build their store — add/edit products, customize site content (navbar, hero, footer), manage variants and images, configure delivery pricing per wilaya, and optionally connect delivery APIs.

---

## Product Management (PRD §4.1)

- **Add product**: name, description (rich text), base price, old price (optional toggle), images (drag-and-drop multi-upload + reorder), variants, archive (soft delete)
- **Edit product**: inline or modal
- **Product list**: grid or list view, search by name, drag-and-drop reorder (no sort controls)

## Site Content Editor (PRD §4.2)

- **Navbar**: logo, 3 fixed links (Shop / FAQ / Help — placeholder, no pages built), cart icon
- **Hero section**: title, image (upload), CTA button text + link; layout toggle (left / center / right); inline editing
- **Footer**: contact info, social links, logo

## Variant Management (PRD §4.3)

- Add/edit/hide variant groups (size: S/M/L, color: Red/Blue, custom)
- Inline rename for group name and variant values
- Auto-save to Convex on blur or Enter key

## Image Management (PRD §4.4)

- Multiple images per product
- Drag to reorder, set featured image, delete, crop
- Crop UI shown after image selection, before saving to Convex storage

## Delivery Pricing (PRD §4.5)

- Merchants set their own delivery prices per wilaya + delivery type (Stopdesk / Domicile)
- Default data pre-populated (merchant can edit)
- **NOT shared across stores** — each store has independent pricing

## Delivery API Integration (PRD §4.6)

- Settings: select delivery company (ZR Express / Yalidine / None)
- Fields: API key + token, "Test Connection" button, "Save"
- If configured: bulk-select confirmed orders → "Send to Delivery Company" → returns tracking number → order status → shipped
- If not configured: "Ship" button just changes status to shipped (no API call)
- API credentials stored encrypted, used server-side only

---

## Relevant Data Models

### Product
```
productId, storeId, name, description, basePrice, oldPrice,
images: [{ url, order }], featuredImageIndex,
variants: [{ groupName, values: [{ label, hidden }] }],
status: 'active' | 'draft' | 'archived',
displayOrder, createdAt
```

### Store (editor-relevant fields)
```
siteContent: { hero, navbar, footer },
deliveryPricing: { [wilayaId]: { stopdesk: DZD, domicile: DZD } },
deliveryIntegration: { provider, apiKey (encrypted), token (encrypted) }
```
