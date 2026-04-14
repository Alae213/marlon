# Data Models (Canonical)

Canonical MVP data model aligned to locked decisions in `context/project/DECISIONS.md` and runtime architecture in `context/technical/ARCHITECTURE.md`.

## Global Rules

- Multi-tenant boundary is `storeId` on all store-scoped records.
- Timestamps use Unix epoch milliseconds (`Date.now()`).
- Commercial lock policy is fixed platform-wide:
  - `dailyCap = 5` orders per store/day.
  - Day boundary is `00:00 Africa/Algiers`.
  - Overflow orders are accepted but merchant-visible data/actions are masked/frozen while locked.
  - Overflow orders auto-delete after 5 days if still locked.
  - Unlock price is fixed at `2000 DZD` per store per month.
- `stores.slug` is globally unique; reserved words are denied at creation/update (`reserved-slug` policy check).

## Shared Enums / State Machines

- `MembershipRole`: `owner | admin | staff`
- `MembershipStatus`: `active | invited | revoked`
- `PlatformRole` (users): `user | platform_admin`
- `OwnershipTransferStatus`: `pending_owner_confirmation | confirmed_by_owner | executed | rejected | canceled | expired | break_glass_executed`
- `StoreLockState`: `unlocked | locked_overflow`
- `OrderStatus`: `pending | confirmed | preparing | out_for_delivery | delivered | canceled | returned`
- `OrderVisibilityState`: `normal | overflow_masked | overflow_unlocked`
- `DeliveryJobStatus`: `queued | in_progress | retry_scheduled | succeeded | failed | dead_letter`
- `WebhookProcessStatus`: `received | verified | processed | ignored_duplicate | rejected`

## Entities

### `users`

Purpose: identity, account trust, and retention lifecycle for authenticated actors.

Fields
- `_id`
- `clerkUserId` (required)
- `platformRole` (`PlatformRole`, default `user`)
- `email` (nullable), `emailVerifiedAt` (nullable)
- `phoneE164` (nullable), `phoneVerifiedAt` (nullable)
- `storesOwnedCount` (derived/cacheable)
- `reputationScore` (number, default neutral)
- `isBlocked` (bool), `blockReason` (nullable)
- `createdAt`, `updatedAt`, `lastSeenAt`
- Retention/lifecycle: `deletedAt` (soft delete), `anonymizedAt`, `retentionPolicyVersion`

Indexes / constraints
- Unique: `clerkUserId`
- Index: `phoneE164`
- Index: `platformRole`

### `stores`

Purpose: canonical store identity, routing slug, and commercial lock/unlock state.

Fields
- `_id`
- `ownerUserId` (required)
- `slug` (required, global unique, reserved denylist protected)
- `name`, `status` (`active | suspended | archived`)
- `timezone` (fixed to `Africa/Algiers` for cap logic)
- `dailyOrderCap` (fixed `5`)
- `dailyWindowDate` (`YYYY-MM-DD` in `Africa/Algiers`)
- `dailyOrdersCount` (resets at local midnight)
- `lockState` (`StoreLockState`)
- `lockActivatedAt` (nullable)
- `unlockPriceDzd` (fixed `2000`)
- `unlockActiveFrom` (nullable), `unlockActiveUntil` (nullable)
- `createdAt`, `updatedAt`
- Lifecycle: `deletedAt` (nullable)

Indexes / constraints
- Unique: `slug`
- Index: `ownerUserId`
- Index: `lockState`
- Index: `unlockActiveUntil`

Policy note
- `slug` uniqueness is global across all stores; writes must fail when slug is in reserved denylist.

### `storeMemberships`

Purpose: actor-to-store authorization source of truth.

Fields
- `_id`
- `storeId`, `userId`
- `role` (`MembershipRole`)
- `status` (`MembershipStatus`)
- `invitedByUserId` (nullable)
- `createdAt`, `updatedAt`, `revokedAt` (nullable)

Indexes / constraints
- Unique: (`storeId`, `userId`)
- Index: (`userId`, `status`)
- Index: (`storeId`, `role`, `status`)

Governance note
- `admin` may manage members and operations per policy, but may not execute current owner removal/transfer without explicit owner confirmation.

