import React, { forwardRef } from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/editor/demo-store",
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
  SVGElement: globalThis.SVGElement,
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
  SVGElement: dom.window.SVGElement,
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  requestAnimationFrame: (callback: FrameRequestCallback) => setTimeout(() => callback(Date.now()), 16),
  cancelAnimationFrame: (handle: ReturnType<typeof setTimeout>) => clearTimeout(handle),
});

if (!dom.window.HTMLElement.prototype.scrollIntoView) {
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
}

if (!dom.window.HTMLElement.prototype.attachEvent) {
  dom.window.HTMLElement.prototype.attachEvent = () => {};
}

if (!dom.window.HTMLElement.prototype.detachEvent) {
  dom.window.HTMLElement.prototype.detachEvent = () => {};
}

if (!dom.window.HTMLInputElement.prototype.attachEvent) {
  dom.window.HTMLInputElement.prototype.attachEvent = () => {};
}

if (!dom.window.HTMLInputElement.prototype.detachEvent) {
  dom.window.HTMLInputElement.prototype.detachEvent = () => {};
}

if (!dom.window.HTMLTextAreaElement.prototype.attachEvent) {
  dom.window.HTMLTextAreaElement.prototype.attachEvent = () => {};
}

if (!dom.window.HTMLTextAreaElement.prototype.detachEvent) {
  dom.window.HTMLTextAreaElement.prototype.detachEvent = () => {};
}

const apiMock = {
  products: {
    updateProduct: "products.updateProduct",
    archiveProduct: "products.archiveProduct",
    unarchiveProduct: "products.unarchiveProduct",
  },
  stores: {
    getStoreBySlug: "stores.getStoreBySlug",
  },
};

const updateProductMock = mock(async () => undefined);
const archiveProductMock = mock(async () => undefined);
const unarchiveProductMock = mock(async () => undefined);
const resolveImageStorageIdsMock = mock(async (images: string[]) => images);
const showToastMock = mock(() => undefined);

mock.module("convex/react", () => ({
  useMutation: (token: string) => {
    if (token === apiMock.products.updateProduct) {
      return updateProductMock;
    }

    if (token === apiMock.products.archiveProduct) {
      return archiveProductMock;
    }

    if (token === apiMock.products.unarchiveProduct) {
      return unarchiveProductMock;
    }

    return mock(async () => undefined);
  },
  useQuery: (token: string, args: unknown) => {
    void args;
    if (token === apiMock.stores.getStoreBySlug) {
      return { name: "Demo Store" };
    }
    return null;
  },
}));

mock.module("@/convex/_generated/api", () => ({
  api: apiMock,
}));

mock.module("@/contexts/toast-context", () => ({
  useToast: () => ({ showToast: showToastMock }),
}));

mock.module("@/components/pages/editor/hooks/use-image-upload", () => ({
  useImageUpload: () => ({ resolveImageStorageIds: resolveImageStorageIdsMock }),
}));

mock.module("next/image", () => ({
  __esModule: true,
  default: ({ alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt ?? ""} {...props} />
  ),
}));

mock.module("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, whileHover, whileTap, transition, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
      void whileHover;
      void whileTap;
      void transition;
      return <div {...props}>{children}</div>;
    },
    button: ({
      children,
      whileHover,
      whileTap,
      transition,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
      void whileHover;
      void whileTap;
      void transition;
      return (
        <button type="button" {...props}>
          {children}
        </button>
      );
    },
  },
}));

mock.module("@/components/ui/dialog", () => ({
  Dialog: ({
    open,
    children,
  }: {
    open?: boolean;
    children: React.ReactNode;
  }) => (open ? <div>{children}</div> : null),
  DialogContent: ({
    children,
    showCloseButton,
    overlayClassName,
    ...props
  }: React.HTMLAttributes<HTMLDivElement> & {
    showCloseButton?: boolean;
    overlayClassName?: string;
  }) => {
    void showCloseButton;
    void overlayClassName;

    return <div {...props}>{children}</div>;
  },
  DialogDescription: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p {...props}>{children}</p>
  ),
  DialogFooter: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  DialogHeader: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  DialogTitle: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h2 {...props}>{children}</h2>,
}));

mock.module("@/components/ui/button", () => {
  const Button = forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }
  >(({ children, type = "button", loading, disabled, ...props }, ref) => (
    <button ref={ref} type={type} disabled={disabled || loading} {...props}>
      {children}
    </button>
  ));

  Button.displayName = "MockButton";

  return { Button };
});

