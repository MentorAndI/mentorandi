import assert from "node:assert/strict";
import { test } from "node:test";

import {
  calculateCreditsForProviderCost,
  calculateProviderCostUsd,
  calculateRetailCostUsd,
  CREDIT_COST_MULTIPLIER,
  CREDIT_RETAIL_VALUE_USD,
} from "@/services/credits/credit-pricing";

test("credits charge exactly 2x the current GPT-5.4 mini provider cost", () => {
  const estimate = calculateProviderCostUsd({
    inputTokens: 767,
    model: "gpt-5.4-mini-2026-03-17",
    outputTokens: 183,
    provider: "openai",
  });

  assert.equal(estimate.providerCostUsd, 0.00139875);
  assert.equal(calculateRetailCostUsd(estimate.providerCostUsd!), 0.0027975);
  assert.equal(calculateCreditsForProviderCost(estimate.providerCostUsd!), 0.28);
  assert.equal(CREDIT_COST_MULTIPLIER, 2);
  assert.equal(CREDIT_RETAIL_VALUE_USD, 0.01);
});

test("OpenAI cached input tokens use the lower cached-input rate", () => {
  const estimate = calculateProviderCostUsd({
    cachedInputTokens: 500_000,
    inputTokens: 1_000_000,
    model: "gpt-5.4-mini",
    outputTokens: 0,
    provider: "openai",
  });

  assert.equal(estimate.providerCostUsd, 0.4125);
  assert.equal(calculateCreditsForProviderCost(estimate.providerCostUsd!), 82.5);
});

test("Claude Sonnet 5 introductory pricing expires on September 1 2026", () => {
  const august = calculateProviderCostUsd(
    {
      inputTokens: 1_000_000,
      model: "claude-sonnet-5",
      outputTokens: 1_000_000,
      provider: "anthropic",
    },
    new Date("2026-08-23T00:00:00.000Z"),
  );
  const september = calculateProviderCostUsd(
    {
      inputTokens: 1_000_000,
      model: "claude-sonnet-5",
      outputTokens: 1_000_000,
      provider: "anthropic",
    },
    new Date("2026-09-01T00:00:00.000Z"),
  );

  assert.equal(august.providerCostUsd, 12);
  assert.equal(calculateCreditsForProviderCost(august.providerCostUsd!), 2400);
  assert.equal(september.providerCostUsd, 18);
  assert.equal(calculateCreditsForProviderCost(september.providerCostUsd!), 3600);
});

test("unknown models fail open on charging unless explicit fallback rates exist", () => {
  const previousInput = process.env.LLM_INPUT_COST_PER_1M;
  const previousOutput = process.env.LLM_OUTPUT_COST_PER_1M;
  delete process.env.LLM_INPUT_COST_PER_1M;
  delete process.env.LLM_OUTPUT_COST_PER_1M;

  try {
    const estimate = calculateProviderCostUsd({
      inputTokens: 100,
      model: "future-unknown-model",
      outputTokens: 100,
      provider: "openai",
    });

    assert.equal(estimate.providerCostUsd, null);
    assert.equal(estimate.pricingConfigured, false);
  } finally {
    restoreEnv("LLM_INPUT_COST_PER_1M", previousInput);
    restoreEnv("LLM_OUTPUT_COST_PER_1M", previousOutput);
  }
});

function restoreEnv(name: string, value?: string) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
