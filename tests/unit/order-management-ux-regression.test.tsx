import React, { forwardRef } from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/orders/demo-store",
});

const previousGlobals = {
  window: globalThis.window,
  document: globalThis.document,
  navigator: globalThis.navigator,
  HTMLElement: globalThis.HTMLElement,
  Element: globalThis.Element,
  Node: globalThis.Node,
  Event: globalThis.Event,
  CustomEvent: globalThis.CustomEvent,
  MouseEvent: globalThis.MouseEvent,
  KeyboardEvent: globalThis.KeyboardEvent,
  PointerEvent: globalThis.PointerEvent,
  MutationObserver: globalThis.MutationObserver,
  DocumentFragment: globalThis.DocumentFragment,
  ShadowRoot: globalThis.ShadowRoot,
  NodeFilter: globalThis.NodeFilter,
  HTMLInputElement: globalThis.HTMLInputElement,
  HTMLButtonElement: globalThis.HTMLButtonElement,
  HTMLTextAreaElement: globalThis.HTMLTextAreaElement,
  HTMLAnchorElement: globalThis.HTMLAnchorElement,
  SVGElement: globalThis.SVGElement,
  localStorage: globalThis.localStorage,
  getComputedStyle: globalThis.getComputedStyle,
  requestAnimationFrame: globalThis.requestAnimationFrame,
  cancelAnimationFrame: globalThis.cancelAnimationFrame,
};

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
  Node: dom.window.Node,
  Event: dom.window.Event,
  CustomEvent: dom.window.CustomEvent,
  MouseEvent: dom.window.MouseEvent,
  KeyboardEvent: dom.window.KeyboardEvent,
  PointerEvent: dom.window.PointerEvent ?? dom.window.MouseEvent,
  MutationObserver: dom.window.MutationObserver,
  DocumentFragment: dom.window.DocumentFragment,
  ShadowRoot: dom.window.ShadowRoot,
  NodeFilter: dom.window.NodeFilter,
  HTMLInputElement: dom.window.HTMLInputElement,
  HTMLButtonElement: dom.window.HTMLButtonElement,
  HTMLTextAreaElement: dom.window.HTMLTextAreaElement,
  HTMLAnchorElement: dom.window.HTMLAnchorElement,
  SVGElement: dom.window.SVGElement,
  localStorage: dom.window.localStorage,
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  requestAnimationFrame: (callback: FrameRequestCallback) => setTimeout(() => callback(Date.now()), 16),
  cancelAnimationFrame: (handle: ReturnType<typeof setTimeout>) => clearTimeout(handle),
});

if (!dom.window.HTMLElement.prototype.scrollIntoView) {
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
}

const apiMock = {
  stores: {
    getStoreBySlug: "stores.getStoreBySlug",
  },
  orders: {
    getOrders: "orders.getOrders",
    updateOrderStatus: "orders.updateOrderStatus",
    addCallLog: "orders.addCallLog",
    upsertAdminNote: "orders.upsertAdminNote",
    bulkDeleteOrders: "orders.bulkDeleteOrders",
  },
};

const mockState = {
  params: { storeSlug: "demo-store" },
  store: { _id: "store_1", slug: "demo-store" },
  orders: [] as unknown,
  billing: {
    todayOrderCount: 2,
    maxDailyOrders: 5,
    ordersRemaining: 3,
    isLocked: false,
    isOverflow: false,
    compatibilityMode: "canonical",
    billingState: "active",
    daysRemaining: 30,
    openPaymentModal: mock(() => {}),
  },
};

const showToastMock = mock(() => {});
const mutationMock = mock(async () => undefined);

mock.module("next/navigation", () => ({
  useParams: () => mockState.params,
}));

mock.module("next/image", () => ({
  __esModule: true,
  default: ({ alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt ?? ""} {...props} />
  ),
}));

