import { describe, expect, it } from "bun:test";

import {
  normalizeDeliveryProvider as normalizeClientProvider,
  toDeliveryApiProvider,
} from "@/lib/delivery-provider";
import { normalizeDeliveryProvider as normalizeServerProvider } from "@/convex/deliveryProvider";

describe("delivery provider normalization", () => {
  it("normalizes zr-express and zr_express variants consistently", () => {
    expect(normalizeClientProvider("zr-express")).toBe("zr-express");
    expect(normalizeClientProvider("zr_express")).toBe("zr-express");
    expect(normalizeClientProvider(" ZR_EXPRESS ")).toBe("zr-express");

    expect(normalizeServerProvider("zr-express")).toBe("zr-express");
    expect(normalizeServerProvider("zr_express")).toBe("zr-express");
    expect(normalizeServerProvider(" ZR_EXPRESS ")).toBe("zr-express");
  });

  it("maps normalized provider to delivery API provider", () => {
    expect(toDeliveryApiProvider("zr-express")).toBe("zr_express");
    expect(toDeliveryApiProvider("zr_express")).toBe("zr_express");
    expect(toDeliveryApiProvider("yalidine")).toBe("yalidine");
    expect(toDeliveryApiProvider("invalid-provider")).toBeNull();
  });
});
