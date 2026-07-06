export type UsageLimitScope =
  | "mentor-deep-model"
  | "mentor-message"
  | "dev-mentor-test"
  | "llm-provider-test"
  | "mentor-core-response"
  | "mentor-response";

export type UsageLimitStatus =
  | "allowed"
  | "daily-limit-reached"
  | "monthly-limit-reached"
  | "tracking-only"
  | "weekly-limit-reached";

export interface UsageLimitConfig {
  dailyMessageLimit: number | null;
  enforceLimits: boolean;
  monthlyMessageLimit: number | null;
  weeklyDeepLimit: number | null;
  weeklyMessageLimit: number | null;
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
  weekly: UsageLimitCounterSnapshot;
}