mock.module("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

mock.module("@clerk/nextjs", () => ({
  useUser: () => ({ user: { id: "user_1" }, isLoaded: true }),
  UserButton: () => <div>User Button</div>,
  SignedIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignedOut: () => null,
  RedirectToSignIn: () => null,
}));

mock.module("@/contexts/billing-context", () => ({
  useBilling: () => mockState.billing,
  BillingProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

mock.module("@/contexts/realtime-context", () => ({
  RealtimeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

mock.module("convex/react", () => ({
  useQuery: (token: string) => {
    if (token === apiMock.stores.getStoreBySlug) {
      return mockState.store;
    }

    if (token === apiMock.orders.getOrders) {
      return mockState.orders;
    }

    return undefined;
  },
  useMutation: () => mutationMock,
}));

mock.module("@/convex/_generated/api", () => ({
  api: apiMock,
}));

mock.module("@/components/primitives/core/layout/bottom-navigation", () => ({
  BottomNavigation: () => <div>Bottom Navigation</div>,
}));

mock.module("@/components/pages/orders/views", () => ({
  ListView: ({ onViewModeChange }: { onViewModeChange: (mode: "list" | "state") => void }) => (
    <div>
      <div>Mock list view</div>
      <button type="button" onClick={() => onViewModeChange("state")}>
        Try state view
      </button>
    </div>
  ),
  KanbanView: () => <div>Mock kanban view</div>,
  OrderDetails: () => null,
}));

mock.module("@/components/pages/layout/locked-overlay", () => ({
  LockedData: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

mock.module("@/components/ui/button", () => {
  const Button = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    ({ children, type = "button", ...props }, ref) => (
      <button ref={ref} type={type} {...props}>
        {children}
      </button>
    ),
  );

  Button.displayName = "MockButton";

  return { Button };
});

mock.module("@/components/primitives/core/feedback/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

mock.module("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

mock.module("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({
    children,
    sideOffset,
    align,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & {
    sideOffset?: number;
    align?: string;
  }) => {
    void sideOffset;
    void align;

    return <div {...props}>{children}</div>;
  },
  DropdownMenuItem: ({
    children,
    onSelect,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    onSelect?: (event: { preventDefault: () => void }) => void;
  }) => (
    <button type="button" onClick={() => onSelect?.({ preventDefault: () => undefined })} {...props}>
      {children}
    </button>
  ),
  DropdownMenuCheckboxItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuLabel: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  DropdownMenuRadioGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuRadioItem: ({
    children,
    onSelect,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    onSelect?: (event: { preventDefault: () => void }) => void;
  }) => (
    <button type="button" onClick={() => onSelect?.({ preventDefault: () => undefined })} {...props}>
      {children}
    </button>
  ),
  DropdownMenuSeparator: (props: React.HTMLAttributes<HTMLHRElement>) => <hr {...props} />,
}));

mock.module("@/components/ui/dialog", () => ({
  Dialog: ({
    open,
    children,
  }: {
    open?: boolean;
    children: React.ReactNode;
  }) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  DialogDescription: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p {...props}>{children}</p>
  ),
  DialogFooter: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  DialogHeader: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  DialogTitle: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h2 {...props}>{children}</h2>,
  DialogClose: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

mock.module("@/components/ui/table", () => ({
  Table: ({ children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => <table {...props}>{children}</table>,
  TableHeader: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => <thead {...props}>{children}</thead>,
  TableBody: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => <tbody {...props}>{children}</tbody>,
  TableRow: ({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => <tr {...props}>{children}</tr>,
  TableCell: ({ children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => <td {...props}>{children}</td>,
}));

mock.module("@/components/ui/sheet", () => ({
  Sheet: ({
    open,
    children,
  }: {
    open?: boolean;
    children: React.ReactNode;
  }) => (open ? <div data-testid="sheet-root">{children}</div> : null),
  SheetContent: ({
    children,
    showCloseButton,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & {
    showCloseButton?: boolean;
  }) => {
    void showCloseButton;

    return (
      <div role="dialog" {...props}>
        {children}
      </div>
    );
  },
  SheetTitle: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 {...props}>{children}</h2>
  ),
}));

mock.module("@/components/ui/hover-card", () => ({
  HoverCard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  HoverCardTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  HoverCardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

mock.module("@/components/ui/checkbox", () => ({
  Checkbox: ({
    checked,
    onChange,
    children,
    onClick,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    checked?: boolean;
    onChange?: (checked: boolean) => void;
  }) => (
    <button
      type="button"
      aria-label={props["aria-label"] ?? "checkbox"}
      data-checked={checked ? "true" : "false"}
      onClick={(event) => {
        onClick?.(event);
        onChange?.(!checked);
      }}
      {...props}
    >
      {children}
    </button>
  ),
  CheckboxIndicator: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
}));

mock.module("@/contexts/toast-context", () => ({
  useToast: () => ({ showToast: showToastMock }),
}));

mock.module("@/components/pages/orders/components/OrderViewToggle", () => ({
  OrderViewToggle: () => <div>Order View Toggle</div>,
}));

const { OrdersSurface } = await import("@/components/pages/orders/components/OrdersSurface");
const { OrderDetails } = await import("@/components/pages/orders/views/OrderDetails");
const { OrderMobileCard } = await import("@/components/pages/orders/components/OrderMobileCard");
const { ListView } = await import("@/components/pages/orders/views/ListView");

function createOrder(overrides: Record<string, unknown> = {}) {
  const now = Date.now();

  return {
    _id: "order_1",
    orderNumber: "1001",
    customerName: "Jane Doe",
    customerPhone: "0550123456",
    customerWilaya: "Alger",
    customerCommune: "Bab Ezzouar",
    customerAddress: "123 Market Street",
    products: [
      {
        productId: "prod_1",
        name: "Widget",
        price: 1500,
        quantity: 1,
        variant: "Red",
      },
    ],
    subtotal: 1500,
    deliveryCost: 500,
    total: 2000,
    deliveryType: "domicile",
    status: "dispatch_ready",
    paymentStatus: "pending",
    callAttempts: 0,
    callLog: [],
    timeline: [],
    notes: "",
    adminNoteText: "",
    adminNoteUpdatedAt: now - 60000,
    adminNoteUpdatedBy: "user_1",
    trackingNumber: "ZR123",
    deliveryProvider: "zr_express",
    createdAt: now - 3600000,
    updatedAt: now - 120000,
    ...overrides,
  };
}

function createListViewProps(overrides: Record<string, unknown> = {}) {
  return {
    orders: [],
    selectedOrders: new Set<string>(),
    selectAll: false,
    onSelectAll: () => undefined,
    onOrderSelect: () => undefined,
    onClearSelection: () => undefined,
    onStatusChange: () => undefined,
    onStatusDropdownToggle: () => undefined,
    statusDropdownOpen: {},
    searchQuery: "",
    onSearchQueryChange: () => undefined,
    isSearchOpen: false,
    onSearchOpenChange: () => undefined,
    sortField: "date" as const,
    sortDirection: "desc" as const,
    onSort: () => undefined,
    onSortDirectionChange: () => undefined,
    onOrderClick: () => undefined,
    storeSlug: "demo-store",
    ...overrides,
  };
}

describe("order management UX regressions", () => {
  beforeAll(() => {
    document.body.innerHTML = "";
    globalThis.fetch = mock(async () => ({
      ok: true,
      json: async () => ({ success: true }),
    })) as typeof fetch;
    Object.assign(globalThis.navigator, {
      clipboard: {
        writeText: mock(async () => undefined),
      },
    });
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    mockState.orders = [];
    mockState.store = { _id: "store_1", slug: "demo-store" };
    showToastMock.mockClear();
    mutationMock.mockClear();
  });

  afterAll(() => {
    Object.assign(globalThis, previousGlobals);
    dom.window.close();
  });

  it("shows a loading panel while the orders query is unresolved", () => {
    const view = render(
      <OrdersSurface
        isOrdersLoading
        viewMode="list"
        onViewModeChange={() => undefined}
        isStateViewEnabled={false}
        listViewProps={createListViewProps()}
      />,
    );

    expect(view.getByText("Loading orders...")).toBeTruthy();
    expect(view.getByText("Pulling the latest order activity for this store.")).toBeTruthy();
    expect(view.queryByText("No orders found")).toBeNull();
  });

  it("keeps the unfinished state view disabled even if the list tries to switch into it", () => {
    const view = render(
      <OrdersSurface
        isOrdersLoading={false}
        viewMode="state"
        onViewModeChange={() => undefined}
        isStateViewEnabled={false}
        listViewProps={createListViewProps()}
      />,
    );

    expect(view.getByText("Mock list view")).toBeTruthy();
    expect(view.queryByText("Mock kanban view")).toBeNull();
  });

  it("renders the dispatch-ready delivery action and an explicit close control in the order details sheet", () => {
    const view = render(
      <OrderDetails
        order={createOrder()}
        isOpen
        onClose={() => undefined}
        onStatusChange={() => undefined}
        onAddCallLog={async () => undefined}
        onUpsertAdminNote={async () => undefined}
        storeSlug="demo-store"
      />,
    );

    expect(view.getByRole("button", { name: /close order details/i })).toBeTruthy();
    expect(view.getByRole("button", { name: "Send to delivery company" })).toBeTruthy();
    expect(view.getByRole("button", { name: "Answered" })).toBeTruthy();
    expect(view.getByRole("button", { name: "No Answer" })).toBeTruthy();
    expect(view.getByRole("button", { name: "Wrong Number" })).toBeTruthy();
    expect(view.getByRole("button", { name: "Refused" })).toBeTruthy();
  });

  it("shows ordered lifecycle, call note, and admin note history in the order details sheet", () => {
    const now = Date.now();
    const view = render(
      <OrderDetails
        order={createOrder({
          status: "delivered",
          codPaymentStatus: "collected",
          timeline: [
            { status: "new", timestamp: now - 300000, note: "Public checkout order created" },
            { status: "confirmed", timestamp: now - 200000, note: "Customer confirmed" },
            { status: "delivered", timestamp: now - 100000, note: "Courier marked delivered" },
          ],
          callLog: [
            {
              id: "call_1",
              timestamp: now - 220000,
              outcome: "answered",
              notes: "Asked to deliver after 5pm",
            },
          ],
          adminNoteText: "VIP customer",
          adminNoteUpdatedAt: now - 90000,
        })}
        isOpen
        onClose={() => undefined}
        onStatusChange={() => undefined}
        onAddCallLog={async () => undefined}
        onUpsertAdminNote={async () => undefined}
        storeSlug="demo-store"
      />,
    );

    expect(view.getByText("Activity")).toBeTruthy();
    expect(view.getByText("Courier marked delivered")).toBeTruthy();
    expect(view.getByText("Asked to deliver after 5pm")).toBeTruthy();
    expect(view.getAllByText("VIP customer").length).toBeGreaterThan(1);
    expect(view.getByText("Collected")).toBeTruthy();
  });

  it("keeps mobile-card selection and status controls from opening the details sheet", () => {
    const handleOrderClick = mock(() => undefined);
    const handleOrderSelect = mock(() => undefined);

    const view = render(
      <OrderMobileCard
        order={createOrder({ status: "confirmed" })}
        isSelected={false}
        searchQuery=""
        onOrderClick={handleOrderClick}
        onOrderSelect={handleOrderSelect}
        statusControl={<button type="button">Open status</button>}
      />,
    );

    fireEvent.click(view.getByRole("button", { name: "checkbox" }));
    expect(handleOrderSelect).toHaveBeenCalledWith("order_1");
    expect(handleOrderClick).not.toHaveBeenCalled();

    fireEvent.click(view.getByRole("button", { name: "Open status" }));
    expect(handleOrderClick).not.toHaveBeenCalled();

    fireEvent.click(view.getByRole("button", { name: /jane doe/i }));
    expect(handleOrderClick).toHaveBeenCalledWith(expect.objectContaining({ _id: "order_1" }));
  });

  it("moves the call indicator into a dedicated desktop column while keeping the mobile indicator", () => {
    const handleOrderClick = mock(() => undefined);
    const order = createOrder({
      status: "confirmed",
      callLog: [
        {
          id: "call_1",
          timestamp: Date.now() - 60000,
          outcome: "answered",
        },
      ],
    });

    const view = render(
      <ListView
        {...createListViewProps({
          orders: [order],
          onOrderClick: handleOrderClick,
        })}
        viewMode="list"
        onViewModeChange={() => undefined}
        isStateViewEnabled={false}
      />,
    );

    const desktopContainer = view.container.querySelector('div.hidden.overflow-visible[class*="md:block"]');
    const mobileContainer = view.container.querySelector('div.grid.gap-3[class*="md:hidden"]');

    expect(desktopContainer).toBeTruthy();
    expect(mobileContainer).toBeTruthy();

    const desktop = within(desktopContainer as HTMLElement);
    const mobile = within(mobileContainer as HTMLElement);

    expect(desktop.getByText("Call")).toBeTruthy();
    expect(desktop.getAllByText("Call History")).toHaveLength(1);
    expect(mobile.getAllByText("Call History")).toHaveLength(1);

    fireEvent.click(desktop.getByRole("button", { name: /call history/i }));
    expect(handleOrderClick).toHaveBeenCalledWith(expect.objectContaining({ _id: "order_1" }));
  });

  it("limits the row status dropdown to server-allowed merchant actions and answered-call confirmation", () => {
    const order = createOrder({ status: "new" });
    const view = render(
      <ListView
        {...createListViewProps({
          orders: [order],
        })}
        viewMode="list"
        onViewModeChange={() => undefined}
        isStateViewEnabled={false}
      />,
    );

    const desktopContainer = view.container.querySelector('div.hidden.overflow-visible[class*="md:block"]');
    const statusCell = desktopContainer?.querySelector("tbody td:nth-child(4)");

    expect(statusCell).toBeTruthy();

    const statusDropdownMenu = within(statusCell as HTMLElement);
    expect(statusDropdownMenu.getByText("Awaiting Confirmation")).toBeTruthy();
    expect(statusDropdownMenu.queryByText("Confirmed")).toBeNull();
    expect(statusDropdownMenu.getByText("Cancelled")).toBeTruthy();
    expect(statusDropdownMenu.getByText("Blocked")).toBeTruthy();
    expect(statusDropdownMenu.queryByText("Delivered")).toBeNull();

    cleanup();

    const answeredOrder = createOrder({ status: "new", lastCallOutcome: "answered" });
    const answeredView = render(
      <ListView
        {...createListViewProps({
          orders: [answeredOrder],
        })}
        viewMode="list"
        onViewModeChange={() => undefined}
        isStateViewEnabled={false}
      />,
    );
    const answeredDesktop = answeredView.container.querySelector('div.hidden.overflow-visible[class*="md:block"]');
    const answeredStatusCell = answeredDesktop?.querySelector("tbody td:nth-child(4)");
    const answeredStatusDropdownMenu = within(answeredStatusCell as HTMLElement);

    expect(answeredStatusDropdownMenu.getByText("Confirmed")).toBeTruthy();
  });

  it("changes row status immediately without a confirmation modal or note prompt", () => {
    const handleStatusChange = mock(() => undefined);
    const order = createOrder({ status: "new" });
    const view = render(
      <ListView
        {...createListViewProps({
          orders: [order],
          onStatusChange: handleStatusChange,
          statusDropdownOpen: { order_1: true },
        })}
        viewMode="list"
        onViewModeChange={() => undefined}
        isStateViewEnabled={false}
      />,
    );

    const desktopContainer = view.container.querySelector('div.hidden.overflow-visible[class*="md:block"]');
    const statusCell = desktopContainer?.querySelector("tbody td:nth-child(4)");
    expect(statusCell).toBeTruthy();

    fireEvent.click(within(statusCell as HTMLElement).getByRole("button", { name: /Awaiting Confirmation/i }));

    expect(handleStatusChange).toHaveBeenCalledWith("order_1", "awaiting_confirmation");
    expect(view.queryByText("Confirm state change")).toBeNull();
    expect(view.queryByPlaceholderText("Audit note (optional)...")).toBeNull();
  });

  it("keeps courier-owned dispatch states out of the row status dropdown", () => {
    const confirmedOrder = createOrder({ status: "confirmed", lastCallOutcome: "answered" });
    const view = render(
      <ListView
        {...createListViewProps({
          orders: [confirmedOrder],
        })}
        viewMode="list"
        onViewModeChange={() => undefined}
        isStateViewEnabled={false}
      />,
    );

    const desktopContainer = view.container.querySelector('div.hidden.overflow-visible[class*="md:block"]');
    const statusCell = desktopContainer?.querySelector("tbody td:nth-child(4)");
    const statusDropdownMenu = within(statusCell as HTMLElement);

    expect(statusDropdownMenu.queryByText("Ready to Dispatch")).toBeNull();
    expect(statusDropdownMenu.queryByText("Dispatched")).toBeNull();
    expect(statusDropdownMenu.getByText("Cancelled")).toBeTruthy();
  });

  it("shows courier setup feedback and CTA in the drawer dispatch action", async () => {
    globalThis.fetch = mock(async () => ({
      ok: false,
      json: async () => ({
        success: false,
        code: "DELIVERY_CREDENTIALS_MISSING",
        error: "Delivery credentials are missing for this store.",
        action: {
          label: "Open Courier settings",
          href: "/editor/demo-store?settings=integration",
        },
      }),
    })) as typeof fetch;

    const view = render(
      <OrderDetails
        order={createOrder({ status: "confirmed", lastCallOutcome: "answered" })}
        isOpen
        onClose={() => undefined}
        onStatusChange={() => undefined}
        onAddCallLog={async () => undefined}
        onUpsertAdminNote={async () => undefined}
        storeSlug="demo-store"
      />,
    );

    fireEvent.click(view.getByRole("button", { name: "Send to delivery company" }));

    expect(await view.findByText("Delivery credentials are missing for this store.")).toBeTruthy();
    const link = view.getByRole("link", { name: "Open Courier settings" }) as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("/editor/demo-store?settings=integration");
  });
});
