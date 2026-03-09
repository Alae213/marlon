# Task 002: ListView - Sorting & Filtering

## LLM Agent Directives

You are implementing sorting and filtering improvements to the Order ListView. Replace the sort icon with a dropdown and add a filter dropdown with status counts.

**Goals:**
1. Add sort dropdown with 4 options
2. Add filter dropdown with counts per status

**Rules:**
- DO NOT add new features beyond what is specified
- DO NOT refactor unrelated code
- RUN `bun run typecheck` after each change
- VERIFY no imports break after changes

---

## 1.1 Replace sort icon with dropdown

**File:** `components/order-page/ListView.tsx`

FIND:
```typescript
// Sort
<button
  onClick={() => onSort(sortField)}
  className="p-2 text-[var(--system-300)] hover:text-[var(--system-600)] hover:bg-[var(--system-100)] rounded-lg transition-colors"
  title="Sort"
>
  <ArrowUpDown className="w-4 h-4" />
</button>
```

CHANGE TO:
```typescript
// Sort Dropdown
<div className="relative" ref={sortDropdownRef}>
  <button
    onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
    className={`p-2 rounded-lg transition-colors ${
      sortField !== "date" || sortDirection !== "desc"
        ? "bg-[var(--system-200)] text-[var(--system-600)]"
        : "text-[var(--system-300)] hover:text-[var(--system-600)] hover:bg-[var(--system-100)]"
    }`}
    title="Sort"
  >
    <ArrowUpDown className="w-4 h-4" />
  </button>
  
  {sortDropdownOpen && (
    <div className="absolute top-full mt-1 right-0 z-[9999] min-w-[180px] bg-white dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#404040] shadow-lg rounded-lg overflow-hidden py-1">
      <div className="px-3 py-2 text-xs text-[var(--system-400)] uppercase tracking-wide">Sort By</div>
      {[
        { id: "date", direction: "desc", label: "Newest first" },
        { id: "date", direction: "asc", label: "Oldest first" },
        { id: "total", direction: "desc", label: "Highest value first" },
        { id: "total", direction: "asc", label: "Lowest value first" },
      ].map((option) => (
        <button
          key={`${option.id}-${option.direction}`}
          onClick={() => {
            onSort(option.id as SortField);
            if (option.direction === "asc") {
              setSortDirection("asc");
            } else {
              setSortDirection("desc");
            }
            setSortDropdownOpen(false);
          }}
          className={`w-full px-3 py-2 text-start body-base flex items-center justify-between hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-colors ${
            sortField === option.id && 
            ((option.id === "date" && sortDirection === (option.direction as SortDirection)) ||
             (option.id === "total" && sortDirection === (option.direction as SortDirection)))
              ? "bg-[#f5f5f5] dark:bg-[#262626]" : ""
          }`}
        >
          <span className="text-[var(--system-600)]">{option.label}</span>
          {sortField === option.id && sortDirection === option.direction && <Check className="w-3.5 h-3.5" />}
        </button>
      ))}
    </div>
  )}
</div>
```

ADD state and ref after searchButtonRef:
```typescript
const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
const sortDropdownRef = useRef<HTMLDivElement>(null);
```

ADD click outside handler in existing useEffect block:
```typescript
// Handle click outside sort dropdown
useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
      setSortDropdownOpen(false);
    }
  }
  
  if (sortDropdownOpen) {
    document.addEventListener('mousedown', handleClickOutside);
  }
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [sortDropdownOpen]);
```

VERIFY: Sorting dropdown opens and shows all 4 options.

---

## 1.2 Add Filter dropdown

ADD filter icon import:
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
} from "lucide-react";
```

FIND the sort button and add filter button before it:
```typescript
// Filter Dropdown
<div className="relative" ref={filterDropdownRef}>
  <button
    onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
    className={`p-2 rounded-lg transition-colors ${
      activeFilter !== "all"
        ? "bg-[var(--system-200)] text-[var(--system-600)]"
        : "text-[var(--system-300)] hover:text-[var(--system-600)] hover:bg-[var(--system-100)]"
    }`}
    title="Filter"
  >
    <Filter className="w-4 h-4" />
  </button>
  
  {filterDropdownOpen && (
    <div className="absolute top-full mt-1 right-0 z-[9999] min-w-[180px] bg-white dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#404040] shadow-lg rounded-lg overflow-hidden py-1">
      <div className="px-3 py-2 text-xs text-[var(--system-400)] uppercase tracking-wide">Filter By State</div>
      <button
        onClick={() => {
          setActiveFilter("all");
          setFilterDropdownOpen(false);
        }}
        className={`w-full px-3 py-2 text-start body-base flex items-center justify-between hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-colors ${
          activeFilter === "all" ? "bg-[#f5f5f5] dark:bg-[#262626]" : ""
        }`}
      >
        <span className="text-[var(--system-600)]">All</span>
        <span className="text-xs text-[var(--system-400)]">{orders.length}</span>
        {activeFilter === "all" && <Check className="w-3.5 h-3.5" />}
      </button>
      {statuses.map((status) => {
        const count = orders.filter(o => o.status === status).length;
        return (
          <button
            key={status}
            onClick={() => {
              setActiveFilter(status);
              setFilterDropdownOpen(false);
            }}
            className={`w-full px-3 py-2 text-start body-base flex items-center justify-between hover:bg-[#f5f5f5] dark:hover:bg-[#262626] transition-colors ${
              activeFilter === status ? "bg-[#f5f5f5] dark:bg-[#262626]" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${statusColors[status].dot}`} />
              <span className="text-[var(--system-600)]">{STATUS_LABELS[status]?.label || status}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--system-400)]">{count}</span>
              {activeFilter === status && <Check className="w-3.5 h-3.5" />}
            </div>
          </button>
        );
      })}
    </div>
  )}
</div>
```

ADD state and ref:
```typescript
const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
const [activeFilter, setActiveFilter] = useState<string>("all");
const filterDropdownRef = useRef<HTMLDivElement>(null);
```

ADD click outside handler:
```typescript
// Handle click outside filter dropdown
useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
      setFilterDropdownOpen(false);
    }
  }
  
  if (filterDropdownOpen) {
    document.addEventListener('mousedown', handleClickOutside);
  }
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [filterDropdownOpen]);
```

MODIFY filteredOrders to include filter:
```typescript
const filteredOrders = useMemo(() => {
  let filtered = [...orders];
  
  if (searchQuery) {
    filtered = filtered.filter(order =>
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery)
    );
  }
  
  if (activeFilter !== "all") {
    filtered = filtered.filter(order => order.status === activeFilter);
  }
  
  filtered.sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "date":
        comparison = a.createdAt - b.createdAt;
        break;
      case "total":
        comparison = a.total - b.total;
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  return filtered;
}, [orders, searchQuery, sortField, sortDirection, activeFilter, currentTime]);
```

VERIFY: Filter dropdown shows all states with counts.

---

## Phase N: Verify

RUN these commands:
```bash
bun run typecheck
bun run dev
```

---

## Checklist

- [ ] Sort dropdown with 4 options works
- [ ] Filter dropdown shows all states with counts
- [ ] Active sort/filter visually indicated

---

## Do NOT Do

- Do NOT add new features beyond what is specified
- Do NOT change API response shapes
- Do NOT refactor unrelated code
