# Orders Tasks

## Completed

### Order List & Table
- [x] Build Notion-style orders table
- [x] Implement filters (status, date range)
- [x] Add search by order ID or customer name
- [x] Implement sorting (date, total, status)
- [x] Add notification dot for new orders

### Status Machine
- [x] Implement status transitions (new → confirmed → packaged → shipped → succeeded)
- [x] Add status badges with colors
- [x] Handle edge transitions (canceled, blocked, hold)

### Order Detail Panel
- [x] Build right-side order detail panel
- [x] Implement inline editing for customer info
- [x] Add product list with quantity editing
- [x] Create delivery type and cost display
- [x] Build order timeline (status change log)

### Call Log
- [x] Implement call attempt counter
- [x] Create call outcomes workflow (Answered, No Answer, Wrong Number, Refused)
- [x] Add timestamp tracking per attempt

### Actions & Notes
- [x] Implement action buttons based on order status
- [x] Add "Send to Delivery Company" bulk action
- [x] Build tracking number display
- [x] Build "Add Note" UI in order detail panel
- [x] Store notes in Convex with (orderId, text, timestamp, merchantId)
- [x] Display notes list sorted by date
- [x] Include notes in order timeline / audit trail
- [x] Render "Add Note" action button for every order
- [x] Render "View Change Log" action button for every order

### Audit Trail
- [x] Create immutable changelog system
- [x] Log status changes, call attempts, notes, edits

## Remaining

(none — all orders tasks complete)

## Next Up

- [ ] Bulk status change for multiple orders
- [ ] Order export (CSV)
- [ ] Advanced filtering (by wilaya, delivery type)
