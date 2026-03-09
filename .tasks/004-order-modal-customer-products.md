# Task 004: Order Modal - Customer & Products

## LLM Agent Directives

You are redesigning the Order Modal customer and products sections. Focus on making important information prominent and enabling quick actions.

**Goals:**
1. Improve Customer Info section with phone priority and inline notes
2. Improve Product section with thumbnails and editing capabilities

**Rules:**
- DO NOT add new features beyond what is specified
- DO NOT refactor unrelated code
- RUN `bun run typecheck` after each change
- VERIFY no imports break after changes
- Follow the visual styling guidelines in AGENTS.md for modal components

---

## 6.0 Create Convex mutations for product editing

**File:** `convex/orders.ts`

ADD mutations:
```typescript
// Update order product quantity
export const updateOrderProductQuantity = mutation({
  args: {
    orderId: v.id("orders"),
    productIndex: v.number(),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    
    const products = [...order.products];
    if (products[args.productIndex]) {
      products[args.productIndex] = {
        ...products[args.productIndex],
        quantity: args.quantity,
      };
      
      // Recalculate totals
      const subtotal = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
      const total = subtotal + order.deliveryCost;
      
      await ctx.db.patch(args.orderId, {
        products,
        subtotal,
        total,
      });
    }
  },
});

// Remove product from order
export const removeOrderProduct = mutation({
  args: {
    orderId: v.id("orders"),
    productIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    
    const products = order.products.filter((_, i) => i !== args.productIndex);
    
    // Recalculate totals
    const subtotal = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const total = subtotal + order.deliveryCost;
    
    await ctx.db.patch(args.orderId, {
      products,
      subtotal,
      total,
    });
  },
});

// Add product to order
export const addProductToOrder = mutation({
  args: {
    orderId: v.id("orders"),
    product: v.object({
      id: v.string(),
      productId: v.string(),
      name: v.string(),
      price: v.number(),
      quantity: v.number(),
      variant: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    
    const products = [...order.products, args.product];
    
    // Recalculate totals
    const subtotal = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const total = subtotal + order.deliveryCost;
    
    await ctx.db.patch(args.orderId, {
      products,
      subtotal,
      total,
    });
  },
});
```

VERIFY: Mutations work with `bun run typecheck`.

---

## 6.1 Customer Info Section - Phone Priority

**File:** `components/order-page/OrderDetails.tsx`

FIND the customer info section:
```typescript
<div className="grid grid-cols-2 gap-4">
  <div className="p-4 bg-[#fafafa] dark:bg-[#171717]">
    <div className="flex items-center gap-2 text-[#737373] mb-2">
      <User className="w-4 h-4" />
      <span className="text-sm">Customer</span>
    </div>
    <LockedData fallback="***">
      <p className="font-normal text-[#171717] dark:text-[#fafafa]">{order.customerName}</p>
      <p className="text-sm text-[#737373]">{order.customerPhone}</p>
    </LockedData>
  </div>
```

CHANGE TO:
```typescript
<div className="p-4 bg-[#fafafa] dark:bg-[#171717]">
  <div className="flex items-center gap-2 text-[#737373] mb-2">
    <User className="w-4 h-4" />
    <span className="text-sm">Customer</span>
  </div>
  {/* Phone - Large and prominent */}
  <LockedData fallback="***">
    <p className="text-2xl font-semibold text-[#171717] dark:text-[#fafafa] mb-2">
      {order.customerPhone}
    </p>
    <p className="font-normal text-[#171717] dark:text-[#fafafa]">{order.customerName}</p>
  </LockedData>
  
  {/* Inline Add Note */}
  {showCustomerNote ? (
    <div className="mt-3 pt-3 border-t border-[#e5e5e5]">
      <textarea
        value={customerNoteText}
        onChange={(e) => setCustomerNoteText(e.target.value)}
        placeholder="Add a note..."
        className="w-full px-3 py-2 border border-[#e5e5e5] dark:border-[#404040] bg-white dark:bg-[#0a0a0a] text-sm resize-none"
        rows={2}
      />
      <div className="flex gap-2 mt-2">
        <Button size="xs" variant="outline" onClick={() => setShowCustomerNote(false)}>Cancel</Button>
        <Button size="xs" onClick={() => {
          if (customerNoteText.trim()) {
            handleAddAdminNote(order._id, customerNoteText);
            setCustomerNoteText("");
          }
          setShowCustomerNote(false);
        }}>Save</Button>
      </div>
    </div>
  ) : (
    <button
      onClick={() => setShowCustomerNote(true)}
      className="mt-3 pt-3 border-t border-[#e5e5e5] text-sm text-[#737373] hover:text-[#171717] dark:hover:text-[#fafafa] transition-colors"
    >
      + Add note
    </button>
  )}
</div>

{/* Address - Separate section */}
<div className="p-4 bg-[#fafafa] dark:bg-[#171717]">
  <div className="flex items-center gap-2 text-[#737373] mb-2">
    <MapPin className="w-4 h-4" />
    <span className="text-sm">Address</span>
  </div>
  <LockedData fallback="***">
    <p className="text-sm text-[#171717] dark:text-[#fafafa]">{order.customerWilaya}</p>
    <p className="text-sm text-[#737373]">{order.customerCommune}</p>
  </LockedData>
</div>
```

