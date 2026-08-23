import type { MentorResponsePipelineLlmUsage } from "@/services/mentor-core/response-pipeline/response-pipeline.types";
import { calculateProviderCostUsd } from "@/services/credits/credit-pricing";

export interface UsageCostEstimate {
  estimatedCostUsd: number | null;
  isConfigured: boolean;
  message: string | null;
}

export function estimateMentorUsageCost(
  usage: MentorResponsePipelineLlmUsage,
): UsageCostEstimate {
  const estimate = calculateProviderCostUsd(usage);

  if (!estimate.pricingConfigured) {
    return {
      estimatedCostUsd: null,
      isConfigured: false,
      message: "Cost estimate not configured for this model",
    };
  }

  if (estimate.providerCostUsd === null) {
    return {
      estimatedCostUsd: null,
      isConfigured: true,
      message: "Token usage not available",
    };
  }

  return {
    estimatedCostUsd: estimate.providerCostUsd,
    isConfigured: true,
    message: null,
  };
}
