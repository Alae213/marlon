# API Contracts (Canonical)

Canonical API contract reference for locked MVP behavior. This document is the source of truth for request/response semantics and security expectations across public storefront, merchant, admin, and webhook ingress.

## Global Conventions

- Transport: JSON over HTTPS only.
- Time format: Unix epoch milliseconds in payloads; day-cap logic always uses `Africa/Algiers` with boundary at `00:00` local time.
- Auth model:
  - Public storefront endpoints: no merchant auth, strict abuse controls.
  - Merchant endpoints: authenticated Clerk session + central Convex policy layer.
  - Store governance endpoints: authenticated + store role checks (`owner | admin | staff` as endpoint-specific).
  - Platform governance endpoints: authenticated + `platformRole=platform_admin`.
- Central auth policy layer is mandatory for all protected actions (no per-endpoint ad hoc bypass).
- Standard error envelope:

```json
{
  "error": {
    "code": "forbidden",
    "message": "You do not have permission for this store.",
    "requestId": "req_...",
    "details": {}
  }
}
```

- Idempotency:
  - Mutation endpoints that create external effects accept `Idempotency-Key` header.
  - Duplicate key with same normalized payload returns previous result.
  - Duplicate key with different payload returns `409 idempotency_conflict`.
  - Idempotency keys retained for 24h minimum.
- Secret handling: no endpoint returns raw payment secrets, delivery credentials, webhook secrets, or decrypted provider credentials.
- Rate limits and abuse controls (minimum baseline):
  - Public checkout/order create: `30 req / 5 min / IP` + phone reputation/blocklist check.
  - Slug validation: `60 req / min / actor`.
  - Unlock init + webhook ingest: `10 req / min / actor or source`.
  - Membership/admin governance endpoints: `30 req / min / actor`.

Role model (locked):
- Store roles: `owner`, `admin`, `staff`
- Platform role: `platform_admin`

Ownership governance lock:
- Admin cannot unilaterally remove current owner.
- Owner transfer/removal execution requires explicit current owner confirmation.
- Optional exceptional break-glass path exists for `platform_admin` only with strict reason-code + immutable audit requirements.

## Public Storefront APIs (Unauthenticated)

### 1) Checkout / Order Creation with Per-Store Daily Cap

- `POST /api/public/stores/{storeSlug}/orders`
- Purpose: create COD order from storefront; enforce per-store cap (`5/day`) and overflow lock behavior.
- Auth: none (public).
- Request shape:

```json
{
  "items": [{ "productId": "p_1", "quantity": 2 }],
  "customer": {
    "fullName": "...",
    "phoneE164": "+213...",
    "addressLine": "...",
    "wilaya": "...",
    "commune": "...",
    "notes": "..."
  },
  "delivery": { "provider": "zr-express" },
  "idempotencyKey": "optional-if-header-not-used"
}
```

- Response shape (`201`):

```json
{
  "orderId": "ord_...",
  "publicOrderNumber": "A-1024",
  "storeId": "st_...",
  "accepted": true,
  "lockStateAtCreation": "unlocked | locked_overflow",
  "visibilityState": "normal | overflow_masked",
  "customerMessage": "Order confirmed"
}
```

- Main errors: `400 validation_failed`, `404 store_not_found`, `409 store_archived`, `429 rate_limited`, `422 blocked_subject`.
- Side effects / audit events:
  - Create `orders` row with inline state.
  - Increment and/or reset daily counter based on `Africa/Algiers` date rollover.
  - If overflow: set `isOverflow=true`, `visibilityState=overflow_masked`, `overflowDeleteAfterAt=createdAt+5d`, ensure store `lockState=locked_overflow`.
  - Append `orderAudit` event `order_created` (+ `masked` when overflow).
- Idempotency notes: required for checkout retries to prevent duplicate orders from client/network retries.

## Merchant/Admin APIs (Authenticated)

### 2) Store Creation + Slug Validation (Global Unique + Reserved Words)

- `POST /api/merchant/stores`
- Purpose: create store with globally unique slug and reserved-word denial.
- Auth: authenticated user; post-creation owner membership is `owner`.
- Request shape:

```json
{ "name": "My Store", "slug": "my-store" }
```

- Response shape (`201`):

```json
{
  "store": {
    "id": "st_...",
    "name": "My Store",
    "slug": "my-store",
    "lockState": "unlocked",
    "dailyOrderCap": 5,
    "timezone": "Africa/Algiers"
  }
}
```

- Main errors: `400 validation_failed`, `409 slug_taken`, `422 reserved_slug`, `403 phone_verification_required_after_5_stores`.
- Side effects / audit events: create `stores`, create `storeMemberships` (`owner`), append `orderAudit` store-level event `store_created`.
- Idempotency notes: support `Idempotency-Key` for repeated submits.