CHANGE grid to 1 column:
```typescript
<div className="grid grid-cols-1 gap-4">
```

ADD state variables:
```typescript
const [showCustomerNote, setShowCustomerNote] = useState(false);
const [customerNoteText, setCustomerNoteText] = useState("");
```

VERIFY: Phone number is large and prominent, inline add note works.

---

## 6.2 Product Section with thumbnails and editing

FIND the Product section:
```typescript
<div className="p-4 bg-[#fafafa] dark:bg-[#171717]">
  <div className="flex items-center gap-2 text-[#737373] mb-3">
    <Package className="w-4 h-4" />
    <span className="text-sm">Products</span>
  </div>
  <div className="space-y-3">
    {(order.products || []).map((item, idx: number) => (
      <div key={idx} className="flex items-center justify-between">
        <div>
          <p className="font-normal text-[#171717] dark:text-[#fafafa]">{item.name}</p>
          {item.variant && (
            <p className="text-sm text-[#737373]">{item.variant} x {item.quantity}</p>
          )}
        </div>
        <p className="font-normal text-[#171717] dark:text-[#fafafa]">
          {formatPrice(item.price * item.quantity)}
        </p>
      </div>
    ))}
  </div>
```

CHANGE TO:
```typescript
<div className="p-4 bg-[#fafafa] dark:bg-[#171717]">
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2 text-[#737373]">
      <Package className="w-4 h-4" />
      <span className="text-sm">Products</span>
    </div>
    <button className="text-sm text-[#2563eb] hover:underline flex items-center gap-1">
      <Plus className="w-3 h-3" /> Add product
    </button>
  </div>
  <div className="space-y-2">
    {(order.products || []).map((item, idx: number) => (
      <div 
        key={idx} 
        className="flex items-center gap-3 p-2 hover:bg-[#f5f5f5] dark:hover:bg-[#262626] rounded-lg group transition-colors"
      >
        {/* Thumbnail placeholder */}
        <div className="w-12 h-12 bg-[#e5e5e5] dark:bg-[#404040] rounded-lg flex items-center justify-center flex-shrink-0">
          {item.image ? (
            <Image src={item.image} alt={item.name} width={48} height={48} className="rounded-lg object-cover" />
          ) : (
            <Package className="w-5 h-5 text-[#737373]" />
          )}
        </div>
        
        {/* Product info */}
        <div className="flex-1 min-w-0">
          <p className="font-normal text-[#171717] dark:text-[#fafafa] truncate">{item.name}</p>
          {item.variant && (
            <p className="text-sm text-[#737373]">{item.variant}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <button 
              className="text-xs text-[#737373] hover:text-[#171717] dark:hover:text-[#fafafa]"
              onClick={() => {/* TODO: Edit quantity */}
            >
              Qty: {item.quantity}
            </button>
          </div>
        </div>
        
        {/* Price */}
        <p className="font-normal text-[#171717] dark:text-[#fafafa]">
          {formatPrice(item.price * item.quantity)}
        </p>
        
        {/* 3-dots menu */}
        <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-[#e5e5e5] dark:hover:bg-[#404040] rounded transition-all">
          <MoreHorizontal className="w-4 h-4 text-[#737373]" />
        </button>
      </div>
    ))}
  </div>
```

ADD imports:
```typescript
import Image from "next/image";
import { 
  Phone,
  User,
  MapPin,
  Package,
  Truck,
  Clock,
  CheckCircle,
  MessageSquare,
  FileText,
  Plus,
  MoreHorizontal,
} from "lucide-react";
```

VERIFY: Products show with thumbnails, quantity, and hover menu.

---

## Phase N: Verify

RUN these commands:
```bash
bun run typecheck
bun run dev
```

---

## Checklist

- [ ] Phone number is large and prominent
- [ ] Inline add note works in customer section
- [ ] Products show with thumbnails and hover menu
- [ ] Product editing mutations work (backend)

---

## Do NOT Do

- Do NOT add new features beyond what is specified
- Do NOT change API response shapes
- Do NOT refactor unrelated code