### `ownerTransferRequests`

Purpose: auditable governance workflow for owner transfer/removal with mandatory current-owner confirmation.

Fields
- `_id`
- `storeId`
- `currentOwnerUserId`
- `proposedSuccessorUserId` (nullable for owner-removal-only request when policy allows)
- `requestedByUserId`
- `status` (`OwnershipTransferStatus`)
- `requestReasonCode` (`owner_initiated | owner_requested_delegate | legal_request | abuse_escalation | support_escalation | other`)
- `requestNote` (nullable)
- `ownerConfirmedAt` (nullable)
- `ownerConfirmedByUserId` (nullable, must equal `currentOwnerUserId`)
- `executedAt` (nullable)
- `executedByUserId` (nullable)
- `breakGlass` (bool, default `false`)
- `breakGlassReasonCode` (nullable, required when `breakGlass=true`)
- `breakGlassTicketRef` (nullable, required when `breakGlass=true`)
- `expiresAt`
- `createdAt`, `updatedAt`, `canceledAt` (nullable)

Indexes / constraints
- Index: (`storeId`, `status`, `createdAt`)
- Index: (`currentOwnerUserId`, `status`)
- Index: (`requestedByUserId`, `createdAt`)
- Logical invariant: execution requires `ownerConfirmedAt` unless `breakGlass=true`.
- Logical invariant: `breakGlass=true` requires `executedBy` actor with `platformRole=platform_admin`, non-empty reason code, and ticket reference.

### `products`

Purpose: merchant catalog entries.

Fields
- `_id`
- `storeId`
- `slug` (store-scoped)
- `title`, `description`
- `priceDzd`, `compareAtPriceDzd` (nullable)
- `currency` (default `DZD`)
- `images` (array), `inventoryQty` (nullable)
- `isPublished`, `sortOrder`
- `createdAt`, `updatedAt`, `deletedAt` (nullable)

Indexes / constraints
- Unique: (`storeId`, `slug`)
- Index: (`storeId`, `isPublished`, `sortOrder`)

### `siteContent`

Purpose: editable storefront/admin content by section.

Fields
- `_id`
- `storeId`
- `section` (e.g., `hero`, `about`, `faq`, `deliveryIntegration`)
- `content` (JSON object)
- `version`
- `updatedByUserId`
- `createdAt`, `updatedAt`

Delivery integration metadata rule
- `siteContent.section = deliveryIntegration` stores metadata only:
  - `provider` (`zr-express | yalidine | none`)
  - `hasCredentials` (bool)
  - `lastUpdatedAt`
- No secret credential values may be stored in `siteContent`.

Indexes / constraints
- Unique: (`storeId`, `section`)
- Index: `storeId`

### `deliveryPricing`

Purpose: store-scoped delivery pricing matrix used at checkout.

Fields
- `_id`
- `storeId`
- `provider` (`zr-express | yalidine | internal`)
- `zones` (array of zone rules: name, feeDzd, conditions)
- `defaultFeeDzd`
- `freeDeliveryThresholdDzd` (nullable)
- `isActive`
- `createdAt`, `updatedAt`

Indexes / constraints
- Unique: (`storeId`, `provider`)
- Index: (`storeId`, `isActive`)

### `deliveryCredentials`

Purpose: encrypted per-store/provider delivery secrets.

Fields
- `_id`
- `storeId`
- `provider` (`zr-express | yalidine`)
- `algorithm` (fixed `aes-256-gcm`)
- `ciphertextHex`, `ivHex`, `authTagHex`
- `keyVersion`
- `createdAt`, `updatedAt`, `rotatedAt` (nullable)

Indexes / constraints
- Unique: (`storeId`, `provider`)
- Index: `storeId`

Security note
- Write-only to merchant UI after save; decrypted values are never returned to clients.

### `orders`

Purpose: operational order record with inline latest state and embedded item snapshots.

Fields
- `_id`
- `storeId`
- `publicOrderNumber` (store-scoped increment/string)
- `status` (`OrderStatus`)
- `visibilityState` (`OrderVisibilityState`)
- `storeLockStateAtCreation` (`StoreLockState`)
- `customerSnapshot`:
  - `fullName`, `phoneE164`, `addressLine`, `wilaya`, `commune`, `notes`
