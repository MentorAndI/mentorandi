import type {
  LlmProviderName,
  LlmModelRoutingDecision,
  LlmModelRouteName,
} from "@/services/llm/llm.types";
import type { MentorResponseContext } from "@/services/mentor-core/context-builder/context-builder.types";

type AutomaticLlmModelRouteName = Extract<
  LlmModelRouteName,
  "cheap" | "deep" | "default"
>;

interface ResolveLlmModelRouteInput {
  context: MentorResponseContext;
  requestedProvider?: LlmProviderName;
  requestedModel?: string;
}

const directQuestionPattern =
  /^(what|where|when|who|which|how many|how much|is|are|can|do|does)\b/i;
const deepReflectionPattern =
  /\b(i want to become|i want to change|my goal is|i am trying to|i'm trying to|i struggle|struggling|lost|burned out|burnt out|anxious|anxiety|depressed|depression|identity|purpose|meaning|relationship|grief|ashamed|shame|afraid|fear|help me understand|why do i|what should i do with my life|life direction|who am i|difficult decision|personal decision)\b/i;
const complexOverthinkingPattern =
  /\b(keep overthinking|same decision|again and again|stuck in a loop|spiral|spiraling|ruminating|rumination|can't stop thinking|cannot stop thinking|replaying)\b/i;
const repeatedPattern =
  /\b(always|again|keeps happening|pattern|same thing|every time|repeatedly|repeating)\b/i;
const riskPattern =
  /\b(diagnose|medical|mental health|legal|financial|investment|emergency|self harm|suicide|hurt myself|hurt someone)\b/i;
const factualPattern =
  /\b(today|date|time|day|weather|where am i|places|visit|city|country|restaurant|museum|beach|capital|define|explain)\b/i;
const dailyChatPattern =
  /\b(hi|hello|thanks|thank you|quick update|just checking|working on|finished|started|today)\b/i;
const simpleProductivityPattern =
  /\b(what should i focus on today|focus on today|focus today|what should i do today|next task|priority today|productive|productivity)\b/i;
const adhdTechniquePattern =
  /\b(adhd|can't get started|cannot get started|cant get started|task initiation|body doubling|time box|time boxing|distracted|procrastinating|procrastination)\b/i;

export function resolveLlmModelRoute({
  context,
  requestedProvider,
  requestedModel,
}: ResolveLlmModelRouteInput): LlmModelRoutingDecision {
  const explicitModel = requestedModel?.trim();
  const explicitProvider = requestedProvider;

  if (explicitModel) {
    const explicitModelProvider =
      explicitProvider ?? readRouteConfig("default").provider ?? readFallbackProvider();

    return {
      model: explicitModel,
      provider: explicitModelProvider,
      reason: "Explicit model was provided by the caller.",
      route: "explicit",
      signals: ["explicit-model"],
      wasExplicitModel: true,
      wasExplicitProvider: Boolean(explicitProvider),
    };
  }

  if (explicitProvider === "mock") {
    return {
      model: undefined,
      provider: "mock",
      reason: "Mock provider keeps its deterministic model behavior.",
      route: "mock",
      signals: ["mock-provider"],
      wasExplicitModel: false,
      wasExplicitProvider: true,
    };
  }

  const currentMessage = context.currentUserMessage?.trim() || "";
  const normalizedMessage = currentMessage.toLowerCase();
  const signals = collectRoutingSignals(normalizedMessage);
  const route = chooseModelRoute(normalizedMessage, signals);
  const routeConfig = readRouteConfig(route);
  const provider = explicitProvider ?? routeConfig.provider ?? readFallbackProvider();
  const model = readModelForRoute({
    explicitProvider,
    provider,
    route,
    routeConfig,
  });

  return {
    model,
    provider,
    reason: buildRoutingReason({
      hasRouteModel: Boolean(model),
      provider,
      route,
      signals,
      usedRouteProvider: !explicitProvider && routeConfig.provider === provider,
    }),
    route,
    signals,
    wasExplicitModel: false,
    wasExplicitProvider: Boolean(explicitProvider),
  };
}

function collectRoutingSignals(message: string) {
  const signals: string[] = [];

  if (riskPattern.test(message)) {
    signals.push("risk-sensitive");
  }

  if (deepReflectionPattern.test(message)) {
    signals.push("deep-reflection");
  }

  if (complexOverthinkingPattern.test(message)) {
    signals.push("complex-overthinking");
  }

  if (repeatedPattern.test(message)) {
    signals.push("repeated-pattern");
  }

  if (directQuestionPattern.test(message)) {
    signals.push("direct-question");
  }

  if (factualPattern.test(message)) {
    signals.push("factual-or-simple");
  }

  if (dailyChatPattern.test(message)) {
    signals.push("daily-chat");
  }

  if (simpleProductivityPattern.test(message)) {
    signals.push("simple-productivity");
  }

  if (adhdTechniquePattern.test(message)) {
    signals.push("adhd-technique");
  }

  if (message.length > 500) {
    signals.push("long-message");
  }

  return signals.length > 0 ? signals : ["general-mentor-message"];
}

function chooseModelRoute(
  message: string,
  signals: string[],
): AutomaticLlmModelRouteName {
  if (
    signals.includes("risk-sensitive") ||
    signals.includes("deep-reflection") ||
    signals.includes("complex-overthinking") ||
    signals.includes("repeated-pattern") ||
    signals.includes("long-message")
  ) {
    return "deep";
  }

  if (
    signals.includes("simple-productivity") ||
    signals.includes("adhd-technique")
  ) {
    return "cheap";
  }

  if (
    signals.includes("direct-question") &&
    signals.includes("factual-or-simple")
  ) {
    return "cheap";
  }

  if (signals.includes("daily-chat") && message.length <= 280) {
    return process.env.LLM_CHEAP_MODEL?.trim() ? "cheap" : "default";
  }

  return "default";
}

function readModelForRoute(input: {
  explicitProvider?: LlmProviderName;
  provider?: LlmProviderName;
  route: LlmModelRouteName;
  routeConfig: RouteConfig;
}) {
  if (
    input.routeConfig.model &&
    (!input.explicitProvider || input.routeConfig.provider === input.provider)
  ) {
    return input.routeConfig.model;
  }

  if (!input.explicitProvider && input.route !== "default") {
    const defaultRouteConfig = readRouteConfig("default");

    if (
      defaultRouteConfig.model &&
      (!defaultRouteConfig.provider ||
        defaultRouteConfig.provider === input.provider)
    ) {
      return defaultRouteConfig.model;
    }
  }

  return undefined;
}

function buildRoutingReason(input: {
  hasRouteModel: boolean;
  provider?: LlmProviderName;
  route: LlmModelRouteName;
  signals: string[];
  usedRouteProvider: boolean;
}) {
  const modelSource = input.hasRouteModel
    ? "using the configured route model"
    : "falling back to the provider default model";
  const providerSource = input.usedRouteProvider
    ? ` and routed provider ${input.provider}`
    : input.provider
      ? ` with provider ${input.provider}`
      : "";

  if (input.route === "cheap") {
    return `Simple, factual or practical message detected; ${modelSource}${providerSource}.`;
  }

  if (input.route === "deep") {
    return `Deep, complex or emotionally weighted mentor moment detected; ${modelSource}${providerSource}.`;
  }

  return `General daily mentor message detected from signals (${input.signals.join(", ")}); ${modelSource}${providerSource}.`;
}

interface RouteConfig {
  model?: string;
  provider?: LlmProviderName;
}

function readRouteConfig(route: "cheap" | "deep" | "default"): RouteConfig {
  if (route === "cheap") {
    return {
      model: readEnv("LLM_CHEAP_MODEL"),
      provider: readConfiguredProvider("LLM_CHEAP_PROVIDER"),
    };
  }

  if (route === "deep") {
    return {
      model: readEnv("LLM_DEEP_MODEL"),
      provider: readConfiguredProvider("LLM_DEEP_PROVIDER"),
    };
  }

  return {
    model: readEnv("LLM_DEFAULT_MODEL"),
    provider: readConfiguredProvider("LLM_DEFAULT_PROVIDER"),
  };
}

function readFallbackProvider() {
  return readConfiguredProvider("LLM_PROVIDER");
}

function readConfiguredProvider(name: string): LlmProviderName | undefined {
  const value = readEnv(name)?.toLowerCase();

  if (value === "anthropic" || value === "mock" || value === "openai") {
    return value;
  }

  return undefined;
}

function readEnv(name: string) {
  return process.env[name]?.trim() || undefined;
}
