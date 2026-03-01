# Marlon PRD

## Summary

Marlon (`marlon.com`) is a multi-tenant SaaS platform for Algerian entrepreneurs to create and manage COD-based online stores with zero technical knowledge. It solves: complexity of existing platforms, USD payment friction, missing COD workflows, and fragmented tooling. Pricing is pay-when-you-succeed: 50 free orders/month per store, then 2000 DZD/month.

---

## Target Users

| Persona | Profile | Core Need |
|---|---|---|
| Solo Merchant ("Fatima") | Non-technical, sells handmade goods | Simple store + COD order management |
| Influencer ("Yacine") | Sells merch to followers | Fast setup, no transaction fees |
| Agency Owner ("Riad") | Manages 5–10 client stores | Multi-store dashboard, cheap per-store cost |

---

## Business Model

- **Free tier**: First 50 orders per store per 30-day rolling window. No credit card required.
- **Paid tier**: 2000 DZD/month per store. Manual renewal. No auto-billing.
- **Payment**: Chargily Pay (CIB card, Edahabia, bank transfer). DZD only.

### Billing State Machine

```
Store created → status: trial, orderCount: 0
  ↓ (each order) orderCount++
  ↓ orderCount >= 50 → status: locked
  ↓ merchant pays 2000 DZD
  → status: active, paidUntil: now+30d, orderCount: 0, firstOrderAt: null
  ↓ paidUntil expires
  → wait for next order → status: trial, firstOrderAt: now, orderCount: 1
  → repeat cycle
```

