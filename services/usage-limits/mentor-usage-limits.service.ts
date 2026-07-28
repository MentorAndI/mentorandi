import { UsageEventStatus } from "@/lib/generated/prisma/client";
import { resolveLlmModelRouteForMessage } from "@/services/llm/llm-model-router";
import type {
  LlmModelRoutingDecision,
  LlmProviderName,
} from "@/services/llm/llm.types";
import type { MentorResponsePipelineLlmUsage } from "@/services/mentor-core/response-pipeline/response-pipeline.types";
import {
  getUsageLimitMessage,
  isUsageLimitReached,
  readUsageLimitConfig,
  UsageLimitService,
} from "@/services/usage-limits/usage-limits.service";
import type {
  UsageLimitCounterSnapshot,
  UsageLimitDecision,
  UsageLimitStatus,
} from "@/services/usage-limits/usage-limits.types";
import { estimateMentorUsageCost } from "@/services/usage-monitoring/usage-cost";
import { UsageMonitoringRepository } from "@/services/usage-monitoring/usage-monitoring.repository";
import type {
  PersistentUsageCounts,
  UsageEventContext,
} from "@/services/usage-monitoring/usage-monitoring.types";
import { EntitlementService } from "@/services/entitlements/entitlement.service";
import type { MentorSpecialistContext } from "@/services/mentor-specialization/specialist-context.types";

export interface MentorUsageLimitCheckInput extends UsageEventContext {
  authUserId: string;
  message: string;
  model?: string;
  provider?: LlmProviderName;
}

export interface MentorUsageLimitRecordInput extends UsageEventContext {
  authUserId: string;
  llmUsage: MentorResponsePipelineLlmUsage;
  specialistContext?: MentorSpecialistContext | null;
}

export interface MentorUsageFailureInput extends UsageEventContext {
  authUserId: string;
  errorCode: string;
  modelRouting: LlmModelRoutingDecision;
}

export interface MentorUsageLimitCheckResult {
  message: string | null;
  messageDecision: UsageLimitDecision;
  modelRouting: LlmModelRoutingDecision;
  status: UsageLimitStatus;
}

export class MentorUsageMonitoringError extends Error {
  readonly statusCode = 503;

  constructor() {
    super("Usage monitoring is temporarily unavailable. Please try again.");
    this.name = "MentorUsageMonitoringError";
  }
}

export class MentorUsageLimitService {
  constructor(
    private readonly repository = new UsageMonitoringRepository(),
    private readonly localFallback = new UsageLimitService(),
    private readonly entitlements = new EntitlementService(),
  ) {}

  async checkBeforeMentorResponse(
    input: MentorUsageLimitCheckInput,
  ): Promise<MentorUsageLimitCheckResult> {
    const modelRouting = resolveLlmModelRouteForMessage({
      currentMessage: input.message,
      requestedModel: input.model,
      requestedProvider: input.provider,
    });
    const counts = await this.readCounts(input);

    if (!counts) {
      return this.checkLocalFallback(input, modelRouting);
    }

    const config = await this.resolveUsageConfig(input.userId);
    const messageDecision = buildPersistentMessageDecision(counts, config);
    let status = messageDecision.status;

    if (!isUsageLimitReached(status) && isDeepModelRoute(modelRouting)) {
      status = buildPersistentDeepDecision(counts, config).status;
    }

    if (isUsageLimitReached(status)) {
      await this.recordBlockedResponse(input, modelRouting, status);

      return {
        message: getUsageLimitMessage(status),
        messageDecision,
        modelRouting,
        status,
      };
    }

    return {
      message: null,
      messageDecision,
      modelRouting,
      status: messageDecision.status,
    };
  }

  async recordSuccessfulMentorResponse(input: MentorUsageLimitRecordInput) {
    const estimate = estimateMentorUsageCost(input.llmUsage);

    try {
      const mentorId =
        input.mentorId ??
        (await this.repository.findMentorIdForConversation(
          input.conversationId,
        ));

      await this.repository.createUsageEvent({
        conversationId: input.conversationId,
        ...(estimate.estimatedCostUsd === null
          ? {}
          : { estimatedCostUsd: estimate.estimatedCostUsd }),
        inputTokens: input.llmUsage.inputTokens,
        mentorId,
        model: input.llmUsage.model,
        outputTokens: input.llmUsage.outputTokens,
        provider: input.llmUsage.provider,
        route: input.llmUsage.modelRouting?.route ?? input.llmUsage.provider,
        specialistContext: input.specialistContext,
        status: UsageEventStatus.SUCCESS,
        totalTokens:
          input.llmUsage.totalTokens ??
          sumTokens(input.llmUsage.inputTokens, input.llmUsage.outputTokens),
        userId: input.userId,
      });
    } catch {
      if (requiresPersistentUsage()) {
        throw new MentorUsageMonitoringError();
      }

      this.localFallback.record({
        scope: "mentor-message",
        subjectId: input.authUserId,
      });

      if (input.llmUsage.modelRouting && isDeepModelRoute(input.llmUsage.modelRouting)) {
        this.localFallback.record({
          scope: "mentor-deep-model",
          subjectId: input.authUserId,
        });
      }

      logDevelopmentFallback();
    }
  }

  async recordFailedMentorResponse(input: MentorUsageFailureInput) {
    await this.recordUnsuccessfulResponse(
      input,
      input.modelRouting,
      UsageEventStatus.FAILURE,
      sanitizeErrorCode(input.errorCode),
    );
  }

  private async readCounts(input: MentorUsageLimitCheckInput) {
    try {
      return await this.repository.getSuccessfulUsageCounts(input.userId);
    } catch {
      if (requiresPersistentUsage()) {
        throw new MentorUsageMonitoringError();
      }

      logDevelopmentFallback();
      return null;
    }
  }

