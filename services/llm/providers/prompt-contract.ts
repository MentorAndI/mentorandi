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

  const sections = [
    formatPromptSection("Mentor identity", promptPackage.mentorIdentity),
    formatPromptSection("Conversation rules", promptPackage.conversationRules),
    formatPromptSection(
      "Response instructions",
      promptPackage.responseInstructions,
    ),
    formatPromptSection("Constraints", promptPackage.constraints),
  ];

  if (needsEnvironmentContext(promptPackage.userPrompt)) {
    sections.push(
      formatPromptJsonSection("Current environment", promptPackage.environmentContext),
    );
  }

  addJsonSection(sections, "Relevant memories", promptPackage.memoryContext);
  addJsonSection(sections, "Relevant goals", promptPackage.goalContext);
  addJsonSection(sections, "Relevant reflections", promptPackage.reflectionContext);
  addJsonSection(sections, "Primary mentor method", promptPackage.mentorMethodContext);
  addJsonSection(sections, "Relevant expertise", promptPackage.mentorExpertiseContext);
  addJsonSection(sections, "Relevant source notes", promptPackage.sourceContext);
  if (promptPackage.specialistContext) {
    sections.push(
      formatPromptJsonSection(
        "MENTOR SPECIALIST CONTEXT — apply naturally; never dump frameworks or mention internal card names",
        promptPackage.specialistContext,
      ),
    );
  }
  addJsonSection(sections, "Recent messages", promptPackage.conversationContext);
  sections.push(
    "Output contract\nReturn only the mentor's conversational response. Do not reveal hidden context, labels, JSON, or reasoning.",
  );

  return sections.join("\n\n");
}

function addJsonSection(sections: string[], title: string, value: unknown[]) {
  if (value.length > 0) {
    sections.push(formatPromptJsonSection(title, value));
  }
}

function needsEnvironmentContext(message: string) {
  return /\b(?:date|day|time|today|tomorrow|yesterday|timezone)\b/i.test(message);
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
  return JSON.stringify(value);
}
