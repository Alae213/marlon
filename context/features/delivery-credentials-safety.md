# Feature: Secure Store-Level Delivery Credentials

## What It Does
This feature makes delivery account credentials safer and more reliable for each store. Each store keeps its own protected credentials, merchants can save credentials without seeing old values again, and delivery dispatch only works within the correct store ownership. It also standardizes provider data and avoids unsafe fallback behavior unless explicitly allowed.

## Who Uses It
Store owners and team members who manage delivery settings and send orders to delivery companies from the store dashboard.

## User Stories
- As a store owner, I want my delivery credentials saved securely per store so one store never uses another store's account.
- As a store owner, I want credential fields to stay hidden after saving so sensitive values are not exposed later.
- As a store owner, I want delivery dispatch to only send orders from stores I own so my data stays protected.
- As an operator, I want provider names and settings to be normalized so delivery behavior is predictable.
- As a business owner, I want fallback behavior to be strict by default so missing credentials fail safely.

## Happy Path
1. The merchant opens delivery settings for a specific store.
2. The merchant chooses a provider and enters credentials.
3. The system validates and safely stores credentials for that store.
4. The settings screen confirms credentials are configured, without showing secret values.
5. The merchant selects store orders and sends them to the provider.
6. The system checks store ownership, uses that store's credentials, and returns dispatch/tracking results.

## Edge Cases
- Missing credentials: Dispatch is blocked with a clear error unless emergency fallback is explicitly enabled.
- Unauthorized store access: Dispatch and credential actions are denied.
- Provider value mismatch (case/format differences): Provider input is normalized before use.
- Old credentials needed for viewing: Not allowed; users must re-enter new values if changes are needed.
- High request bursts: Delivery dispatch endpoint is rate-limited for safer operations.

## Dependencies
- Requires: Authentication and store ownership checks, delivery provider integrations (ZR Express and Yalidine), and secure key management for encrypted secrets.
- Blocks: None.

## Tasks (T-numbers)
- T4: Implement per-store encrypted credentials storage and secure retrieval.
- T4: Enforce write-only credential UX (no secret re-display after save).
- T4: Enforce store-scoped dispatch with ownership checks.
- T4: Normalize provider handling and tighten fallback behavior.
