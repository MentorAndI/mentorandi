import "dotenv/config";

import { mkdir, writeFile } from "node:fs/promises";

const defaultBaseUrl = "http://localhost:3000";
const reportPath = "reports/mentor-eval-latest.json";
const baseUrl = normalizeBaseUrl(process.env.APP_URL?.trim() || defaultBaseUrl);
const providers = readProviders();
const modelOverride = process.env.EVAL_LLM_MODEL?.trim();

const scenarioGroups = [
  {
    messages: [
      {
        input: "What day is it today?",
        name: "Direct factual question",
      },
    ],
  },
  {
    messages: [
      {
        input: "I want to become more focused and stop overthinking.",
        name: "Goal/mentor question",
      },
      {
        input: "What should I focus on today?",
        name: "Follow-up",
      },
    ],
  },
  {
    messages: [
      {
        input: "The weather is hot here. Where am I?",
        name: "Location uncertainty",
      },
    ],
  },
  {
    messages: [
      {
        input: "I am working on the MentorAndI design today.",
        name: "Product/project context",
      },
      {
        input: "What should I focus on next?",
        name: "Product/project follow-up",
      },
    ],
  },
];

console.log("MentorAndI Mentor Evaluation");
console.log(`Base URL: ${baseUrl}`);
console.log(`Providers: ${providers.join(", ")}`);

const seedData = await loadSeedData();
const startedAt = new Date().toISOString();
const results = [];

for (const provider of providers) {
  console.log("");
  console.log(`Provider: ${provider}`);

  for (const group of scenarioGroups) {
    let conversationId;

    for (const scenario of group.messages) {
      const result = await runScenario({
        conversationId,
        input: scenario.input,
        mentorId: seedData.mentorId,
        model: modelOverride,
        name: scenario.name,
        provider,
        userId: seedData.userId,
      });

      if (result.conversationId) {
        conversationId = result.conversationId;
      }

      results.push(result);
      printScenarioResult(result);
    }
  }
}

const report = {
  app: "MentorAndI",
  baseUrl,
  createdAt: new Date().toISOString(),
  providers,
  results,
  startedAt,
};

