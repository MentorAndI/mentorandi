import type { LlmProvider } from "@/services/llm/providers/provider.interface";
import type {
  LlmCompletionRequest,
  LlmCompletionResponse,
} from "@/services/llm/llm.types";

const openAiResponsesUrl = "https://api.openai.com/v1/responses";

interface OpenAiResponseOutputText {
  text?: unknown;
  type?: unknown;
}

interface OpenAiResponseOutputMessage {
  content?: unknown;
  type?: unknown;
}

interface OpenAiResponsesApiResponse {
  created_at?: unknown;
  error?: {
    message?: string;
  } | null;
  model?: unknown;
  output?: unknown;
  output_text?: unknown;
}

export class OpenAiLlmProvider implements LlmProvider {
  readonly name = "openai";

  async complete(
    request: LlmCompletionRequest,
  ): Promise<LlmCompletionResponse> {
    const config = getOpenAiConfig();
    const model = request.model?.trim() || config.model;

    const response = await fetch(openAiResponsesUrl, {
      body: JSON.stringify({
        input: [
          {
            content: [
              {
                text: buildOpenAiDeveloperInput(request),
                type: "input_text",
              },
            ],
            role: "developer",
          },
          {
            content: [
              {
                text: `Current user message:\n${request.userMessage}`,
                type: "input_text",
              },
            ],
            role: "user",
          },
        ],
        instructions: request.systemPrompt,
        model,
        store: false,
        ...(request.temperature !== undefined
          ? { temperature: request.temperature }
          : {}),
      }),
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const responseBody = (await response.json().catch(() => null)) as
      | OpenAiResponsesApiResponse
      | null;

    if (!response.ok) {
      throw new Error(
        `OpenAI request failed: ${readOpenAiErrorMessage(responseBody, response.status)}`,
      );
    }

    if (!responseBody) {
      throw new Error("OpenAI request failed: response body was empty.");
    }

    const content = extractOpenAiText(responseBody);

    if (!content) {
      throw new Error("OpenAI response did not include text output.");
    }

    return {
      content,
      createdAt: readOpenAiCreatedAt(responseBody),
      metadata: {
        model: readOpenAiModel(responseBody, model),
        provider: this.name,
      },
      raw: responseBody,
    };
  }
}

function buildOpenAiDeveloperInput(request: LlmCompletionRequest) {
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
  return [
    title,
    ...formatListItems(items),
  ].join("\n");
}

function formatPromptJsonSection(title: string, value: unknown) {
  return [
    title,
    formatJsonForPrompt(value),
  ].join("\n");
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

function getOpenAiConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_MODEL?.trim();

  if (!apiKey) {
    throw new Error("Missing OpenAI configuration: OPENAI_API_KEY is required.");
  }

  if (!model) {
    throw new Error("Missing OpenAI configuration: OPENAI_MODEL is required.");
  }

  return {
    apiKey,
    model,
  };
}

function extractOpenAiText(response: OpenAiResponsesApiResponse) {
  if (typeof response.output_text === "string") {
    return response.output_text.trim();
  }

  if (!Array.isArray(response.output)) {
    return "";
  }

  return response.output
    .flatMap((outputItem) => readOutputMessageContent(outputItem))
    .filter(Boolean)
    .join("\n")
    .trim();
}

function readOutputMessageContent(outputItem: unknown) {
  if (!isOpenAiOutputMessage(outputItem) || !Array.isArray(outputItem.content)) {
    return [];
  }

  return outputItem.content
    .map((contentItem) => {
      if (!isOpenAiOutputText(contentItem)) {
        return "";
      }

      return typeof contentItem.text === "string" ? contentItem.text : "";
    })
    .filter(Boolean);
}

function isOpenAiOutputMessage(
  value: unknown,
): value is OpenAiResponseOutputMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "message"
  );
}

function isOpenAiOutputText(value: unknown): value is OpenAiResponseOutputText {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "output_text"
  );
}

function readOpenAiModel(response: OpenAiResponsesApiResponse, fallback: string) {
  return typeof response.model === "string" && response.model.trim()
    ? response.model
    : fallback;
}

function readOpenAiCreatedAt(response: OpenAiResponsesApiResponse) {
  return typeof response.created_at === "number"
    ? new Date(response.created_at * 1000).toISOString()
    : new Date().toISOString();
}

function readOpenAiErrorMessage(
  responseBody: OpenAiResponsesApiResponse | null,
  status: number,
) {
  return responseBody?.error?.message ?? `HTTP ${status}`;
}