- `GET /api/merchant/stores/slug-availability?slug={slug}`
- Purpose: preflight slug checks.
- Auth: authenticated.
- Response shape (`200`):

```json
{
  "slug": "my-store",
  "isAvailable": false,
  "reason": "slug_taken | reserved_slug | invalid_format",
  "suggestions": ["my-store-dz", "my-store-1"]
}
```

- Main errors: `400 invalid_slug`, `429 rate_limited`.
- Side effects / audit events: none.
- Idempotency notes: not applicable (read endpoint).

### 3) Merchant Order Reads/Actions with Overflow Masking + Freeze

- `GET /api/merchant/stores/{storeId}/orders?status=&cursor=&limit=`
- Purpose: list orders with policy-enforced masking for locked overflow records.
- Auth: store membership required (`owner|admin|staff`), policy checks per role.
- Response shape (`200`):

```json
{
  "items": [
    {
      "orderId": "ord_...",
      "status": "pending",
      "visibilityState": "normal | overflow_masked | overflow_unlocked",
      "customer": {
        "fullName": "***",
        "phoneE164": "***",
        "addressLine": "***"
      },
      "actions": {
        "canUpdateStatus": false,
        "canDispatch": false,
        "canEdit": false
      }
    }
  ],
  "nextCursor": "..."
}
```

- Main errors: `401 unauthorized`, `403 forbidden`, `404 store_not_found`.
- Side effects / audit events: read access audit optional (`orders_read`).
- Idempotency notes: not applicable.

- `POST /api/merchant/stores/{storeId}/orders/{orderId}/actions`
- Purpose: status/edit/dispatch intent actions; blocked while `overflow_masked` and store locked.
- Auth: store membership + role policy.
- Request shape:

```json
{ "action": "update_status", "payload": { "status": "confirmed" } }
```

- Response shape (`200`):

```json
{ "ok": true, "orderId": "ord_...", "status": "confirmed" }
```

- Main errors: `403 order_frozen_locked_overflow`, `403 staff_action_not_allowed`, `404 order_not_found`, `409 invalid_transition`.
- Side effects / audit events: append `orderAudit` (`status_changed`, `note_added`, etc.) when successful.
- Idempotency notes: required for mutating actions.

### 4) Unlock Payment Initiation (`2000 DZD/store/month`, any store admin)

- `POST /api/merchant/stores/{storeId}/unlock/initiate`
- Purpose: initiate Chargily checkout for one store unlock window.
- Auth: authenticated store admin (`owner | admin`).
- Request shape:

```json
{
  "planCode": "unlock_store_monthly_2000_dzd",
  "successUrl": "https://.../billing/success",
  "cancelUrl": "https://.../billing/cancel"
}
```

- Response shape (`200`):

```json
{
  "checkoutId": "chk_...",
  "checkoutUrl": "https://pay.chargily...",
  "amountDzd": 2000,
  "currency": "DZD",
  "storeId": "st_..."
}
```

- Main errors: `403 forbidden`, `409 unlock_already_active`, `422 invalid_plan`, `429 rate_limited`.
- Side effects / audit events:
  - Create/refresh `billingSubscriptions` in `pending`.
  - Append `orderAudit` store-level event `unlock_initiated`.
- Idempotency notes: mandatory to avoid duplicate checkout sessions per click/retry burst.

### 5) Unlock Activation Side Effects on Order Visibility

- `POST /api/internal/stores/{storeId}/unlock/activate`
- Purpose: internal trusted activation step (triggered only by verified webhook processor).
- Auth: internal service credential only (not user session).
- Request shape:

```json
{
  "storeId": "st_...",
  "sourceWebhookReceiptId": "whrec_...",
  "startsAt": 1713043200000,
  "endsAt": 1715635200000
}
```

- Response shape (`200`):

```json
{
  "storeId": "st_...",
  "lockState": "unlocked",
  "unlockActiveUntil": 1715635200000,
  "unmaskedOrderCount": 3
}
```

- Main errors: `401 internal_auth_failed`, `409 stale_window`, `409 already_processed`.
- Side effects / audit events:
  - Transition store lock state to unlocked with active window.
  - Convert retained `orders.visibilityState=overflow_masked` to `overflow_unlocked`.
  - Keep deleted-overflow records deleted; no resurrection.
  - Append immutable `orderAudit` events (`unlocked`, `visibility_restored`).
- Idempotency notes: keyed by `sourceWebhookReceiptId`.

### 6) Delivery Dispatch Enqueue + Async Status Polling (Retry + DLQ)

- `POST /api/merchant/stores/{storeId}/orders/{orderId}/dispatch`
- Purpose: enqueue async delivery provider dispatch job.
- Auth: authenticated store member with dispatch permission.
- Request shape:

