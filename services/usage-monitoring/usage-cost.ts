import type { MentorResponsePipelineLlmUsage } from "@/services/mentor-core/response-pipeline/response-pipeline.types";

export interface UsageCostEstimate {
  estimatedCostUsd: number | null;
  isConfigured: boolean;
  message: string | null;
}

export function estimateMentorUsageCost(
  usage: Pick<
    MentorResponsePipelineLlmUsage,
    "inputTokens" | "outputTokens"
  >,
): UsageCostEstimate {
  const inputCostPer1m = readOptionalCost("LLM_INPUT_COST_PER_1M");
  const outputCostPer1m = readOptionalCost("LLM_OUTPUT_COST_PER_1M");

  if (inputCostPer1m === null || outputCostPer1m === null) {
    return {
      estimatedCostUsd: null,
      isConfigured: false,
      message: "Cost estimate not configured",
    };
  }

  if (
    usage.inputTokens === undefined ||
    usage.outputTokens === undefined
  ) {
    return {
      estimatedCostUsd: null,
      isConfigured: true,
      message: "Token usage not available",
    };
  }

  return {
    estimatedCostUsd:
      (usage.inputTokens / 1_000_000) * inputCostPer1m +
      (usage.outputTokens / 1_000_000) * outputCostPer1m,
    isConfigured: true,
    message: null,
  };
}

function readOptionalCost(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) && parsedValue >= 0
    ? parsedValue
    : null;
}