  private async resolveUsageConfig(userId: string) {
    const base = readUsageLimitConfig();

    try {
      return (await this.entitlements.resolveUsageConfig(userId, base)).config;
    } catch {
      if (requiresPersistentUsage()) {
        throw new MentorUsageMonitoringError();
      }

      logDevelopmentFallback();
      return base;
    }
  }

  private checkLocalFallback(
    input: MentorUsageLimitCheckInput,
    modelRouting: LlmModelRoutingDecision,
  ): MentorUsageLimitCheckResult {
    const messageDecision = this.localFallback.check({
      scope: "mentor-message",
      subjectId: input.authUserId,
    });
    let status = messageDecision.status;

    if (!isUsageLimitReached(status) && isDeepModelRoute(modelRouting)) {
      status = this.localFallback.check({
        scope: "mentor-deep-model",
        subjectId: input.authUserId,
      }).status;
    }

    return {
      message: isUsageLimitReached(status) ? getUsageLimitMessage(status) : null,
      messageDecision,
      modelRouting,
      status,
    };
  }

  private async recordBlockedResponse(
    input: MentorUsageLimitCheckInput,
    modelRouting: LlmModelRoutingDecision,
    status: UsageLimitStatus,
  ) {
    await this.recordUnsuccessfulResponse(
      input,
      modelRouting,
      UsageEventStatus.BLOCKED,
      status,
    );
  }

  private async recordUnsuccessfulResponse(
    input: UsageEventContext,
    modelRouting: LlmModelRoutingDecision,
    status: Extract<UsageEventStatus, "BLOCKED" | "FAILURE">,
    errorCode: string,
  ) {
    try {
      const mentorId =
        input.mentorId ??
        (await this.repository.findMentorIdForConversation(
          input.conversationId,
        ));

      await this.repository.createUsageEvent({
        conversationId: input.conversationId,
        errorCode,
        mentorId,
        model: modelRouting.model,
        provider: modelRouting.provider,
        route: modelRouting.route,
        status,
        userId: input.userId,
      });
    } catch {
      if (requiresPersistentUsage()) {
        throw new MentorUsageMonitoringError();
      }

      logDevelopmentFallback();
    }
  }
}

function buildPersistentMessageDecision(
  counts: PersistentUsageCounts,
  config: ReturnType<typeof readUsageLimitConfig>,
): UsageLimitDecision {
  const status = config.enforceLimits
    ? findLimitStatus({
        dailyCount: counts.daily,
        dailyLimit: config.dailyMessageLimit,
        monthlyCount: counts.monthly,
        monthlyLimit: config.monthlyMessageLimit,
        weeklyCount: counts.weekly,
        weeklyLimit: config.weeklyMessageLimit,
      })
    : "tracking-only";

  return {
    daily: buildSnapshot(counts.daily, config.dailyMessageLimit, "UTC day"),
    monthly: buildSnapshot(
      counts.monthly,
      config.monthlyMessageLimit,
      "UTC month",
    ),
    scope: "mentor-message",
    status,
    weekly: buildSnapshot(
      counts.weekly,
      config.weeklyMessageLimit,
      "UTC week",
    ),
  };
}

function buildPersistentDeepDecision(
  counts: PersistentUsageCounts,
  config: ReturnType<typeof readUsageLimitConfig>,
): UsageLimitDecision {
  const status =
    config.enforceLimits &&
    config.weeklyDeepLimit !== null &&
    counts.deepWeekly + 1 > config.weeklyDeepLimit
      ? "weekly-limit-reached"
      : config.enforceLimits
        ? "allowed"
        : "tracking-only";

  return {
    daily: buildSnapshot(0, null, "UTC day"),
    monthly: buildSnapshot(0, null, "UTC month"),
    scope: "mentor-deep-model",
    status,
    weekly: buildSnapshot(
      counts.deepWeekly,
      config.weeklyDeepLimit,
      "UTC week",
    ),
  };
}

function findLimitStatus(input: {
  dailyCount: number;
  dailyLimit: number | null;
  monthlyCount: number;
  monthlyLimit: number | null;
  weeklyCount: number;
  weeklyLimit: number | null;
}): UsageLimitStatus {
  if (input.dailyLimit !== null && input.dailyCount + 1 > input.dailyLimit) {
    return "daily-limit-reached";
  }

  if (input.weeklyLimit !== null && input.weeklyCount + 1 > input.weeklyLimit) {
    return "weekly-limit-reached";
  }

  if (
    input.monthlyLimit !== null &&
    input.monthlyCount + 1 > input.monthlyLimit
  ) {
    return "monthly-limit-reached";
  }

  return "allowed";
}

function buildSnapshot(
  count: number,
  limit: number | null,
  period: string,
): UsageLimitCounterSnapshot {
  return {
    count,
    limit,
    period,
    remaining: limit === null ? null : Math.max(limit - count, 0),
  };
}

function isDeepModelRoute(modelRouting: LlmModelRoutingDecision) {
  const model = modelRouting.model?.toLowerCase() ?? "";

  return (
    modelRouting.route === "deep" ||
    modelRouting.provider === "anthropic" ||
    model.includes("claude") ||
    model.includes("sonnet")
  );
}

function requiresPersistentUsage() {
  return process.env.NODE_ENV === "production";
}

function sanitizeErrorCode(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");

  return normalized.slice(0, 80) || "mentor_response_failed";
}

function sumTokens(inputTokens?: number, outputTokens?: number) {
  if (inputTokens === undefined && outputTokens === undefined) {
    return undefined;
  }

  return (inputTokens ?? 0) + (outputTokens ?? 0);
}

function logDevelopmentFallback() {
  console.error(
    "Persistent usage monitoring unavailable; using the local development fallback.",
  );
}
