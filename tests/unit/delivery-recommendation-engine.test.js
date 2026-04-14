import { describe, expect, it } from "bun:test";

import { recommendProvider } from "@/lib/delivery/recommendation-engine";

describe("delivery recommendation engine", () => {
  it("recommends provider with better delivery success profile", () => {
    const result = recommendProvider({
      mode: "recommendation_only",
      providers: [
        { provider: "zr_express", attempts: 100, delivered: 90, failed: 5, rts: 5 },
        { provider: "yalidine", attempts: 100, delivered: 70, failed: 20, rts: 10 },
      ],
    });

    expect(result.recommendedProvider).toBe("zr_express");
    expect(result.scores).toHaveLength(2);
    expect(result.scores[0].score).toBeGreaterThan(result.scores[1].score);
  });
});