mock.module("@/components/primitives/core/inputs/input", () => {
  const Input = forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement> & { label?: React.ReactNode; error?: React.ReactNode }
  >(({ label, error, id, containerClassName, surfaceClassName, ...props }, ref) => {
    void containerClassName;
    void surfaceClassName;
    const inputId = id ?? `input-${String(label ?? "field").replace(/\s+/g, "-").toLowerCase()}`;

    return (
      <label htmlFor={inputId}>
        <span>{label}</span>
        <input ref={ref} id={inputId} {...props} />
        {error ? <span>{error}</span> : null}
      </label>
    );
  });

  Input.displayName = "MockInput";

  return { Input };
});

mock.module("@/components/primitives/core/inputs/textarea", () => {
  const Textarea = forwardRef<
    HTMLTextAreaElement,
    React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: React.ReactNode; error?: React.ReactNode }
  >(({ label, error, id, containerClassName, surfaceClassName, ...props }, ref) => {
    void containerClassName;
    void surfaceClassName;
    const textareaId =
      id ?? `textarea-${String(label ?? "field").replace(/\s+/g, "-").toLowerCase()}`;

    return (
      <label htmlFor={textareaId}>
        <span>{label}</span>
        <textarea ref={ref} id={textareaId} {...props} />
        {error ? <span>{error}</span> : null}
      </label>
    );
  });

  Textarea.displayName = "MockTextarea";

  return { Textarea };
});

mock.module("@/components/features/shared/inline-variant-editor", () => ({
  InlineVariantEditor: () => <div>Variant editor</div>,
}));

mock.module("@/components/pages/editor/components/editor-product-gallery", () => ({
  EditorProductGallery: () => <div>Gallery</div>,
}));

const { EditorProductDetailModal } = await import(
  "@/components/pages/editor/components/editor-product-detail-modal"
);
const { ProductCard } = await import("@/components/pages/editor/components/product-card");
const {
  QUICK_PRODUCT_DEFAULTS,
  getProductEditorPrimaryActionLabel,
  getProductEditorSaveMode,
  getProductEditorUnhideMode,
  isFreshQuickCreatedHiddenProduct,
  shouldResetProductEditorState,
} = await import("@/lib/product-editor");

function createProduct(overrides: Record<string, unknown> = {}) {
  return {
    _id: "product_1",
    _creationTime: 1,
    name: "Starter Product",
    description: "A product description",
    basePrice: 1800,
    oldPrice: undefined,
    images: [],
    variants: [],
    isArchived: false,
    sortOrder: 0,
    createdAt: 100,
    updatedAt: 200,
    ...overrides,
  };
}

