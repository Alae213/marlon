# Feature: Delivery Provider Settings

> **Status:** `in-progress`
> **Phase:** v1
> **Last updated:** 2026-04-16

---

## Summary

Delivery Provider Settings is the courier-configuration tab inside the editor settings dialog. The live UI is `components/pages/editor/settings/delivery-integration-settings.tsx`, mounted from `components/pages/editor/components/settings-dialog.tsx`, with persistence in `convex/siteContent.ts` and encrypted credential storage in the `deliveryCredentials` table. Current: owners can enable providers, save credentials per store, and test connections. Partial: only Yalidine and ZR Express are operational for dispatch/testing, while Andrson and Noest remain placeholder/TBD adapters that are still exposed in the UI.

---

## Users

- Store owners connecting supported courier providers to a store.
- Delivery dispatch/runtime code that reads the configured provider and credentials for protected owner-scoped actions.

---

## User Stories

- As a store owner, I want to connect my courier credentials securely so that I can dispatch orders from the app.
- As a store owner, I want to test a provider connection before relying on it so that I can catch bad credentials early.

---

## Behaviour

### Happy Path

1. The owner opens the Courier tab in `components/pages/editor/components/settings-dialog.tsx`.
2. The tab loads current integration metadata from `api.siteContent.getDeliveryIntegration`.
3. The owner enables one or more providers from the visible list: Yalidine, ZR Express, Andrson, and Noest.
4. When required credential fields are present, blur or Save triggers `api.siteContent.setDeliveryIntegration`, which encrypts credentials into `deliveryCredentials` and updates non-secret metadata in `siteContent`.
5. The owner can run Test, which calls `api.siteContent.testDeliveryConnection`.
6. Delivery runtime later reads decrypted credentials through owner-scoped server paths such as `api.siteContent.getDeliveryCredentialsForOwnerRuntime` and `app/api/delivery/create-order/route.ts`.

### Edge Cases & Rules

- `Current`: existing credentials are write-only after save; the UI only shows that credentials exist and when they were updated.
- `Current`: Yalidine and ZR Express are the operational providers for testing/dispatch in current runtime.
- `Partial`: Andrson and Noest can be enabled in UI and stored in settings metadata, but their real adapter support is still TBD.
- `Current`: toggling providers updates enabled-provider metadata immediately through `setDeliveryIntegration`.
- `Current`: an emergency global credential fallback exists in `app/api/delivery/create-order/route.ts` behind `DELIVERY_ALLOW_GLOBAL_CREDENTIAL_FALLBACK=true`; this is not normal multi-tenant runtime.

---

## Connections

- **Depends on:** `components/pages/editor/settings/delivery-integration-settings.tsx`, `convex/siteContent.ts`, `convex/schema.ts`, `app/api/delivery/create-order/route.ts`.
- **Triggers:** protected delivery connection tests and delivery dispatch runtime.
- **Shares data with:** `deliveryCredentials` storage, `siteContent.deliveryIntegration` metadata, and provider adapters in `lib/delivery-api` / `lib/delivery-provider`.

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Provider list | `Partial`: 4 visible providers, but only Yalidine and ZR Express are operational | `Planned`: only expose providers with real adapters, or fully ship the missing ones |
| Secret handling | `Current`: encrypted per-store storage and write-only UI | `Planned`: same posture, with clearer ops tooling if needed |
| Testing | `Current`: owner-scoped connection test action exists | `Planned`: stronger provider-specific diagnostics and monitoring |
| Fallback behavior | `Partial`: emergency global fallback exists behind env flag | `Policy-locked`: fallback should stay off unless incident-driven and time-boxed |

---

---

## Security Considerations

- `Current`: delivery credential writes and runtime reads are owner-scoped server operations.
- `Current`: credentials are encrypted at rest in `deliveryCredentials` using `DELIVERY_CREDENTIALS_KEY`; decrypted values are not returned to the client.
- `Current`: public delivery integration reads expose metadata only, not secrets.
- `Current`: write-only-after-save behavior in the UI matches the documented secret-handling posture.
- `Partial`: the emergency global credential fallback can bypass per-store credentials when explicitly enabled; this should be documented as incident-only, not standard runtime.
- `Policy-locked`: do not widen credential read access for support or convenience, and do not treat unsupported provider placeholders as production-ready dispatch paths.

## Tasks

> Status: [ ] todo  [~] in progress  [x] done  [-] blocked  [>] deferred

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T15 | `[ ]` | Remove unsupported courier providers from the live settings surface or clearly gate them until real adapters and dispatch/test support exist. |

---

---

## User Acceptance Tests

**UAT Status:** `pending`

**Last tested:** -

**Outcome:** Not recorded in repo-backed context yet.

## Open Questions

- No additional open questions beyond the known adapter gap: Andrson and Noest are visibly configurable, but the repo does not yet show them as fully operational dispatch providers.

---

## Notes

- Main implementation references: `components/pages/editor/settings/delivery-integration-settings.tsx`, `convex/siteContent.ts`, `convex/schema.ts`, `app/api/delivery/create-order/route.ts`.
- The live data model splits secret and non-secret delivery state intentionally: encrypted rows in `deliveryCredentials`, public-safe metadata in `siteContent.deliveryIntegration`.

---

## Archive

None.
