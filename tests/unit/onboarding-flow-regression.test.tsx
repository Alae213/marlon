import React from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { JSDOM } from "jsdom";

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
  localStorage: globalThis.localStorage,
  getComputedStyle: globalThis.getComputedStyle,
  fetch: globalThis.fetch,
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
  localStorage: dom.window.localStorage,
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
});

const trackMock = mock(() => undefined);
const navigateToPreSignupExitMock = mock(() => undefined);
let fetchMock = mock(async () => Response.json({ success: true }));

mock.module("@vercel/analytics/react", () => ({
  track: trackMock,
}));

mock.module("@/components/pages/onboarding/onboarding-navigation", () => ({
  navigateToPreSignupExit: navigateToPreSignupExitMock,
}));

mock.module("@clerk/nextjs", () => ({
  useUser: () => ({ isLoaded: true, isSignedIn: false, user: null }),
  SignedIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignUp: () => <div>Create Account Form</div>,
}));

mock.module("next/image", () => ({
  __esModule: true,
  default: ({ alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

const { OnboardingFlow } = await import("@/components/pages/onboarding/onboarding-flow");
const { PRE_SIGNUP_STORAGE_KEY } = await import("@/components/pages/onboarding/onboarding-data");

function readStoredState() {
  const stored = dom.window.localStorage.getItem(PRE_SIGNUP_STORAGE_KEY);
  if (!stored) throw new Error("Expected onboarding state in localStorage");
  return JSON.parse(stored);
}

function seedStoredState(state: Record<string, unknown>) {
  dom.window.localStorage.setItem(PRE_SIGNUP_STORAGE_KEY, JSON.stringify(state));
}

describe("onboarding flow regression coverage", () => {
  beforeAll(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    dom.window.localStorage.clear();
    trackMock.mockClear();
    navigateToPreSignupExitMock.mockClear();
    fetchMock = mock(async () => Response.json({ success: true }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterAll(() => {
    Object.assign(globalThis, previousGlobals);
    dom.window.close();
  });

  it("starts disabled, advances after a single-select answer, and persists the answer", async () => {
    const view = render(<OnboardingFlow />);

    expect(view.queryByRole("button", { name: "Continue" })).toBeNull();

    fireEvent.click(view.getByRole("button", { name: /I already sell online/i }));
    const continueButton = view.getByRole("button", { name: "Continue" });
    expect(continueButton.hasAttribute("disabled")).toBe(false);

    fireEvent.click(continueButton);

    expect(await view.findByText("So, where did you hear about me? 👀")).toBeTruthy();

    await waitFor(() => {
      const stored = readStoredState();
      expect(stored.step).toBe(1);
      expect(stored.answers.sellingStage).toBe("already_online");
    });

    expect(trackMock).toHaveBeenCalledWith(
      "pre_signup_step_completed",
      expect.objectContaining({ question: "sellingStage", selectionCount: 1 })
    );
  });

  it("toggles multi-select answers without leaving stale selections", async () => {
    seedStoredState({
      sessionId: "session_1",
      step: 1,
      completed: false,
      answers: {
        sellingStage: "already_online",
        heardFrom: [],
        bottlenecks: [],
        expectedDailyOrders: null,
      },
      expiresAt: Date.now() + 60_000,
    });

    const view = render(<OnboardingFlow />);
    const friendOption = view.getByRole("button", { name: /A friend told me/i });

    fireEvent.click(friendOption);

    await waitFor(() => {
      expect(readStoredState().answers.heardFrom).toEqual(["friend"]);
    });

    fireEvent.click(friendOption);

    await waitFor(() => {
      expect(readStoredState().answers.heardFrom).toEqual([]);
    });
  });

  it("resets expired stored onboarding state", () => {
    seedStoredState({
      sessionId: "expired_session",
      step: 2,
      completed: false,
      answers: {
        sellingStage: "already_online",
        heardFrom: ["friend"],
        bottlenecks: [],
        expectedDailyOrders: null,
      },
      expiresAt: Date.now() - 1,
    });

    const view = render(<OnboardingFlow />);

    expect(view.getByText("Where are you with selling right now? 🛍️")).toBeTruthy();
    expect(dom.window.localStorage.getItem(PRE_SIGNUP_STORAGE_KEY)).not.toContain("expired_session");
  });

  it("restarts the questionnaire instead of reopening sign-up from completed storage", async () => {
    seedStoredState({
      sessionId: "completed_session",
      step: 3,
      completed: true,
      completedAt: Date.now() - 1000,
      sheetSyncedAt: Date.now() - 500,
      answers: {
        sellingStage: "already_online",
        heardFrom: ["friend"],
        bottlenecks: ["confirmation"],
        expectedDailyOrders: "6_20",
      },
      expiresAt: Date.now() + 60_000,
    });

    const view = render(<OnboardingFlow />);

    expect(view.getByText("Where are you with selling right now? 🛍️")).toBeTruthy();
    expect(view.queryByText("Create Account Form")).toBeNull();

    await waitFor(() => {
      const stored = readStoredState();
      expect(stored.completed).toBe(false);
      expect(stored.step).toBe(0);
      expect(stored.sessionId).not.toBe("completed_session");
    });
  });

  it("uses the dedicated first-step exit navigation", () => {
    const view = render(<OnboardingFlow />);

    fireEvent.click(view.getByRole("button", { name: "Go back" }));

    expect(navigateToPreSignupExitMock).toHaveBeenCalledTimes(1);
  });

  it("goes back inside the flow after the first step", async () => {
    seedStoredState({
      sessionId: "session_back",
      step: 1,
      completed: false,
      answers: {
        sellingStage: "already_online",
        heardFrom: [],
        bottlenecks: [],
        expectedDailyOrders: null,
      },
      expiresAt: Date.now() + 60_000,
    });

    const view = render(<OnboardingFlow />);

    fireEvent.click(view.getByRole("button", { name: "Go back" }));

    expect(await view.findByText("Where are you with selling right now? 🛍️")).toBeTruthy();
    expect(navigateToPreSignupExitMock).not.toHaveBeenCalled();
  });

  it("completes the flow, opens sign-up, and syncs answers once", async () => {
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const view = render(<OnboardingFlow />);

    fireEvent.click(view.getByRole("button", { name: /I already sell online/i }));
    fireEvent.click(view.getByRole("button", { name: "Continue" }));

    fireEvent.click(await view.findByRole("button", { name: /A friend told me/i }));
    fireEvent.click(view.getByRole("button", { name: "Continue" }));

    fireEvent.click(await view.findByRole("button", { name: /Confirming the order/i }));
    fireEvent.click(view.getByRole("button", { name: "Continue" }));

    fireEvent.click(await view.findByRole("button", { name: "6-20" }));
    fireEvent.click(view.getByRole("button", { name: "Continue" }));

    expect(await view.findByText("Create Account Form")).toBeTruthy();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/pre-signup/google-sheet");
    expect(init?.method).toBe("POST");

    const payload = JSON.parse(String(init?.body));
    expect(payload.sessionId).toBeTruthy();
    expect(typeof payload.completedAt).toBe("number");
    expect(payload.answers).toEqual({
      sellingStage: "already_online",
      heardFrom: ["friend"],
      bottlenecks: ["confirmation"],
      expectedDailyOrders: "6_20",
    });
  });
});
