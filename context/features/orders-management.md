# Feature: Orders Management

> **Status:** `complete (aligned to canonical lock model)`
> **Phase:** v1
> **Last updated:** 2026-04-14

---

## Summary

The orders management system is a COD-first workflow for merchants to track and process orders. It includes a list view with filters, Kanban board view, canonical order status machine, call logging, and overflow masking/freeze behavior for locked stores. Access via `/orders/[storeSlug]`.

---

## Users

- **Primary**: Store owners/merchants
- **When**: After receiving orders, to confirm, process, and ship
- **Journey**: Storefront order → Orders page → Confirm → Prepare → Dispatch → Deliver

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
   - Filters: Status (`pending`, `confirmed`, `preparing`, `out_for_delivery`, `delivered`, `canceled`, `returned`), Date range
   - Search: by order ID or customer name
   - Sort: Date, Total, Status

2. **Order Status Machine**
   ```
    pending → confirmed → preparing → out_for_delivery → delivered
       ↓          ↓            ↓
    canceled   canceled      returned
   ```
    - pending: Order placed, awaiting confirmation
    - confirmed: Merchant called and confirmed
    - preparing: Ready to ship
    - out_for_delivery: Sent to delivery company
    - delivered: Delivered successfully
    - canceled: Merchant or customer canceled
    - returned: Delivery attempt failed/returned

3. **Order Detail Panel**
   - Customer info: name, phone, wilaya, commune, address — all editable inline
   - Products: list with quantities, variants, prices — editable inline
   - Delivery type (stopdesk/domicile), delivery cost, total amount
   - Order timeline, Call log, Internal notes

4. **Call Log**
   - Attempt counter (1st/2nd/3rd)
    - Outcomes: Answered → confirm order, No Answer → increment attempt, Wrong Number → cancel/returned per policy, Refused → cancel

5. **Context-Aware Actions**
    - Pending: Confirm, Cancel, Call Log
    - Confirmed: Move to Preparing, Cancel
    - Preparing: Dispatch (`out_for_delivery`), Cancel
    - Out for delivery: View Tracking (if API connected)
    - All: Add Note, View Change Log

6. **Audit Trail**
    - Logs: status changes, call attempts, notes added, order edits
    - Mandatory immutable events for lock lifecycle: `masked`, `unlocked`, `visibility_restored`
    - Mandatory immutable events for dispatch lifecycle: `dispatch_attempted`, `dispatch_succeeded`, `dispatch_failed`, `dispatch_dead_letter`
    - Immutable, cannot be deleted

### Edge Cases & Rules

- **Locked store (phase-3 lock)**: Customer name/phone/address replaced with `***`; server-enforced freeze disables merchant actions on masked overflow orders with no exceptions
- **Overflow masking lifecycle (canonical)**:
  - Once a store exceeds `5` orders/day (`Africa/Algiers` boundary), newly created overflow orders are created as masked/frozen (`visibilityState=overflow_masked`)
  - While locked, masked overflow orders are view-only; no merchant status/edit/dispatch actions are allowed
  - While locked, no customer notification is sent for masked overflow records
  - If still locked after `5` days from creation, masked overflow records are auto-deleted
  - After unlock, only retained masked records restore visibility (`overflow_unlocked`); deleted overflow records are never resurrected
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

- Auth required: Yes (Clerk) + central authorization policy layer for all protected reads/actions
- Input validation: Canonical status transitions and action permissions validated server-side
- Locked-state masking: Full masking for locked overflow records with no exceptions
- Fraud controls baseline: public order creation and sensitive mutations are rate-limited and checked against phone reputation/blocklist controls
- Sensitive data: Customer data and masked snapshots must never be logged/exposed

---

## Tasks

| Task # | Status | What needs to be done |
|--------|--------|-----------------------|
| T23 | [x] | Align this feature spec with canonical overflow masking lifecycle, lock/unlock visibility semantics, and Phase 3 security controls |

---

## UAT Status

**UAT Status:** `passed`

**Last tested:** 2026-04-10

**Outcome:** All order features working - list, status, call log, notes, masking

---

## Open Questions

- None at this time (previous questions on phone search and bulk actions are deferred to post-v1 backlog and not blockers for canonical lock behavior).

---

## Notes

- Canonical enums align with `context/technical/DATA_MODELS.md` (`OrderStatus`, `OrderVisibilityState`, `StoreLockState`)
- Locked state overlay: "Unlock your store to manage orders: Pay 2000 DZD" + Pay Now button
- Customer data masking: replaced with `***` for name, phone, address while `locked_overflow`
