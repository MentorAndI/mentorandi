import { resolveLlmModelRouteForMessage } from "@/services/llm/llm-model-router";
import type {
  LlmModelRoutingDecision,
  LlmProviderName,
} from "@/services/llm/llm.types";
import {
  getUsageLimitMessage,
  isUsageLimitReached,
  UsageLimitService,
} from "@/services/usage-limits/usage-limits.service";
import type {
  UsageLimitDecision,
  UsageLimitStatus,
} from "@/services/usage-limits/usage-limits.types";

export interface MentorUsageLimitCheckInput {
  authUserId: string;
  message: string;
  model?: string;
  provider?: LlmProviderName;
}

export interface MentorUsageLimitRecordInput {
  authUserId: string;
  modelRouting?: LlmModelRoutingDecision;
}

export interface MentorUsageLimitCheckResult {
  message: string | null;
  messageDecision: UsageLimitDecision;
  modelRouting: LlmModelRoutingDecision;
  status: UsageLimitStatus;
}

export class MentorUsageLimitService {
  constructor(private readonly usageLimitService = new UsageLimitService()) {}

  checkBeforeMentorResponse(
    input: MentorUsageLimitCheckInput,
  ): MentorUsageLimitCheckResult {
    const messageDecision = this.usageLimitService.check({
      scope: "mentor-message",
      subjectId: input.authUserId,
    });
    const modelRouting = resolveLlmModelRouteForMessage({
      currentMessage: input.message,
      requestedModel: input.model,
      requestedProvider: input.provider,
    });

    if (isUsageLimitReached(messageDecision.status)) {
      return {
        message: getUsageLimitMessage(messageDecision.status),
        messageDecision,
        modelRouting,
        status: messageDecision.status,
      };
    }

    if (isDeepModelRoute(modelRouting)) {
      const deepDecision = this.usageLimitService.check({
        scope: "mentor-deep-model",
        subjectId: input.authUserId,
      });

      if (isUsageLimitReached(deepDecision.status)) {
        return {
          message: getUsageLimitMessage(deepDecision.status),
          messageDecision,
          modelRouting,
          status: deepDecision.status,
        };
      }
    }

    return {
      message: null,
      messageDecision,
      modelRouting,
      status: messageDecision.status,
    };
  }

  recordSuccessfulMentorResponse(input: MentorUsageLimitRecordInput) {
    const messageDecision = this.usageLimitService.record({
      scope: "mentor-message",
      subjectId: input.authUserId,
    });
    const deepDecision = input.modelRouting
      ? this.recordDeepUsageIfNeeded(input.authUserId, input.modelRouting)
      : null;

    return {
      deepDecision,
      messageDecision,
    };
  }

  private recordDeepUsageIfNeeded(
    authUserId: string,
    modelRouting: LlmModelRoutingDecision,
  ) {
    if (!isDeepModelRoute(modelRouting)) {
      return null;
    }

    return this.usageLimitService.record({
      scope: "mentor-deep-model",
      subjectId: authUserId,
    });
  }
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
