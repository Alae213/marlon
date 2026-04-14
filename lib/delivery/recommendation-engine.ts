import { DeliveryProviderKey } from "@/lib/delivery/contracts";

export type RecommendationMode = "recommendation_only";

export interface ProviderPerformanceSnapshot {
  provider: DeliveryProviderKey;
  attempts: number;
  delivered: number;
  failed: number;
  rts: number;
}

export interface RecommendationInput {
  mode: RecommendationMode;
  region?: string;
  providers: ProviderPerformanceSnapshot[];
}

export interface RecommendationScore {
  provider: DeliveryProviderKey;
  score: number;
  successRate: number;
  failureRate: number;
  rtsRate: number;
  reason: string;
}

export interface RecommendationResult {
  mode: RecommendationMode;
  recommendedProvider: DeliveryProviderKey | null;
  scores: RecommendationScore[];
}

function rate(portion: number, total: number) {
  if (total <= 0) {
    return 0;
  }
  return portion / total;
}

export function scoreProvider(snapshot: ProviderPerformanceSnapshot): RecommendationScore {
  const attempts = Math.max(0, snapshot.attempts);
  const successRate = rate(snapshot.delivered, attempts);
  const failureRate = rate(snapshot.failed, attempts);
  const rtsRate = rate(snapshot.rts, attempts);

  const score = successRate * 100 - failureRate * 30 - rtsRate * 20;

  return {
    provider: snapshot.provider,
    score,
    successRate,
    failureRate,
    rtsRate,
    reason: `Higher success and lower failure/RTS yields higher score (${score.toFixed(2)}).`,
  };
}

export function recommendProvider(input: RecommendationInput): RecommendationResult {
  const scores = input.providers
    .map((provider) => scoreProvider(provider))
    .sort((left, right) => right.score - left.score);

  return {
    mode: input.mode,
    recommendedProvider: scores.length > 0 ? scores[0].provider : null,
    scores,
  };
}