```json
{ "provider": "zr-express" }
```

- Response shape (`202`):

```json
{
  "jobId": "job_...",
  "status": "queued",
  "attemptCount": 0,
  "maxAttempts": 5,
  "nextRunAt": 1713043200000
}
```

- Main errors: `403 forbidden`, `403 order_frozen_locked_overflow`, `409 already_dispatched`, `422 credentials_missing`, `429 rate_limited`.
- Side effects / audit events:
  - Create `queueJobs(topic=delivery.dispatch,status=queued)`.
  - Update order delivery inline state to queued.
  - Append `orderAudit` event `dispatch_attempted` (enqueue accepted).
- Idempotency notes: required; idempotency key prevents duplicate queue jobs.

- `GET /api/merchant/stores/{storeId}/dispatch-jobs/{jobId}`
- Purpose: poll async dispatch status.
- Auth: authenticated store member.
- Response shape (`200`):

```json
{
  "jobId": "job_...",
  "status": "queued | in_progress | retry_scheduled | succeeded | failed | dead_letter",
  "attemptCount": 2,
  "maxAttempts": 5,
  "lastErrorCode": "provider_timeout",
  "nextRunAt": 1713043260000
}
```

- Main errors: `403 forbidden`, `404 job_not_found`.
- Side effects / audit events: none on read.
- Idempotency notes: not applicable.

- Retry/DLQ policy constants (locked for MVP):
  - `maxAttempts = 5`
  - Backoff schedule (seconds from failed attempt): `30`, `120`, `600`, `1800`, then DLQ
  - Terminal state after last failure: `dead_letter`
  - Each attempt and terminal outcome appends audit event (`dispatch_attempted`, `dispatch_succeeded`, `dispatch_failed`, `dispatch_dead_letter`).

### 7) Admin + Membership Management (Owner Governance Included)

- `POST /api/merchant/stores/{storeId}/members`
- Purpose: invite/add member.
- Auth: owner or store admin per policy (`owner | admin`).
- Request shape:

```json
{ "userId": "usr_...", "role": "admin | staff" }
```

- Response shape (`201`):

```json
{ "membershipId": "mem_...", "status": "invited | active" }
```

- Main errors: `403 forbidden`, `409 membership_exists`, `422 invalid_role`.
- Side effects / audit events: upsert membership; append `membership_added`.
- Idempotency notes: required.

Notes:
- Owner role assignment/change is handled only through ownership governance flow, not direct member invite.

- `PATCH /api/merchant/stores/{storeId}/members/{membershipId}`
- Purpose: role/status updates.
- Auth: owner or store admin per policy (`owner | admin`).
- Request shape:

```json
{ "role": "staff", "status": "active | revoked" }
```

- Response shape (`200`):

```json
{ "membershipId": "mem_...", "role": "staff", "status": "active" }
```

- Main errors: `403 forbidden`, `404 membership_not_found`, `409 last_owner_violation`.
- Side effects / audit events: append `membership_updated`.
- Idempotency notes: required for repeated admin actions.

- `DELETE /api/merchant/stores/{storeId}/members/{membershipId}`
- Purpose: remove membership.
- Auth: owner/admin per policy.
- Main errors: `403 forbidden`, `409 owner_removal_requires_owner_confirmation`, `409 owner_removal_requires_governance`.
- Side effects / audit events: mark membership revoked; append `membership_removed`.
- Idempotency notes: required.

- `POST /api/merchant/stores/{storeId}/ownership-transfer-requests`
- Purpose: create owner transfer/removal governance request requiring current-owner confirmation.
- Auth: store member with governance permission (`owner | admin`).
- Request shape:

```json
{
  "currentOwnerUserId": "usr_owner",
  "proposedSuccessorUserId": "usr_new_owner",
  "requestReasonCode": "owner_initiated|owner_requested_delegate|support_escalation|other",
  "requestNote": "optional"
}
```

- Response shape (`201`):

```json
{
  "requestId": "otr_...",
  "storeId": "st_...",
  "status": "pending_owner_confirmation",
  "expiresAt": 1713129600000
}
```

- Main errors: `403 forbidden`, `404 owner_membership_not_found`, `409 successor_required`, `409 successor_not_active_member`, `409 open_request_exists`.
- Side effects / audit events:
  - Create `ownerTransferRequests` with `pending_owner_confirmation` status.
  - Append immutable governance event `owner_transfer_requested`.
- Idempotency notes: mandatory.

- `POST /api/merchant/stores/{storeId}/ownership-transfer-requests/{requestId}/confirm`
- Purpose: explicit current-owner confirmation before execution.
- Auth: current owner only (`owner`).
- Request shape:

