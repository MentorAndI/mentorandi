import type { LlmCompletionRequest } from "@/services/llm/llm.types";

export function buildProviderDeveloperInput(request: LlmCompletionRequest) {
  const promptPackage = request.promptPackage;

  if (!promptPackage) {
    return [
      "Mentor Core structured context",
      formatJsonForPrompt(request.context),
      "",
      "Response instructions",
      "- Return only Marcus' response text.",
      "- Do not include analysis, labels, markdown headers or internal context.",
    ].join("\n");
  }

  return [
    formatPromptSection("Mentor identity", promptPackage.mentorIdentity),
    formatPromptSection("Conversation rules", promptPackage.conversationRules),
    formatPromptJsonSection(
      "Current environment context",
      promptPackage.environmentContext,
    ),
    formatPromptJsonSection("User memories", promptPackage.memoryContext),
    formatPromptJsonSection("Active goals", promptPackage.goalContext),
    formatPromptJsonSection(
      "Recent reflections",
      promptPackage.reflectionContext,
    ),
    formatPromptJsonSection(
      "Relevant Mentor Methods",
      promptPackage.mentorMethodContext,
    ),
    formatPromptSection("Mentor method guidance", [
      "Use these methods only when relevant.",
      "Do not mention method IDs.",
      "Do not sound formulaic.",
      "Adapt the method to the user's situation.",
    ]),
    formatPromptJsonSection(
      "Relevant Mentor Expertise",
      promptPackage.mentorExpertiseContext,
    ),
    formatPromptSection("Mentor expertise guidance", [
      "Use this expertise only when relevant.",
      "Do not mention internal profile IDs.",
      "Do not cite URLs unless the user asks for sources.",
      "Adapt expertise to the current user message.",
      "Keep the current user message highest priority.",
    ]),
    formatPromptJsonSection("Relevant Source Notes", promptPackage.sourceContext),
    formatPromptSection("Source note guidance", [
      "Use these source notes only when relevant.",
      "Do not mention URLs unless the user asks for sources.",
      "Do not pretend to have browsed the web.",
      "Adapt the principles to the user's situation.",
      "Keep the current user message highest priority.",
    ]),
    formatPromptJsonSection(
      "Recent messages",
      promptPackage.conversationContext,
    ),
    formatPromptSection(
      "Response instructions",
      promptPackage.responseInstructions,
    ),
    formatPromptSection("Constraints", promptPackage.constraints),
    "Output contract",
    "- Return only Marcus' response text.",
    "- Do not include section labels, hidden reasoning, JSON, markdown headers or internal implementation details.",
    "- Do not say you are using memories, goals, reflections, a database or Mentor Core.",
  ].join("\n\n");
}

function formatPromptSection(title: string, items: string[]) {
  return [title, ...formatListItems(items)].join("\n");
}

function formatPromptJsonSection(title: string, value: unknown) {
  return [title, formatJsonForPrompt(value)].join("\n");
}

function formatListItems(items: string[]) {
  if (items.length === 0) {
    return ["- None."];
  }

  return items.map((item) => `- ${item}`);
}

function formatJsonForPrompt(value: unknown) {
  return JSON.stringify(value, null, 2);
}
