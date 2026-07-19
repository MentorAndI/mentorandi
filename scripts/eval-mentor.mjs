import "dotenv/config";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const defaultAppUrl = "http://localhost:3000";
const endpointPath = "/api/dev/test-mentor-response";
const seedEndpointPath = "/api/dev/seed-data";
const reportPath = path.join("reports", "mentor-eval-latest.json");
const appUrl = normalizeAppUrl(process.env.APP_URL || defaultAppUrl);
const endpointUrl = new URL(endpointPath, appUrl).toString();
const seedEndpointUrl = new URL(seedEndpointPath, appUrl).toString();
const evalCases = collectEvalCases();

const scenarioGroups = [
  {
    name: "factual-routing",
    messages: [
      {
        expectsMentorShape: false,
        name: "Direct factual question",
        text: "What day is it today?",
      },
    ],
  },
  {
    name: "focus-follow-up",
    messages: [
      {
        expectsMentorShape: true,
        expectsWarmAffirmation: true,
        name: "Competing focus priorities",
        text: "I sat down to work on the launch today, but I kept bouncing between five priorities and finished none of them. Now I feel annoyed with myself.",
      },
      {
        expectsMentorShape: true,
        name: "Focus follow-up",
        text: "The launch page matters most, but I am worried I will choose the wrong part to work on.",
      },
    ],
  },
  {
    name: "adhd-methods",
    messages: [
      {
        expectsMentorShape: true,
        expectsWarmAffirmation: true,
        name: "ADHD task initiation",
        text: "I have ADHD, and even opening the document feels weirdly impossible today. I know the task matters, which makes me feel worse about being stuck.",
      },
    ],
  },
  {
    name: "overthinking-loop",
    messages: [
      {
        expectsMentorShape: true,
        name: "Overthinking decision loop",
        text: "I keep overthinking the same decision.",
      },
    ],
  },
  {
    name: "relationship-expertise",
    messages: [
      {
        expectsMentorShape: true,
        expectsWarmAffirmation: true,
        name: "Relationship communication",
        text: "My partner said I never listen, and I got defensive even though part of me knows they have a point. We ended the evening barely speaking.",
      },
    ],
  },
  {
    name: "stress-burnout",
    messages: [
      {
        expectsMentorShape: true,
        expectsWarmAffirmation: true,
        name: "Stress and overload",
        text: "I feel guilty whenever I stop working, but I am exhausted and starting to resent everything.",
      },
    ],
  },
  {
    name: "confidence",
    messages: [
      {
        expectsMentorShape: true,
        expectsWarmAffirmation: true,
        name: "Self-doubt in a group",
        text: "I had an idea in the meeting but stayed quiet because everyone else sounded more capable. Someone else said almost the same thing later, and now I'm frustrated with myself.",
      },
    ],
  },
  {
    name: "life-direction",
    messages: [
      {
        expectsMentorShape: true,
        name: "Life direction",
        text: "My life looks fine from the outside, but I feel disconnected from it and I don't know what needs to change.",
      },
    ],
  },
];

console.log("MentorAndI Full Mentor Core Evaluation");
console.log(`App URL: ${appUrl}`);
console.log(`Seed endpoint: ${seedEndpointUrl}`);
console.log(`Mentor endpoint: ${endpointUrl}`);
console.log(`Scenario groups: ${scenarioGroups.length}`);
console.log(`Eval cases: ${evalCases.length}`);
console.log("");

const seedData = await loadSeedData();
const startedAt = new Date().toISOString();
const results = [];

for (const evalCase of evalCases) {
  console.log(`Case: ${formatEvalCase(evalCase)}`);

  for (const group of scenarioGroups) {
    let conversationId = null;

    for (const scenario of group.messages) {
      const result = await runScenario({
        conversationId,
        evalCase,
        groupName: group.name,
        mentorId: seedData.mentorId,
        scenario,
        userId: seedData.userId,
      });

      if (result.conversationId) {
        conversationId = result.conversationId;
      }

      results.push(result);
      printScenarioResult(result);
    }
  }

  console.log("");
}

const report = {
  appUrl,
  endpointUrl,
  evalCases,
  generatedAt: new Date().toISOString(),
  requires: [
    "database connected",
    "seeded development user",
    "model routing",
    "mentor method library",
    "mentor expertise library",
    "mentor source library",
  ],
  results,
  scenarioGroups,
  seedEndpointUrl,
  startedAt,
};

