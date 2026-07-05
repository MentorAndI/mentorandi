import "dotenv/config";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const defaultAppUrl = "http://localhost:3000";
const endpointPath = "/api/dev/test-llm-provider";
const reportPath = path.join("reports", "model-eval-latest.json");

const scenarios = [
  "What day is it today?",
  "I want to become more focused and stop overthinking. What should I do today?",
  "I have ADHD and I can't get started on my work.",
  "I keep overthinking the same decision.",
  "I am working on the MentorAndI design today. What should I focus on next?",
];

const providerConfigs = [
  {
    apiKeyEnv: "ANTHROPIC_API_KEY",
    modelEnvs: [
      "ANTHROPIC_MODEL",
      "ANTHROPIC_MODEL_CHEAP",
      "ANTHROPIC_MODEL_DEEP",
    ],
    provider: "anthropic",
  },
  {
    apiKeyEnv: "OPENAI_API_KEY",
    modelEnvs: ["OPENAI_MODEL", "OPENAI_MODEL_CHEAP", "OPENAI_MODEL_DEEP"],
    provider: "openai",
  },
];

const appUrl = normalizeAppUrl(process.env.APP_URL || defaultAppUrl);
const endpointUrl = new URL(endpointPath, appUrl).toString();
const modelCases = collectModelCases();
const shouldRunAutomaticRouting = hasRoutingProviderConfiguration();

if (modelCases.length === 0 && !shouldRunAutomaticRouting) {
  console.log("No real-provider models configured for evaluation.");
  console.log(
    "Set an API key plus model env vars or routing provider env vars, then run npm run eval:models again.",
  );
  process.exitCode = 1;
} else {
  const startedAt = new Date().toISOString();
  const results = [];

  console.log(`Model comparison endpoint: ${endpointUrl}`);
  console.log(`Scenarios: ${scenarios.length}`);
  console.log(`Model cases: ${modelCases.length}`);
  console.log(
    `Automatic routing: ${shouldRunAutomaticRouting ? "enabled" : "not configured"}`,
  );
  console.log("");

  for (const modelCase of modelCases) {
    for (const scenario of scenarios) {
      const result = await runScenario(modelCase, scenario);
      results.push(result);
      printResult(result);
    }
  }

  if (shouldRunAutomaticRouting) {
    for (const scenario of scenarios) {
      const result = await runScenario(
        {
          mode: "automatic-routing",
          model: null,
          modelEnv: null,
          provider: null,
        },
        scenario,
      );
      results.push(result);
      printResult(result);
    }
  }

  const report = {
    appUrl,
    endpointUrl,
    generatedAt: new Date().toISOString(),
    modelCases,
    results,
    scenarios,
    startedAt,
  };

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log("");
  console.log(`Wrote JSON report: ${reportPath}`);
}

function collectModelCases() {
  return providerConfigs.flatMap((config) => {
    if (!readEnv(config.apiKeyEnv)) {
      return [];
    }

    const seenModels = new Set();

    return config.modelEnvs.flatMap((modelEnv) => {
      const model = readEnv(modelEnv);

      if (!model || seenModels.has(model)) {
        return [];
      }

      seenModels.add(model);

      return [
        {
          mode: "explicit-model",
          model,
          modelEnv,
          provider: config.provider,
        },
      ];
    });
  });
}

