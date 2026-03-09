# Task 003: ListView - Bulk Actions, Search, Archive, Tooltips

## LLM Agent Directives

You are implementing additional ListView improvements: bulk selection toolbar, search highlighting, archive shortcuts, and tooltips.

**Goals:**
1. Add bulk selection toolbar with delete
2. Add search text highlighting
3. Add archive shortcuts with counts
4. Add tooltips to toolbar icons

**Rules:**
- DO NOT add new features beyond what is specified
- DO NOT refactor unrelated code
- RUN `bun run typecheck` after each change
- VERIFY no imports break after changes

---

## 2.1 Add Bulk Action Toolbar

**File:** `components/order-page/ListView.tsx`

FIND the toolbar div:
```typescript
{/* Toolbar */}
<div className="flex items-center justify-between gap-1">
  {/* View Toggle */}
```

CHANGE TO:
```typescript
{/* Bulk Action Toolbar */}
{selectedOrders.size > 0 && (
  <div className="absolute top-0 left-0 right-0 z-50 bg-[var(--system-600)] text-white px-4 py-3 flex items-center justify-between rounded-t-xl">
    <div className="flex items-center gap-4">
      <span className="body-base font-medium">{selectedOrders.size} selected</span>
      <div className="flex items-center gap-2">
        {statuses.map((status) => {
          const count = orders.filter(o => selectedOrders.has(o._id) && o.status === status).length;
          if (count === 0) return null;
          return (
            <span key={status} className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded">
              <span className={`w-2 h-2 rounded-full ${statusColors[status].dot}`} />
              {count}
            </span>
          );
        })}
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Button
        variant="danger"
        size="sm"
        onClick={() => setShowDeleteConfirm(true)}
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </Button>
      <button
        onClick={() => {
          setSelectedOrders(new Set());
          setSelectAll(false);
        }}
        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  </div>
)}

{/* Toolbar */}
<div className={`flex items-center justify-between gap-1 ${selectedOrders.size > 0 ? 'pt-12' : ''}`}>
```

ADD import for Trash2:
```typescript
import { 
  Search, 
  ChevronDown, 
  ChevronUp,
  ArrowUpDown,
  Settings,
  Archive,
  X,
  Check,
  Filter,
  Trash2,
  AlertTriangle,
} from "lucide-react";
```

ADD state for delete confirmation:
```typescript
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
```

### 2.2 Add Delete Confirmation Modal

ADD Delete Confirmation Modal using the Dialog components from `@/components/animate-ui`:

FIND where to add the modal (at the end of the component, before closing div):
```typescript
{showDeleteConfirm && (
  <Dialog open={showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(false)}>
    <DialogPortal>
      <DialogOverlay className="fixed inset-0 z-[60] bg-black/30" />
      <div className="fixed inset-0 flex items-center justify-center z-[70]">
        <DialogContent
          style={{ boxShadow: "var(--shadow-xl-shadow)" } as any}
          className="w-[360px] bg-[--system-100] [corner-shape:squircle] rounded-[48px] overflow-hidden bg-[image:var(--gradient-popup)] p-[20px] flex flex-col gap-[12px] items-start backdrop-blur-[12px]"
          from="top"
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <DialogHeader>
            <DialogTitle>Delete Orders</DialogTitle>
          </DialogHeader>
          <p className="text-[var(--system-500)] body-base">
            Are you sure you want to delete {selectedOrders.size} order(s)? This action cannot be undone.
          </p>
          <div className="flex gap-2 w-full mt-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                await handleBulkDelete(Array.from(selectedOrders));
                setShowDeleteConfirm(false);
              }}
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </div>
    </DialogPortal>
  </Dialog>
)}
```

ADD imports for Dialog:
```typescript
import { Dialog, DialogPortal, DialogOverlay, DialogContent, DialogHeader, DialogTitle } from "@/components/animate-ui";
```

### 2.3 Create Convex mutation for bulk delete

**File:** `convex/orders.ts`

ADD mutation:
```typescript
// Hard delete order (permanent)
export const deleteOrder = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.orderId);
  },
});
```

### 2.4 Add handleBulkDelete function

In `ListView.tsx` or the parent component, ADD:
```typescript
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const deleteOrder = useMutation(api.orders.deleteOrder);

const handleBulkDelete = async (orderIds: string[]) => {
  try {
    for (const orderId of orderIds) {
      await deleteOrder({ orderId: orderId as Id<"orders"> });
    }
    setSelectedOrders(new Set());
    setSelectAll(false);
  } catch (error) {
    console.error("Failed to delete orders:", error);
  }
};
```

