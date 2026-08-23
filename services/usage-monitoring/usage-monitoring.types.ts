import type { UsageEventStatus } from "@/lib/generated/prisma/client";
import type {
  LlmModelRoutingDecision,
  LlmProviderName,
} from "@/services/llm/llm.types";
import type { MentorResponsePipelineLlmUsage } from "@/services/mentor-core/response-pipeline/response-pipeline.types";
import type { MentorSpecialistContext } from "@/services/mentor-specialization/specialist-context.types";

export interface UsageEventContext {
  conversationId?: string;
  mentorId?: string;
  userId: string;
}

export interface PersistentUsageCounts {
  daily: number;
  deepWeekly: number;
  monthly: number;
  weekly: number;
}

export interface RecordSuccessfulUsageInput extends UsageEventContext {
  llmUsage: MentorResponsePipelineLlmUsage;
  specialistContext?: MentorSpecialistContext | null;
}

export interface RecordUnsuccessfulUsageInput extends UsageEventContext {
  errorCode: string;
  modelRouting: LlmModelRoutingDecision;
  status: Extract<UsageEventStatus, "BLOCKED" | "FAILURE">;
}

export interface UsageEventWriteInput extends UsageEventContext {
  cachedInputTokens?: number;
  errorCode?: string;
  estimatedCostUsd?: number;
  inputTokens?: number;
  model?: string;
  outputTokens?: number;
  provider?: LlmProviderName;
  route?: string;
  status: UsageEventStatus;
  specialistContext?: MentorSpecialistContext | null;
  totalTokens?: number;
}

export interface AdminUsageGroup {
  count: number;
  estimatedCostUsd: number;
  label: string;
}

export interface AdminUsageOverview {
  blockedCount: number;
  byMentor: AdminUsageGroup[];
  byModel: AdminUsageGroup[];
  byProvider: AdminUsageGroup[];
  periods: {
    last30Days: AdminUsagePeriod;
    last7Days: AdminUsagePeriod;
    today: AdminUsagePeriod;
  };
  tokenAverages: {
    last24Hours: AdminUsageTokenAverage;
    last7Days: AdminUsageTokenAverage;
  };
  recentEvents: Array<{
    createdAt: string;
    errorCode: string | null;
    estimatedCostUsd: number | null;
    mentor: string;
    model: string;
    provider: string;
    route: string;
    status: UsageEventStatus;
    totalTokens: number | null;
  }>;
}

export interface AdminUsagePeriod {
  estimatedCostUsd: number;
  messageCount: number;
}

export interface AdminUsageTokenAverage {
  inputTokens: number;
  outputTokens: number;
}
