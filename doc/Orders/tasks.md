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

## Phase 1: Add Image Field to Orders (COMPLETED)

### Schema Updates
- [x] Add `image` field to Convex schema (products array in orders table)
- [x] Update createOrder mutation to accept image parameter
- [x] Update orders-types.ts OrderItem interface

## Phase 2: Add Blocked Status (COMPLETED)

### Status Machine Updates
- [x] Add "blocked" to OrderStatus type in orders-types.ts
- [x] Add blocked entry to STATUS_LABELS with danger variant
- [x] Add blocked to STATUS_TRANSITIONS (from new, confirmed, hold)

## Phase 3: Cart & Checkout Flow (COMPLETED)

### Cart Sidebar
- [x] Add order form with customer details (name, phone, wilaya, commune, address, delivery type)
- [x] Get storeId from context for order creation
- [x] Map cart items to order products with images

### Product Detail Page
- [x] Pass product image when creating order from "Buy Now"

## Phase 4: Orders Page Redesign (COMPLETED)

### Header
- [x] Change page title from "الطلبات" to "Orders"
- [x] Remove Export button

### View Toggle
- [x] Add viewMode state ("list" | "state")
- [x] Create toggle bar with "List" and "By State" options
- [x] Show "Coming Soon" placeholder for "By State"

### Toolbar (Icon Bar)
- [x] Add 5 icon buttons: Search, Filter, Sort, Settings, Archive
- [x] Implement expandable search input (click to expand, escape/click outside to collapse)
- [x] Wire search to existing search logic

### Table Redesign
- [x] Add checkbox column (select all + individual checkboxes)
- [x] Redesign Customer column (name bold + phone muted)
- [x] Remove Order ID column
- [x] Add Product column (first item name + variant + "+N more" badge)
- [x] Add inline status dropdown (clickable badge → dropdown below)
- [x] Add Total column with formatted price
- [x] Add Date column with relative time (e.g., "about 3h ago")

### Additional Components
- [x] Add relativeTime helper function
- [x] Create inline status dropdown component (Notion-style)
- [x] Wire updateOrderStatus mutation to dropdown

## Phase 5: Testing (COMPLETED)

- [x] Run lint to check for errors
- [x] Run build to verify no compilation errors
- [x] Fix any lint or build errors