VERIFY: Bulk toolbar appears, shows counts, delete works (hard delete).

---

## 3.1 Add search highlighting

ADD helper function after getRelativeTime:
```typescript
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  
  if (index === -1) return text;
  
  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
        {text.slice(index, index + query.length)}
      </mark>
      {text.slice(index + query.length)}
    </>
  );
}
```

MODIFY the Customer cell to use highlightMatch:
```typescript
{/* Customer */}
<div className="col-span-3 px-3 py-3 flex items-center">
  <div>
    <LockedData fallback="***">
      <p className="body-base text-[var(--system-600)]">
        {highlightMatch(order.customerName, searchQuery)}
      </p>
      <p className="body-base text-[var(--system-300)]">
        {highlightMatch(order.customerPhone, searchQuery)}
      </p>
    </LockedData>
  </div>
</div>
```

VERIFY: Search query text is highlighted in results.

---

## 4.1 Add Archive buttons with counts

FIND the Archive button:
```typescript
{/* Archive */}
<button
  className="p-2 text-[var(--system-300)] hover:text-[var(--system-600)] hover:bg-[var(--system-100)] rounded-lg transition-colors"
  title="Archive"
>
  <Archive className="w-4 h-4" />
</button>
```

CHANGE TO:
```typescript
{/* Archive - Blocked Orders */}
<button
  className="p-2 text-[var(--system-300)] hover:text-[var(--system-600)] hover:bg-[var(--system-100)] rounded-lg transition-colors relative"
  title="Blocked Orders (Blacklist)"
  onClick={() => {
    setActiveFilter("blocked");
    setFilterDropdownOpen(false);
  }}
>
  <Archive className="w-4 h-4" />
  {orders.filter(o => o.status === "blocked").length > 0 && (
    <span className="absolute -top-1 -end-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
      {orders.filter(o => o.status === "blocked").length}
    </span>
  )}
</button>

{/* Archive - Router Orders */}
<button
  className="p-2 text-[var(--system-300)] hover:text-[var(--system-600)] hover:bg-[var(--system-100)] rounded-lg transition-colors relative"
  title="Router Orders"
  onClick={() => {
    setActiveFilter("router");
    setFilterDropdownOpen(false);
  }}
>
  <Routes className="w-4 h-4" />
  {orders.filter(o => o.status === "router").length > 0 && (
    <span className="absolute -top-1 -end-1 bg-yellow-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
      {orders.filter(o => o.status === "router").length}
    </span>
  )}
</button>
```

ADD import for Routes:
```typescript
import { 
  Search, 
  ChevronDown, 
  ChevronUp,
  ArrowUpDown,
  Settings,
  Archive,
  X,
  Check,
  Filter,
  Trash2,
  AlertTriangle,
  Routes,
} from "lucide-react";
```

VERIFY: Archive buttons show counts for blocked and router orders.

---

## 5.1 Add tooltips to all toolbar icons

Wrap toolbar icons with Tooltip component from `@/components/animate-ui/components/animate/tooltip`:

ADD imports:
```typescript
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/animate-ui/components/animate/tooltip";
```

WRAP each icon button with tooltip:
```typescript
<Tooltip>
  <TooltipTrigger asChild>
    <button className="p-2...">
      <Search className="w-4 h-4" />
    </button>
  </TooltipTrigger>
  <TooltipContent>Search orders</TooltipContent>
</Tooltip>
```

Apply to: Search, Filter, Sort, Settings, Archive (Blocked), Archive (Router) buttons.

WRAP the entire ListView content with TooltipProvider (add at the top of the component return):
```typescript
return (
  <TooltipProvider>
    <div className="w-full h-full flex flex-col gap-3">
      ...
    </div>
  </TooltipProvider>
);
```

VERIFY: All toolbar icons have hover tooltips.

---

## Phase N: Verify

RUN these commands:
```bash
bun run typecheck
bun run dev
```

---

## Checklist

### Bulk Selection
- [ ] Bulk toolbar appears when orders selected
- [ ] Shows count and breakdown by state
- [ ] Delete button with confirmation works
- [ ] Hard delete mutation works

### Search
- [ ] Search highlights matching text

### Archive Shortcuts
- [ ] Blocked orders button shows count
- [ ] Router orders button shows count

### Tooltips
- [ ] All toolbar icons have tooltips

---

## Do NOT Do

- Do NOT add new features beyond what is specified
- Do NOT change API response shapes
- Do NOT refactor unrelated code
