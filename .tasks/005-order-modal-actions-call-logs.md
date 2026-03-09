# Task 005: Order Modal - Actions & Call Logs

## LLM Agent Directives

You are implementing the Fixed Actions section for the Order Modal. This includes call logs with visual slots and state-specific action buttons.

**Goals:**
1. Add Call Logs section with 4 colored slots
2. Add state-specific action buttons

**Rules:**
- DO NOT add new features beyond what is specified
- DO NOT refactor unrelated code
- RUN `bun run typecheck` after each change
- VERIFY no imports break after changes
- Follow the visual styling guidelines in AGENTS.md for modal components

---

## 6.3 Fixed Actions Section

FIND the Actions section:
```typescript
<div className="space-y-3">
  <h3 className="font-normal text-[#171717] dark:text-[#fafafa]">Actions</h3>
```

CHANGE TO:
```typescript
<div className="space-y-4">
  {/* Call Logs - Always Visible */}
  <div className="p-4 bg-[#fafafa] dark:bg-[#171717]">
    <h3 className="font-normal text-[#171717] dark:text-[#fafafa] mb-3 flex items-center gap-2">
      <Phone className="w-4 h-4" />
      Call Logs
    </h3>
    
    {/* 4 slots for call attempts */}
    <div className="grid grid-cols-4 gap-2 mb-3">
      {(order.callLog?.slice(-4) || []).map((call, index) => {
        const bgColor = call?.outcome === "answered" ? "bg-green-500" : 
                       call?.outcome === "no_answer" ? "bg-yellow-500" : 
                       call?.outcome === "refused" ? "bg-red-500" : 
                       call?.outcome === "wrong_number" ? "bg-gray-500" :
                       "bg-[#e5e5e5] dark:bg-[#404040]";
        return (
          <div 
            key={index}
            className={`h-2 rounded-full ${bgColor} transition-colors`}
            title={call ? `${CALL_OUTCOME_LABELS[call.outcome]?.label || ""} - ${formatDate(call.timestamp)}` : `Attempt ${index + 1}`}
          />
        );
      })}
    </div>
    
    {/* Scrollable list on hover */}
    {order.callLog && order.callLog.length > 0 && (
      <div className="max-h-24 overflow-y-auto mb-3 space-y-1">
        {order.callLog.slice().reverse().map((call, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${
              call.outcome === "answered" ? "bg-green-500" : 
              call.outcome === "no_answer" ? "bg-yellow-500" : 
              call.outcome === "refused" ? "bg-red-500" : "bg-gray-500"
            }`} />
            <span className="text-[#737373]">{CALL_OUTCOME_LABELS[call.outcome]?.label}</span>
            <span className="text-[#a3a3a3] ml-auto">{formatDate(call.timestamp)}</span>
          </div>
        ))}
      </div>
    )}
    
    {/* Call action buttons */}
    <div className="flex gap-2">
      {(["answered", "no_answer", "refused"] as const).map((outcome) => (
        <Button
          key={outcome}
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => {
            setCallOutcome(outcome);
            handleAddCallLog(order._id, outcome, undefined);
          }}
        >
          {CALL_OUTCOME_LABELS[outcome]?.label}
        </Button>
      ))}
    </div>
  </div>

  {/* State-based Actions */}
  <div className="p-4 bg-[#fafafa] dark:bg-[#171717]">
    <h3 className="font-normal text-[#171717] dark:text-[#fafafa] mb-3">Actions</h3>
    
    {order.status === "new" && (
      <div className="grid grid-cols-2 gap-2">
        <Button
          className="h-16 text-lg"
          onClick={() => onStatusChange(order._id, "confirmed")}
        >
          Confirm
        </Button>
        <Button
          variant="danger"
          className="h-16 text-lg"
          onClick={() => onStatusChange(order._id, "canceled")}
        >
          Cancel
        </Button>
      </div>
    )}
    
    {order.status === "confirmed" && (
      <Button
        className="w-full h-16 text-lg"
        onClick={() => onStatusChange(order._id, "packaged")}
      >
        Send to delivery company
      </Button>
    )}
    
    {order.status === "packaged" && (
      <Button
        className="w-full h-16 text-lg"
        onClick={() => onStatusChange(order._id, "shipped")}
      >
        Print label
      </Button>
    )}
    
    {order.status === "shipped" && (
      <div className="grid grid-cols-2 gap-2">
        <Button
          className="h-16 text-lg"
          onClick={() => onStatusChange(order._id, "succeeded")}
        >
          Succeed
        </Button>
        <Button
          variant="outline"
          className="h-16 text-lg"
          onClick={() => onStatusChange(order._id, "router")}
        >
          Router
        </Button>
      </div>
    )}
    
    {order.status === "succeeded" && (
      <p className="text-center text-[#737373] py-4">Order completed - no actions available</p>
    )}
    
    {order.status === "router" && (
      <div className="space-y-2">
        <Button
          className="w-full"
          onClick={() => onStatusChange(order._id, "confirmed")}
        >
          Return to Confirmed
        </Button>
        <Button
          variant="danger"
          className="w-full"
          onClick={() => onStatusChange(order._id, "canceled")}
        >
          Cancel
        </Button>
      </div>
    )}
    
    {order.status === "canceled" && (
      <Button
        className="w-full"
        onClick={() => onStatusChange(order._id, "new")}
      >
        Reopen Order
      </Button>
    )}
    
    {order.status === "blocked" && (
      <Button
        className="w-full"
        onClick={() => onStatusChange(order._id, "new")}
      >
        Unblock / Reopen
      </Button>
    )}
  </div>
```

DELETE the old "Change Status" section if it exists.

VERIFY: Call logs show 4 slots + scrollable list on hover, state-specific actions work.

---

## Phase N: Verify

RUN these commands:
```bash
bun run typecheck
bun run dev
```

---

## Checklist

- [ ] Call logs show 4 slots + scrollable on hover
- [ ] State-specific action buttons work:
  - New: Confirm + Cancel
  - Confirmed: Send to delivery
  - Packaged: Print label → transitions to Shipped
  - Shipped: Succeed + Router
  - Router: Return to Confirmed / Cancel
  - Canceled: Reopen
  - Blocked: Unblock/Reopen

---

## Do NOT Do

- Do NOT add new features beyond what is specified
- Do NOT change API response shapes
- Do NOT refactor unrelated code