```json
{ "confirm": true }
```

- Response shape (`200`):

```json
{
  "requestId": "otr_...",
  "status": "confirmed_by_owner",
  "ownerConfirmedAt": 1713043200000
}
```

- Main errors: `403 not_current_owner`, `404 request_not_found`, `409 request_not_pending`, `410 request_expired`.
- Side effects / audit events:
  - Set owner confirmation metadata.
  - Append immutable governance event `owner_transfer_confirmed`.
- Idempotency notes: required.

- `POST /api/merchant/stores/{storeId}/ownership-transfer-requests/{requestId}/execute`
- Purpose: execute owner transfer/removal only after owner confirmation.
- Auth: policy-authorized store role (`owner | admin`).
- Request shape:

```json
{ "idempotencyKey": "gov_..." }
```

- Response shape (`200`):

```json
{
  "requestId": "otr_...",
  "storeId": "st_...",
  "previousOwnerUserId": "usr_owner",
  "newOwnerUserId": "usr_new_owner",
  "effectiveAt": 1713043200000,
  "status": "executed"
}
```

- Main errors: `403 forbidden`, `409 owner_confirmation_required`, `409 request_not_executable`, `409 successor_not_active_member`.
- Side effects / audit events:
  - Atomic owner transfer with no ownerless intermediate state.
  - Append immutable governance event `owner_transfer_executed`.
- Idempotency notes: mandatory.

- `POST /api/admin/stores/{storeId}/ownership-transfer-requests/{requestId}/break-glass-execute`
- Purpose: exceptional `platform_admin` override when owner confirmation cannot be obtained for legal/safety/escalation incidents.
- Auth: `platformRole=platform_admin` only.
- Request shape:

```json
{
  "breakGlassReasonCode": "legal|security_incident|account_takeover|support_escalation",
  "ticketRef": "GOV-1234",
  "note": "optional"
}
```

- Response shape (`200`):

```json
{
  "requestId": "otr_...",
  "storeId": "st_...",
  "status": "break_glass_executed",
  "effectiveAt": 1713043200000
}
```

- Main errors: `403 admin_only`, `404 request_not_found`, `409 invalid_break_glass_state`, `422 missing_reason_or_ticket`.
- Side effects / audit events:
  - Executes ownership governance change under break-glass policy.
  - Appends immutable governance event `owner_transfer_break_glass_executed` including reason code and ticket reference.
- Idempotency notes: mandatory; keyed to governance ticket/reference.

## Payment Provider Webhook API (External Ingress)

### 8) Chargily Webhook Processing (Signature + Replay Window + Idempotency)

- `POST /api/chargily/webhook`
- Purpose: ingest payment events and activate unlock windows only for verified, fresh, non-duplicate events.
- Auth: provider signature headers (no user auth).
- Required headers:
  - `x-chargily-signature`
  - `x-chargily-timestamp`
  - `x-chargily-event-id`
- Request shape: provider-native event payload (`payment.succeeded`/equivalent) including store reference metadata.
- Response shape:
  - `200 { "received": true, "status": "processed | ignored_duplicate" }`
  - `400 { "error": { "code": "invalid_payload" ... } }`
  - `401 { "error": { "code": "invalid_signature" ... } }`
  - `409 { "error": { "code": "replay_window_exceeded" ... } }`

- Main errors: `401 invalid_signature`, `409 replay_window_exceeded`, `409 duplicate_event`, `422 missing_store_binding`.
- Side effects / audit events:
  - Persist `webhookReceipts` evidence row (`received` -> `verified` -> `processed|ignored_duplicate|rejected`).
  - Verify HMAC against raw body with env secret; never log secret or raw sensitive payload.
  - Enforce replay window: reject if abs(`now - x-chargily-timestamp`) > 300 seconds.
  - Enforce idempotency on (`provider`, `externalEventId`) and `idempotencyKey` uniqueness.
  - On verified success event, trigger internal unlock activation and append store-level `unlocked` audit.
- Idempotency notes: webhook must be safely re-deliverable; duplicate delivery returns `200 ignored_duplicate`.

## Security Constraints (Locked)

- Central authorization helper + policy layer is the only allowed protected-access path.
- Full masking for locked overflow records has no exceptions and is enforced server-side.
- No secret return in any response (payment/provider secrets, decrypted delivery credentials, signing material).
- Webhook trust model: signature verification + replay protection + idempotent processing are all mandatory.
- Immutable audit append required for lock/unlock, order state mutation, dispatch attempts, and governance actions.
- Abuse controls mandatory on public submit and sensitive mutation endpoints (rate limits + blocklist/reputation checks).
- Ownership governance changes require explicit current-owner confirmation, except documented `platform_admin` break-glass path.
