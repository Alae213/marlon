# Courier Integration Matrix (Wave 1)

## Purpose
Canonical provider matrix for MVP wave-1 couriers: Yalidine, ZR Express, Andrson, and Noest Express.

## Verification Basis
- Verified from implementation and context artifacts currently in this repo, primarily:
  - `lib/delivery/adapters/zr-express-adapter.ts`
  - `lib/delivery/adapters/yalidine-adapter.ts`
  - `app/api/delivery/create-order/route.ts`
  - `convex/siteContent.ts`
  - `components/pages/editor/settings/delivery-integration-settings.tsx`
  - `tests/unit/delivery-provider-contract.test.js`
- No external provider docs or sandbox credentials were available in-repo for Andrson/Noest, and no linked authoritative spec snapshots were found for Yalidine/ZR Express beyond current integration code.

## Canonical Integration Matrix

| Provider | Auth modes | Endpoints (current known) | Payload fields (dispatch/status) | Constraints / validation | Webhooks vs polling | Sandbox vs production deltas | Source confidence |
|---|---|---|---|---|---|---|---|
| Yalidine | Dispatch currently uses `Authorization: <apiKey>` header + body `api_secret`. Credential-test action currently uses `X-API-Key` + `X-API-Token`. | Dispatch: `POST https://api.yalidine.ws/v1/orders`  Status: `GET https://api.yalidine.ws/v1/track/{tracking}`  Credential test: `GET https://api.yalidine.com/v1/test` | Dispatch request maps: `reference`, `destinataire.{nom,mobile,commune,adresse,wilaya}`, `produits[].{designation,qte,prix}`, `frais`, `api_secret`. Dispatch response mapped from `tracking`, `frais_livraison`. Status response mapped from `tracking`, `statut`, `date_livraison`, `position`. | Platform preflight requires `orderId`, `customerName`, `customerPhone`, `customerWilaya` before provider call. Settings/test flow enforces `apiKey` + (`apiToken` or `apiSecret`). `accountNumber` not required for Yalidine. Provider-side field/format limits: `TBD (doc/credential required)`. | Current implementation: polling supported via provider status endpoint. Courier webhook support/contract: `TBD (doc/credential required)`. | No sandbox endpoint is configured in code; production URLs are hardcoded. Exact sandbox host/auth differences: `TBD (doc/credential required)`. | Medium - endpoint/payload/auth behavior verified from live adapter + UI/action code; official provider spec not linked, and host/auth style differs between adapter and credential test path. |
| ZR Express | Bearer auth + secret header: `Authorization: Bearer <apiKey>` and `X-API-SECRET: <apiSecret or apiToken>`. | Dispatch: `POST https://api.zrexpress.dz/api/v1/orders`  Status: `GET https://api.zrexpress.dz/api/v1/orders/{tracking}`  Credential test: `GET https://api.zrexpress.dz/v1/test` | Dispatch request maps: `order_number`, `recipient_name`, `recipient_phone`, `recipient_wilaya`, `recipient_commune`, `recipient_address`, `products[]`, `cod_amount`, optional `account_number`. Dispatch response mapped from `tracking_number`, `delivery_fee`. Status response mapped from `tracking_number`, `status`, `estimated_delivery`, `current_location`. | Platform preflight requires `orderId`, `customerName`, `customerPhone`, `customerWilaya`. Settings/test flow enforces `apiKey` + (`apiSecret` or `apiToken`); help text marks `accountNumber` optional. Provider-side field/format limits and rate limits: `TBD (doc/credential required)`. | Current implementation: polling supported via provider status endpoint. Courier webhook support/contract: `TBD (doc/credential required)`. | No sandbox endpoint is configured in code; production URL is hardcoded. Exact sandbox base URL/auth differences: `TBD (doc/credential required)`. | Medium - endpoint/payload/auth behavior verified from adapter + credential-test flow; authoritative external docs not present in repo. |
| Andrson | `TBD (doc/credential required)` | `TBD (doc/credential required)` | `TBD (doc/credential required)` | `TBD (doc/credential required)` | `TBD (doc/credential required)` | `TBD (doc/credential required)` | Low - no adapter, fixture, or provider contract details found in current code/context. |
| Noest Express | `TBD (doc/credential required)` | `TBD (doc/credential required)` | `TBD (doc/credential required)` | `TBD (doc/credential required)` | `TBD (doc/credential required)` | `TBD (doc/credential required)` | Low - no adapter, fixture, or provider contract details found in current code/context. |

## Notes
- This artifact intentionally captures only integration-matrix facts (T27) and explicit unknown markers.
- Capability-map analysis and extended unknowns reporting beyond this table are deferred to T28.
