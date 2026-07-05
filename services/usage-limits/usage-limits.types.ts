export type UsageLimitScope =
  | "dev-mentor-test"
  | "llm-provider-test"
  | "mentor-core-response"
  | "mentor-response";

export type UsageLimitStatus =
  | "allowed"
  | "daily-limit-reached"
  | "monthly-limit-reached"
  | "tracking-only";

export interface UsageLimitConfig {
  dailyRequestLimit: number | null;
  enforceLimits: boolean;
  monthlyRequestLimit: number | null;
}

export interface UsageLimitCounterSnapshot {
  count: number;
  limit: number | null;
  period: string;
  remaining: number | null;
}

export interface CheckAndRecordUsageInput {
  scope: UsageLimitScope;
  subjectId: string;
}

export interface UsageLimitDecision {
  daily: UsageLimitCounterSnapshot;
  monthly: UsageLimitCounterSnapshot;
  scope: UsageLimitScope;
  status: UsageLimitStatus;
}
