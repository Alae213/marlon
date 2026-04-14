# Courier Capability Map (MVP Wave 1)

## Purpose

Canonical capability map for MVP couriers in wave 1:
- Yalidine
- ZR Express
- Andrson
- Noest Express

This artifact is for T28 and focuses on practical required/optional fields, coverage constraints, pickup/fulfillment flow differences, and explicit unknowns that block downstream implementation tasks.

## Source of Truth and Confidence

- Primary verified sources in this repo:
  - `context/technical/COURIER_INTEGRATION_MATRIX.md`
  - `app/api/delivery/create-order/route.ts`
  - `lib/delivery/adapters/yalidine-adapter.ts`
  - `lib/delivery/adapters/zr-express-adapter.ts`
  - `convex/siteContent.ts`
  - `components/pages/editor/settings/delivery-integration-settings.tsx`
- No authoritative external provider docs or sandbox credentials are present in-repo for Andrson/Noest.
- Provider limits, serviceability matrices, and pickup SLAs not explicitly documented in-repo are marked as `TBD (doc/credential required)`.

## Capability Matrix (Practical Required vs Optional)

| Provider | Credential fields (practical) | Dispatch payload fields (practical) | Status/tracking capability | Notes |
|---|---|---|---|---|
| Yalidine | Required: `apiKey` + (`apiToken` or `apiSecret`) at settings/test level; runtime dispatch uses `apiSecret` field after normalization. Optional: `accountNumber` not used. | Platform preflight required: `orderId`, `customerName`, `customerPhone`, `customerWilaya`. Commonly expected for provider call: `customerCommune`, `customerAddress`, `products[]`, `total` (passed through adapter but not hard-failed by current preflight). | Dispatch + polling status endpoint are implemented. Webhook contract unknown. | Adapter sends `Authorization: <apiKey>` and body `api_secret`; credential test path uses `X-API-Key` + `X-API-Token`. |
| ZR Express | Required: `apiKey` + (`apiSecret` or `apiToken`) at settings/test; runtime dispatch requires normalized `apiSecret`. Optional: `accountNumber`. | Platform preflight required: `orderId`, `customerName`, `customerPhone`, `customerWilaya`. Commonly expected for provider call: `customerCommune`, `customerAddress`, `products[]`, `total`; optional `account_number`. | Dispatch + polling status endpoint are implemented. Webhook contract unknown. | Adapter sends `Authorization: Bearer <apiKey>` + `X-API-SECRET`. |
| Andrson | `TBD (doc/credential required)` | `TBD (doc/credential required)` | `TBD (doc/credential required)` | No adapter or fixtures found in current code/context. |
| Noest Express | `TBD (doc/credential required)` | `TBD (doc/credential required)` | `TBD (doc/credential required)` | No adapter or fixtures found in current code/context. |

## Coverage and Serviceability Constraints

### Currently Known

- Current create-order preflight enforces only baseline required fields: `orderId`, `customerName`, `customerPhone`, `customerWilaya`.
- Store ownership/auth checks and provider credential presence are enforced before dispatch.
- Courier-specific zone coverage validation (wilaya/commune/address serviceability) is not documented as an authoritative provider matrix in current context.
- Emergency global credential fallback exists for Yalidine and ZR Express, gated by `DELIVERY_ALLOW_GLOBAL_CREDENTIAL_FALLBACK`.

### Provider Coverage Constraints

| Provider | Coverage/serviceability constraints |
|---|---|
| Yalidine | Wilaya/commune serviceability matrix: `TBD (doc/credential required)`. Cutoff times, rejected-zone semantics, and remote-area surcharge rules: `TBD (doc/credential required)`. |
| ZR Express | Wilaya/commune serviceability matrix: `TBD (doc/credential required)`. Cutoff times, rejected-zone semantics, and remote-area surcharge rules: `TBD (doc/credential required)`. |
| Andrson | `TBD (doc/credential required)` |
| Noest Express | `TBD (doc/credential required)` |

