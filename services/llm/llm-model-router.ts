import type {
  LlmProviderName,
  LlmModelRoutingDecision,
  LlmModelRouteName,
} from "@/services/llm/llm.types";
import type { MentorResponseContext } from "@/services/mentor-core/context-builder/context-builder.types";

interface ResolveLlmModelRouteInput {
  context: MentorResponseContext;
  provider: LlmProviderName;
  requestedModel?: string;
}

const directQuestionPattern =
  /^(what|where|when|who|which|how many|how much|is|are|can|do|does)\b/i;
const deepReflectionPattern =
  /\b(i want to become|i want to change|my goal is|i am trying to|i'm trying to|i struggle|struggling|overthinking|stuck|lost|burned out|burnt out|anxious|anxiety|depressed|depression|identity|purpose|meaning|relationship|grief|ashamed|shame|afraid|fear|help me understand|why do i|what should i do with my life)\b/i;
const riskPattern =
  /\b(diagnose|medical|mental health|legal|financial|investment|emergency|self harm|suicide|hurt myself|hurt someone)\b/i;
const factualPattern =
  /\b(today|date|time|day|weather|where am i|places|visit|city|country|restaurant|museum|beach|capital|define|explain)\b/i;
const dailyChatPattern =
  /\b(hi|hello|thanks|thank you|quick update|just checking|working on|finished|started|today)\b/i;

export function resolveLlmModelRoute({
  context,
  provider,
  requestedModel,
}: ResolveLlmModelRouteInput): LlmModelRoutingDecision {
  const explicitModel = requestedModel?.trim();

  if (explicitModel) {
    return {
      model: explicitModel,
      reason: "Explicit model was provided by the caller.",
      route: "explicit",
      signals: ["explicit-model"],
      wasExplicitModel: true,
    };
  }

  if (provider === "mock") {
    return {
      model: undefined,
      reason: "Mock provider keeps its deterministic model behavior.",
      route: "mock",
      signals: ["mock-provider"],
      wasExplicitModel: false,
    };
  }

  const currentMessage = context.currentUserMessage?.trim() || "";
  const normalizedMessage = currentMessage.toLowerCase();
  const signals = collectRoutingSignals(normalizedMessage);
  const route = chooseModelRoute(normalizedMessage, signals);
  const model = readModelForRoute(route);

  return {
    model,
    reason: buildRoutingReason(route, signals, Boolean(model)),
    route,
    signals,
    wasExplicitModel: false,
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

  if (directQuestionPattern.test(message)) {
    signals.push("direct-question");
  }

  if (factualPattern.test(message)) {
    signals.push("factual-or-simple");
  }

  if (dailyChatPattern.test(message)) {
    signals.push("daily-chat");
  }

  if (message.length > 500) {
    signals.push("long-message");
  }

  return signals.length > 0 ? signals : ["general-mentor-message"];
}

function chooseModelRoute(
  message: string,
  signals: string[],
): LlmModelRouteName {
  if (
    signals.includes("risk-sensitive") ||
    signals.includes("deep-reflection") ||
    signals.includes("long-message")
  ) {
    return "deep";
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

function readModelForRoute(route: LlmModelRouteName) {
  if (route === "cheap") {
    return (
      process.env.LLM_CHEAP_MODEL?.trim() ||
      process.env.LLM_DEFAULT_MODEL?.trim() ||
      undefined
    );
  }

  if (route === "deep") {
    return (
      process.env.LLM_DEEP_MODEL?.trim() ||
      process.env.LLM_DEFAULT_MODEL?.trim() ||
      undefined
    );
  }

  if (route === "default") {
    return process.env.LLM_DEFAULT_MODEL?.trim() || undefined;
  }

  return undefined;
}

function buildRoutingReason(
  route: LlmModelRouteName,
  signals: string[],
  hasRouteModel: boolean,
) {
  const modelSource = hasRouteModel
    ? "using the configured route model"
    : "falling back to the provider default model";

  if (route === "cheap") {
    return `Simple or factual message detected; ${modelSource}.`;
  }

  if (route === "deep") {
    return `Deep, complex or risk-sensitive message detected; ${modelSource}.`;
  }

  return `General mentor message detected from signals (${signals.join(", ")}); ${modelSource}.`;
}
