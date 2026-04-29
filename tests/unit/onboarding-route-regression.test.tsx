import React, { type ReactNode } from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it, mock } from "bun:test";
import { cleanup, render, waitFor } from "@testing-library/react";
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

const replaceMock = mock(() => undefined);

const authState = {
  isLoaded: true,
  isSignedIn: false,
  user: null as null | { id: string },
};

mock.module("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    push: mock(() => undefined),
  }),
}));

mock.module("next/image", () => ({
  __esModule: true,
  default: ({ alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt ?? ""} {...props} />
  ),
}));

mock.module("@clerk/nextjs", () => ({
  useUser: () => authState,
  SignedIn: ({ children }: { children: ReactNode }) => (authState.isSignedIn ? <>{children}</> : null),
  SignUp: () => <div>Create Account Form</div>,
}));

mock.module("convex/react", () => ({
  useMutation: () => mock(async () => undefined),
  useQuery: () => [],
}));

mock.module("@/convex/_generated/api", () => ({
  api: {
    stores: {
      createStore: "stores.createStore",
      getUserStores: "stores.getUserStores",
      isSlugAvailable: "stores.isSlugAvailable",
    },
  },
}));

mock.module("@/contexts/realtime-context", () => ({
  RealtimeProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

mock.module("@/components/pages/onboarding/onboarding-flow", () => ({
  OnboardingFlow: () => <div>Onboarding Questionnaire</div>,
}));

const { default: HomePage } = await import("@/app/page");
const { default: OboardingPage } = await import("@/app/oboarding/page");

describe("onboarding route regression coverage", () => {
  beforeAll(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
    replaceMock.mockClear();
    authState.isLoaded = true;
    authState.isSignedIn = false;
    authState.user = null;
  });

  afterAll(() => {
    Object.assign(globalThis, previousGlobals);
    dom.window.close();
  });

  it("redirects signed-out visitors from home to /oboarding", async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/oboarding");
    });
  });

  it("keeps signed-out onboarding on /oboarding instead of rendering it on home", () => {
    const homeView = render(<HomePage />);
    expect(homeView.queryByText("Onboarding Questionnaire")).toBeNull();

    cleanup();

    const onboardingView = render(<OboardingPage />);
    expect(onboardingView.getByText("Onboarding Questionnaire")).toBeTruthy();
  });

  it("redirects signed-in visitors away from /oboarding", async () => {
    authState.isSignedIn = true;
    authState.user = { id: "user_1" };

    render(<OboardingPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/");
    });
  });
});
