export interface ProviderOnboardingChecklistItem {
  id: string;
  category:
    | "commercial"
    | "technical"
    | "contract"
    | "security"
    | "reliability"
    | "operations"
    | "analytics";
  label: string;
  required: boolean;
}

export const PROVIDER_ONBOARDING_CHECKLIST: ProviderOnboardingChecklistItem[] = [
  {
    id: "commercial-sla",
    category: "commercial",
    label: "Signed commercial terms and SLA contact matrix",
    required: true,
  },
  {
    id: "technical-endpoints",
    category: "technical",
    label: "API endpoints validated against docs and sandbox",
    required: true,
  },
  {
    id: "contract-status-map",
    category: "contract",
    label: "Status and error mapping contract finalized",
    required: true,
  },
  {
    id: "security-write-only",
    category: "security",
    label: "Write-only credential handling verified",
    required: true,
  },
  {
    id: "reliability-contract-tests",
    category: "reliability",
    label: "Provider contract test suite passing",
    required: true,
  },
  {
    id: "operations-rollout",
    category: "operations",
    label: "Pilot stores and rollback plan approved",
    required: true,
  },
  {
    id: "analytics-baseline",
    category: "analytics",
    label: "Baseline attempted/dispatched/delivered/failed/RTS metrics captured",
    required: true,
  },
];
