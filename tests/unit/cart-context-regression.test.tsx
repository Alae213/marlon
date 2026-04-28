import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import { cleanup, render, waitFor } from "@testing-library/react";
import { JSDOM } from "jsdom";
import { createElement, useEffect } from "react";

import { CartProvider, useCart, type CartItem } from "@/contexts/cart-context";

const h = createElement;

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});

const previousGlobals = {
  window: globalThis.window,
  document: globalThis.document,
  navigator: globalThis.navigator,
  HTMLElement: globalThis.HTMLElement,
  localStorage: globalThis.localStorage,
};

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
  HTMLElement: dom.window.HTMLElement,
  localStorage: dom.window.localStorage,
});

const itemA: CartItem = {
  id: "cart-item-a",
  productId: "product_a",
  name: "Product A",
  price: 1000,
  quantity: 1,
};

const itemB: CartItem = {
  id: "cart-item-b",
  productId: "product_b",
  name: "Product B",
  price: 2000,
  quantity: 1,
};

function CartProbe({ onItems }: { onItems: (items: CartItem[]) => void }) {
  const { items } = useCart();

  useEffect(() => {
    onItems(items);
  }, [items, onItems]);

  return h("div", { "data-testid": "count" }, String(items.length));
}

beforeAll(() => {
  dom.window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  dom.window.localStorage.clear();
});

afterAll(() => {
  Object.assign(globalThis, previousGlobals);
});

describe("CartProvider storage scoping", () => {
  it("loads the cart from the active store storage key only", async () => {
    dom.window.localStorage.setItem("cart:alaa", JSON.stringify([itemA]));
    dom.window.localStorage.setItem("cart:other-store", JSON.stringify([itemB]));
    const observed: CartItem[][] = [];

    render(
      h(
        CartProvider,
        { storageKey: "cart:alaa" },
        h(CartProbe, { onItems: (items) => observed.push(items) })
      )
    );

    await waitFor(() => {
      expect(observed.at(-1)?.map((item) => item.productId)).toEqual(["product_a"]);
    });
  });
});
