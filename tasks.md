# Marlon Project Milestones

## Phase 1: Foundation & Setup (Week 1-2)

### 1.1 Project Initialization
- [x] Set up Next.js 16 project with TypeScript (strict mode)
- [x] Configure Tailwind CSS v4 with custom theme variables
- [x] Set up project structure (app/, components/, hooks/, lib/, types/)
- [x] Configure path aliases (@/ prefix in tsconfig.json)

### 1.2 Database & Backend Setup
- [x] Set up Convex project and configuration
- [x] Define Convex schema (stores, products, orders, users)
- [x] Configure multi-tenant isolation (storeId filtering)
- [ ] Set up Convex deployment and dev environment

### 1.3 Authentication Infrastructure
- [x] Set up Clerk project with Google OAuth
- [x] Configure Clerk middleware for route protection
- [x] Create user data sync webhook handler (Clerk → Convex)
- [x] Implement authorization middleware (userId ownership check)

---

## Phase 2: Core Platform (Week 2-3)

### 2.1 Landing Page
- [x] Build landing page layout (white background, centered)
- [x] Create "New Store" card with plus icon
- [x] Implement Google sign-in flow
- [x] Add redirect logic to dashboard after auth

### 2.2 Home Dashboard
- [x] Build dashboard layout with logo and profile avatar
- [x] Create store cards grid with thumbnail and subscription badge
- [x] Implement "New Store" card functionality
- [x] Build create store dialog (name, slug input with auto-generation)
- [x] Implement slug uniqueness validation with suggestions
- [x] Create store card navigation to store admin

### 2.3 Store Admin Layout
- [x] Build persistent top sticky bar (logo, back arrow, profile menu)
- [x] Implement bottom floating nav toggle (Editor / Orders)
- [x] Add "View Store" button (opens public storefront in new tab)

---

## Phase 3: Store Editor (Week 3-5)

### 3.1 Product Management
- [x] Build product list (grid/list view toggle)
- [x] Implement product search functionality
- [x] Create add product modal
- [x] Add image upload with drag-and-drop and reordering
- [x] Implement variant management (add/edit/hide variant groups)
- [x] Add product edit functionality (inline/modal)
- [x] Implement product archiving (soft delete)
- [x] Add drag-and-drop product reordering

### 3.2 Site Content Editor
- [x] Build navbar editor (logo, fixed links, cart icon)
- [x] Create hero section editor (title, image, CTA button, layout toggle)
- [x] Build footer editor (contact info, social links, logo)
- [x] Implement inline editing for all site content

### 3.3 Delivery Pricing
- [x] Create delivery pricing table (per wilaya + delivery type)
- [x] Pre-populate default delivery pricing data
- [x] Allow merchants to edit prices per wilaya

### 3.4 Delivery API Integration (Optional)
- [x] Build delivery settings section
- [x] Add API credential input fields (ZR Express / Yalidine)
- [x] Implement "Test Connection" button
- [x] Create encrypted credential storage

---

## Phase 4: Orders Management (Week 5-6)

### 4.1 Order List
- [x] Build Notion-style orders table
- [x] Implement filters (status, date range)
- [x] Add search by order ID or customer name
- [x] Implement sorting (date, total, status)
- [x] Add notification dot for new orders

### 4.2 Order Status Machine
- [x] Implement status transitions (new → confirmed → packaged → shipped → succeeded)
- [x] Add status badges with colors
- [x] Handle edge transitions (canceled, blocked, hold)

### 4.3 Order Detail Panel
- [x] Build right-side order detail panel
- [x] Implement inline editing for customer info
- [x] Add product list with quantity editing
- [x] Create delivery type and cost display
- [x] Build order timeline (status change log)

### 4.4 Call Log
- [x] Implement call attempt counter
- [x] Create call outcomes workflow (Answered, No Answer, Wrong Number, Refused)
- [x] Add timestamp tracking per attempt

### 4.5 Context-Aware Actions
- [x] Implement action buttons based on order status
- [x] Add "Send to Delivery Company" bulk action
- [x] Build tracking number display

### 4.6 Audit Trail
- [x] Create immutable changelog system
- [x] Log status changes, call attempts, notes, edits

---

## Phase 5: Public Storefront (Week 6-8)

### 5.1 Catalog Page
- [x] Build fixed navbar (logo, links, cart icon)
- [x] Implement hero section from site content
- [x] Create product grid with images, names, prices
- [x] Add product card hover effects

### 5.2 Product Detail Page
- [x] Build image gallery with carousel
- [x] Implement variant selector buttons
- [x] Add quantity selector
- [x] Create order form with validation (Algerian phone format)
- [x] Implement wilaya/commune dependent dropdowns

### 5.3 Cart & Checkout
- [x] Build cart sidebar with item management
- [x] Implement quantity adjustment and remove functionality
- [x] Create checkout popup with delivery cost calculation
- [x] Add order summary (subtotal, delivery, total)
- [x] Implement COD payment flow

### 5.4 Order Confirmation
- [x] Build confirmation page with order ID
- [x] Add "Continue Shopping" button

---

## Phase 6: Billing & Payments (Week 8-9)

### 6.1 Billing State Machine
- [x] Implement trial → locked → active status transitions
- [x] Add order counting per 30-day rolling window
- [x] Create payment expiry handling

### 6.2 Locked State Behavior
- [x] Mask customer data in orders page (show ***)
- [x] Disable action buttons when locked
- [x] Add unlock overlay message with Pay Now button

### 6.3 Chargily Integration
- [x] Create payment action (Convex → Chargily API)
- [x] Build checkout redirect flow
- [x] Implement webhook handler for payment confirmation
- [x] Update store status on successful payment

---

## Phase 7: Integrations (Week 9-10)

### 7.1 Delivery API Integration
- [ ] Implement ZR Express API integration
- [ ] Implement Yalidine API integration
- [ ] Create bulk "Send to Delivery" action
- [ ] Handle tracking number updates
- [ ] Add fallback for manual status change

### 7.2 Real-time Updates
- [ ] Configure Convex subscriptions for live updates
- [ ] Implement order notifications
- [ ] Add store dashboard real-time sync

---

## Phase 8: Polish & Launch (Week 10-12)

### 8.1 Performance Optimization
- [ ] Implement lazy loading for images
- [ ] Add WebP image optimization
- [ ] Configure responsive images
- [ ] Optimize LCP (< 2s target)

### 8.2 Error Handling
- [ ] Add error boundaries
- [ ] Implement loading states
- [ ] Create user-friendly error messages

### 8.3 Mobile & Browser Support
- [ ] Test and fix responsive layouts
- [ ] Ensure iOS Safari compatibility
- [ ] Test Chrome Mobile support

### 8.4 Final Testing
- [ ] End-to-end user flow testing
- [ ] Multi-store scenarios testing
- [ ] Billing edge cases testing
- [ ] Delivery API testing (if configured)

---

## Post-Launch (Ongoing)

- Monitor KPIs (time to first store, order confirmation rate, paid store rate)
- Fix bugs and edge cases
- Gather user feedback for v2 features
- Consider Arabic/French localization (out of scope for MVP)
