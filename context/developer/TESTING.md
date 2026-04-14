# Testing Strategy

## Philosophy
- Prioritize delivery-critical behavior (provider normalization, credential encryption, and delivery request guards).
- Keep secret-handling tests explicit: verify both success paths and clear failures when required env vars are missing.

## Test Runner and Commands
- Default test command: `bun test` (wired to `npm test`/`pnpm test` via `package.json`).
- Run a single file when iterating: `bun test tests/unit/delivery-credentials-crypto.test.js`.

## Unit Tests
- `tests/unit/delivery-provider.test.js`: normalizes provider values and API mapping behavior.
- `tests/unit/delivery-credentials-crypto.test.js`: validates encrypt/decrypt round-trip with `DELIVERY_CREDENTIALS_KEY` set, and missing-key error behavior.
- `tests/unit/delivery-provider-contract.test.js`: provider onboarding contract scaffold validating adapter response/status shape.
- `tests/unit/delivery-recommendation-engine.test.js`: recommendation-only engine scoring and provider ordering behavior.
- `tests/unit/delivery-rollout-gates.test.js`: rollout gate threshold evaluator behavior for pass/fail scenarios.
- Pattern used for env-sensitive tests: save original env value, mutate per test, and restore in `afterEach`.

## Integration Tests
- `tests/integration/delivery-create-order-route.test.js`: API route validation/auth behavior (missing store context, unauthenticated user, unauthorized store access).
- `tests/integration/delivery-integration-public-query.test.js`: confirms delivery integration query never leaks decrypted/raw credentials.
- `tests/integration/delivery-analytics-status-events.test.js`: verifies terminal order status transitions emit delivery analytics events.

## E2E Tests
- No browser E2E suite is defined yet.

## Coverage Goals
- No numeric coverage gate is enforced yet; maintain regression tests for all delivery credential and auth boundary changes.
