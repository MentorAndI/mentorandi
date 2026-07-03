import type { LlmProvider } from "@/services/llm/providers/provider.interface";
import type {
  LlmCompletionRequest,
  LlmCompletionResponse,
} from "@/services/llm/llm.types";
import { buildProviderDeveloperInput } from "@/services/llm/providers/prompt-contract";

const anthropicMessagesUrl = "https://api.anthropic.com/v1/messages";
const anthropicVersion = "2023-06-01";
const defaultMaxTokens = 800;

interface AnthropicContentBlock {
  text?: unknown;
  type?: unknown;
}

interface AnthropicMessagesApiResponse {
  content?: unknown;
  error?: {
    message?: string;
  } | null;
  model?: unknown;
}

export class AnthropicLlmProvider implements LlmProvider {
  readonly name = "anthropic";

  async complete(
    request: LlmCompletionRequest,
  ): Promise<LlmCompletionResponse> {
    const config = getAnthropicConfig();
    const model = request.model?.trim() || config.model;

    const response = await fetch(anthropicMessagesUrl, {
      body: JSON.stringify({
        max_tokens: defaultMaxTokens,
        messages: [
          {
            content: [
              {
                text: `Current user message:\n${request.userMessage}`,
                type: "text",
              },
            ],
            role: "user",
          },
        ],
        model,
        system: buildAnthropicSystemPrompt(request),
        ...(request.temperature !== undefined
          ? { temperature: request.temperature }
          : {}),
      }),
      headers: {
        "anthropic-version": anthropicVersion,
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
      },
      method: "POST",
    });

    const responseBody = (await response.json().catch(() => null)) as
      | AnthropicMessagesApiResponse
      | null;

    if (!response.ok) {
      throw new Error(
        `Anthropic request failed: ${readAnthropicErrorMessage(responseBody, response.status)}`,
      );
    }

    if (!responseBody) {
      throw new Error("Anthropic request failed: response body was empty.");
    }

    const content = extractAnthropicText(responseBody);

    if (!content) {
      throw new Error("Anthropic response did not include text output.");
    }

    return {
      content,
      createdAt: new Date().toISOString(),
      metadata: {
        model: readAnthropicModel(responseBody, model),
        provider: this.name,
      },
      raw: responseBody,
    };
  }
}

function buildAnthropicSystemPrompt(request: LlmCompletionRequest) {
  return [
    request.systemPrompt,
    "",
    buildProviderDeveloperInput(request),
  ].join("\n");
}

function getAnthropicConfig() {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  const model = process.env.ANTHROPIC_MODEL?.trim();

  if (!apiKey) {
    throw new Error(
      "Missing Anthropic configuration: ANTHROPIC_API_KEY is required.",
    );
  }

  if (!model) {
    throw new Error(
      "Missing Anthropic configuration: ANTHROPIC_MODEL is required.",
    );
  }

  return {
    apiKey,
    model,
  };
}

function extractAnthropicText(response: AnthropicMessagesApiResponse) {
  if (!Array.isArray(response.content)) {
    return "";
  }

  return response.content
    .map((contentItem) => {
      if (!isAnthropicContentBlock(contentItem)) {
        return "";
      }

      return typeof contentItem.text === "string" ? contentItem.text : "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

function isAnthropicContentBlock(
  value: unknown,
): value is AnthropicContentBlock {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "text"
  );
}

function readAnthropicModel(
  response: AnthropicMessagesApiResponse,
  fallback: string,
) {
  return typeof response.model === "string" && response.model.trim()
    ? response.model
    : fallback;
}

function readAnthropicErrorMessage(
  responseBody: AnthropicMessagesApiResponse | null,
  status: number,
) {
  return responseBody?.error?.message ?? `HTTP ${status}`;
}
