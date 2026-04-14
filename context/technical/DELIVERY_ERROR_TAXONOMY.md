# Delivery Error Taxonomy

> Error category hierarchy, codes, user-facing messages, and remediation steps for support/ops.
> Last updated: 2026-04-14

---

## Overview

This document defines the canonical error taxonomy for delivery dispatch operations. It covers validation, authentication, rate-limiting, provider-down, and unknown-outcome scenarios with clear recovery paths for operators and support staff.

**Key concepts:**
- **Retryable** — error may succeed on retry (no action needed from user)
- **Non-retryable** — requires user action or support intervention
- **Provider-specific** — error originates from the courier API itself

---

## Error Categories

| Category | Code Prefix | Retryable | Description |
|----------|-------------|-----------|-------------|
| `validation` | `VAL` | No | Request payload invalid |
| `authentication` | `AUTH` | No | Credentials missing or invalid |
| `rate_limit` | `RATE` | Yes (delayed) | Too many requests |
| `provider_down` | `PROV` | Yes | Provider API unavailable |
| `configuration` | `CFG` | No | System misconfiguration |
| `unknown_outcome` | `UNK` | Yes (manual check) | Ambiguous response |

---

## Category: validation

Request payload failed schema or business-rule validation.

| Error Code | HTTP Status | User Message | Remediation | Retryable |
|------------|--------------|---------------|--------------|-----------|
| `VAL_001` | 400 | "Missing required fields." | Check order has orderId, customerName, customerPhone, customerWilaya | No |
| `VAL_002` | 400 | "Invalid JSON body." | Request body is malformed; re-send valid JSON | No |
| `VAL_003` | 400 | "Invalid storeId." | Store ID format is incorrect | No |
| `VAL_004` | 404 | "Store not found." | Store does not exist or was deleted | No |
| `VAL_005` | 400 | "storeId does not match storeSlug." | Conflicting store identifiers provided | No |
| `VAL_006` | 400 | "Invalid delivery provider." | Provider string is not recognized | No |
| `VAL_007` | 400 | "No supported delivery provider configured for this store." | Store has no provider set in settings | No |
| `VAL_008` | 400 | "Customer phone number is invalid." | TBD — not currently validated | No |
| `VAL_009` | 400 | "Customer address is required for this region." | TBD — address validation for specific regions | No |
| `VAL_010` | 400 | "Unsupported region for delivery." | TBD — region allowlist check | No |

**Remediation pattern (validation):** Direct user to fix their input. No support escalation needed unless field is unclear.

---

## Category: authentication

User or store authorization failed.

| Error Code | HTTP Status | User Message | Remediation | Retryable |
|------------|--------------|---------------|--------------|-----------|
| `AUTH_001` | 401 | "Unauthorized" | User not logged in; prompt re-login | No |
| `AUTH_002` | 401 | "Unable to authenticate delivery request." | Token expired or invalid; re-authenticate | No |
| `AUTH_003` | 403 | "You do not have access to this store." | User is not store owner/staff | No |

**Remediation pattern (authentication):** User must re-authenticate or request store access. Support cannot resolve.

---

## Category: configuration

System or credentials misconfigured (operator/infrastructure issue).

| Error Code | HTTP Status | User Message | Remediation | Retryiation |
|------------|--------------|---------------|--------------|-------------|
| `CFG_001` | 500 | "Missing DELIVERY_CREDENTIALS_KEY. Configure it in Convex environment settings before creating delivery orders." | Ops: Check DELIVERY_CREDENTIALS_KEY env var in Convex | No |
| `CFG_002` | 400 | "Missing delivery credentials for this store." | Store admin must add provider credentials in store settings | No |
| `CFG_003` | 500 | "Missing NEXT_PUBLIC_CONVEX_URL. Delivery API cannot load store credentials." | Ops: Check Convex URL configuration | No |

**Remediation pattern (configuration):** Escalate to ops/engineering. Requires infrastructure or store-admin action.

---

## Category: rate_limit

