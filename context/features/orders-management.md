# Feature: Orders Management

> **Status:** `complete`
> **Phase:** v1
> **Last updated:** 2026-04-10

---

## Summary

The orders management system is a COD-first workflow for merchants to track and process orders. It includes a list view with filters, Kanban board view, order status machine, call logging, and customer data masking for locked stores. Access via `/orders/[storeSlug]`.

---

## Users

- **Primary**: Store owners/merchants
- **When**: After receiving orders, to confirm, process, and ship
- **Journey**: Storefront order → Orders page → Confirm → Package → Ship → Succeeded

---

## User Stories

- As a merchant, I want to see all my orders in one place so I don't miss any
- As a merchant, I want to call customers to confirm orders so I can verify they want to buy
- As a merchant, I want to update order status so I know where each order is
- As a merchant, I want to add notes to orders so I can remember important details
- As a merchant with a locked store, I want customer data masked so I can't see it until I pay

---

## Behaviour

### Happy Path

1. **Order List**
   - Notion-style table: Customer Name, Phone, Wilaya, Status (colored badge), Total, Date
   - Filters: Status (All/New/Confirmed/Packaged/Shipped/Succeeded/Canceled/Blocked/Hold), Date range
   - Search: by order ID or customer name
   - Sort: Date, Total, Status

2. **Order Status Machine**
   ```
   new → confirmed → packaged → shipped → succeeded
    ↓        ↓          ↓
   canceled / blocked / hold
   ```
   - new: Order placed, awaiting confirmation
   - confirmed: Merchant called and confirmed
   - packaged: Ready to ship
   - shipped: Sent to delivery company
   - succeeded: Delivered successfully
   - canceled: Merchant or customer canceled
   - blocked: Customer flagged as fraudulent
   - hold: Wrong number, pending resolution

3. **Order Detail Panel**
   - Customer info: name, phone, wilaya, commune, address — all editable inline
   - Products: list with quantities, variants, prices — editable inline
   - Delivery type (stopdesk/domicile), delivery cost, total amount
   - Order timeline, Call log, Internal notes

4. **Call Log**
   - Attempt counter (1st/2nd/3rd)
   - Outcomes: Answered → confirm order, No Answer → increment, Wrong Number → hold, Refused → cancel

5. **Context-Aware Actions**
   - New: Confirm, Cancel, Block Customer, Call Log
   - Confirmed: Package, Cancel
   - Packaged: Ship, Cancel
   - Shipped: View Tracking (if API connected)
   - All: Add Note, View Change Log

6. **Audit Trail**
   - Logs: status changes, call attempts, notes added, order edits
   - Immutable, cannot be deleted

### Edge Cases & Rules

- **Locked store**: Customer name/phone/address replaced with `***`, action buttons disabled
- **No orders**: Show empty state with "No orders yet" message
- **Status transitions**: Only valid transitions allowed per status machine

---

## Connections

- **Depends on**: Store creation, Products, Delivery pricing
- **Triggers**: Delivery API integration, Customer notifications
- **Shares data with**: Store Editor (products), Public storefront (orders)

---

## MVP vs Full Version

| Aspect | MVP (v1) | Full Version |
|--------|----------|--------------|
| Kanban view | Partial | Full |
| Search by phone | Not supported | Supported |
| Bulk status updates | Not supported | Supported |

---

## Security Considerations

- Auth required: Yes (Clerk)
- Input validation: Order status transitions validated
- Rate limiting: None
- Sensitive data: Customer data masked for locked stores (must never be logged/exposed)

---

## Tasks

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T11 | [x] | Order list with filters |
| T12 | [x] | Order status machine |
| T13 | [x] | Call logging system |
| T14 | [x] | Order detail panel |
| T15 | [x] | Notes and changelog |
| T16 | [x] | Customer data masking (locked state) |

---

## UAT Status

**UAT Status:** `passed`

**Last tested:** 2026-04-10

**Outcome:** All order features working - list, status, call log, notes, masking

---

## Open Questions

- [ ] Need to add search by customer phone?
- [ ] Any need for bulk actions?

---

## Notes

- Implementation follows PRD exactly: status machine, call logging outcomes, audit trail
- Locked state overlay: "Unlock your store to manage orders: Pay 2000 DZD" + Pay Now button
- Customer data masking: replaced with `***` for name, phone, address