# Testing Strategy

This file defines the testing bar for this repo. Keep claims narrow and evidence explicit. If code and docs disagree, the repo is truth; fix the docs.

## Status Language

- `Current`: enforced or clearly present in the repo now.
- `Target`: intended direction only. Do not describe it as already covered.

## Current Test Stack and Scope

- Test runner: Bun via `bun test`.
- Package script: `npm test` and `pnpm test` run the same Bun suite because `package.json` defines `test: bun test`.
- Static check: `npm run lint` runs `eslint`.
- `vitest` is installed but is not the active committed runner.
- No committed browser E2E suite exists.
- The committed suite is narrow and backend-leaning.

## Current Suite Map

- `tests/unit/delivery-provider.test.js`: delivery provider normalization and mapping.
- `tests/unit/delivery-credentials-crypto.test.js`: AES-GCM credential encryption/decryption and missing `DELIVERY_CREDENTIALS_KEY` failure.
- `tests/unit/delivery-provider-contract.test.js`: shared adapter contract rules for provider onboarding.
- `tests/unit/delivery-recommendation-engine.test.js`: recommendation scoring and provider ordering.
- `tests/unit/delivery-rollout-gates.test.js`: rollout gate threshold evaluation.
- `tests/integration/delivery-create-order-route.test.js`: `/api/delivery/create-order` validation, auth requirement, and owner-only store access.
- `tests/integration/delivery-integration-public-query.test.js`: public delivery integration query returns metadata only and never leaks credentials.
- `tests/integration/delivery-analytics-status-events.test.js`: terminal delivery outcomes emit analytics status events.

## What The Current Suite Covers

- Delivery provider normalization and contract behavior.
- Delivery credential encryption and fail-closed env handling.
- A small set of auth-sensitive server paths.
- Public-query secret non-disclosure for delivery integration metadata.

## What The Current Suite Does Not Cover

- Browser flows for storefront checkout, editor flows, or merchant order management.
- Broad Clerk auth wiring across the app.
- Hardened payment webhook handling end to end.
- Payment initiation and lock/unlock lifecycle coverage.
- Store governance flows.
- Real external-provider integration environments.
- Numeric coverage gates.

Do not describe the app as comprehensively tested.

## Tests Are Mandatory When

- A change touches authorization, tenant isolation, or store access checks.
- A change touches secret handling, env-based trust decisions, or credential reads/writes.
- A change touches delivery provider normalization, provider contracts, or rollout gates.
- A change touches payment verification, webhook verification, or provider callbacks.
- A server bug is fixed and the failure can be reproduced in automation.
- A tested public contract, status code, or error shape changes.

## Enough Evidence Means

- The changed behavior is covered by an added or updated automated test in the same change.
- The test asserts the business outcome, not just that a helper was called.
- Blocked-path assertions exist for risky paths: unauthorized, wrong store, missing context, missing secret, or invalid input.
- Lint passes, but lint never counts as behavior evidence.
- If automation is not practical yet, record the exact gap and add the closest pure-function or server-side test you can.

## Integration Test Rules

- Prefer direct handler or Convex function invocation with explicit mocks.
- Do not bootstrap the whole app for server-path tests unless the boundary itself is the subject.
- Mock external providers and auth/provider boundaries. Prove our code, not third-party uptime.
- Assert both allowed and blocked paths for any route or function that can mutate state or call a provider.
- Assert security boundaries directly: unauthorized, wrong-store, missing-store-context, and secret non-disclosure.
- Keep integration tests deterministic. No live network, live provider, or real account dependence.

## Env-Sensitive Test Rules

- Save the original env value before changing it.
- Set only the variables the test needs.
- Restore env state in cleanup.
- Assert fail-closed behavior when critical env vars are missing.
- Never depend on developer-local secrets, live payment credentials, or real courier accounts.
- Use `tests/unit/delivery-credentials-crypto.test.js` as the baseline pattern.

## Release-Time Red Flags

Treat these as must-fix before release:

- Security-sensitive server changes with no matching test update.
- Delivery, payment, auth, or webhook changes covered only by lint or manual claims.
- Missing blocked-path assertions on a newly changed protected route or mutation.
- A test that passes only with developer-local env values or real third-party credentials.
- Docs or release notes that imply checkout, webhook, or auth coverage the repo does not have.
- A changed risky path with no honest note about the remaining automation gap.

## What Not To Claim From This Suite

- A passing `bun test` run does not prove repo-wide safety.
- A passing `bun test` run does not prove checkout works in the browser.
- A passing `bun test` run does not prove payment flows are production-hardened.
- A passing `bun test` run does not prove Clerk wiring is correct across all routes.
- A mocked provider test does not prove live provider integration health.

## Target

- Add stronger browser coverage for critical checkout and payment flows.
- Raise release confidence for auth, payment, and merchant-critical journeys without overstating current coverage.
