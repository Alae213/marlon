# Environment Contract

> Canonical env contract aligned with current runtime usage and locked decisions as of 2026-04-14.
> Never commit real values. All secrets must stay in managed environment secret stores.

## Canonical Variables

| Variable | Purpose | Required in (dev/staging/prod) | Scope (server/client) | Default / failure behavior | Security notes |
|----------|---------|----------------------------------|-----------------------|----------------------------|----------------|
| `NEXT_PUBLIC_CONVEX_URL` | Convex endpoint for app client and server routes that call Convex HTTP API. | dev: required, staging: required, prod: required | client + server (`NEXT_PUBLIC_`, exposed) | Missing value throws in webhook/delivery routes and can break Convex client initialization. | Not a secret, but treat as environment-specific infra config and do not hardcode. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key used to enable auth provider wiring in layout/providers. | dev: optional, staging: required for auth, prod: required for auth | client + server (`NEXT_PUBLIC_`, exposed) | If missing/placeholder, app skips Clerk wiring (`isClerkConfigured=false`), and auth-dependent flows will not function. | Publishable key is public by design; never confuse with Clerk secret keys. |
| `CLERK_WEBHOOK_SECRET` | Verifies Clerk webhook signatures (`/api/webhooks/clerk`). | dev: required if testing webhooks, staging: required, prod: required | server | Missing value returns 500 for Clerk webhook route; no user sync/delete processing. | Secret; store in Vercel project env only, rotate from Clerk dashboard. |
| `PAYMENT_PROVIDER` | Selects active payment backend (`chargily` default, `sofizpay`, `custom`). | dev: optional, staging: optional, prod: optional (but should be explicit) | server | Unset/unknown value falls back to `chargily`. | Not a secret, but lock explicitly per environment to avoid accidental provider drift. |
| `CHARGILY_API_KEY` | Chargily API auth key for checkout creation and webhook signature validation key material. | dev: optional, staging: required when `PAYMENT_PROVIDER=chargily`, prod: required when `PAYMENT_PROVIDER=chargily` | server | Missing key triggers demo/mock checkout path and webhook verification returns null. | Secret; rotate on compromise and treat as payment-critical credential. |
| `CHARGILY_WEBHOOK_URL` | Webhook callback URL sent in Chargily checkout payload. | dev: optional, staging: recommended when `chargily`, prod: required when `chargily` | server | If missing, checkout request sends `webhook_url` as undefined, risking no payment callback delivery. | Not a credential, but integrity-critical; always use HTTPS production URL. |
| `NEXT_PUBLIC_APP_URL` | Base app URL used for success/failure/return URLs in payment flows. | dev: optional, staging: required, prod: required | client + server (`NEXT_PUBLIC_`, exposed) | Chargily falls back to `http://localhost:3000`; SofizPay return URL can become malformed when unset. | Public URL only; ensure correct domain per environment to prevent redirect issues. |
| `SOFIZPAY_API_KEY` | SofizPay API auth key. | dev: optional, staging: required when `PAYMENT_PROVIDER=sofizpay`, prod: required when `PAYMENT_PROVIDER=sofizpay` | server | If missing (or API URL missing), SofizPay provider returns demo/mock checkout response. | Secret; payment credential, keep server-only and rotate regularly. |
| `SOFIZPAY_API_URL` | SofizPay API base URL used for payment creation. | dev: optional, staging: required when `sofizpay`, prod: required when `sofizpay` | server | If missing (or API key missing), provider switches to demo/mock mode. | Config value, not secret; pin to trusted HTTPS endpoint only. |
| `SOFIZPAY_WEBHOOK_URL` | Callback URL forwarded to SofizPay in checkout payload. | dev: optional, staging: recommended when `sofizpay`, prod: required when `sofizpay` | server | Missing value sends undefined webhook URL in payload, risking missed async payment confirmation. | Not secret; must be HTTPS and route to verified webhook endpoint. |
| `DELIVERY_CREDENTIALS_KEY` | Root encryption secret for AES-GCM delivery credential encryption/decryption in Convex. | dev: required for delivery credentials, staging: required, prod: required | server (Convex runtime) | Missing value throws explicit error and blocks encrypt/decrypt operations and delivery credential reads/writes. | High-sensitivity secret; rotate with planned re-encryption migration only. |
| `DELIVERY_ALLOW_GLOBAL_CREDENTIAL_FALLBACK` | Emergency switch to allow global courier env credentials if store credentials are unavailable. | dev: optional, staging: optional (normally off), prod: optional (normally off) | server | Only exact `"true"` enables fallback; any other value disables. Disabled means missing store creds fail fast. | Keep off by default to preserve tenant isolation; enable only during controlled incident recovery. |
| `ZR_EXPRESS_API_KEY` | Global ZR Express fallback API key (used only when fallback enabled and provider is `zr_express`). | dev: optional, staging: conditional, prod: conditional | server | Ignored unless fallback enabled; missing key prevents fallback for ZR provider. | Secret; avoid normal-operation use, since this is cross-store fallback material. |
| `ZR_EXPRESS_API_SECRET` | Global ZR Express fallback API secret. | dev: optional, staging: conditional, prod: conditional | server | Ignored unless fallback enabled; missing secret prevents fallback for ZR provider. | Secret; treat as high risk because it can bypass per-store credential isolation in fallback mode. |
| `ZR_EXPRESS_ACCOUNT_NUMBER` | Optional ZR Express account number included with fallback credentials. | dev: optional, staging: conditional, prod: conditional | server | Optional metadata; fallback can still proceed when key+secret exist. | Sensitive business identifier; keep server-only. |
| `YALIDINE_API_KEY` | Global Yalidine fallback API key (used only when fallback enabled and provider is `yalidine`). | dev: optional, staging: conditional, prod: conditional | server | Ignored unless fallback enabled; missing key prevents Yalidine fallback. | Secret; use only for emergency fallback, not steady-state. |
| `YALIDINE_API_SECRET` | Preferred global Yalidine fallback secret. | dev: optional, staging: conditional, prod: conditional | server | Used first for fallback secret resolution. | Secret; rotate and keep server-only. |
| `YALIDINE_API_TOKEN` | Legacy/alternate Yalidine fallback secret source when `YALIDINE_API_SECRET` is absent. | dev: optional, staging: conditional, prod: conditional | server | Used as fallback alternative to `YALIDINE_API_SECRET`; if both missing, fallback fails. | Secret; do not set both unless migration requires dual support. |
| `NODE_ENV` | Runtime behavior switch (`development` vs `production`) for debug scripts and console stripping. | dev: required (`development`), staging: required (`production`), prod: required (`production`) | server + build | Production removes console statements in build; development loads debug helper scripts in layout. | Not secret; must be controlled by deployment platform, never user input. |

