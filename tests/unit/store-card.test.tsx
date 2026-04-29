import { afterAll, afterEach, beforeAll, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { JSDOM } from "jsdom";
import type { ReactNode } from "react";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});

const previousGlobals = {
  window: globalThis.window,
  document: globalThis.document,
  navigator: globalThis.navigator,
  HTMLElement: globalThis.HTMLElement,
  HTMLAnchorElement: globalThis.HTMLAnchorElement,
  KeyboardEvent: globalThis.KeyboardEvent,
  MouseEvent: globalThis.MouseEvent,
  getComputedStyle: globalThis.getComputedStyle,
};

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
  HTMLElement: dom.window.HTMLElement,
  HTMLAnchorElement: dom.window.HTMLAnchorElement,
  KeyboardEvent: dom.window.KeyboardEvent,
  MouseEvent: dom.window.MouseEvent,
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
});

const pushMock = mock(() => undefined);

mock.module("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

mock.module("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const { StoreCard } = await import("@/components/features/shared/StoreCard");

describe("StoreCard", () => {
  beforeAll(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    pushMock.mockClear();
  });

  afterAll(() => {
    Object.assign(globalThis, previousGlobals);
    dom.window.close();
  });

  it("renders store identity and routes the card to the editor", () => {
    const view = render(
      <StoreCard name="My shop" slug="my-shop" subscription="trial" now={1000} />
    );

    expect(view.getByText("My shop")).toBeTruthy();
    expect(view.getByText("marlon.app/my-shop")).toBeTruthy();
    expect(view.getByRole("link", { name: "Open My shop editor" })).toBeTruthy();
    expect(
      view.getByRole("link", { name: "Open My shop public storefront" }).getAttribute("href")
    ).toBe("/my-shop");

    fireEvent.click(view.getByRole("link", { name: "Open My shop editor" }));

    expect(pushMock).toHaveBeenCalledWith("/editor/my-shop");
  });

  it("shows Paid only for active stores with an unexpired paid period", () => {
    const paidView = render(
      <StoreCard
        name="Paid shop"
        slug="paid-shop"
        subscription="active"
        paidUntil={2000}
        now={1000}
      />
    );

    expect(paidView.getByText("Paid")).toBeTruthy();

    cleanup();

    const expiredView = render(
      <StoreCard
        name="Expired shop"
        slug="expired-shop"
        subscription="active"
        paidUntil={999}
        now={1000}
      />
    );

    expect(expiredView.getByText("Free")).toBeTruthy();
  });

  it("shows Free for trial, locked, and missing paid states", () => {
    const view = render(
      <div>
        <StoreCard name="Trial shop" slug="trial-shop" subscription="trial" now={1000} />
        <StoreCard name="Locked shop" slug="locked-shop" subscription="locked" now={1000} />
        <StoreCard name="Unknown shop" slug="unknown-shop" now={1000} />
      </div>
    );

    expect(view.getAllByText("Free")).toHaveLength(3);
  });

  it("keeps the public storefront link from triggering editor navigation", () => {
    const view = render(
      <StoreCard name="My shop" slug="my-shop" subscription="trial" now={1000} />
    );

    fireEvent.click(view.getByRole("link", { name: "Open My shop public storefront" }));

    expect(pushMock).not.toHaveBeenCalled();
  });
});
