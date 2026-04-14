import { describe, expect, it } from "bun:test";

import {
  DEFAULT_PROVIDER_ROLLOUT_GATES,
  evaluateProviderRolloutGate,
} from "@/lib/delivery/rollout-gates";

describe("delivery provider rollout gates", () => {
  it("passes when metrics satisfy default gates", () => {
    const result = evaluateProviderRolloutGate({
      attempted: 80,
      delivered: 70,
      failed: 6,
      rts: 4,
    });

    expect(result.passed).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it("fails with descriptive messages when thresholds are missed", () => {
    const result = evaluateProviderRolloutGate(
      {
        attempted: 20,
        delivered: 10,
        failed: 6,
        rts: 4,
      },
      DEFAULT_PROVIDER_ROLLOUT_GATES
    );

    expect(result.passed).toBe(false);
    expect(result.failures.length).toBeGreaterThan(0);
  });
});
