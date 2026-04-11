# Feature: Subscription Billing

> **Status:** `complete`
> **Phase:** v1
> **Last updated:** 2026-04-10

---

## Summary

The billing system handles subscription tiers for stores: 50 free orders per 30-day rolling window, then 2000 DZD/month for paid access. Includes locked state handling where customer data is masked, and payment webhook processing to activate stores. Payment provider is abstracted and configurable.

---

## Users

- **Primary**: Store owners/merchants
- **When**: When store reaches 50 orders, to unlock full order management
- **Journey**: Trial → 50 orders reached → Locked → Pay 2000 DZD → Active (30 days)

---

## User Stories

- As a merchant, I want 50 free orders so I can test the platform before paying
- As a merchant, I want to see my order count so I know when I'll hit the limit
- As a merchant with a locked store, I want to pay 2000 DZD so I can access order details again
- As a merchant, I want my store to stay live even when locked so customers can still order
- As a merchant, I want manual renewal so I'm not charged automatically

---

## Behaviour

### Happy Path

1. **Free Tier (Trial)**
   - Store created → status: trial, orderCount: 0
   - Each order increments orderCount
   - Window: 30-day rolling (starts on first order)

2. **Locked State**
   - Trigger: orderCount >= 50
   - Public storefront: fully operational
   - Orders page: customer data masked (`***`), action buttons disabled
   - Editor: full access
   - Overlay message: "Unlock your store to manage orders: Pay 2000 DZD" + Pay Now button

3. **Paid Tier (Active)**
   - Payment via payment provider (configurable)
   - Webhook received → status: active, paidUntil: now+30d, orderCount: 0, firstOrderAt: null
   - Full access restored

4. **Expiry Flow**
   - paidUntil expires → wait for next order → status: trial, firstOrderAt: now, orderCount: 1
   - Repeat cycle

### Billing State Machine

```
Store created → status: trial, orderCount: 0
  ↓ (each order) orderCount++
  ↓ orderCount >= 50 → status: locked
  ↓ merchant pays 2000 DZD
  → status: active, paidUntil: now+30d, orderCount: 0, firstOrderAt: null
  ↓ paidUntil expires
  → wait for next order → status: trial, firstOrderAt: now, orderCount: 1
  → repeat cycle
```

### Edge Cases & Rules

- **50-order limit**: Per store per 30-day rolling window
- **Payment unlocks**: 30 days from payment date (not from first order)
- **After paid period expires**: Store returns to free tier (new 50-order allowance)
- **Public storefront always live**: Regardless of lock state
- **No auto-renewal**: Manual renewal only
- **Independent billing**: Multi-store users don't share allowances

---

## Connections

- **Depends on**: Store creation, Orders (order counting)
- **Triggers**: Payment provider webhook → Store activation
- **Shares data with**: Orders management (locked state behavior)

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Auto-renewal | Not supported | Supported |
| Payment methods | EDAHABIA/CIB | All Algerian methods |
| Agency billing | Per-store | Consolidated |

---

## Security Considerations

- Auth required: Yes (Clerk)
- Input validation: Payment webhook signature verification
- Rate limiting: Webhook endpoints should be rate limited
- Sensitive data: Customer data masked in locked state (must never be logged)

---

## Tasks

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T23 | [x] | 50-order free tier with rolling window |
| T24 | [x] | 2000 DZD/month payment flow |
| T25 | [x] | Locked state with customer data masking |
| T26 | [x] | Payment webhook processing |
| T27 | [x] | Payment provider abstraction |

---

## UAT Status

**UAT Status:** `passed`

**Last tested:** 2026-04-10

**Outcome:** All billing features working - free tier, locked state, payment flow, webhook

---

## Open Questions

- [ ] Need auto-renewal option for convenience?
- [ ] Any need for payment receipts?

---

## Notes

- Payment provider is abstracted via lib/payment-service.ts
- Configure via PAYMENT_PROVIDER env var (chargily|sofizpay|custom)
- Webhook endpoint: `/api/chargily/webhook` (handles any provider)
- Customer data never deleted, only masked while locked