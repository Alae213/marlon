import {
  getAllowedOrderStatusTransitions,
  normalizeOrderStatus,
  type OrderStatus,
  type OrderTransitionActor,
} from "./order-lifecycle";

export const CALL_OUTCOMES = [
  "answered",
  "no_answer",
  "wrong_number",
  "refused",
] as const;

export type CallOutcome = (typeof CALL_OUTCOMES)[number];

export const CALL_OUTCOME_LABELS: Record<CallOutcome, { label: string; icon: string }> = {
  answered: { label: "Answered", icon: "OK" },
  no_answer: { label: "No Answer", icon: "X" },
  wrong_number: { label: "Wrong Number", icon: "!" },
  refused: { label: "Refused", icon: "X" },
};

export const NO_ANSWER_UNREACHABLE_THRESHOLD = 4;

export const ORDER_RISK_FLAGS = [
  "duplicate_phone",
  "repeated_cancelled_or_refused",
  "high_frequency_submissions",
] as const;

export type OrderRiskFlag = (typeof ORDER_RISK_FLAGS)[number];

export const ORDER_RISK_FLAG_LABELS: Record<OrderRiskFlag, string> = {
  duplicate_phone: "Duplicate phone",
  repeated_cancelled_or_refused: "Repeated cancelled/refused history",
  high_frequency_submissions: "High-frequency submissions",
};

const CALL_OUTCOME_SET = new Set<string>(CALL_OUTCOMES);
const ORDER_RISK_FLAG_SET = new Set<string>(ORDER_RISK_FLAGS);

type CallEvidence = {
  outcome?: string;
};

type OrderConfirmationEvidence = {
  status?: string;
  lastCallOutcome?: string;
  callLog?: CallEvidence[];
};

export function isCallOutcome(outcome: unknown): outcome is CallOutcome {
  return typeof outcome === "string" && CALL_OUTCOME_SET.has(outcome);
}

export function normalizeOrderRiskFlags(flags: unknown): OrderRiskFlag[] {
  if (!Array.isArray(flags)) {
    return [];
  }

  return flags.filter((flag): flag is OrderRiskFlag => {
    return typeof flag === "string" && ORDER_RISK_FLAG_SET.has(flag);
  });
}

export function hasAnsweredCallEvidence(
  order: OrderConfirmationEvidence | null | undefined
): boolean {
  if (!order) {
    return false;
  }

  if (order.lastCallOutcome === "answered") {
    return true;
  }

  return Boolean(order.callLog?.some((call) => call.outcome === "answered"));
}

export function getMerchantTransitionsForOrder(
  status: unknown,
  order: OrderConfirmationEvidence | null | undefined,
  actor: OrderTransitionActor = "merchant"
): OrderStatus[] {
  const transitions = getAllowedOrderStatusTransitions(status, actor);
  const canonicalStatus = normalizeOrderStatus(status);
  
  // Always allow "confirmed" transition for "awaiting_confirmation" and "new" (Needs Call) status
  if ((canonicalStatus === "awaiting_confirmation" || canonicalStatus === "new") && transitions.includes("confirmed")) {
    return transitions;
  }
  
  if (!transitions.includes("confirmed")) {
    return transitions;
  }

  if (hasAnsweredCallEvidence(order)) {
    return transitions;
  }

  return transitions.filter((transition) => transition !== "confirmed");
}

export function getNoAnswerAttemptCount(callLog: CallEvidence[]): number {
  return callLog.filter((call) => call.outcome === "no_answer").length;
}

export function shouldPromptUnreachableAfterNoAnswer(
  order: OrderConfirmationEvidence | null | undefined
): boolean {
  const currentStatus = normalizeOrderStatus(order?.status);
  if (currentStatus !== "new" && currentStatus !== "awaiting_confirmation") {
    return false;
  }

  return getNoAnswerAttemptCount(order?.callLog ?? []) >= NO_ANSWER_UNREACHABLE_THRESHOLD;
}

export function getCallOutcomeLifecycleTransition(
  order: OrderConfirmationEvidence,
  outcome: CallOutcome
): OrderStatus | null {
  const currentStatus = normalizeOrderStatus(order.status);
  if (!currentStatus) {
    return null;
  }

  if (outcome === "answered" && currentStatus === "new") {
    return "awaiting_confirmation";
  }

  if (outcome === "refused" && (currentStatus === "new" || currentStatus === "awaiting_confirmation")) {
    return "refused";
  }

  if (
    outcome === "wrong_number" &&
    (currentStatus === "new" ||
      currentStatus === "awaiting_confirmation" ||
      currentStatus === "confirmed")
  ) {
    return "blocked";
  }

  if (outcome === "no_answer") {
    if (currentStatus === "new") {
      return "awaiting_confirmation";
    }
  }

  return null;
}
