import React, { useState } from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});

const previousGlobals = {
  window: globalThis.window,
  document: globalThis.document,
  navigator: globalThis.navigator,
  HTMLElement: globalThis.HTMLElement,
  HTMLInputElement: globalThis.HTMLInputElement,
  HTMLTextAreaElement: globalThis.HTMLTextAreaElement,
  Event: globalThis.Event,
  getComputedStyle: globalThis.getComputedStyle,
};

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
  HTMLElement: dom.window.HTMLElement,
  HTMLInputElement: dom.window.HTMLInputElement,
  HTMLTextAreaElement: dom.window.HTMLTextAreaElement,
  Event: dom.window.Event,
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
});

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

const { Input } = await import("@/components/primitives/core/inputs/input");
const { Textarea } = await import("@/components/primitives/core/inputs/textarea");

function ControlledInputHarness() {
  const [value, setValue] = useState("Initial value");

  return (
    <Input
      label="Email"
      type="email"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      supportingText="We only use this for receipts."
      showClearButton
    />
  );
}

describe("ios field primitives", () => {
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

  it("applies semantic trait defaults for email fields and renders labels/supporting text", () => {
    const view = render(
      <Input
        label="Email"
        type="email"
        value="merchant@example.com"
        onChange={() => undefined}
        supportingText="Used for account updates."
      />,
    );

    const input = view.getByLabelText("Email") as HTMLInputElement;

    expect(input.getAttribute("autocomplete")).toBe("email");
    expect(input.getAttribute("inputmode")).toBe("email");
    expect(input.getAttribute("autocapitalize")).toBe("none");
    const spellcheckAttribute = input.getAttribute("spellcheck");
    if (spellcheckAttribute !== null) {
      expect(spellcheckAttribute).toBe("false");
    } else {
      expect((input as any).spellcheck).toBe(false);
    }
    expect(view.getByText("Used for account updates.")).toBeTruthy();
  });

  it("shows a clear affordance for controlled editable fields and clears the value", () => {
    const view = render(<ControlledInputHarness />);

    expect(view.getByDisplayValue("Initial value")).toBeTruthy();

    fireEvent.click(view.getByRole("button", { name: "Clear email" }));

    expect(view.queryByDisplayValue("Initial value")).toBeNull();
    expect((view.getByLabelText("Email") as HTMLInputElement).value).toBe("");
  });

  it("renders dark multiline fields with stable error messaging", () => {
    const view = render(
      <Textarea
        label="Store description"
        variant="dark"
        error="Description is required."
        value=""
        onChange={() => undefined}
      />,
    );

    const textarea = view.getByLabelText("Store description");
    const surface = textarea.closest("[data-variant='dark']");

    expect(textarea.getAttribute("aria-invalid")).toBe("true");
    expect(surface?.getAttribute("data-invalid")).toBe("true");
    expect(view.getByText("Description is required.")).toBeTruthy();
  });
});
