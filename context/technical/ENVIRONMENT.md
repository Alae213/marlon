# Environment Reference

Truth-first reference for environment variables seen in current code and expected ops setup.
Never commit real values. Secrets belong in managed secret stores.

## Status Labels

- `Current`: observed in code paths today.
- `Partial`: used in some paths, optional in others, or supports mock/fallback behavior.
- `Policy target`: expected ops standard, not enforced by the app.
- `Needs verification`: documented placement or ownership expectation that has not been re-audited here.

## Current Variables In Live Use

| Variable | Status | Current use | Runtime notes |
|----------|--------|-------------|---------------|
| `NEXT_PUBLIC_CONVEX_URL` | Current | Convex endpoint for app client and some server-side HTTP calls. | Public config. Missing value can break Convex client init and some server routes. |
| `CONVEX_ADMIN_KEY` | Partial | Server-side admin token used by operator-only internal migration routes to call Convex internal functions. | Server secret. Only required when `ENABLE_INTERNAL_MIGRATIONS_UI=true`. Never expose via `NEXT_PUBLIC_*`. |
| `ENABLE_INTERNAL_MIGRATIONS_UI` | Partial | Enables the operator-only internal migrations UI and supporting API routes. | Server config. Keep off by default; when enabled it still requires an allowlist. |
| `INTERNAL_MIGRATIONS_ALLOWLIST_USER_IDS` | Partial | Comma-separated Clerk user IDs allowed to access internal migrations UI/routes. | Server config. If unset/empty, access is denied (fail-closed). |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Current | Enables Clerk wiring in app providers/layout. | Public key. If missing or placeholder, Clerk-dependent flows stay disabled. |
| `CLERK_WEBHOOK_SECRET` | Current | Verifies `/api/webhooks/clerk`. | Server secret. Missing value breaks Clerk webhook processing. |
| `PAYMENT_PROVIDER` | Current | Selects payment backend. | Server-side switch. Unset or unknown currently falls back to `chargily`. |
| `CHARGILY_API_KEY` | Partial | Used for Chargily checkout/auth flows. | Server secret. Missing value can push current code into demo/mock behavior. Do not assume webhook verification is fully wired just because this exists. |
| `CHARGILY_WEBHOOK_URL` | Partial | Passed into Chargily checkout payload. | Server-side config. Missing value risks no callback target being sent. |
| `NEXT_PUBLIC_APP_URL` | Current | Base URL for payment return/success/failure URLs. | Named public, but current usage is effectively server-side. Falls back to localhost in some paths. |
| `SOFIZPAY_API_KEY` | Partial | Used for SofizPay payment creation. | Server secret. Missing value can trigger demo/mock behavior when SofizPay is selected. |
| `SOFIZPAY_API_URL` | Partial | Base URL for SofizPay requests. | Server config. Missing value can trigger demo/mock behavior when SofizPay is selected. |
| `SOFIZPAY_WEBHOOK_URL` | Partial | Passed into SofizPay checkout payload. | Server-side config. Missing value risks missed async confirmation callbacks. |
| `PRE_SIGNUP_GOOGLE_SHEET_WEBHOOK_URL` | Current | Server-side endpoint for forwarding completed pre-signup answers to Google Sheets through Apps Script. | Server secret/config. Keep out of `NEXT_PUBLIC_*`; missing value skips Sheet sync and leaves local/Vercel tracking intact. |
| `DELIVERY_CREDENTIALS_KEY` | Current | Encrypts/decrypts stored delivery credentials in Convex flows. | Required for encrypted credential paths, not every delivery read/write path. Rotation needs planned re-encryption. |
| `DELIVERY_ALLOW_GLOBAL_CREDENTIAL_FALLBACK` | Current | Enables emergency fallback to global courier env credentials. | Only exact `"true"` enables fallback. Keep off by default. |
| `ZR_EXPRESS_API_KEY` | Partial | Global fallback credential for `zr_express`. | Only matters when fallback is enabled. |
| `ZR_EXPRESS_API_SECRET` | Partial | Global fallback credential for `zr_express`. | Only matters when fallback is enabled. |
| `ZR_EXPRESS_ACCOUNT_NUMBER` | Partial | Optional fallback metadata for `zr_express`. | Only matters when fallback is enabled. |
| `YALIDINE_API_KEY` | Partial | Global fallback credential for `yalidine`. | Only matters when fallback is enabled. |
| `YALIDINE_API_SECRET` | Partial | Preferred fallback secret for `yalidine`. | Only matters when fallback is enabled. |
| `YALIDINE_API_TOKEN` | Partial | Legacy alternate fallback secret for `yalidine`. | Used only if `YALIDINE_API_SECRET` is absent. |
| `NODE_ENV` | Current | Build/runtime mode switch. | Usually set by the platform, not app code. |

