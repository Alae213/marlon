# Global Tasks

## Completed

### Foundation & Setup
- [x] Set up Next.js 16 project with TypeScript (strict mode)
- [x] Configure Tailwind CSS v4 with custom theme variables
- [x] Set up project structure (app/, components/, hooks/, lib/, types/)
- [x] Configure path aliases (@/ prefix in tsconfig.json)
- [x] Set up Convex project and configuration
- [x] Define Convex schema (stores, products, orders, users)
- [x] Configure multi-tenant isolation (storeId filtering)
- [x] Set up Convex deployment and dev environment

### Authentication
- [x] Set up Clerk project with Google OAuth
- [x] Configure Clerk middleware for route protection
- [x] Create user data sync webhook handler (Clerk → Convex)
- [x] Implement authorization middleware (userId ownership check)

### Landing Page
- [x] Build landing page layout (white background, centered)
- [x] Create "New Store" card with plus icon
- [x] Implement Google sign-in flow
- [x] Add redirect logic to dashboard after auth

### Dashboard
- [x] Build dashboard layout with logo and profile avatar
- [x] Create store cards grid with thumbnail and subscription badge
- [x] Implement "New Store" card functionality
- [x] Build create store dialog (name, slug input with auto-generation)
- [x] Implement slug uniqueness validation with suggestions
- [x] Create store card navigation to store admin

### Store Admin Layout
- [x] Build persistent top sticky bar (logo, back arrow, profile menu)
- [x] Implement bottom floating nav toggle (Editor / Orders)
- [x] Add "View Store" button (opens public storefront in new tab)

### Integrations
- [x] Implement ZR Express API integration
- [x] Implement Yalidine API integration
- [x] Create bulk "Send to Delivery" action
- [x] Handle tracking number updates
- [x] Add fallback for manual status change
- [x] Configure Convex subscriptions for live updates
- [x] Implement order notifications
- [x] Add store dashboard real-time sync

### Performance & Polish
- [x] Implement lazy loading for images
- [x] Add WebP image optimization
- [x] Configure responsive images
- [x] Optimize LCP (< 2s target)
- [x] Add error boundaries
- [x] Implement loading states
- [x] Create user-friendly error messages
- [x] Test and fix responsive layouts
- [x] Ensure iOS Safari compatibility
- [x] Test Chrome Mobile support

## Remaining

- [ ] Confirm route structure (keep current or align to PRD)
- [ ] End-to-end user flow testing
- [ ] Multi-store scenarios testing

## Post-Launch (Ongoing)

- Monitor KPIs (time to first store, order confirmation rate, paid store rate)
- Fix bugs and edge cases
- Gather user feedback for v2 features

## Next Up

- [ ] Analytics dashboard (post-MVP)
- [ ] Arabic/French localization (post-MVP)
- [ ] Custom domain support (post-MVP)
