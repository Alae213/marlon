# Feature: Subscription Billing (Masked Overflow Unlock)

> **Status:** `complete`
> **Phase:** v1
> **Last updated:** 2026-04-14

---

## Summary

Canonical commercial model for MVP monetization and lock governance (per locked decisions on 2026-04-14):

- Unlimited stores per account.
- Per-store cap: `5` orders/day.
- Cap reset: daily at `00:00` in `Africa/Algiers` timezone.
- Overflow orders are accepted, but merchant-side data/actions are masked and frozen until unlock.
- Unlock price: `2000 DZD/store/month` subscription.
- Any store admin can initiate and complete payment.
- No customer-facing notification is sent during locked state.
- Masked overflow records auto-delete after `5` days if the store remains locked.

---

## Users

- Solo merchant operating one or multiple stores.
- Agency/admin team managing multiple client stores and paying unlocks on behalf of a store.

---

## User Stories

- As a solo merchant, I want each store to keep accepting orders after cap so I do not lose incoming demand while deciding to unlock.
- As a solo merchant, I want clear lock/unlock status per store so I can pay only for stores that need full order access.
- As an agency admin, I want to unlock any assigned store without owner intervention so operations are not blocked.
- As an agency admin, I want lock behavior to be consistent across stores so team SOPs stay predictable.

---

## Behavior Flows

### 1) Normal Under-Cap Order Flow

1. Customer places order on storefront.
2. System validates/store-saves order as normal.
3. If store has fewer than 5 accepted orders for current `Africa/Algiers` day, order remains fully visible to merchant.
4. Merchant can view customer details and run normal order actions.

### 2) Overflow/Lock Flow

1. Customer places order after daily per-store cap is reached.
2. System still accepts order to avoid checkout drop-off.
3. Store enters or remains locked state for overflow scope: merchant-facing customer/order data is fully masked and mutation actions are frozen.
4. Customer receives no lock-related notification; checkout UX remains unchanged.
5. If store remains locked, masked overflow records older than 5 days are permanently deleted.

### 3) Unlock Payment Flow (Webhook + Idempotency)

1. Any store admin initiates `2000 DZD/store/month` subscription checkout for the specific store.
2. Payment provider sends signed webhook on success/failure.
3. Backend verifies signature, timestamp/replay window, and event authenticity before any state change.
4. Webhook handler is idempotent: duplicate events do not create duplicate subscriptions or inconsistent unlock transitions.
5. On verified success, store billing status transitions to unlocked for active subscription period.

### 4) Post-Unlock Visibility Restoration

1. After successful unlock, store lock flag clears.
2. Merchant/admin regains full visibility for retained (not auto-deleted) masked overflow orders.
3. Frozen merchant actions are restored for unlocked store.
4. Overflow orders already deleted by 5-day retention rule are not recoverable.

---

## Edge Cases and Business Rules

- Daily cap counter is computed per store, not per account.
- Day boundary always follows `Africa/Algiers` regardless of merchant/browser locale.
- Unlock scope is per store; one store subscription never unlocks another store.
- Payment success must be event-driven from verified webhook, not client redirect state.
- Duplicate, delayed, or out-of-order webhook deliveries must be safely handled.
- If subscription expires/cancels, lock behavior re-applies according to active billing state.
- Overflow acceptance continues during lock; visibility/action restrictions remain enforced until unlock.

---

## Security and Compliance Notes

- Enforce owner/staff policy layer on all billing and order-visibility endpoints.
- Accept unlock initiation from store admins only; reject non-admin actors server-side.
- Treat webhook endpoint as untrusted input: signature verification, replay protection, strict schema validation, and immutable audit logs are required.
- Never expose masked PII while locked, including exports, logs, analytics payloads, and error traces.
- Keep payment secrets in environment variables only; no secrets in source, logs, or client payloads.
- Retention rule (`5` days for still-locked masked overflow) must be deterministic and auditable.

---

## Task Mapping (Canonical Alignment)

| Task # | Status | Mapping |
|--------|--------|---------|
| T22 | `[x]` | This spec is now aligned to locked commercial model and governance semantics. |
| T23 | `[ ]` | Depends on this spec: propagate overflow masking lifecycle into `context/features/orders-management.md`. |
| T24 | `[ ]` | Depends on this spec + security locks: codify launch controls in `context/developer/SECURITY.md`. |
| T25 | `[ ]` | Depends on billing/lock lifecycle for ops gates in `context/ops/CI_CD.md` and `context/ops/MONITORING.md`. |

---

## Notes

- Source of truth: locked policy decisions in `context/project/DECISIONS.md` (Decision dated 2026-04-14, commercial model + governance lock).
