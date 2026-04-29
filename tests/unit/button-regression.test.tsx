import React from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { JSDOM } from "jsdom";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});

const previousGlobals = {
  window: globalThis.window,
  document: globalThis.document,
  navigator: globalThis.navigator,
  HTMLElement: globalThis.HTMLElement,
  HTMLButtonElement: globalThis.HTMLButtonElement,
  HTMLAnchorElement: globalThis.HTMLAnchorElement,
  SVGElement: globalThis.SVGElement,
  getComputedStyle: globalThis.getComputedStyle,
};

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
  HTMLElement: dom.window.HTMLElement,
  HTMLButtonElement: dom.window.HTMLButtonElement,
  HTMLAnchorElement: dom.window.HTMLAnchorElement,
  SVGElement: dom.window.SVGElement,
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
});

describe("shared Button regression coverage", () => {
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

  it("renders the Figma CTA xl size on the primary variant", () => {
    const view = render(<Button size="xl">Continue</Button>);
    const button = view.getByRole("button", { name: "Continue" });

    expect(button.className).toContain("bg-[#00ACFF]");
    expect(button.className).toContain("shadow-onboarding-cta");
    expect(button.className).toContain("onboarding-button-text");
    expect(button.className).toContain("h-12");
  });

  it("keeps loading buttons disabled while preserving hidden content for layout", () => {
    const view = render(
      <Button loading leadingIcon={ArrowRight}>
        Saving
      </Button>
    );
    const button = view.getByRole("button");

    expect(button.hasAttribute("disabled")).toBe(true);
    expect(button.querySelector(".opacity-0")).toBeTruthy();
    expect(button.querySelector("svg")).toBeTruthy();
  });

  it("keeps icon-only sizing separate from text buttons", () => {
    const view = render(
      <Button size="icon" aria-label="Next">
        <ArrowRight />
      </Button>
    );
    const button = view.getByRole("button", { name: "Next" });

    expect(button.className).toContain("h-10");
    expect(button.className).toContain("w-10");
    expect(button.className).toContain("rounded-full");
  });

  it("still composes with asChild links", () => {
    const view = render(
      <Button asChild>
        <Link href="/editor/demo">Open editor</Link>
      </Button>
    );
    const link = view.getByRole("link", { name: "Open editor" });

    expect(link.getAttribute("href")).toBe("/editor/demo");
    expect(link.className).toContain("bg-[#00ACFF]");
  });
});