## Conditional And Fallback Variables

- `PAYMENT_PROVIDER=chargily` -> expect `CHARGILY_API_KEY`; `CHARGILY_WEBHOOK_URL` is strongly recommended for real callbacks.
- `PAYMENT_PROVIDER=sofizpay` -> expect `SOFIZPAY_API_KEY`, `SOFIZPAY_API_URL`, and usually `SOFIZPAY_WEBHOOK_URL`.
- `DELIVERY_ALLOW_GLOBAL_CREDENTIAL_FALLBACK=true` -> corresponding courier fallback credentials must be complete for the selected provider.
- `DELIVERY_CREDENTIALS_KEY` matters when the code path touches encrypted Convex credential storage or retrieval.

## Expected Ownership And Runtime Placement

These are expected ops placements, not guaranteed audited reality.

| Variable set | Status | Expected owner | Expected placement |
|--------------|--------|----------------|--------------------|
| `NEXT_PUBLIC_CONVEX_URL` | Needs verification | Platform ops | Vercel env, matching the active Convex deployment URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_WEBHOOK_SECRET` | Needs verification | Auth/platform ops | Vercel env using Clerk-issued values |
| `PAYMENT_PROVIDER`, `CHARGILY_*`, `SOFIZPAY_*`, `NEXT_PUBLIC_APP_URL` | Needs verification | Platform ops / payments owner | Vercel env per environment |
| `PRE_SIGNUP_GOOGLE_SHEET_WEBHOOK_URL` | Needs verification | Growth/platform ops | Vercel env for the app server; value should be the deployed Google Apps Script Web App URL |
| `DELIVERY_CREDENTIALS_KEY` | Needs verification | Security/platform ops | Convex env; mirror elsewhere only if a real server path needs it |
| `DELIVERY_ALLOW_GLOBAL_CREDENTIAL_FALLBACK`, `ZR_EXPRESS_*`, `YALIDINE_*` | Needs verification | Platform ops + security | Vercel env, tightly controlled and normally unset |
| `NODE_ENV` | Current | Deployment platform | Set by runtime/platform |

## Policy Targets

- `Policy target`: rotate payment and webhook secrets every 90 days or immediately after suspected exposure.
- `Policy target`: keep courier fallback credentials unset unless handling an active incident.
- `Policy target`: rotate `DELIVERY_CREDENTIALS_KEY` only during a planned re-encryption migration.
- `Policy target`: set provider selection explicitly per environment instead of relying on the current default-to-`chargily` behavior.

## Recommended Release Checks

These are release checks and ops guidance. There is no central startup validator enforcing them in the app today.

- Confirm baseline config: `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_APP_URL`, `NODE_ENV`.
- If Clerk is expected, confirm `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_WEBHOOK_SECRET`.
- If `PAYMENT_PROVIDER=chargily`, confirm `CHARGILY_API_KEY`; verify `CHARGILY_WEBHOOK_URL` if real callbacks are required.
- If `PAYMENT_PROVIDER=sofizpay`, confirm `SOFIZPAY_API_KEY`, `SOFIZPAY_API_URL`, and `SOFIZPAY_WEBHOOK_URL` for real callbacks.
- If encrypted delivery credentials are in use, confirm `DELIVERY_CREDENTIALS_KEY` exists in the Convex environment.
- Confirm `DELIVERY_ALLOW_GLOBAL_CREDENTIAL_FALLBACK` is off unless there is an intentional, ticketed incident workflow.