await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

const failures = results.filter((result) => !result.passed);

console.log(`Wrote JSON report: ${reportPath}`);

if (failures.length > 0) {
  console.error(`${failures.length} full mentor eval scenario failed.`);
  process.exit(1);
}

console.log("Full mentor eval completed.");

function collectEvalCases() {
  const cases = [
    {
      mode: "automatic-routing",
      model: null,
      provider: null,
    },
  ];

  for (const provider of readExplicitProviders()) {
    cases.push({
      mode: "explicit-provider",
      model: readModelOverride(provider),
      provider,
    });
  }

  return cases;
}

function readExplicitProviders() {
  const providerSource = process.env.EVAL_MENTOR_PROVIDERS?.trim();

  if (!providerSource) {
    return [];
  }

  const supportedProviders = new Set(["anthropic", "mock", "openai"]);
  const providers = providerSource
    .split(",")
    .map((provider) => provider.trim().toLowerCase())
    .filter(Boolean);
  const unsupportedProviders = providers.filter(
    (provider) => !supportedProviders.has(provider),
  );

  if (unsupportedProviders.length > 0) {
    console.error(
      `Unsupported mentor eval provider: ${unsupportedProviders.join(", ")}. Use mock, openai or anthropic.`,
    );
    process.exit(1);
  }

  return [...new Set(providers)];
}

function readModelOverride(provider) {
  const globalOverride = readEnv("EVAL_MENTOR_MODEL");

  if (globalOverride) {
    return globalOverride;
  }

  if (provider === "anthropic") {
    return readEnv("ANTHROPIC_MODEL") || null;
  }

  if (provider === "openai") {
    return readEnv("OPENAI_MODEL") || null;
  }

  return null;
}

async function loadSeedData() {
  try {
    const response = await fetch(seedEndpointUrl);
    const body = await readJson(response);

    if (!response.ok) {
      throw new Error(readSafeError(body) ?? `HTTP ${response.status}`);
    }

    if (!isNonEmptyString(body?.userId) || !isNonEmptyString(body?.mentorId)) {
      throw new Error("Seed data response was missing userId or mentorId.");
    }

    return {
      conversationId: isNonEmptyString(body?.conversationId)
        ? body.conversationId
        : null,
      mentorId: body.mentorId,
      userId: body.userId,
    };
  } catch (error) {
    console.error("Unable to load development seed data.");
    console.error(
      "Run npm run dev in one terminal and ensure the database is connected and seeded.",
    );
    console.error(toSafeErrorMessage(error));
    process.exit(1);
  }
}

