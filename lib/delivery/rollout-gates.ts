export interface ProviderRolloutGateConfig {
  minAttemptedOrders: number;
  minSuccessRate: number;
  maxFailureRate: number;
  maxRtsRate: number;
}

export interface ProviderRolloutMetrics {
  attempted: number;
  delivered: number;
  failed: number;
  rts: number;
}

export interface RolloutGateEvaluation {
  passed: boolean;
  failures: string[];
  successRate: number;
  failureRate: number;
  rtsRate: number;
}

export const DEFAULT_PROVIDER_ROLLOUT_GATES: ProviderRolloutGateConfig = {
  minAttemptedOrders: 50,
  minSuccessRate: 0.8,
  maxFailureRate: 0.15,
  maxRtsRate: 0.15,
};

function ratio(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }
  return value / total;
}

export function evaluateProviderRolloutGate(
  metrics: ProviderRolloutMetrics,
  config: ProviderRolloutGateConfig = DEFAULT_PROVIDER_ROLLOUT_GATES
): RolloutGateEvaluation {
  const attempted = Math.max(0, metrics.attempted);
  const delivered = Math.max(0, metrics.delivered);
  const failed = Math.max(0, metrics.failed);
  const rts = Math.max(0, metrics.rts);

  const successRate = ratio(delivered, attempted);
  const failureRate = ratio(failed, attempted);
  const rtsRate = ratio(rts, attempted);

  const failures: string[] = [];

  if (attempted < config.minAttemptedOrders) {
    failures.push(
      `Not enough attempts: ${attempted} < ${config.minAttemptedOrders}`
    );
  }

  if (successRate < config.minSuccessRate) {
    failures.push(
      `Success rate too low: ${successRate.toFixed(3)} < ${config.minSuccessRate.toFixed(3)}`
    );
  }

  if (failureRate > config.maxFailureRate) {
    failures.push(
      `Failure rate too high: ${failureRate.toFixed(3)} > ${config.maxFailureRate.toFixed(3)}`
    );
  }

  if (rtsRate > config.maxRtsRate) {
    failures.push(`RTS rate too high: ${rtsRate.toFixed(3)} > ${config.maxRtsRate.toFixed(3)}`);
  }

  return {
    passed: failures.length === 0,
    failures,
    successRate,
    failureRate,
    rtsRate,
  };
}
