# API Contracts

Truth-first reference for the live API surface.

- `Current`: live and used in runtime today.
- `Partial`: live, but incomplete, narrow, or transitional.
- `Planned`: target contract only; do not assume a stable entrypoint yet.
- `Deprecated/Mock`: present in repo, but not a production contract.

Use this file as an entrypoint map, not a promise of future payloads.

## Current Cross-Cutting Behavior

- Transport: JSON over HTTPS for Next.js routes; Convex query/mutation/action contracts for most merchant runtime surfaces.
- Auth:
  - `Current`: protected merchant/admin access is mostly Clerk -> Convex identity -> `store.ownerId` checks.
  - `Current`: no live central `owner | admin | staff` policy layer across merchant surfaces.
  - `Current`: public reads exist where Convex queries do not enforce auth.
- Errors:
  - `Current`: no single shared error envelope. Convex functions mostly throw plain errors; route handlers return ad hoc JSON.
- Idempotency:
  - `Current`: not a platform-wide guarantee. `POST /api/orders/create` supports public checkout idempotency through `publicIdempotencyKey`; other sensitive POST flows should be treated as non-idempotent unless code proves otherwise.
- Billing/lock model:
  - `Current`: store billing is trial/subscription based, not the planned `5/day` overflow/unlock model.
  - `Current`: `convex/stores.ts` uses a 30-day trial window, locks after more than 50 orders in the active trial window, tracks `paidUntil` for active subscriptions, and deletes old orders from long-locked stores after 20 days.

## Current Live Surfaces

### Public storefront reads (`Current`)

These are mostly Convex queries, not REST routes.

| Surface | Entrypoint | Notes |
|---|---|---|
| Store lookup by slug | `convex/stores.ts` -> `getStoreBySlug` | Public query; returns store doc by slug. |
| Product list | `convex/products.ts` -> `getProducts` | Public active-product read for a store. |
| Product by id | `convex/products.ts` -> `getProduct` | Public direct product read. |
| Product category/filter search | `convex/products.ts` -> `getProductsByCategory`, `searchProducts` | Public catalog reads. |
| Site content sections | `convex/siteContent.ts` -> `getSiteContent`, `getSiteContentResolved`, `getAllSiteContent` | Public storefront content reads. |
| Delivery pricing read | `convex/siteContent.ts` -> `getDeliveryPricing`; `convex/stores.ts` -> `getDeliveryCost` | Storefront pricing/config reads. |

### Merchant/store management (`Current`)

Primary merchant surfaces are Convex functions.

| Surface | Entrypoint | Auth reality |
|---|---|---|
| Create store | `convex/stores.ts` -> `createStore` | Auth required; owner becomes `store.ownerId`. |
| Read own stores | `convex/stores.ts` -> `getUserStores`, `subscribeToUserStores` | Owner-scoped. |
| Read/update store | `convex/stores.ts` -> `getStore`, `updateStore` | `getStore` reads by id; writes enforce owner check. |
| Slug checks | `convex/stores.ts` -> `isSlugAvailable`, `generateSlugSuggestions` | Live Convex queries; no documented REST slug route is needed today. |
| Billing status | `convex/stores.ts` -> `getStoreBillingStatus` | Reports current trial/subscription state, not planned overflow state. |
| Delivery pricing write | `convex/stores.ts` -> `updateDeliveryPricing` | Owner-scoped. |

### Merchant product management (`Current`)

| Surface | Entrypoint | Auth reality |
|---|---|---|
| Create/update product | `convex/products.ts` -> `createProduct`, `updateProduct` | Owner-scoped. |
| Archive/reorder products | `convex/products.ts` -> `archiveProduct`, `unarchiveProduct`, `reorderProducts` | Owner-scoped. |
| Merchant product reads | `convex/products.ts` -> `getAllProducts`, `getProductDigests`, `getCategories` | Mixed read paths; operational reads are owner/store scoped where enforced by caller flow. |

### Merchant order operations (`Current`)

| Surface | Entrypoint | Auth reality |
|---|---|---|
| Order lists and reads | `convex/orders.ts` -> `getOrders`, `getOrder`, `getOrdersByStatus`, `getOrderByNumber`, `getOrderDigests`, `getNewOrdersCount` | Owner-scoped. |
| Order mutations | `convex/orders.ts` -> `updateOrderStatus`, `bulkUpdateOrderStatus`, `updateOrderNotes`, `upsertAdminNote`, `addCallLog`, `updateTrackingNumber` | Owner-scoped; confirmation now requires answered-call evidence and `addCallLog` can move pre-fulfillment lifecycle states. |
| Delivery sync-back | `convex/orders.ts` -> `markOrderDispatchedFromDeliveryApi` | Owner-scoped mutation used by delivery route. |

### Merchant storefront/content + delivery integration (`Current`)

| Surface | Entrypoint | Auth reality |
|---|---|---|
| Generic content writes | `convex/siteContent.ts` -> `updateSiteContent` | Live write path. |
| Asset upload URL | `convex/siteContent.ts` -> `generateUploadUrl` | Live helper for uploads. |
| Navbar/hero/content helpers | `convex/siteContent.ts` -> `setNavbarStyles`, `deleteNavbarLogo`, `setNavbarLogo`, `setHeroStyles`, `initializeSiteContent` | Live merchant content helpers. |
| Delivery integration read/write | `convex/siteContent.ts` -> `getDeliveryIntegration`, `setDeliveryIntegration` | Owner-scoped. |
| Owner runtime credential read | `convex/siteContent.ts` -> `getDeliveryCredentialsForOwnerRuntime` | Owner-scoped, returns decrypted provider credentials to server-side owner flows. |
| Delivery connection test | `convex/siteContent.ts` -> `testDeliveryConnection` | Owner-scoped action with local rate limit. |

