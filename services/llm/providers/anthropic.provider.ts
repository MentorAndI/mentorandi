import type { LlmProvider } from "@/services/llm/providers/provider.interface";
import type {
  LlmCompletionRequest,
  LlmCompletionResponse,
} from "@/services/llm/llm.types";
import { getLlmCostControls } from "@/services/llm/llm-cost-controls";
import { buildProviderDeveloperInput } from "@/services/llm/providers/prompt-contract";

const anthropicMessagesUrl = "https://api.anthropic.com/v1/messages";
const anthropicVersion = "2023-06-01";

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
  usage?: {
    input_tokens?: unknown;
    output_tokens?: unknown;
  } | null;
}

export class AnthropicLlmProvider implements LlmProvider {
  readonly name = "anthropic";

  async complete(
    request: LlmCompletionRequest,
  ): Promise<LlmCompletionResponse> {
    const config = getAnthropicConfig(request.model);
    const controls = getLlmCostControls();
    const model = request.model?.trim() || config.model;
    const startedAt = Date.now();

    const response = await fetch(anthropicMessagesUrl, {
      body: JSON.stringify({
        max_tokens: controls.maxOutputTokens,
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
        ...buildAnthropicSamplingParameters(request, model),
      }),
      headers: {
        "anthropic-version": anthropicVersion,
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
      },
      method: "POST",
    });
    const latencyMs = Date.now() - startedAt;

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
        ...readAnthropicUsage(responseBody),
        latencyMs,
        maxOutputTokens: controls.maxOutputTokens,
        model: readAnthropicModel(responseBody, model),
        provider: this.name,
      },
      raw: responseBody,
    };
  }
}

function buildAnthropicSamplingParameters(
  request: LlmCompletionRequest,
  model: string,
) {
  if (isSonnet5Model(model)) {
    return {};
  }

  return request.temperature !== undefined
    ? { temperature: request.temperature }
    : {};
}

function isSonnet5Model(model: string) {
  return model.toLowerCase().includes("sonnet-5");
}

function buildAnthropicSystemPrompt(request: LlmCompletionRequest) {
  return [
    request.systemPrompt,
    "",
    buildProviderDeveloperInput(request),
  ].join("\n");
}

function getAnthropicConfig(requestedModel?: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  const model = process.env.ANTHROPIC_MODEL?.trim();

  if (!apiKey) {
    throw new Error(
      "Missing Anthropic configuration: ANTHROPIC_API_KEY is required.",
    );
  }

  if (!model && !requestedModel?.trim()) {
    throw new Error(
      "Missing Anthropic configuration: ANTHROPIC_MODEL is required.",
    );
  }

  return {
    apiKey,
    model: model || requestedModel?.trim() || "",
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

function readAnthropicUsage(response: AnthropicMessagesApiResponse) {
  const inputTokens = readNumber(response.usage?.input_tokens);
  const outputTokens = readNumber(response.usage?.output_tokens);
  const totalTokens =
    inputTokens !== undefined && outputTokens !== undefined
      ? inputTokens + outputTokens
      : undefined;

  return {
    ...(inputTokens !== undefined ? { inputTokens } : {}),
    ...(outputTokens !== undefined ? { outputTokens } : {}),
    ...(totalTokens !== undefined ? { totalTokens } : {}),
  };
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function readAnthropicErrorMessage(
  responseBody: AnthropicMessagesApiResponse | null,
  status: number,
) {
  return responseBody?.error?.message ?? `HTTP ${status}`;
}