## Environment Ownership

| Variable set | Source-of-truth owner | Where value is managed |
|--------------|-----------------------|------------------------|
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment endpoint | Vercel env (mirrors Convex deploy URL) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_WEBHOOK_SECRET` | Clerk application | Vercel env (values issued from Clerk dashboard) |
| `PAYMENT_PROVIDER`, `CHARGILY_*`, `SOFIZPAY_*`, `NEXT_PUBLIC_APP_URL` | Platform operations / payments owner | Vercel env per environment |
| `DELIVERY_CREDENTIALS_KEY` | Platform security owner | Convex env (and mirrored to Vercel only if required by server runtime paths) |
| `DELIVERY_ALLOW_GLOBAL_CREDENTIAL_FALLBACK`, `ZR_EXPRESS_*`, `YALIDINE_*` | Platform operations + security (incident-only controls) | Vercel env, tightly controlled |
| `NODE_ENV` | Deployment platform | Set by Vercel/Node runtime, not manually toggled in app code |

## Rotation Policy Guidance

- Payment and webhook secrets (`CLERK_WEBHOOK_SECRET`, `CHARGILY_API_KEY`, `SOFIZPAY_API_KEY`, courier fallback secrets): rotate every 90 days or immediately on suspected exposure.
- `DELIVERY_CREDENTIALS_KEY`: rotate only with a planned re-encryption migration window; uncoordinated rotation breaks existing encrypted credential reads.
- Fallback courier secrets (`ZR_EXPRESS_*`, `YALIDINE_*`): keep unset by default; if enabled for incident recovery, disable and rotate after incident closure.
- Any leaked secret is treated as compromised at once: revoke, replace, and audit logs/events for misuse.

## Startup and Health Checklist

1. Verify critical baseline vars are present before release: `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_APP_URL`, `NODE_ENV`, and (if auth enabled) `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_WEBHOOK_SECRET`.
2. Verify payment-provider contract: if `PAYMENT_PROVIDER=chargily`, require `CHARGILY_API_KEY` and valid `CHARGILY_WEBHOOK_URL`; if `PAYMENT_PROVIDER=sofizpay`, require `SOFIZPAY_API_KEY`, `SOFIZPAY_API_URL`, `SOFIZPAY_WEBHOOK_URL`.
3. Verify delivery credential encryption key exists in Convex: `DELIVERY_CREDENTIALS_KEY`.
4. Verify emergency fallback is disabled by default: `DELIVERY_ALLOW_GLOBAL_CREDENTIAL_FALLBACK` unset or not `"true"`.
5. If fallback is intentionally enabled, verify corresponding provider global fallback credentials are complete and incident ticketed.