Client exceeded request quota.

| Error Code | HTTP Status | User Message | Remediation | Retryable |
|------------|--------------|---------------|--------------|-----------|
| `RATE_001` | 429 | "Too many create-order requests. Try again in {n}s." | Wait for cooldown period; try again | Yes (delayed) |

**Retry behavior:** Wait `retryAfterSeconds` before retrying. No user action required.

---

## Category: provider_down

Courier provider API is unavailable or returning errors.

| Error Code | HTTP Status | User Message | Remediation | Retryable |
|------------|--------------|---------------|--------------|-----------|
| `PROV_001` | 400 | "Failed to create ZR Express order" | TBD — check ZR Express status page | Yes |
| `PROV_002` | 400 | "Failed to create Yalidine order" | TBD — check Yalidine status page | Yes |
| `PROV_003` | 400 | "[Provider] is experiencing issues. Please try again later." | TBD — generic fallback | Yes |
| `PROV_004` | 503 | "Courier service temporarily unavailable." | TBD — health check fallback | Yes |

**Retry behavior:** Retry after 30-60s. If persistent, escalate to ops to check provider status.

---

## Category: unknown_outcome

Ambiguous response from provider — unclear if order succeeded.

| Error Code | HTTP Status | User Message | Remediation | Retryable |
|------------|--------------|---------------|--------------|-----------|
| `UNK_001` | 400 | "Order creation returned an unclear response. Please check provider dashboard for confirmation." | Manual check provider portal for order | Yes |
| `UNK_002` | 500 | "Unknown error from provider." | Contact support with order details | Yes |

**Retry behavior:** Do not auto-retry — requires manual verification to avoid duplicate orders.

---

## Provider-Specific Error Notes

### ZR Express (`zr_express`)

| Scenario | Current Behavior | Gaps |
|----------|------------------|------|
| API timeout | Returns "Unknown error" | Need explicit timeout error code |
| Auth failure (401/403) | Returns "Failed to create ZR Express order" | Distinguish 401 vs 500 |
| Invalid phone/address | Returns provider message | No mapping to VAL codes |

### Yalidine (`yalidine`)

| Scenario | Current Behavior | Gaps |
|----------|------------------|------|
| API timeout | Returns "Unknown error" | Need explicit timeout error code |
| Auth failure | Returns "Failed to create Yalidine order" | No credential validity check |
| Invalid commune/wilaya | Returns provider message | No mapping to VAL codes |

---

## Operators / Support Workflows

### Flow 1: Validation Error
1. Read error message — it tells user what's wrong
2. Guide user to fix the field (orderId, phone, address)
3. Re-submit request

### Flow 2: Authentication Error
1. User must re-login or request store access
2. Support cannot bypass — must be user action

### Flow 3: Configuration Error
1. If CFG_001: Escalate to engineering — env var missing
2. If CFG_002: Guide user to store settings → delivery credentials
3. If CFG_003: Escalate to engineering — infra issue

### Flow 4: Rate Limit
1. Tell user to wait N seconds
2. Auto-retry is acceptable

### Flow 5: Provider Down
1. Check provider status (internal dashboard or external status page)
2. If known outage: inform user, suggest alternative provider
3. If unknown: retry after 60s, escalate if >3 failures

### Flow 6: Unknown Outcome
1. Do NOT retry automatically
2. Check provider dashboard manually
3. If order exists: mark as dispatched, update tracking
4. If order missing: re-create with idempotency key
5. Document incident

---

## Idempotency Notes

- Current: No idempotency key implementation
- T38 (pending): Add dispatch idempotency + dedupe persistence
- Until then: Unknown-outcome errors risk duplicates — always check provider dashboard first

---

## Related Tasks

- T30: This document
- T37: Add dispatch preflight edge-case guardrails
- T38: Add dispatch idempotency + dedupe persistence
- T39: Add retries and rate-limit resilience policy
- T40: Normalize webhook/polling status ingestion
- T41: Build uncertain-outcome reconciliation worker