## Partial / Transitional Surfaces

### Delivery dispatch route (`Partial`)

- Route: `POST /api/delivery/create-order`
- Status: live Next.js route.
- Current behavior:
  - Requires authenticated Clerk user.
  - Resolves store by `storeId` or `storeSlug`.
  - Enforces owner-only access, not admin/staff policy.
  - Loads the server-side order record and rejects dispatch unless the order is `confirmed`.
  - Loads store delivery credentials from Convex and dispatches synchronously.
  - Writes delivery analytics and tries to patch order tracking metadata.
- Current caveats:
  - Not queued.
  - No durable idempotency protection.
  - Retry/unknown-outcome cases can duplicate provider-side dispatch.

### Payment initiation (`Partial`)

- Route: `POST /api/chargily/create-payment`
- Status: live payment-initiation route.
- Current request fields: `storeId`.
- Current response fields: `checkoutUrl`, `checkoutId`, `paymentAttemptId`, `success`, optional `message`.
- Current reality:
  - This is the active payment-initiation surface today.
  - The route now authenticates the actor, resolves store access through centralized Convex helpers, and derives amount/store/provider metadata on the server.
  - It persists a `paymentAttempts` row before calling the provider so future webhook work can reconcile by server-owned attempt metadata.
  - It is still not the final documented merchant unlock route because webhook trust and billing-policy cutover remain incomplete.

### Billing state transitions (`Partial`)

- Convex entrypoints:
  - `convex/stores.ts` -> `handleNewOrderSubscription`
  - `convex/stores.ts` -> `updateSubscription`
  - `convex/stores.ts` -> `getStoreBillingStatus`
  - `convex/stores.ts` -> `cleanupLockedStoreOrders`
- Current reality:
  - Runtime semantics are subscription/trial oriented.
  - Locking threshold is tied to trial-window order count, not `5/day` overflow.
  - Retention cleanup is for long-locked stores after 20 days, not masked overflow orders after 5 days.

### Chargily webhook (`Partial`)

- Route: `POST /api/chargily/webhook`
- Status: live route, incomplete hardening.
- Current behavior:
  - Parses incoming JSON.
  - Reacts to `payment.succeeded` / `payment.completed`.
  - Attempts store activation when webhook metadata includes `storeId`.
- Current caveats:
  - No completed signature-verification contract should be assumed.
  - No durable replay defense or webhook dedupe ledger is in place.
  - Activation currently calls `convex/stores.ts` -> `updateSubscription`, which enforces owner auth; the webhook path does not supply owner auth, so end-to-end activation is not a hardened or reliable contract yet.

### Public order submit route (`Current`)

- Route: `POST /api/orders/create`
- Status: live public checkout route.
- Current behavior:
  - Does not require Clerk auth.
  - Accepts `storeSlug`, `idempotencyKey`, customer fields, delivery type, and products with `productId`, `quantity`, and optional `variant`.
  - Ignores client-supplied product names, prices, subtotal, delivery cost, and total.
  - Calls `convex/orders.ts` -> `createPublicOrder`.
  - Returns `orderId`, `orderNumber`, `duplicate`, and server-computed `totals`.
  - Maps malformed payloads, invalid phones/products/stores, duplicate recent orders, and velocity limits to safe JSON errors.
  - Adds lightweight order `riskFlags` for duplicate phone, repeated cancelled/refused history, and high-frequency submissions.
- Current caveats:
  - Abuse controls are lightweight and order-based, not a full fraud/risk engine.
  - The route creates orders directly; lead/checkout-attempt tracking is still planned for a later phase.

## Deprecated / Mock

## Planned Contracts And Policy Targets

These are target directions only; exact payload guarantees should not be assumed until live entrypoints exist.

- Lead/checkout-attempt tracking before public order conversion.
- Merchant lock/unlock behavior based on `5/day`, `Africa/Algiers` reset boundaries, masked overflow orders, and timed cleanup/unlock restoration.
- A stable merchant unlock/initiation surface instead of the current generic payment route.
- Hardened Chargily webhook processing with signature verification, replay-window enforcement, durable dedupe, and a trusted internal activation path.
- Centralized authorization and policy enforcement for `owner | admin | staff` rather than scattered owner checks.
- Membership/governance APIs for store roles and ownership transfer.
- Async delivery dispatch queueing with retries and dead-letter handling.

## Biggest Known Gaps

- Merchant API docs should treat Convex functions as the primary live surface; most documented REST merchant routes do not exist.
- Public checkout is now live, but checkout attempts/leads are not separately tracked yet.
- Billing runtime does not match the planned overflow/unlock contract.
- Payment initiation is currently `POST /api/chargily/create-payment`, not a stable merchant unlock endpoint.
- Chargily webhook route exists, but hardening and activation correctness are incomplete.
- Auth is primarily owner-based today; `owner | admin | staff` is still a policy target, not an enforced runtime layer.