## Pickup and Fulfillment Flow Differences

### Currently Known

- Assignment model for MVP wave 1 is manual-only (no auto-assignment).
- Yalidine and ZR Express currently support dispatch + polling-based status checks.
- Status vocabulary differs by provider payload and is normalized in adapters:
  - Yalidine source statuses mapped from values like `en_attente`, `collectee`, `en_cours`, `en_livraison`, `livree`, `retour`, `echouee`.
  - ZR Express source statuses map directly from normalized-style values like `pending`, `picked_up`, `in_transit`, `out_for_delivery`, `delivered`, `returned`, `failed`.

### Provider Flow Gaps

| Provider | Pickup/fulfillment flow differences still unknown |
|---|---|
| Yalidine | Pickup booking mechanics (immediate vs scheduled), cancellation windows, reattempt policy, RTS operational transitions, and webhook event order: `TBD (doc/credential required)`. |
| ZR Express | Pickup booking mechanics (immediate vs scheduled), cancellation windows, reattempt policy, RTS operational transitions, and webhook event order: `TBD (doc/credential required)`. |
| Andrson | End-to-end pickup + fulfillment lifecycle: `TBD (doc/credential required)`. |
| Noest Express | End-to-end pickup + fulfillment lifecycle: `TBD (doc/credential required)`. |

## Unknowns Log (Blocking / Owner / Next Action)

| ID | Unknown | Affects tasks | Owner | Next action |
|---|---|---|---|---|
| U1 | Official API docs + auth contract snapshots for Yalidine | T29-T41 | Integrations lead (TBD) | Obtain latest provider docs and archive reference copy in context; mark auth/header contract canonical. |
| U2 | Official API docs + auth contract snapshots for ZR Express | T29-T41 | Integrations lead (TBD) | Obtain latest provider docs and archive reference copy in context; confirm auth and endpoint versioning. |
| U3 | Sandbox credentials and base URLs for Yalidine | T33, T37-T41, T45 | Ops + partner manager (TBD) | Request sandbox account, store secrets in secure env, add non-production fixture notes. |
| U4 | Sandbox credentials and base URLs for ZR Express | T34, T37-T41, T45 | Ops + partner manager (TBD) | Request sandbox account, store secrets in secure env, add non-production fixture notes. |
| U5 | Full provider contract for Andrson (auth, endpoints, payload, statuses, limits) | T29, T35-T41, T45 | Partnerships owner (TBD) + engineering (TBD) | Acquire docs + credentials, then produce adapter contract draft before implementation. |
| U6 | Full provider contract for Noest Express (auth, endpoints, payload, statuses, limits) | T29, T36-T41, T45 | Partnerships owner (TBD) + engineering (TBD) | Acquire docs + credentials, then produce adapter contract draft before implementation. |
| U7 | Courier coverage/serviceability matrices (wilaya/commune/address acceptance) for all 4 providers | T37, T44-T45 | Operations owner (TBD) | Collect provider coverage artifacts and define canonical preflight validation data shape. |
| U8 | Webhook availability and event schema/order guarantees per provider | T29, T40-T41 | Integrations lead (TBD) | Confirm webhook support per provider; if absent, lock polling-only strategy with reconciliation cadence. |
| U9 | Pickup scheduling/cutoff/cancellation policies and RTS transitions per provider | T29, T37, T41, T45 | Operations owner (TBD) | Capture provider SOP + API support details and define normalized workflow constraints. |
| U10 | Provider rate limits and retry guidance per provider | T39, T43 | SRE/Backend owner (TBD) | Request official limits; define provider policy table for backoff/circuit-break defaults. |

## Exit Criteria for This Artifact (T28)

- Capability matrix exists for all four MVP providers with practical required/optional fields.
- Coverage constraints and pickup/fulfillment flow differences are explicitly documented.
- Unknowns are not guessed and are marked as `TBD (doc/credential required)` where facts are missing.