await mkdir("reports", { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

const failures = results.filter((result) => !result.success);

console.log("");
console.log(`Report written: ${reportPath}`);

if (failures.length > 0) {
  console.error(`${failures.length} mentor eval scenario failed.`);
  process.exit(1);
}

console.log("Mentor eval completed.");

async function loadSeedData() {
  const url = new URL("/api/dev/seed-data", baseUrl);

  try {
    const response = await fetch(url);
    const body = await readJson(response);

    if (!response.ok) {
      throw new Error(readSafeError(body) ?? `HTTP ${response.status}`);
    }

    if (!isNonEmptyString(body?.userId) || !isNonEmptyString(body?.mentorId)) {
      throw new Error("Seed data response was missing userId or mentorId.");
    }

    return {
      mentorId: body.mentorId,
      userId: body.userId,
    };
  } catch (error) {
    console.error("Unable to load development seed data.");
    console.error(toSafeErrorMessage(error));
    process.exit(1);
  }
}

async function runScenario({
  conversationId,
  input,
  mentorId,
  model,
  name,
  provider,
  userId,
}) {
  const url = new URL("/api/dev/test-mentor-response", baseUrl);
  const payload = {
    mentorId,
    message: input,
    provider,
    userId,
    ...(conversationId ? { conversationId } : {}),
    ...(model ? { model } : {}),
  };

  try {
    const response = await fetch(url, {
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const body = await readJson(response);
    const diagnostics = body?.diagnostics;
    const usage = diagnostics?.llmUsage;

    if (!response.ok) {
      return {
        errorState: sanitizeText(
          diagnostics?.providerErrorState ?? readSafeError(body) ?? "request_failed",
        ),
        estimatedCost: readCostEstimate(usage),
        inputMessage: input,
        inputTokens: readNullableNumber(usage?.inputTokens),
        latencyMs: readNullableNumber(usage?.latencyMs),
        model: sanitizeText(usage?.model ?? body?.model ?? "unknown"),
        outputTokens: readNullableNumber(usage?.outputTokens),
        provider,
        providerUsed: sanitizeText(
          diagnostics?.providerUsed ?? diagnostics?.provider ?? provider,
        ),
        responseText: "",
        scenario: name,
        success: false,
        totalTokens: readNullableNumber(usage?.totalTokens),
      };
    }

    return {
      conversationId: body?.conversation?.id,
      errorState: null,
      estimatedCost: readCostEstimate(usage),
      inputMessage: input,
      inputTokens: readNullableNumber(usage?.inputTokens),
      latencyMs: readNullableNumber(usage?.latencyMs),
      model: sanitizeText(usage?.model ?? body?.model ?? "unknown"),
      outputTokens: readNullableNumber(usage?.outputTokens),
      provider,
      providerUsed: sanitizeText(
        diagnostics?.providerUsed ?? diagnostics?.provider ?? body?.provider ?? provider,
      ),
      responseText: sanitizeText(body?.mentorMessage?.content ?? ""),
      scenario: name,
      success: true,
      totalTokens: readNullableNumber(usage?.totalTokens),
    };
  } catch (error) {
    return {
      errorState: toSafeErrorMessage(error),
      estimatedCost: null,
      inputMessage: input,
      inputTokens: null,
      latencyMs: null,
      model: model ?? "unknown",
      outputTokens: null,
      provider,
      providerUsed: provider,
      responseText: "",
      scenario: name,
      success: false,
      totalTokens: null,
    };
  }
}

function printScenarioResult(result) {
  const status = result.success ? "PASS" : "FAIL";
  const latency = result.latencyMs === null ? "latency n/a" : `${result.latencyMs}ms`;
  const tokens =
    result.totalTokens === null ? "tokens n/a" : `${result.totalTokens} tokens`;
  const cost =
    result.estimatedCost === null
      ? "cost n/a"
      : `$${result.estimatedCost.toFixed(6)}`;

  console.log(
    `${status} ${result.scenario} | ${result.providerUsed} | ${result.model} | ${latency} | ${tokens} | ${cost}`,
  );

  if (result.success) {
    console.log(`  Input: ${result.inputMessage}`);
    console.log(`  Marcus: ${truncate(result.responseText, 220) || "No response text"}`);
  } else {
    console.log(`  Error: ${result.errorState ?? "unknown_error"}`);
  }
}

function readProviders() {
  const providerSource =
    process.env.EVAL_LLM_PROVIDERS?.trim() ||
    process.env.LLM_PROVIDER?.trim() ||
    "mock";
  const supportedProviders = new Set(["anthropic", "mock", "openai"]);
  const parsedProviders = providerSource
    .split(",")
    .map((provider) => provider.trim().toLowerCase())
    .filter(Boolean);

  const unsupportedProviders = parsedProviders.filter(
    (provider) => !supportedProviders.has(provider),
  );

  if (unsupportedProviders.length > 0) {
    console.error(
      `Unsupported eval provider: ${unsupportedProviders.join(", ")}. Use mock, openai or anthropic.`,
    );
    process.exit(1);
  }

  return [...new Set(parsedProviders.length > 0 ? parsedProviders : ["mock"])];
}

async function readJson(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function readSafeError(body) {
  if (isNonEmptyString(body?.error)) {
    return body.error;
  }

  if (body?.errors && typeof body.errors === "object") {
    return Object.values(body.errors)
      .filter(isNonEmptyString)
      .join(" ");
  }

  return null;
}

function readCostEstimate(usage) {
  const estimatedCost = usage?.costEstimate?.estimatedCostUsd;

  return typeof estimatedCost === "number" && Number.isFinite(estimatedCost)
    ? estimatedCost
    : null;
}

function readNullableNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function sanitizeText(value) {
  const text = typeof value === "string" ? value : String(value ?? "");

  return redactSensitiveValues(text);
}

function redactSensitiveValues(text) {
  const sensitiveVariableNames = [
    "DATABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
  ];

  return sensitiveVariableNames.reduce((currentText, variableName) => {
    const secret = process.env[variableName]?.trim();

    return secret ? currentText.split(secret).join("[redacted]") : currentText;
  }, text);
}

function toSafeErrorMessage(error) {
  if (error instanceof Error) {
    return sanitizeText(error.message);
  }

  return "Unknown error.";
}

function truncate(value, maxLength) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

function normalizeBaseUrl(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
