# Feature: Delivery Credentials Encryption

> **Status:** `in-progress`
> **Phase:** v1
> **Last updated:** 2026-04-16

---

## Summary

Delivery Credentials Encryption covers how courier secrets are stored and read for merchant delivery flows. Current: `convex/siteContent.ts:setDeliveryIntegration` encrypts per-store provider credentials into `deliveryCredentials`, and `convex/deliveryCredentialsCrypto.ts` uses AES-GCM keyed by `DELIVERY_CREDENTIALS_KEY`. Partial: legacy plaintext-style fallback paths still read credentials from `siteContent.deliveryIntegration`, and `getDeliveryCredentialsForOwnerRuntime` is owner-scoped but still client-callable even though it returns decrypted credentials.

---

## Users

- Store owners saving or rotating courier credentials in settings.
- Protected server-side delivery flows that need decrypted credentials to test or dispatch.

---

## User Stories

- As a store owner, I want saved courier credentials to stay encrypted at rest so that store configuration is not storing raw secrets in generic content records.
- As a delivery runtime path, I want a consistent way to load credentials for the active store so that dispatch and connection testing can work without copying secrets into client state.

---

## Behaviour

### Happy Path

1. `components/pages/editor/settings/delivery-integration-settings.tsx` sends owner-entered credentials to `api.siteContent.setDeliveryIntegration`.
2. `convex/siteContent.ts:setDeliveryIntegration` normalizes the provider, merges credential input, and encrypts credentials with `encryptDeliveryCredentials()` from `convex/deliveryCredentialsCrypto.ts`.
3. The encrypted payload is stored in `deliveryCredentials`, while non-secret state such as provider selection and `enabledProviders` remains in `siteContent.deliveryIntegration`.

### Edge Cases & Rules

- `Current`: `convex/deliveryCredentialsCrypto.ts` derives an AES-GCM key from `DELIVERY_CREDENTIALS_KEY` using SHA-256 and a random IV per payload.
- `Current`: the merchant UI is write-only after save; `components/pages/editor/settings/delivery-integration-settings.tsx` only shows configured state and update timestamps, not decrypted values.
- `Partial`: `convex/siteContent.ts:getDeliveryCredentialsForOwnerRuntime` falls back to legacy credentials embedded in `siteContent.deliveryIntegration` when no encrypted row exists.
- `Partial`: if decryption fails, `getDeliveryCredentialsForOwnerRuntime` returns blank credentials plus `decryptionError` instead of hard-crashing the caller.
- `Partial`: `getDeliveryCredentialsForOwnerRuntime` verifies store ownership in `convex/siteContent.ts:666`, but it is still a client-callable Convex query that returns decrypted credentials. This is a live security gap, not a target-state pattern.
- `Current`: the delivery route also has an emergency env-based fallback behind `DELIVERY_ALLOW_GLOBAL_CREDENTIAL_FALLBACK=true`, but that is separate from encrypted store credential storage.

---

## Connections

- **Depends on:** `convex/deliveryCredentialsCrypto.ts`, `convex/siteContent.ts`, `convex/schema.ts`, `context/developer/SECURITY.md`.
- **Triggers:** owner delivery connection tests and order dispatch credential loading.
- **Shares data with:** `deliveryCredentials`, `siteContent.deliveryIntegration`, `app/api/delivery/create-order/route.ts`.

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| At-rest storage | `Current`: encrypted per-store records in `deliveryCredentials` | `Current`: keep encrypted records as the canonical store |
| Legacy fallback | `Partial`: plaintext-era fields in `siteContent.deliveryIntegration` can still be read | `Planned`: migrate and scrub legacy secret fields |
| Runtime reads | `Partial`: owner-scoped query returns decrypted credentials | `Planned`: server-only or internal runtime access path |
| Ops fallback | `Partial`: env fallback exists behind `DELIVERY_ALLOW_GLOBAL_CREDENTIAL_FALLBACK` | `Policy-locked`: incident-only, off by default |

---

---

## Security Considerations

- `Current`: credentials are encrypted at rest in `deliveryCredentials` with `DELIVERY_CREDENTIALS_KEY`.
- `Current`: the merchant UI keeps credential inputs write-only after save and does not re-display stored secrets.
- `Partial`: legacy credential material can still survive in `siteContent.deliveryIntegration`; that weakens the target secret-handling posture until migration/scrubbing finishes.
- `Partial`: `convex/siteContent.ts:getDeliveryCredentialsForOwnerRuntime` is owner-scoped, but because it is client-callable and returns decrypted credentials, it violates the intended server-only secret boundary documented in `context/developer/SECURITY.md`.
- `Current`: emergency global fallback env secrets are disabled unless `DELIVERY_ALLOW_GLOBAL_CREDENTIAL_FALLBACK` is exactly `true`.
- `Policy-locked`: do not widen decrypted credential access for support, convenience, or future role-model assumptions.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T21 | `[ ]` | Move decrypted delivery credential access to a server-only or internal path. |
| T25 | `[ ]` | Finish legacy delivery credential migration and scrub plaintext-era credential fallback fields from `siteContent.deliveryIntegration`. |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** -

**Outcome:** Crypto unit coverage exists in `tests/unit/delivery-credentials-crypto.test.js`, but no browser UAT result is recorded here.

## Open Questions

- None. The remaining issues are already identified in code and tracked as backlog/security work.

---

## Notes

- Main code references: `convex/deliveryCredentialsCrypto.ts`, `convex/siteContent.ts`, `components/pages/editor/settings/delivery-integration-settings.tsx`, `app/api/delivery/create-order/route.ts`.
- `convex/schema.ts` still allows `andrson` and `noest` provider rows in `deliveryCredentials`, even though runtime adapter support is incomplete.

---

## Archive

None.