async function runScenario({
  conversationId,
  evalCase,
  groupName,
  mentorId,
  scenario,
  userId,
}) {
  const startedAt = Date.now();
  const payload = {
    mentorId,
    message: scenario.text,
    userId,
    ...(conversationId ? { conversationId } : {}),
    ...(evalCase.model ? { model: evalCase.model } : {}),
    ...(evalCase.provider ? { provider: evalCase.provider } : {}),
  };

  try {
    const response = await fetch(endpointUrl, {
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const body = await readJson(response);
    const diagnostics = body?.diagnostics;
    const usage = diagnostics?.llmUsage;
    const modelRouting = usage?.modelRouting;
    const success = response.ok;
    const responseText = success
      ? sanitizeText(body?.mentorMessage?.content ?? "")
      : "";
    const responseQuality = analyzeResponseQuality(
      responseText,
      scenario.expectsMentorShape === true,
      scenario.expectsWarmAffirmation === true,
    );

    return {
      conversationId: isNonEmptyString(body?.conversation?.id)
        ? body.conversation.id
        : conversationId,
      costEstimate: readCostEstimate(usage?.costEstimate),
      errorState: success
        ? null
        : sanitizeText(
            diagnostics?.providerErrorState ??
              readSafeError(body) ??
              `http_${response.status}`,
          ),
      evalMode: evalCase.mode,
      explicitModel: evalCase.model,
      explicitProvider: evalCase.provider,
      groupName,
      inputMessage: scenario.text,
      inputTokens: readNullableNumber(usage?.inputTokens),
      latencyMs: readNullableNumber(usage?.latencyMs),
      matchedExpertise: readMatchedKnowledge(diagnostics?.matchedExpertise),
      matchedMethods: readMatchedKnowledge(diagnostics?.matchedMethods),
      matchedSources: readMatchedKnowledge(diagnostics?.matchedSources),
      model: sanitizeText(usage?.model ?? body?.model ?? "unknown"),
      outputTokens: readNullableNumber(usage?.outputTokens),
      passed: success && responseQuality.passed,
      provider: sanitizeText(
        usage?.provider ??
          diagnostics?.providerUsed ??
          body?.provider ??
          evalCase.provider ??
          "unknown",
      ),
      responsePreview: buildPreview(responseText),
      responseQuality,
      responseText,
      routeReason: sanitizeText(modelRouting?.reason ?? "Not available"),
      routeSignals: Array.isArray(modelRouting?.signals)
        ? modelRouting.signals.filter(isNonEmptyString).map(sanitizeText)
        : [],
      routeType: sanitizeText(modelRouting?.route ?? "unknown"),
      scenarioName: scenario.name,
      success,
      totalTokens: readNullableNumber(usage?.totalTokens),
      wallClockMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      conversationId,
      costEstimate: null,
      errorState: toSafeErrorMessage(error),
      evalMode: evalCase.mode,
      explicitModel: evalCase.model,
      explicitProvider: evalCase.provider,
      groupName,
      inputMessage: scenario.text,
      inputTokens: null,
      latencyMs: null,
      matchedExpertise: emptyMatchedKnowledge(),
      matchedMethods: emptyMatchedKnowledge(),
      matchedSources: emptyMatchedKnowledge(),
      model: evalCase.model ?? "unknown",
      outputTokens: null,
      passed: false,
      provider: evalCase.provider ?? "unknown",
      responsePreview: "",
      responseQuality: analyzeResponseQuality(
        "",
        scenario.expectsMentorShape === true,
        scenario.expectsWarmAffirmation === true,
      ),
      responseText: "",
      routeReason: "Request failed before model routing diagnostics were returned.",
      routeSignals: [],
      routeType: "unknown",
      scenarioName: scenario.name,
      success: false,
      totalTokens: null,
      wallClockMs: Date.now() - startedAt,
    };
  }
}

function printScenarioResult(result) {
  const status = result.passed ? "success" : "failure";

  console.log(
    `[${status}] ${result.scenarioName} | ${result.provider} / ${result.model}`,
  );
  console.log(`  group: ${result.groupName}`);
  console.log(`  route: ${result.routeType}`);
  console.log(`  route reason: ${result.routeReason}`);
  console.log(`  latencyMs: ${formatNullable(result.latencyMs)}`);
  console.log(
    `  tokens: input ${formatNullable(result.inputTokens)} / output ${formatNullable(result.outputTokens)} / total ${formatNullable(result.totalTokens)}`,
  );
  console.log(`  estimated cost: ${formatCostEstimate(result.costEstimate)}`);
  console.log(
    `  methods: ${formatMatchedKnowledge(result.matchedMethods)}`,
  );
  console.log(
    `  expertise: ${formatMatchedKnowledge(result.matchedExpertise)}`,
  );
  console.log(`  sources: ${formatMatchedKnowledge(result.matchedSources)}`);
  console.log(`  quality: ${formatResponseQuality(result.responseQuality)}`);

  if (result.success) {
    console.log(`  preview: ${result.responsePreview || "No response text."}`);
  } else {
    console.log(`  error: ${result.errorState || "Request failed safely."}`);
  }

  console.log("");
}

function readMatchedKnowledge(value) {
  if (!value || typeof value !== "object") {
    return emptyMatchedKnowledge();
  }

  return {
    count: readNullableNumber(value.count) ?? 0,
    domains: Array.isArray(value.domains)
      ? value.domains.filter(isNonEmptyString).map(sanitizeText)
      : [],
    titles: Array.isArray(value.titles)
      ? value.titles.filter(isNonEmptyString).map(sanitizeText)
      : [],
  };
}

function emptyMatchedKnowledge() {
  return {
    count: 0,
    domains: [],
    titles: [],
  };
}

function formatMatchedKnowledge(value) {
  if (value.count === 0) {
    return "none";
  }

  return `${value.count} (${value.titles.join(", ") || value.domains.join(", ")})`;
}

function readCostEstimate(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  return {
    estimatedCostUsd: readNullableNumber(value.estimatedCostUsd),
    isConfigured: value.isConfigured === true,
    message: isNonEmptyString(value.message) ? sanitizeText(value.message) : null,
  };
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
    return sanitizeText(body.error);
  }

  if (body?.errors && typeof body.errors === "object") {
    return Object.values(body.errors)
      .filter(isNonEmptyString)
      .map(sanitizeText)
      .join(" ");
  }

  return null;
}

function buildPreview(value) {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = sanitizeText(value).replace(/\s+/g, " ").trim();

  return normalized.length > 240
    ? `${normalized.slice(0, 237).trimEnd()}...`
    : normalized;
}

function analyzeResponseQuality(
  responseText,
  expectsMentorShape,
  expectsWarmAffirmation,
) {
  const bulletLineCount = responseText
    .split("\n")
    .filter((line) => /^\s*(?:[-*•]|\d+[.)])\s+/.test(line)).length;
  const questionCount = (responseText.match(/\?/g) ?? []).length;
  const wordCount = responseText.split(/\s+/).filter(Boolean).length;
  const normalizedResponse = responseText.toLowerCase();
  const genericPhrases = [
    "here are some practical tips",
    "a few things usually help",
    "one useful question",
    "it depends",
    "let's break it down",
    "believe in yourself",
    "you are amazing",
    "you've got this",
  ].filter((phrase) => normalizedResponse.includes(phrase));
  const hasWarmAffirmation =
    /\bthat makes sense\b|\bthat [^.!?\n]{0,80} makes sense\b|\b(?:it|your reaction) makes sense\b|\bthat sounds (?:difficult|exhausting|frustrating|hard|heavy|honest|painful|tiring|understandable)\b|\bthat(?:'s| is) (?:a )?(?:real|understandable|valid)\b|\byou(?:'re| are) not (?:wrong|lazy|failing|weak)\b|\b(?:good|helpful|important|useful) (?:that you|you've|you have)\b|\bno wonder\b|\bnot a character flaw\b|\bi hear (?:you|how)\b/i.test(
      responseText,
    );
  const issues = [];

  if (
    (expectsMentorShape && bulletLineCount > 0) ||
    (!expectsMentorShape && bulletLineCount > 2)
  ) {
    issues.push("list-heavy response");
  }

  if (questionCount > 1) {
    issues.push("more than one question");
  }

  if (expectsMentorShape && responseText && questionCount === 0) {
    issues.push("missing follow-up question");
  }

  if (expectsWarmAffirmation && responseText && !hasWarmAffirmation) {
    issues.push("missing warm affirmation");
  }

  if (genericPhrases.length > 0) {
    issues.push(`generic assistant phrase: ${genericPhrases.join(", ")}`);
  }

  if (wordCount > 220) {
    issues.push("response exceeds 220 words");
  }

  return {
    bulletLineCount,
    expectsMentorShape,
    expectsWarmAffirmation,
    genericPhrases,
    hasWarmAffirmation,
    issues,
    passed: responseText ? issues.length === 0 : false,
    questionCount,
    wordCount,
  };
}

