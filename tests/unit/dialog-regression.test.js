import { afterAll, afterEach, beforeAll, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { JSDOM } from "jsdom";
import {
  cloneElement,
  createContext,
  createElement,
  forwardRef,
  isValidElement,
  useContext,
  useState,
} from "react";
import { createPortal } from "react-dom";

const h = createElement;

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
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
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  requestAnimationFrame: (callback) => setTimeout(() => callback(Date.now()), 16),
  cancelAnimationFrame: (handle) => clearTimeout(handle),
});

if (!dom.window.HTMLElement.prototype.scrollIntoView) {
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
}

mock.module("framer-motion", () => {
  const motion = new Proxy(
    {},
    {
      get: (_, tagName) =>
        forwardRef(({ children, ...props }, ref) => {
          const {
            animate: _animate,
            exit: _exit,
            forceMount: _forceMount,
            initial: _initial,
            transition: _transition,
            ...domProps
          } = props;

          return h(tagName, { ...domProps, ref }, children);
        }),
    }
  );

  return {
    AnimatePresence: ({ children }) => children,
    motion,
    useIsPresent: () => true,
  };
});

mock.module("@radix-ui/react-dialog", () => {
  const DialogContext = createContext({
    open: false,
    onOpenChange: () => {},
  });

  function withAsChild(children, props, ref, fallbackTag) {
    const { asChild: _asChild, ...elementProps } = props;

    if (isValidElement(children)) {
      const childProps = children.props ?? {};
      const mergedOnClick = (event) => {
        elementProps.onClick?.(event);
        childProps.onClick?.(event);
      };

      return cloneElement(children, {
        ...elementProps,
        ...childProps,
        onClick: mergedOnClick,
        ref,
      });
    }

    return h(fallbackTag, { ...elementProps, ref }, children);
  }

  function Root({ open = false, onOpenChange, children }) {
    return h(
      DialogContext.Provider,
      { value: { open, onOpenChange: onOpenChange ?? (() => {}) } },
      children
    );
  }

  const Trigger = forwardRef(({ children, ...props }, ref) => {
    const { onOpenChange } = useContext(DialogContext);
    return withAsChild(children, { ...props, onClick: () => onOpenChange(true) }, ref, "button");
  });

  const Close = forwardRef(({ children, ...props }, ref) => {
    const { onOpenChange } = useContext(DialogContext);
    return withAsChild(children, { ...props, onClick: () => onOpenChange(false) }, ref, "button");
  });

  function Portal({ children }) {
    return createPortal(children, document.body);
  }

  const Overlay = forwardRef(({ children, ...props }, ref) =>
    withAsChild(children, props, ref, "div")
  );

  const Content = forwardRef(({ children, ...props }, ref) =>
    withAsChild(children, { role: "dialog", "aria-modal": "true", ...props }, ref, "div")
  );

  const Title = forwardRef((props, ref) => h("h2", { ...props, ref }));
  const Description = forwardRef((props, ref) => h("p", { ...props, ref }));

  return {
    Root,
    Trigger,
    Close,
    Portal,
    Overlay,
    Content,
    Title,
    Description,
  };
});

const {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} = await import("@/components/ui/dialog");

function DialogHarness() {
  const [open, setOpen] = useState(false);

  return h(
    "div",
    null,
    h("button", { type: "button" }, "Page action"),
    h(
      Dialog,
      { open, onOpenChange: setOpen },
      h(
        DialogTrigger,
        { asChild: true },
        h("button", { type: "button" }, "Open shared dialog")
      ),
      h(
        DialogContent,
        {
          className: "dialog-content-regression",
          overlayClassName: "dialog-overlay-regression",
        },
        h(DialogTitle, null, "Shared dialog"),
        h(DialogDescription, null, "Regression coverage for stale overlays.")
      )
    )
  );
}

async function closeDialogAndWaitForUnmount(queryByRole, getByText) {
  fireEvent.click(getByText(/close/i));

  await waitFor(
    () => {
      expect(queryByRole("dialog")).toBeNull();
      expect(document.querySelector(".dialog-overlay-regression")).toBeNull();
      expect(document.querySelector(".dialog-content-regression")).toBeNull();
    },
    { timeout: 1500 }
  );
}

describe("shared dialog regression", () => {
  beforeAll(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  afterAll(() => {
    Object.assign(globalThis, previousGlobals);
    dom.window.close();
  });

  it("removes overlay and content after close and does not accumulate stale layers", async () => {
    const view = render(h(DialogHarness));

    fireEvent.click(view.getByRole("button", { name: /open shared dialog/i }));

    await view.findByRole("dialog");
    expect(document.querySelectorAll(".dialog-overlay-regression").length).toBe(1);
    expect(document.querySelectorAll(".dialog-content-regression").length).toBe(1);

    await closeDialogAndWaitForUnmount(view.queryByRole, view.getByText);

    fireEvent.click(view.getByRole("button", { name: /open shared dialog/i }));

    await view.findByRole("dialog");
    expect(document.querySelectorAll(".dialog-overlay-regression").length).toBe(1);
    expect(document.querySelectorAll(".dialog-content-regression").length).toBe(1);

    await closeDialogAndWaitForUnmount(view.queryByRole, view.getByText);
  });
});
