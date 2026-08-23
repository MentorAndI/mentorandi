import type { LlmProviderName } from "@/services/llm/llm.types";

export const CREDIT_RETAIL_VALUE_USD = 0.01;
export const CREDIT_COST_MULTIPLIER = 2;
export const CREDIT_PRICING_VERSION = "2026-08-23";

export interface CreditPricedUsage {
  cachedInputTokens?: number;
  inputTokens?: number;
  model: string;
  outputTokens?: number;
  provider: LlmProviderName;
}

export interface ProviderCostEstimate {
  providerCostUsd: number | null;
  pricingConfigured: boolean;
  pricingVersion: string;
}

interface ModelTokenRates {
  cachedInputPer1m?: number;
  inputPer1m: number;
  outputPer1m: number;
}

export function calculateProviderCostUsd(
  usage: CreditPricedUsage,
  now = new Date(),
): ProviderCostEstimate {
  if (usage.inputTokens === undefined || usage.outputTokens === undefined) {
    return {
      providerCostUsd: null,
      pricingConfigured: true,
      pricingVersion: CREDIT_PRICING_VERSION,
    };
  }

  const rates = resolveModelTokenRates(usage.provider, usage.model, now);

  if (!rates) {
    const fallback = readEnvironmentFallbackRates();

    if (!fallback) {
      return {
        providerCostUsd: null,
        pricingConfigured: false,
        pricingVersion: CREDIT_PRICING_VERSION,
      };
    }

    return {
      providerCostUsd: calculateTokenCost(usage, fallback),
      pricingConfigured: true,
      pricingVersion: `${CREDIT_PRICING_VERSION}:env-fallback`,
    };
  }

  return {
    providerCostUsd: calculateTokenCost(usage, rates),
    pricingConfigured: true,
    pricingVersion: CREDIT_PRICING_VERSION,
  };
}

export function calculateCreditsForProviderCost(providerCostUsd: number) {
  if (!Number.isFinite(providerCostUsd) || providerCostUsd <= 0) {
    return 0;
  }

  const retailCostUsd = providerCostUsd * CREDIT_COST_MULTIPLIER;
  const rawCredits = retailCostUsd / CREDIT_RETAIL_VALUE_USD;

  // Credit balances are shown to two decimals. Always round debits upward so
  // rounding can never reduce the agreed 2x provider-cost multiplier.
  return Math.ceil((rawCredits - Number.EPSILON) * 100) / 100;
}

export function calculateRetailCostUsd(providerCostUsd: number) {
  return providerCostUsd * CREDIT_COST_MULTIPLIER;
}

function calculateTokenCost(
  usage: CreditPricedUsage,
  rates: ModelTokenRates,
) {
  const inputTokens = Math.max(0, usage.inputTokens ?? 0);
  const cachedInputTokens = Math.min(
    inputTokens,
    Math.max(0, usage.cachedInputTokens ?? 0),
  );
  const uncachedInputTokens = inputTokens - cachedInputTokens;
  const cachedRate = rates.cachedInputPer1m ?? rates.inputPer1m;
  const outputTokens = Math.max(0, usage.outputTokens ?? 0);

  return (
    (uncachedInputTokens / 1_000_000) * rates.inputPer1m +
    (cachedInputTokens / 1_000_000) * cachedRate +
    (outputTokens / 1_000_000) * rates.outputPer1m
  );
}

function resolveModelTokenRates(
  provider: LlmProviderName,
  model: string,
  now: Date,
): ModelTokenRates | null {
  const normalized = model.trim().toLowerCase();

  if (provider === "openai") {
    if (matchesModel(normalized, "gpt-5.6-terra")) {
      return { cachedInputPer1m: 0.2, inputPer1m: 2, outputPer1m: 12 };
    }
    if (matchesModel(normalized, "gpt-5.6-luna")) {
      return { cachedInputPer1m: 0.02, inputPer1m: 0.2, outputPer1m: 1.2 };
    }
    if (
      normalized === "gpt-5.6" ||
      matchesModel(normalized, "gpt-5.6-sol")
    ) {
      // Temporary GPT-5.6 Sol price reduction active on 2026-08-23.
      return { cachedInputPer1m: 0.4, inputPer1m: 4, outputPer1m: 20 };
    }
    if (matchesModel(normalized, "gpt-5.5")) {
      return { cachedInputPer1m: 0.5, inputPer1m: 5, outputPer1m: 30 };
    }
    if (matchesModel(normalized, "gpt-5.4-mini")) {
      return { cachedInputPer1m: 0.075, inputPer1m: 0.75, outputPer1m: 4.5 };
    }
    if (matchesModel(normalized, "gpt-5.4-nano")) {
      return { cachedInputPer1m: 0.02, inputPer1m: 0.2, outputPer1m: 1.25 };
    }
    if (matchesModel(normalized, "gpt-5.4")) {
      return { cachedInputPer1m: 0.25, inputPer1m: 2.5, outputPer1m: 15 };
    }
    if (matchesModel(normalized, "gpt-5-mini")) {
      return { cachedInputPer1m: 0.025, inputPer1m: 0.25, outputPer1m: 2 };
    }
    if (matchesModel(normalized, "gpt-5")) {
      return { cachedInputPer1m: 0.125, inputPer1m: 1.25, outputPer1m: 10 };
    }
  }

  if (provider === "anthropic") {
    if (normalized.includes("claude-sonnet-5")) {
      // Introductory Claude Sonnet 5 pricing runs through 2026-08-31.
      return now < new Date("2026-09-01T00:00:00.000Z")
        ? { inputPer1m: 2, outputPer1m: 10 }
        : { inputPer1m: 3, outputPer1m: 15 };
    }
    if (
      normalized.includes("claude-sonnet-4-6") ||
      normalized.includes("claude-sonnet-4-5")
    ) {
      return { inputPer1m: 3, outputPer1m: 15 };
    }
    if (normalized.includes("claude-haiku-4-5")) {
      return { inputPer1m: 1, outputPer1m: 5 };
    }
    if (
      normalized.includes("claude-opus-4-8") ||
      normalized.includes("claude-opus-4-7") ||
      normalized.includes("claude-opus-4-6") ||
      normalized.includes("claude-opus-4-5")
    ) {
      return { inputPer1m: 5, outputPer1m: 25 };
    }
  }

  if (provider === "mock") {
    return { inputPer1m: 0, outputPer1m: 0 };
  }

  return null;
}

function matchesModel(model: string, family: string) {
  return model === family || model.startsWith(`${family}-`);
}

function readEnvironmentFallbackRates(): ModelTokenRates | null {
  const inputPer1m = readOptionalNumber("LLM_INPUT_COST_PER_1M");
  const outputPer1m = readOptionalNumber("LLM_OUTPUT_COST_PER_1M");

  return inputPer1m === null || outputPer1m === null
    ? null
    : { inputPer1m, outputPer1m };
}

function readOptionalNumber(name: string) {
  const value = process.env[name]?.trim();
  if (!value) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
