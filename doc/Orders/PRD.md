# Orders PRD

> Domain owner for: Order List, Status Machine, Detail Panel, Call Log, Audit Trail
> Route: `/orders/[storeSlug]`

---

## Summary

Notion-style order management with a status state machine, call logging, context-aware actions, and an immutable audit trail. Merchants confirm orders via phone calls and track them through fulfillment.

---

## Order List (PRD §5.1)

- Notion-style table: Customer Name, Phone, Wilaya, Status (colored badge), Total, Date
- Filters: Status (All / New / Confirmed / Packaged / Shipped / Succeeded / Canceled / Blocked / Hold), Date range
- Search: by order ID or customer name
- Sort: Date, Total, Status
- Red notification dot on Orders nav item for new orders

## Order Status Machine (PRD §5.2)

```
new → confirmed → packaged → shipped → succeeded
  ↓        ↓          ↓
blocked / canceled / hold
```

| Status | Description |
|---|---|
| new | Order placed, awaiting merchant confirmation |
| confirmed | Merchant called and confirmed |
| packaged | Ready to ship |
| shipped | Sent to delivery company |
| succeeded | Delivered successfully |
| canceled | Canceled by merchant or customer |
| blocked | Customer flagged as fraudulent |
| hold | Wrong number, pending resolution |

## Order Detail Panel (PRD §5.3)

- Customer info: name, phone, wilaya, commune, address — all editable inline (auto-save on Enter or Save/Cancel)
- Edits are for merchant reference only; no downstream effects on delivery API or validation
- Products: list with quantities, variants, prices — editable inline (editing quantity recalculates total)
- Delivery type (Stopdesk / Domicile), delivery cost, total amount
- Order timeline (status change log)
- Call log
- Internal notes (not visible to customers)

## Call Log (PRD §5.4)

- Attempt counter (1st / 2nd / 3rd)
- Outcomes:
  - **Answered** → prompt to confirm order → status: confirmed
  - **No Answer** → increment attempt counter
  - **Wrong Number** → status: hold
  - **Refused** → prompt confirmation → status: canceled
- Timestamp per attempt

## Context-Aware Action Buttons (PRD §5.5)

| Order Status | Available Actions |
|---|---|
| new | Confirm, Cancel, Block Customer, Call Log |
| confirmed | Package, Cancel |
| packaged | Ship, Cancel |
| shipped | View Tracking (if delivery API connected) |
| all | Add Note, View Change Log |

## Audit Trail (PRD §5.6)

- Logs: status changes (who, when), call attempts (outcome, timestamp), notes added, order edits
- **Immutable** — cannot be deleted

---

## Relevant Data Models

### Order
```
orderId, storeId, orderNumber,
customer: { name, phone, wilaya, commune, address },
items: [{ productId, name, image, variant, quantity, price }],
deliveryType: 'stopdesk' | 'domicile',
deliveryCost, subtotal, total,
status: 'new' | 'confirmed' | 'packaged' | 'shipped' | 'succeeded' | 'canceled' | 'blocked' | 'hold',
trackingNumber, callLog: [{ attempt, outcome, timestamp }],
notes: [{ text, createdAt }], changelog: [{ action, by, timestamp }],
createdAt
```