describe("product editor regressions", () => {
  beforeAll(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    updateProductMock.mockClear();
    archiveProductMock.mockClear();
    unarchiveProductMock.mockClear();
    resolveImageStorageIdsMock.mockClear();
    showToastMock.mockClear();
  });

  afterAll(() => {
    Object.assign(globalThis, previousGlobals);
    dom.window.close();
  });

  it("detects untouched hidden quick-created products and stops matching after edits", () => {
    const freshHiddenProduct = createProduct({
      name: QUICK_PRODUCT_DEFAULTS.name,
      description: QUICK_PRODUCT_DEFAULTS.description,
      basePrice: QUICK_PRODUCT_DEFAULTS.basePrice,
      images: [...QUICK_PRODUCT_DEFAULTS.images],
      variants: undefined,
      isArchived: true,
      createdAt: 500,
      updatedAt: 500,
    });

    expect(isFreshQuickCreatedHiddenProduct(freshHiddenProduct)).toBe(true);
    expect(
      isFreshQuickCreatedHiddenProduct({
        ...freshHiddenProduct,
        basePrice: 2500,
      }),
    ).toBe(false);
  });

  it("hides the header visibility control for fresh hidden quick-created products", () => {
    const view = render(
      <EditorProductDetailModal
        open
        onClose={() => undefined}
        storeSlug="demo-store"
        product={createProduct({
          name: QUICK_PRODUCT_DEFAULTS.name,
          description: QUICK_PRODUCT_DEFAULTS.description,
          basePrice: QUICK_PRODUCT_DEFAULTS.basePrice,
          images: [...QUICK_PRODUCT_DEFAULTS.images],
          variants: undefined,
          isArchived: true,
          createdAt: 500,
          updatedAt: 500,
        })}
      />,
    );

    expect(view.queryByRole("button", { name: "Unhide" })).toBeNull();
    expect(view.queryByRole("button", { name: "Hide" })).toBeNull();
  });

  it("renders the resolved store name when available", () => {
    const view = render(
      <EditorProductDetailModal
        open
        onClose={() => undefined}
        storeSlug="demo-store"
        product={createProduct({
          name: "Example",
          basePrice: 1000,
          isArchived: true,
          createdAt: 500,
          updatedAt: 900,
        })}
      />,
    );

    expect(view.getByText("Demo Store")).toBeTruthy();
  });

  it("computes the primary save label and save mode from freshness, visibility, and validity", () => {
    expect(
      getProductEditorPrimaryActionLabel({
        isFreshHiddenQuickCreate: true,
        publishReady: true,
      }),
    ).toBe("Save & Publish");
    expect(
      getProductEditorPrimaryActionLabel({
        isFreshHiddenQuickCreate: true,
        publishReady: false,
      }),
    ).toBe("Save Hidden");
    expect(
      getProductEditorPrimaryActionLabel({
        isFreshHiddenQuickCreate: false,
        publishReady: true,
      }),
    ).toBe("Save Changes");

    expect(
      getProductEditorSaveMode({
        isFreshHiddenQuickCreate: true,
        isHidden: true,
        publishReady: true,
      }),
    ).toBe("publish_and_close");
    expect(
      getProductEditorSaveMode({
        isFreshHiddenQuickCreate: true,
        isHidden: true,
        publishReady: false,
      }),
    ).toBe("save_hidden_and_close");
    expect(
      getProductEditorSaveMode({
        isFreshHiddenQuickCreate: false,
        isHidden: true,
        publishReady: true,
      }),
    ).toBe("save_hidden_and_close");
    expect(
      getProductEditorSaveMode({
        isFreshHiddenQuickCreate: false,
        isHidden: false,
        publishReady: false,
      }),
    ).toBe("archive_and_close");
    expect(
      getProductEditorSaveMode({
        isFreshHiddenQuickCreate: false,
        isHidden: false,
        publishReady: true,
      }),
    ).toBe("save_visible_and_close");
  });

  it("computes unhide behavior and avoids resetting the open editor for the same product id", () => {
    expect(
      getProductEditorUnhideMode({
        isDirty: false,
        publishReady: false,
      }),
    ).toBe("blocked");
    expect(
      getProductEditorUnhideMode({
        isDirty: false,
        publishReady: true,
      }),
    ).toBe("unhide_only");
    expect(
      getProductEditorUnhideMode({
        isDirty: true,
        publishReady: true,
      }),
    ).toBe("save_and_unhide");

    expect(
      shouldResetProductEditorState({
        currentProductKey: null,
        nextProductId: "product_1",
        open: true,
      }),
    ).toBe(true);
    expect(
      shouldResetProductEditorState({
        currentProductKey: "product_1",
        nextProductId: "product_1",
        open: true,
      }),
    ).toBe(false);
    expect(
      shouldResetProductEditorState({
        currentProductKey: "product_1",
        nextProductId: "product_2",
        open: true,
      }),
    ).toBe(true);
    expect(
      shouldResetProductEditorState({
        currentProductKey: "product_1",
        nextProductId: "product_1",
        open: false,
      }),
    ).toBe(false);
  });

  it("shows card actions by visibility state and opens the editor from the card body", () => {
    const onOpen = mock(() => undefined);
    const hiddenCard = render(
      <ProductCard
        product={createProduct({ isArchived: true })}
        onOpen={onOpen}
        onToggleArchive={() => undefined}
        deletingProductId={null}
        onRequestDelete={() => undefined}
        onCancelDelete={() => undefined}
        onConfirmDelete={() => undefined}
      />,
    );

    expect(hiddenCard.getByText("Hidden")).toBeTruthy();
    expect(hiddenCard.getByRole("button", { name: /unhide starter product/i })).toBeTruthy();
    expect(hiddenCard.getByRole("button", { name: /delete starter product/i })).toBeTruthy();

    hiddenCard.unmount();

    const visibleCard = render(
      <ProductCard
        product={createProduct()}
        onOpen={onOpen}
        onToggleArchive={() => undefined}
        deletingProductId={null}
        onRequestDelete={() => undefined}
        onCancelDelete={() => undefined}
        onConfirmDelete={() => undefined}
      />,
    );

    expect(visibleCard.getByRole("button", { name: /hide starter product/i })).toBeTruthy();
    expect(visibleCard.getByRole("button", { name: /delete starter product/i })).toBeTruthy();

    const clickableCard = visibleCard.container.querySelector("div[role='button'][tabindex='0']");
    fireEvent.click(clickableCard as HTMLElement);
    expect(onOpen).toHaveBeenCalled();
  });
});
