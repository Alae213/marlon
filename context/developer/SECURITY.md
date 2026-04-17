# Security

This file is the non-negotiable security baseline for code that touches auth, tenant data, payments, delivery integrations, webhooks, uploads, or environment variables.

## Status Language

- `Current`: enforced or clearly present in the live repo.
- `Planned`: intended direction only. Do not describe it as live.
- If code and docs disagree, the repo is truth. Fix the docs.

## Priority Order

1. Tenant isolation, auth correctness, and secret handling
2. Payment and delivery trust decisions
3. Sensitive data exposure and logging boundaries
4. Abuse resistance and fail-closed behavior
5. Developer convenience

Do not accept a cleaner abstraction, faster path, or better UX if it weakens any higher-priority rule.

## Hard Rules

- Server-side enforcement only. UI visibility is never authorization.
- Store boundary is `storeId`. `storeSlug` is routing data, not proof of access.
- Fail closed. If auth context, store resolution, credentials, or webhook verification are missing, reject the operation.
- Never return secrets, decrypted credentials, signing material, or raw payment credentials to the client.
- Never log secrets, raw credentials, customer PII, full payment payloads, or raw sensitive webhook bodies.
- Any authz, tenant-isolation, secret-handling, or webhook-trust gap is a must-fix issue.

## Current Access Model

### Current

- Touched Convex merchant-access paths now route through centralized `convex/storeAccess.ts` helpers.
- The helper still fails closed to legacy owner-only semantics unless a store is explicitly in `membershipMode=memberships_enabled`.
- Delivery credential runtime reads are owner-scoped.
- The delivery route rejects authenticated users who do not own the target store.
- The repo is still mixed overall; unrefactored paths may still use direct `store.ownerId` checks.

### Planned

- Store roles move to `owner | admin | staff`.
- Platform governance role moves to `platform_admin`.
- Protected access moves behind a central Convex authorization helper and policy layer.
- Ownership transfer or removal requires explicit current-owner confirmation, with break-glass use limited to `platform_admin`.

Do not write new code that assumes the planned role model already exists.

## Secrets Handling

- Keep secrets only in managed environment stores documented in `context/technical/ENVIRONMENT.md`.
- Do not hardcode real, test, placeholder, temporary, or fallback secrets in source, fixtures, comments, screenshots, or seeded data.
- Treat every committed secret as compromised: rotate it, remove it from active use, and inspect misuse risk.
- `DELIVERY_CREDENTIALS_KEY` is high sensitivity. Do not change it without an explicit re-encryption plan.
- Emergency courier fallback secrets (`ZR_EXPRESS_*`, `YALIDINE_*`) are incident-only controls. Keep them unset unless fallback is intentionally enabled and tracked.

## Authorization and Tenant Isolation

- Every store-scoped read or write must resolve the target store on the server and verify access to that exact store.
- Never trust `storeSlug`, query params, hidden form fields, client role claims, or request metadata as proof of authorization.
- Cross-store access is forbidden for orders, analytics, credentials, content, and admin actions.
- Keep current owner-based enforcement where that is the live model.
- New code must not widen access to make future role migration easier.

## Sensitive Data and Logging

- Treat customer names, phone numbers, addresses, emails, payment references, and delivery credentials as sensitive.
- Do not place sensitive values in URLs, redirect params, cache keys, analytics events, or client-visible error messages.
- Keep sensitive values out of browser debugging output.
- Delivery credential UI is write-only after save. Do not reintroduce secret readback.
- Payment data stays with the provider. Do not store card details or equivalent raw payment instruments.
- Log only what is needed to diagnose behavior: outcome, actor ID, store ID, provider, request ID.
- Existing console logging is development-level only, not an audit trail.

## Delivery Credentials

### Current

- Per-store delivery credentials live in dedicated `deliveryCredentials` records encrypted with `DELIVERY_CREDENTIALS_KEY`.
- Non-secret delivery integration metadata lives in `siteContent.deliveryIntegration`.
- Public delivery integration queries expose metadata only.
- Owner-scoped server runtime reads can decrypt credentials for delivery actions.
- An emergency global fallback exists behind `DELIVERY_ALLOW_GLOBAL_CREDENTIAL_FALLBACK=true`.

### Planned

- Keep fallback off during normal operation.
- Any fallback enablement must be incident-driven, time-boxed, and rotated off after use.
- Platform operators do not get routine read access to merchant credentials.

## Payments and Webhook Trust

### Current

- `PAYMENT_PROVIDER` selects the provider by environment.
- Chargily and SofizPay API keys are server-side env vars.
- Provider helpers include signature verification logic.
- Provider helpers can return demo or mock checkout responses when credentials are absent.
- The live Chargily webhook route is not yet hardened to the target trust model.

### Planned

- Verified payment webhooks are the only trusted trigger for unlock activation.
- Webhook processing persists receipt evidence, rejects replay, and dedupes before state changes.

Rules:

- All inbound webhooks are untrusted until verified.
- Verify signatures with the provider's documented scheme over the raw request body.
- Never trust store IDs or metadata in the payload as authorization proof.
- Enforce idempotency before state changes.
- Apply replay-window checks where the provider supports timestamps.
- Do not describe payment flows as production-hardened while demo mode or incomplete verification still exists.

## Abuse Controls and Fail-Closed Behavior

### Current

- The delivery create-order route has an in-memory per-process rate limit keyed by user and client IP.
- Delivery connection testing in Convex is rate-limited per owner and store.

### Planned

- Durable rate limits cover public checkout, unlock initiation, webhook ingest, slug validation, and governance endpoints.
- COD order creation adds phone reputation and blocklist checks.

Rules:

- In-memory limits are temporary guards, not durable protection.
- Missing auth, missing credentials, missing verification, or ambiguous tenant context must reject the request.
- Do not add silent fallback behavior for protected operations.

## Delivery Credentials Rules

- Delivery credentials are server-only.
- Do not expose decrypted values through Convex queries, route responses, admin tooling, or debug helpers.
- Do not copy delivery secrets into `siteContent`, public metadata, or client state.
- Do not widen credential read access for support or convenience.

## Review-Time Red Flags

Treat these as must-fix findings:

- Auth enforced only in UI code
- Store access derived from slug or client-supplied store identifiers without a server check
- Cross-store reads or writes without an explicit access check
- Secrets or tokens committed anywhere in the repo
- Decrypted credentials returned to clients or logged
- Sensitive data placed in URLs, analytics payloads, or client error messages
- Payment or unlock state changes triggered without verified webhook trust
- Webhook handlers that skip raw-body verification, dedupe, or replay checks where supported
- New delivery fallback behavior enabled by default
- Public or semi-public endpoints that fail open when auth or verification is missing
- Security-sensitive changes merged without updating this file when the live posture changed

## What Engineers Must Do

- Read this file before changing auth, payments, delivery integrations, tenant-scoped queries, or env handling.
- Verify whether a rule is `Current` or `Planned` before documenting behavior.
- Reduce logging before calling security-sensitive work complete.
- Align with `context/project/DECISIONS.md`, `context/technical/ARCHITECTURE.md`, `context/technical/API_CONTRACTS.md`, and `context/technical/ENVIRONMENT.md` when the touched path depends on them.
