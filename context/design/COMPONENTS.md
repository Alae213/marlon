# Component Inventory

> Canonical component contracts — maintain these as the source of truth.

## Layout

### Shell
- **Purpose**: Dashboard layout wrapper with sidebar + top bar
- **Props**: `children`, `sidebarCollapsed`
- **Behavior**: Responsive — sidebar becomes drawer on mobile

### Sidebar
- **Purpose**: Primary navigation for dashboard
- **Props**: `items`, `collapsed`, `onToggle`
- **Items**: Dashboard, Stores, Orders, Products, Delivery, Settings
- **States**: Default, collapsed (icons only), mobile (drawer)

### PageWrapper
- **Purpose**: Standard page container with header + content
- **Props**: `title`, `subtitle`, `actions`, `children`
- **Slots**: header (title + actions), main content area

### TopBar
- **Purpose**: Store selector, notifications, user menu
- **Props**: `store`, `notificationCount`, `user`
- **Behavior**: Fixed position, z-index above content

## Common UI

### Button
- **Variants**: primary, secondary, ghost, danger
- **Sizes**: sm (28px, `text-caption`), md (32px, `text-body-sm`), lg (40px, `text-body`)
- **States**: default, hover, active, disabled, loading
- **Props**: `variant`, `size`, `disabled`, `loading`, `children`

### Input
- **Purpose**: Shared iOS-style single-line text field for forms and settings rows
- **Visual family**: inset-grouped iOS Settings row
- **Variants**: `light`, `dark`
- **Layouts**: `stacked` (default), `row`
- **States**: default, focus, error, disabled, read-only, filled
- **Props**: `label`, `supportingText`, `error`, `type`, `value`, `leadingAccessory`, `trailingAccessory`, `showClearButton`, `variant`, `layout`
- **Behavior**: single-line only, clear affordance for editable controlled fields, trait defaults based on field type
- **Trait guidance**: set `autoComplete`, `inputMode`, `autoCapitalize`, `spellCheck`, and `enterKeyHint` intentionally for email/phone/url/password/numeric fields

### Textarea
- **Purpose**: Shared multiline text view for longer freeform content
- **Variants**: `light`, `dark`
- **States**: default, focus, error, disabled, filled
- **Props**: `label`, `supportingText`, `error`, `value`, `rows`, `variant`
- **Behavior**: multiline only; do not use it to mimic a single-line input

### Select / Dropdown
- **Purpose**: Single selection from options
- **Props**: `options`, `value`, `onChange`, `placeholder`
- **Search**: Built-in search for long lists (10+ items)

### Modal / Dialog
- **Purpose**: Focused task or confirmation
- **Props**: `open`, `onClose`, `title`, `children`, `actions`
- **Behavior**: Escape to close, click outside to close (configurable)
- **Animation**: Scale + fade entrance
- **Typography**: titles use `text-title`, supporting copy uses `text-body-sm`

### Toast / Notification
- **Types**: success, error, warning, info
- **Props**: `type`, `title`, `message`, `duration`
- **Position**: Bottom-right, stacked
- **Auto-dismiss**: 5 seconds default, persistent for errors

### Badge
- **Variants**: default, success, warning, danger
- **Props**: `variant`, `children`, `dot` (optional indicator)
- **Usage**: Status labels, counts, alerts

### Card
- **Purpose**: Content container with optional header
- **Props**: `title`, `subtitle`, `actions`, `children`
- **Variants**: default, elevated (shadow), bordered

### Table
- **Props**: `columns`, `data`, `loading`, `empty`
- **Features**: Sortable columns, row selection, pagination
- **States**: Loading (skeleton), empty, error

### Skeleton
- **Purpose**: Loading placeholder
- **Props**: `width`, `height`, `borderRadius`, `animated`
- **Usage**: Match exact dimensions of content being loaded

## Feature-Specific

### StoreCard
- **Purpose**: Display store summary in list/grid
- **Props**: `store`, `onEdit`, `onDelete`
- **Shows**: Name, status (locked/unlocked), order count, daily cap

### OrderCard
- **Purpose**: Order summary in list
- **Props**: `order`, `onClick`, `onStatusChange`
- **Shows**: Order number, customer, status, total, date

### OrderTimeline
- **Purpose**: Visual order status progression
- **Props**: `statuses`, `currentStatus`
- **Shows**: Ordered → Confirmed → Shipped → Delivered

### DeliveryProviderCard
- **Purpose**: Delivery provider in settings
- **Props**: `provider`, `configured`, `onConfigure`
- **Shows**: Name, logo, coverage, status (configured/not)

### ProductCard
- **Purpose**: Product display in catalog
- **Props**: `product`, `onEdit`, `onDelete`
- **Shows**: Image, name, price, stock status

### CustomerInfo
- **Purpose**: Customer details display
- **Props**: `customer`, `showPhone`, `showAddress`
- **Masks**: Phone for non-confirmed orders, address when locked

### PriceDisplay
- **Purpose**: Formatted price with DZD currency
- **Props**: `amount`, `showCurrency`, `size`
- **Format**: "1,500 DZD" (comma as thousand separator)

### LockedBanner
- **Purpose**: Show store lock status
- **Props**: `storeId`, `daysRemaining`, `onUnlock`
- **Shows**: Lock icon, "Store locked", unlock CTA
