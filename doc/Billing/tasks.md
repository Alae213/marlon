# Billing Tasks

## Completed

### Billing State Machine
- [x] Implement trial → locked → active status transitions
- [x] Add order counting per 30-day rolling window
- [x] Create payment expiry handling
- [x] On new order: check if paidUntil expired → revert to trial, reset orderCount
- [x] Add `lockedAt` timestamp field to stores schema
- [x] Implement Convex cron for auto-deletion after 20 days locked

### Locked State
- [x] Mask customer data in orders page (show ***)
- [x] Disable action buttons when locked
- [x] Add unlock overlay message with Pay Now button

### Chargily Integration
- [x] Create payment action (Convex → Chargily API)
- [x] Build checkout redirect flow
- [x] Implement webhook handler for payment confirmation
- [x] Update store status on successful payment

## Testing Needed

- [ ] Paid store expires → next order → status becomes 'trial' not 'locked'
- [ ] Trial after expiry → hits 50 again → locks normally
- [ ] Merchant locks, 20 days pass → orders permanently deleted
- [ ] Merchant pays within 20 days → orders NOT deleted, data revealed
- [ ] Merchant sees order in list with *** masked data until payment
- [ ] Build Mode (Editor) remains fully accessible when store is locked

## Next Up

- [ ] Payment receipt / history page
- [ ] Grace period notifications before locking
- [ ] Email notification when store is about to lock (approaching 50 orders)