- `customerMaskedSnapshot`:
  - masked display values used while locked
- `totals`:
  - `subtotalDzd`, `deliveryFeeDzd`, `discountDzd`, `totalDzd`
- `currency` (`DZD`)
- `items` (`OrderItemSnapshot[]`, embedded; see below)
- `delivery`:
  - `provider`, `dispatchState`, `lastDispatchJobId` (nullable), `providerTrackingRef` (nullable)
- `placedAt`, `confirmedAt` (nullable), `deliveredAt` (nullable), `canceledAt` (nullable)
- Lock lifecycle: `isOverflow` (bool), `overflowDeleteAfterAt` (nullable)
- Retention: `piiRetentionUntil`, `anonymizedAt` (nullable), `deletedAt` (nullable)
- `createdAt`, `updatedAt`

Embedded `OrderItemSnapshot`
- `lineId`
- `productId` (nullable for deleted products)
- `productTitleSnapshot`
- `skuSnapshot` (nullable)
- `unitPriceDzdSnapshot`
- `quantity`
- `lineTotalDzdSnapshot`

Indexes / constraints
- Unique: (`storeId`, `publicOrderNumber`)
- Index: (`storeId`, `createdAt`)
- Index: (`storeId`, `status`, `createdAt`)
- Index: (`storeId`, `visibilityState`, `createdAt`)
- Index: (`storeId`, `overflowDeleteAfterAt`)

Lifecycle note
- If `isOverflow=true` and store remains locked, record is hard-deleted at `overflowDeleteAfterAt` (`createdAt + 5 days`).
- Before delete, non-PII aggregates can be retained in analytics tables only.

### `orderAudit`

Purpose: immutable append-only timeline for order and lock/billing/delivery events.

Fields
- `_id`
- `storeId`, `orderId` (nullable for store-level events)
- `eventType` (e.g., `order_created`, `status_changed`, `masked`, `unlocked`, `dispatch_attempted`, `dispatch_succeeded`, `dispatch_failed`, `owner_transfer_requested`, `owner_transfer_confirmed`, `owner_transfer_executed`, `owner_transfer_break_glass_executed`)
- `actorType` (`system | user | webhook | worker`)
- `actorId` (nullable)
- `payload` (structured JSON, no raw secrets)
- `occurredAt`, `createdAt`
- `idempotencyKey` (nullable)

Indexes / constraints
- Index: (`orderId`, `occurredAt`)
- Index: (`storeId`, `occurredAt`)
- Unique (nullable): `idempotencyKey`

### `billingSubscriptions`

Purpose: recurring commercial subscription records per store unlock plan.

Fields
- `_id`
- `storeId`
- `provider` (fixed `chargily` for MVP)
- `providerSubscriptionId` (nullable until confirmed)
- `planCode` (`unlock_store_monthly_2000_dzd`)
- `amountDzd` (fixed `2000`)
- `currency` (`DZD`)
- `status` (`pending | active | past_due | canceled | expired`)
- `currentPeriodStartAt`, `currentPeriodEndAt`
- `canceledAt` (nullable)
- `createdAt`, `updatedAt`

Indexes / constraints
- Unique: (`storeId`, `planCode`, `status=active`) logical invariant
- Index: (`storeId`, `status`)
- Index: `providerSubscriptionId`

### `unlockWindows`

Purpose: auditable store unlock entitlement windows derived from verified billing events.

Fields
- `_id`
- `storeId`
- `subscriptionId` (nullable)
- `sourceWebhookReceiptId`
- `startsAt`, `endsAt`
- `state` (`scheduled | active | expired | revoked`)
- `createdAt`, `updatedAt`

Indexes / constraints
- Index: (`storeId`, `startsAt`)
- Index: (`storeId`, `endsAt`)
- Index: (`storeId`, `state`)

### `webhookReceipts`

Purpose: trusted webhook evidence, replay defense, and idempotent processing ledger.