async function runScenario(modelCase, scenario) {
  const startedAt = Date.now();

  try {
    const response = await fetch(endpointUrl, {
      body: JSON.stringify({
        message: scenario,
        ...(modelCase.model ? { model: modelCase.model } : {}),
        ...(modelCase.provider ? { provider: modelCase.provider } : {}),
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const responseBody = await response.json().catch(() => null);

    if (!response.ok) {
      return buildFailureResult({
        errorState: `http_${response.status}`,
        modelCase,
        responseBody,
        safeErrorMessage: readSafeErrorMessage(responseBody, "Request failed."),
        scenario,
        startedAt,
      });
    }

    if (!responseBody || typeof responseBody !== "object") {
      return buildFailureResult({
        errorState: "invalid_response",
        modelCase,
        responseBody,
        safeErrorMessage: "Provider test returned an invalid response.",
        scenario,
        startedAt,
      });
    }

    return {
      costEstimate: readCostEstimate(responseBody.costEstimate),
      errorState:
        typeof responseBody.errorState === "string"
          ? responseBody.errorState
          : null,
      inputTokens: readNullableNumber(responseBody.inputTokens),
      latencyMs: readNullableNumber(responseBody.latencyMs),
      model:
        typeof responseBody.routedModel === "string"
          ? responseBody.routedModel
          : typeof responseBody.model === "string"
            ? responseBody.model
            : modelCase.model,
      mode: modelCase.mode,
      modelEnv: modelCase.modelEnv,
      outputTokens: readNullableNumber(responseBody.outputTokens),
      provider:
        typeof responseBody.routedProvider === "string"
          ? responseBody.routedProvider
          : typeof responseBody.provider === "string"
            ? responseBody.provider
            : modelCase.provider,
      responsePreview: buildPreview(responseBody.responseText),
      routeReason:
        typeof responseBody.routeReason === "string"
          ? responseBody.routeReason
          : readModelRoutingText(responseBody.modelRouting, "reason"),
      routeType:
        typeof responseBody.routeType === "string"
          ? responseBody.routeType
          : readModelRoutingText(responseBody.modelRouting, "route"),
      safeErrorMessage: readSafeErrorMessage(responseBody, null),
      scenario,
      success: responseBody.success === true,
      totalTokens: readNullableNumber(responseBody.totalTokens),
      wallClockMs: Date.now() - startedAt,
    };
  } catch (error) {
    return buildFailureResult({
      errorState: "request_failed",
      modelCase,
      responseBody: null,
      safeErrorMessage:
        error instanceof Error
          ? "Unable to call the local model evaluation endpoint."
          : "Model evaluation request failed.",
      scenario,
      startedAt,
    });
  }
}

function buildFailureResult(input) {
  return {
    costEstimate: null,
    errorState: input.errorState,
    inputTokens: null,
    latencyMs: null,
    model: input.modelCase.model,
    mode: input.modelCase.mode,
    modelEnv: input.modelCase.modelEnv,
    outputTokens: null,
    provider: input.modelCase.provider,
    responsePreview: "",
    routeReason: null,
    routeType: null,
    safeErrorMessage: input.safeErrorMessage,
    scenario: input.scenario,
    success: false,
    totalTokens: null,
    wallClockMs: Date.now() - input.startedAt,
  };
}

function printResult(result) {
  const status = result.success ? "success" : "failure";

  console.log(
    `[${status}] ${result.provider ?? "unknown-provider"} / ${result.model ?? "unknown-model"} (${result.mode})`,
  );
  console.log(`  scenario: ${result.scenario}`);
  console.log(`  route: ${result.routeType ?? "n/a"}`);
  console.log(`  route reason: ${result.routeReason ?? "n/a"}`);
  console.log(`  latencyMs: ${formatNullable(result.latencyMs)}`);
  console.log(
    `  tokens: input ${formatNullable(result.inputTokens)} / output ${formatNullable(result.outputTokens)} / total ${formatNullable(result.totalTokens)}`,
  );
  console.log(`  estimated cost: ${formatCostEstimate(result.costEstimate)}`);

  if (result.success) {
    console.log(`  preview: ${result.responsePreview || "No response text."}`);
  } else {
    console.log(
      `  error: ${result.safeErrorMessage || result.errorState || "Request failed safely."}`,
    );
  }

  console.log("");
}

function readCostEstimate(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  return {
    estimatedCostUsd: readNullableNumber(value.estimatedCostUsd),
    isConfigured: value.isConfigured === true,
    message: typeof value.message === "string" ? value.message : null,
  };
}

function readModelRoutingText(value, key) {
  if (!value || typeof value !== "object") {
    return null;
  }

  return typeof value[key] === "string" ? value[key] : null;
}

function formatCostEstimate(costEstimate) {
  if (!costEstimate) {
    return "not available";
  }

  if (!costEstimate.isConfigured) {
    return costEstimate.message || "not configured";
  }

  if (costEstimate.estimatedCostUsd === null) {
    return costEstimate.message || "not available";
  }

  return `$${costEstimate.estimatedCostUsd.toFixed(6)}`;
}

function readSafeErrorMessage(value, fallback) {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  if (typeof value.safeErrorMessage === "string") {
    return value.safeErrorMessage;
  }

  if (typeof value.error === "string") {
    return value.error;
  }

  if (value.errors && typeof value.errors === "object") {
    return Object.values(value.errors).filter(Boolean).join(" ");
  }

  return fallback;
}

function buildPreview(value) {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.replace(/\s+/g, " ").trim();

  return normalized.length > 220
    ? `${normalized.slice(0, 217).trimEnd()}...`
    : normalized;
}

function readNullableNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatNullable(value) {
  return value === null ? "n/a" : String(value);
}

function readEnv(name) {
  return process.env[name]?.trim() || "";
}

function hasRoutingProviderConfiguration() {
  return Boolean(
    readEnv("LLM_CHEAP_PROVIDER") ||
      readEnv("LLM_DEFAULT_PROVIDER") ||
      readEnv("LLM_DEEP_PROVIDER") ||
      readEnv("LLM_PROVIDER"),
  );
}

function normalizeAppUrl(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
