# Billing PRD

> Domain owner for: Billing State Machine, Locked State Behavior, Chargily Pay Integration, Pricing
> Cross-cutting: affects Orders (data masking) and Public (storefront stays live)

---

## Summary

Pay-when-you-succeed billing: 50 free orders/month per store, then 2000 DZD/month via Chargily Pay. Locked stores mask customer data but keep the storefront live. No auto-renewal.

---

## Business Model

- **Free tier**: First 50 orders per store per 30-day rolling window. No credit card required.
- **Paid tier**: 2000 DZD/month per store. Manual renewal. No auto-billing.
- **Payment**: Chargily Pay (CIB card, Edahabia, bank transfer). DZD only.
- Each store has **independent billing** (multi-store users don't share allowances)

## Billing State Machine

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

### Rules
- 50-order limit per store per 30-day rolling window (window starts on first order)
- Payment unlocks 30 days from **payment date** (not from first order)
- After paid period expires with no payment: store returns to free tier (new 50-order allowance)
- No auto-renewal
- Public storefront always stays live regardless of lock state

## Locked State Behavior

- **Public storefront**: fully operational — customers can still place orders
- **Orders page**: orders visible, but customer name/phone/address replaced with `***`; all action buttons disabled; call log disabled; notes disabled 
- **Editor**: full access (products, site content)
- **Customer data**: never deleted, only masked while locked; revealed after payment
- Overlay message: "Unlock your store to manage orders: Pay 2000 DZD" + Pay Now button

### Auto-Deletion After 20 Days (GAP 3)
- `lockedAt` timestamp set when status → 'locked'
- Convex cron runs daily: find stores where status = 'locked' AND lockedAt < now - 20 days → hard-delete all orders from that locked window
- If merchant pays within 20 days → orders NOT deleted, data revealed

## Chargily Pay Integration

- **Flow**: merchant clicks "Pay Now" → Convex action creates Chargily invoice (2000 DZD) → redirect to checkout URL → webhook received → store unlocked
- **Webhook endpoint**: `marlon.com/api/webhooks/chargily`
- **Webhook triggers**: update `subscriptionStatus: active`, `paidUntil: now+30d`, reset `orderCount: 0`, reset `firstOrderAt: null`

---

## Relevant Data Models

### Store (billing fields)
```
subscriptionStatus: 'trial' | 'active' | 'locked',
orderCount,
firstOrderAt,
subscriptionPaidUntil,
lockedAt
```
