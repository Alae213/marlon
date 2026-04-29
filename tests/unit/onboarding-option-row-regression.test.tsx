import React from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { JSDOM } from "jsdom";
import { OnboardingOptionRow } from "@/components/pages/onboarding/onboarding-option-row";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});

const previousGlobals = {
  window: globalThis.window,
  document: globalThis.document,
  navigator: globalThis.navigator,
  HTMLElement: globalThis.HTMLElement,
  HTMLButtonElement: globalThis.HTMLButtonElement,
  SVGElement: globalThis.SVGElement,
  Event: globalThis.Event,
  MouseEvent: globalThis.MouseEvent,
  getComputedStyle: globalThis.getComputedStyle,
};

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
  HTMLElement: dom.window.HTMLElement,
  HTMLButtonElement: dom.window.HTMLButtonElement,
  SVGElement: dom.window.SVGElement,
  Event: dom.window.Event,
  MouseEvent: dom.window.MouseEvent,
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
});

describe("onboarding option row", () => {
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

  it("renders a text-only option and exposes selection with aria-pressed", () => {
    const onSelect = mock(() => undefined);
    const view = render(
      <OnboardingOptionRow
        label="A friend told me"
        value="friend"
        isSelected
        onSelect={onSelect}
      />
    );

    const option = view.getByRole("button", { name: /A friend told me/i });
    expect(option.getAttribute("aria-pressed")).toBe("true");
    expect(option.querySelector("svg")).toBeNull();
    expect(option.getAttribute("title")).toBe("A friend told me");

    fireEvent.click(option);

    expect(onSelect).toHaveBeenCalledWith("friend");
  });

  it("keeps long option labels on one line with truncation and tooltip support", () => {
    const view = render(
      <OnboardingOptionRow
        label="Tracking who paid / delivered / cancelled"
        value="status_tracking"
        isSelected={false}
        onSelect={() => undefined}
      />
    );

    const label = view.getByText("Tracking who paid / delivered / cancelled");
    expect(label.className).toContain("truncate");
    expect(label.className).not.toContain("break-words");
    expect(label.className).not.toContain("whitespace-normal");
    expect(view.getByRole("button", { name: /Tracking who paid/i }).getAttribute("title")).toBe(
      "Tracking who paid / delivered / cancelled"
    );
  });
});
