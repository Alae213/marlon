# Delivery Status Normalization Contract

> Canonical status model for MVP courier providers (Yalidine, ZR Express, Andrson, Noest Express).
> Prevents stale regressions from out-of-order provider updates.

---

## 1. Canonical Internal Status Model

```typescript
type DeliveryLifecycleStatus =
  | "pending"        // Order created, awaiting pickup
  | "picked_up"      // Courier collected parcel
  | "in_transit"    // Parcel in transit to destination hub
  | "out_for_delivery" // Parcel out for final delivery
  | "delivered"     // Successfully delivered to recipient
  | "returned"      // Returned to sender
  | "failed";       // Delivery failed (reason logged separately)
```

**Rationale:** This 7-state model covers the complete delivery lifecycle. Each state is mutually exclusive and chronologically ordered for most delivery scenarios.

---

## 2. Status Progression Rules

### 2.1 Monotonic Progression (Default)

Status updates are processed **only if** the new status is later in the progression than the current stored status:

```
pending → picked_up → in_transit → out_for_delivery → delivered
                                                  → returned
                                                  → failed
```

| Current State | New Status | Action |
|---------------|------------|--------|
| pending | picked_up | ✅ Accept |
| pending | in_transit | ⚠️ Reject (skip picked_up) |
| pending | delivered | ⚠️ Reject (skip intermediate) |
| in_transit | in_transit | ✅ Accept (idempotent) |
| in_transit | pending | ❌ Reject (backward) |
| delivered | failed | ❌ Reject (terminal state) |
| any | same | ✅ Accept (idempotent) |

### 2.2 Out-of-Order Update Handling

| Scenario | Handling |
|----------|----------|
| Update arrives with skipped intermediate state | Reject with warning log |
| Update arrives with earlier state | Reject as stale |
| Update arrives with same state | Accept (idempotent) |
| Update arrives with terminal state (delivered/returned/failed) | Accept regardless of current state |
| No current state (new tracking) | Accept any valid state |

**Audit Log:** All rejected updates are logged with timestamp, provider, tracking number, current state, and attempted state for debugging.

### 2.3 Terminal States

The following states are **terminal** — once reached, no further status updates should override them:
- `delivered`
- `returned`
- `failed`

Exception: Reconciliation worker may override terminal state only if:
- Provider explicitly corrects the status
- Manual intervention logged
- 24-hour grace period passed with no provider resolution

---

## 3. Provider Status Mapping Tables

### 3.1 Yalidine

| Yalidine Raw Status | Canonical Status | Notes |
|---------------------|------------------|-------|
| `en_attente` | `pending` | Order waiting for pickup |
| `collectee` | `picked_up` | Collected by Yalidine |
| `en_cours` | `in_transit` | In transit |
| `en_livraison` | `out_for_delivery` | Out for delivery |
| `livree` | `delivered` | Delivered |
| `retour` | `returned` | Returned to sender |
| `echouee` | `failed` | Failed delivery |

**Source:** `lib/delivery/adapters/yalidine-adapter.ts`

---

### 3.2 ZR Express

| ZR Express Raw Status | Canonical Status | Notes |
|----------------------|------------------|-------|
| `pending` | `pending` | Order created |
| `picked_up` | `picked_up` | Picked up |
| `in_transit` | `in_transit` | In transit |
| `out_for_delivery` | `out_for_delivery` | Out for delivery |
| `delivered` | `delivered` | Delivered |
| `returned` | `returned` | Returned |
| `failed` | `failed` | Failed |

**Source:** `lib/delivery/adapters/zr-express-adapter.ts`

---

### 3.3 Andrson

| Andrson Raw Status | Canonical Status | Notes |
|--------------------|------------------|-------|
| `TBD (doc required)` | `TBD` | Awaiting provider documentation |

**Action Required:** Obtain Andrson API documentation to map status values.

---

### 3.4 Noest Express

| Noest Express Raw Status | Canonical Status | Notes |
|---------------------------|------------------|-------|
| `TBD (doc required)` | `TBD` | Awaiting provider documentation |

**Action Required:** Obtain Noest Express API documentation to map status values.

---

## 4. Fallback Handling

### 4.1 Unknown Provider Status

When a provider sends a status string not in the mapping table:

1. **Log warning:** `Unknown status '<raw>' from provider '<provider>' for tracking <trackingNumber>`
2. **Default to:** `pending` (safe default — assumes delivery in progress)
3. **Alert:** Trigger observability alert for manual investigation
4. **Defer:** Queue for reconciliation worker to poll again in 15 minutes

### 4.2 Null/Missing Status

When provider response lacks status field:
- Log error with full response payload
- Default to `pending`
- Do NOT treat as delivery failure

### 4.3 Network/Provider Errors

When provider API fails:
- Do NOT update stored status
- Log error with attempt count
- Schedule retry with exponential backoff
- After 3 consecutive failures, mark provider as degraded

---

## 5. Audit & Timeline Implications

### 5.1 Status History

All status transitions must be recorded in a timeline:

```typescript
interface StatusTransition {
  trackingNumber: string;
  provider: string;
  previousStatus: DeliveryLifecycleStatus | null;
  newStatus: DeliveryLifecycleStatus;
  timestamp: Date;
  source: "webhook" | "polling" | "manual";
  rawProviderStatus?: string;
  rejected?: boolean;
  rejectionReason?: string;
}
```

### 5.2 Timeline Queries

| Question | Query |
|----------|-------|
| Current status | `WHERE trackingNumber = X ORDER BY timestamp DESC LIMIT 1` |
| Full history | `WHERE trackingNumber = X ORDER BY timestamp ASC` |
| Stale updates rejected | `WHERE rejected = true` |
| Provider degraded events | `WHERE provider = X AND event = "degraded"` |

### 5.3 Stale Event Detection

An update is considered stale if:
- `newStatus.timestamp < currentStatus.timestamp - 5 minutes`
- Provider confirms delivery but we have later `out_for_delivery`

**Handling:** Log as stale, do not apply, trigger investigation.

---

## 6. Implementation Notes

- This contract is enforced at the **adapter layer** before status reaches storage
- Each adapter must implement the mapping logic per the table above
- The `mapStatus()` function must return canonical status only
- Unknown statuses fall back to `pending` per Section 4.1
- Status progression validation happens in the status ingestion service

---

## 7. Revisions

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-04-14 | Initial contract - Yalidine/ZR Express mapped, Andrson/Noest TBD |