Fields
- `_id`
- `provider` (`chargily`)
- `externalEventId`
- `eventType`
- `signatureValid` (bool)
- `payloadHash`
- `receivedAt`
- `processedAt` (nullable)
- `processStatus` (`WebhookProcessStatus`)
- `idempotencyKey`
- `errorCode` (nullable), `errorMessage` (nullable)

Indexes / constraints
- Unique: (`provider`, `externalEventId`)
- Unique: `idempotencyKey`
- Index: (`provider`, `processStatus`, `receivedAt`)

### `queueJobs`

Purpose: async job queue backing delivery dispatch and retries.

Fields
- `_id`
- `topic` (fixed `delivery.dispatch` for current scope)
- `storeId`, `orderId`
- `provider`
- `status` (`DeliveryJobStatus`)
- `attemptCount`, `maxAttempts`
- `runAt` (scheduled next execution)
- `lastErrorCode` (nullable), `lastErrorMessage` (nullable)
- `payload` (minimal provider input)
- `idempotencyKey`
- `createdAt`, `updatedAt`, `finishedAt` (nullable)

Indexes / constraints
- Unique: `idempotencyKey`
- Index: (`topic`, `status`, `runAt`)
- Index: (`storeId`, `status`, `createdAt`)
- Index: (`orderId`, `createdAt`)

### `blocklistEntries`

Purpose: explicit fraud/abuse denial rules.

Fields
- `_id`
- `scope` (`global | store`)
- `storeId` (nullable when global)
- `subjectType` (`phone | user | ip | address`)
- `subjectHash` (normalized + hashed value)
- `reasonCode`
- `active` (bool)
- `expiresAt` (nullable)
- `createdByUserId` (nullable), `createdAt`, `updatedAt`

Indexes / constraints
- Unique: (`scope`, `storeId`, `subjectType`, `subjectHash`)
- Index: (`active`, `expiresAt`)
- Index: (`storeId`, `active`)

### `reputationSignals`

Purpose: non-binary trust signals used for fraud scoring and throttling.

Fields
- `_id`
- `storeId` (nullable for global signals)
- `subjectType` (`phone | user | ip | address`)
- `subjectHash`
- `signalType` (`order_cancel_rate | return_rate | failed_delivery | abuse_report | velocity_spike`)
- `signalValue` (number)
- `windowStartAt`, `windowEndAt`
- `source` (`system | admin | webhook`)
- `createdAt`

Indexes / constraints
- Index: (`subjectType`, `subjectHash`, `windowEndAt`)
- Index: (`storeId`, `signalType`, `windowEndAt`)

## Locked Lifecycle and Retention Behavior

- Overflow lifecycle (locked commercial behavior):
  - On order create, if store exceeds `dailyOrderCap=5` for `dailyWindowDate` in `Africa/Algiers`, set `orders.isOverflow=true`, `orders.visibilityState=overflow_masked`, and `orders.overflowDeleteAfterAt = createdAt + 5 days`.
  - While store is `locked_overflow`, merchant-facing reads/actions use masked snapshot only and block state-mutating actions per policy.
  - If unlock becomes active before `overflowDeleteAfterAt`, set `visibilityState=overflow_unlocked` and allow normal handling.
  - If still locked at `overflowDeleteAfterAt`, hard-delete overflow order record and keep only anonymized/aggregated metrics.
- PII retention/anonymization fields:
  - `orders.piiRetentionUntil` controls when direct identifiers must be anonymized.
  - `users.anonymizedAt` and `orders.anonymizedAt` mark irreversible anonymization completion.
  - `deletedAt` means tombstoned/soft-deleted records; hard-delete allowed only for overflow-expired locked orders and retention cleanup jobs.
- Analytics retention:
  - Retain only aggregate non-identifying metrics after anonymization/deletion events.
- Ownership governance lifecycle:
  - Ownership transfer/removal starts with `ownerTransferRequests.status=pending_owner_confirmation`.
  - Execution is blocked until `ownerConfirmedAt` is set by current owner.
  - Admin cannot bypass owner confirmation.
  - Break-glass execution is exceptional (`breakGlass=true`) and requires `platform_admin`, reason code, ticket reference, and immutable audit append.
