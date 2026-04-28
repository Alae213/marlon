import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const proxySource = readFileSync(join(process.cwd(), "proxy.ts"), "utf8");

describe("proxy auth routing regression", () => {
  it("protects merchant pages and delivery API routes", () => {
    expect(proxySource).toContain('"/orders(.*)"');
    expect(proxySource).toContain('"/editor(.*)"');
    expect(proxySource).toContain('"/api/delivery(.*)"');
    expect(proxySource).toContain("protected API routes return structured JSON");
  });

  it("keeps public checkout APIs outside protected middleware matching", () => {
    expect(proxySource).toContain("api/orders/create");
    expect(proxySource).toContain("api/checkout-attempts");
    expect(proxySource).not.toContain('"/api/orders/create(.*)"');
    expect(proxySource).not.toContain('"/api/checkout-attempts(.*)"');
  });
});