function formatResponseQuality(quality) {
  if (!quality) {
    return "not available";
  }

  const warmthMetric = quality.expectsWarmAffirmation
    ? `, affirmation ${quality.hasWarmAffirmation ? "present" : "missing"}`
    : "";
  const metrics = `${quality.wordCount} words, ${quality.bulletLineCount} bullets, ${quality.questionCount} questions${warmthMetric}`;

  return quality.passed
    ? `pass (${metrics})`
    : `review (${metrics}; ${quality.issues.join(", ") || "no response"})`;
}

function readNullableNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatNullable(value) {
  return value === null ? "n/a" : String(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function readEnv(name) {
  return process.env[name]?.trim() || "";
}

function sanitizeText(value) {
  const text = typeof value === "string" ? value : String(value ?? "");

  return redactSensitiveValues(text);
}

function redactSensitiveValues(text) {
  const sensitiveVariableNames = [
    "ANTHROPIC_API_KEY",
    "DATABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "OPENAI_API_KEY",
  ];

  return sensitiveVariableNames.reduce((currentText, variableName) => {
    const secret = readEnv(variableName);

    return secret ? currentText.split(secret).join("[redacted]") : currentText;
  }, text);
}

function toSafeErrorMessage(error) {
  if (error instanceof Error) {
    return sanitizeText(error.message);
  }

  return "Unknown error.";
}

function formatEvalCase(evalCase) {
  if (evalCase.mode === "automatic-routing") {
    return "automatic routing";
  }

  return `${evalCase.provider}${evalCase.model ? ` / ${evalCase.model}` : ""}`;
}

function normalizeAppUrl(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