### Billing Rules
- 50-order limit per store per 30-day rolling window (window starts on first order)
- Payment unlocks 30 days from payment date (not from first order)
- After paid period expires with no payment: store returns to free tier (new 50-order allowance)
- Public storefront always stays live regardless of lock state
- No auto-renewal
- Each store has independent billing (multi-store users don't share allowances)

### Locked State Behavior
- **Public storefront**: fully operational
- **Orders page**: orders visible, but customer name/phone/address replaced with `***`; all action buttons disabled; call log disabled; notes disabled
- **Editor**: full access (products, site content)
- **Customer data**: never deleted, only masked while locked; revealed after payment
- Overlay message: "Unlock your store to manage orders: Pay 2000 DZD" + Pay Now button

---

## Tech Stack

- **Frontend**: Next.js
- **Backend/DB**: Convex (real-time subscriptions, tenant isolation via `storeId`)
- **Auth**: Clerk (Google OAuth only)
- **Payments**: Chargily Pay
- **Hosting**: Vercel
- **Delivery APIs**: ZR Express, Yalidine (optional per store)

---

## URL Structure

```
marlon.com                          → Landing page / sign-in
marlon.com/[userId]                 → Home Dashboard
marlon.com/[userId]/[storeId]/editor  → Store Editor
marlon.com/[userId]/[storeId]/orders  → Order Management
marlon.com/[store-slug]             → Public Storefront
marlon.com/[store-slug]/[productId] → Product Detail Page
```

---

## Authentication

- Provider: Clerk
- Method: Google OAuth only (no email/password)
- Flow: Landing → "Sign in with Google" popup → redirect to `/[userId]`
- User data stored: `clerkId`, `email`, `name`, `profileImageUrl`, `createdAt`
- Authorization: middleware enforces `userId` ownership; users cannot access other users' stores (403)

---

## Feature: Landing Page

- White background, centered minimal layout
- Single large light-grey card labeled "new store" with circular plus icon (top-left)
- Small logo centered at top
- Clicking "new store" triggers Google sign-in if not authenticated, then redirects to dashboard

---

## Feature: Home Dashboard (`/[userId]`)

### Layout
- White background, centered
- Logo + profile avatar (top)
- "New store" card always first in grid
- Store cards grid: name, thumbnail, subscription badge (Free / Active / Locked)
- Click store card → enter store admin

### Create Store Flow
1. Click "new store" card
2. Dialog: Store Name (required) + Store Slug (auto-generated, editable, lowercase alphanumeric + hyphens, unique globally)
3. Click "Create"
4. System creates store, empty product catalog, default site content
5. Redirect to `/[userId]/[storeId]/editor`

### Edge Cases
- Slug conflict: show error "This slug is taken. Try another." + 3 auto-suggestions
- 0 stores: show only the "new store" card

---

## Feature: Store Admin Layout

### Persistent UI (after store creation)
- **Top sticky bar**:
  - Left: Logo → on hover shows back arrow → click → `/[userId]`
  - Right: Profile menu (settings, logout)
- **Bottom floating nav toggle**: Editor | Orders
  - Editor → `/[userId]/[storeId]/editor`
  - Orders → `/[userId]/[storeId]/orders`
- **"View Store" button**: persistent, always visible, always opens `marlon.com/[store-slug]` in new tab (works even with 0 products)

---

## Feature: Editor (`/[userId]/[storeId]/editor`)

### 4.1 Product Management
- Add product: name, description (rich text), base price, old price (optional toggle), images (drag-and-drop multi-upload + reorder), variants, archive (soft delete)
- Edit product: inline or modal
- Product list: grid or list view, search by name, drag-and-drop reorder (no sort controls)

### 4.2 Site Content Editor
- **Navbar**: logo, 3 fixed links (Shop / FAQ / Help — placeholder, no pages built), cart icon
- **Hero section**: title, image (upload), CTA button text + link; layout toggle (left / center / right); inline editing
- **Footer**: contact info, social links, logo

### 4.3 Variant Management
- Add/edit/hide variant groups (size: S/M/L, color: Red/Blue, custom)
- Inline rename for group name and variant values

### 4.4 Image Management
- Multiple images per product
- Drag to reorder, set featured image, delete, crop

### 4.5 Delivery Pricing (per store)
- Merchants set their own delivery prices per wilaya + delivery type (Stopdesk / Domicile)
- Default data pre-populated (merchant can edit)
- This is NOT shared across stores

### 4.6 Delivery API Integration (optional)
- Settings section: select delivery company (ZR Express / Yalidine / None)
- Fields: API key + token, "Test Connection" button, "Save"
- If configured: bulk-select confirmed orders → "Send to Delivery Company" → returns tracking number → order status → shipped
- If not configured: "Ship" button just changes status to shipped (no API call)
- API credentials stored encrypted, used server-side only

---

## Feature: Orders (`/[userId]/[storeId]/orders`)

### 5.1 Order List
- Notion-style table: Customer Name, Phone, Wilaya, Status (colored badge), Total, Date
- Filters: Status (All / New / Confirmed / Packaged / Shipped / Succeeded / Canceled / Blocked / Hold), Date range
- Search: by order ID or customer name
- Sort: Date, Total, Status
- Red notification dot on Orders nav item for new orders

### 5.2 Order Status Machine

```
new → confirmed → packaged → shipped → succeeded
 ↓        ↓          ↓
canceled / blocked / hold
```

| Status | Description |
|---|---|
| new | Order placed, awaiting merchant confirmation |
| confirmed | Merchant called and confirmed |
| packaged | Ready to ship |
| shipped | Sent to delivery company |
| succeeded | Delivered successfully |
| canceled | Canceled by merchant or customer |
| blocked | Customer flagged as fraudulent |
| hold | Wrong number, pending resolution |

### 5.3 Order Detail Panel (right side panel)
- Customer info: name, phone, wilaya, commune, address — all editable inline (auto-save on Enter or Save/Cancel buttons)
- Edits are for merchant reference only; no downstream effects on delivery API or validation
- Products: list with quantities, variants, prices — editable inline (editing quantity recalculates total)
- Delivery type (Stopdesk / Domicile), delivery cost, total amount
- Order timeline (status change log)
- Call log
- Internal notes (not visible to customers)

### 5.4 Call Log (per order)
- Attempt counter (1st / 2nd / 3rd)
- Outcomes:
  - **Answered** → prompt to confirm order → status: confirmed
  - **No Answer** → increment attempt counter
  - **Wrong Number** → status: hold
  - **Refused** → prompt confirmation → status: canceled
- Timestamp per attempt

### 5.5 Context-Aware Action Buttons

| Order Status | Available Actions |
|---|---|
| new | Confirm, Cancel, Block Customer, Call Log |
| confirmed | Package, Cancel |
| packaged | Ship, Cancel |
| shipped | View Tracking (if delivery API connected) |
| all | Add Note, View Change Log |

### 5.6 Audit Trail (immutable)
- Logs: status changes (who, when), call attempts (outcome, timestamp), notes added, order edits
- Cannot be deleted

---

## Feature: Public Storefront (`marlon.com/[store-slug]`)

### Catalog Page
- Fixed navbar (logo, Shop / FAQ / Help links, cart icon)
- Hero section (from site content editor)
- Product grid: main image, name, price, old price

### Product Detail Page
- Fixed navbar
- Image gallery (carousel)
- Name, price, old price, rich text description
- Variant selector (buttons)
- Quantity selector
- Order form: Full Name, Phone (Algerian format validation), Delivery Type (Stopdesk / Domicile), Wilaya (dropdown), Commune (dependent dropdown), Full Address (if Domicile)
- **"Buy Now"** button (single item, requires form fill) — primary
- **"Add to Cart"** button — opens cart sidebar

### Cart Sidebar
- Item list: image, name, variant, quantity (+/-), price, remove
- Subtotal (products only)
- "Proceed to Checkout" button

### Checkout Popup
- Form: Full Name, Phone, Delivery Type, Wilaya, Commune, Full Address (if Domicile)
- Real-time delivery cost: based on merchant's per-store delivery pricing table (Wilaya + Delivery Type)
- Order summary: subtotal + delivery cost + total
- Payment method: "Cash on Delivery" (read-only)
- "Place Order" button

### Order Confirmation Page
- "We'll call you at [phone] to confirm your order."
- Order ID displayed
- "Continue Shopping" button

---

## Integrations

### Clerk
- Google OAuth only
- JWT session tokens, auto-refresh
- Webhook syncs user data to Convex on creation

### Chargily Pay
- Payment flow: merchant clicks "Pay Now" → Convex action creates Chargily invoice (2000 DZD) → redirect to checkout URL → webhook received → store unlocked
- Webhook endpoint: `marlon.com/api/webhooks/chargily`
- Webhook triggers: update `subscriptionStatus: active`, `paidUntil: now+30d`, reset `orderCount: 0`, reset `firstOrderAt: null`

### Delivery APIs (ZR Express, Yalidine)
- Optional per store
- Used server-side only via Convex actions
- Credentials encrypted at rest
- Fallback: manual status change if not configured

---

## Data Models (key fields)

### Store
```
storeId, userId, name, slug, thumbnailUrl,
subscriptionStatus: 'trial' | 'active' | 'locked',
orderCount, firstOrderAt, subscriptionPaidUntil,
siteContent: { hero, navbar, footer },
deliveryPricing: { [wilayaId]: { stopdesk: DZD, domicile: DZD } },
deliveryIntegration: { provider, apiKey (encrypted), token (encrypted) },
createdAt
```

### Product
```
productId, storeId, name, description, basePrice, oldPrice,
images: [{ url, order }], featuredImageIndex,
variants: [{ groupName, values: [{ label, hidden }] }],
status: 'active' | 'draft' | 'archived',
displayOrder, createdAt
```

### Order
```
orderId, storeId, orderNumber,
customer: { name, phone, wilaya, commune, address },
items: [{ productId, name, variant, quantity, price }],
deliveryType: 'stopdesk' | 'domicile',
deliveryCost, subtotal, total,
status: 'new' | 'confirmed' | 'packaged' | 'shipped' | 'succeeded' | 'canceled' | 'blocked' | 'hold',
trackingNumber, callLog: [{ attempt, outcome, timestamp }],
notes: [{ text, createdAt }], changelog: [{ action, by, timestamp }],
createdAt
```

---

## Non-Functional Requirements

- Page load: < 2s LCP
- API response: < 500ms p95
- Real-time updates: < 100ms (Convex subscriptions)
- Uptime: 99.9% (Vercel + Convex SLA)
- Images: lazy load, WebP, responsive
- Browser support: Chrome, Firefox, Safari, Edge (last 2 versions); iOS Safari, Chrome Mobile

---

## Out of Scope (MVP)

- Store templates / themes / color pickers / CSS editors
- Custom domains
- Arabic / French UI language
- Super-admin dashboard
- Store suspension / merchant approval
- Analytics / charts
- Mobile app
- Real-time delivery tracking maps
- Online payments (COD only)
- Inventory / stock alerts
- Customer accounts / order history
- Marketing tools (discounts, email campaigns, referrals)
- Public merchant API
- White-label / agency plans
- Auto-renewal billing

---

## KPIs

- Time to first store: < 10 min
- Time to first product: < 5 min
- Order confirmation rate: % of new → confirmed
- Order completion rate: % of confirmed → shipped
- Paid store rate: target 50% of stores hitting 50 orders/month
- MRR target Y1: 200K DZD/month
- MRR target Y2: 3,000 stores × 50% paid × 2,000 DZD = 3M DZD/month