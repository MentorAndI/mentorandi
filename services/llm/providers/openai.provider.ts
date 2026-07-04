import type { LlmProvider } from "@/services/llm/providers/provider.interface";
import type {
  LlmCompletionRequest,
  LlmCompletionResponse,
} from "@/services/llm/llm.types";
import { getLlmCostControls } from "@/services/llm/llm-cost-controls";
import { buildProviderDeveloperInput } from "@/services/llm/providers/prompt-contract";

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
  usage?: {
    completion_tokens?: unknown;
    input_tokens?: unknown;
    output_tokens?: unknown;
    prompt_tokens?: unknown;
    total_tokens?: unknown;
  } | null;
}

export class OpenAiLlmProvider implements LlmProvider {
  readonly name = "openai";

  async complete(
    request: LlmCompletionRequest,
  ): Promise<LlmCompletionResponse> {
    const config = getOpenAiConfig();
    const controls = getLlmCostControls();
    const model = request.model?.trim() || config.model;
    const startedAt = Date.now();

    const response = await fetch(openAiResponsesUrl, {
      body: JSON.stringify({
        input: [
          {
            content: [
              {
                text: buildProviderDeveloperInput(request),
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
        max_output_tokens: controls.maxOutputTokens,
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
    const latencyMs = Date.now() - startedAt;

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
        ...readOpenAiUsage(responseBody),
        latencyMs,
        maxOutputTokens: controls.maxOutputTokens,
        model: readOpenAiModel(responseBody, model),
        provider: this.name,
      },
      raw: responseBody,
    };
  }
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

function readOpenAiUsage(response: OpenAiResponsesApiResponse) {
  const inputTokens =
    readNumber(response.usage?.input_tokens) ??
    readNumber(response.usage?.prompt_tokens);
  const outputTokens =
    readNumber(response.usage?.output_tokens) ??
    readNumber(response.usage?.completion_tokens);
  const totalTokens =
    readNumber(response.usage?.total_tokens) ??
    (inputTokens !== undefined && outputTokens !== undefined
      ? inputTokens + outputTokens
      : undefined);

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

function readOpenAiErrorMessage(
  responseBody: OpenAiResponsesApiResponse | null,
  status: number,
) {
  return responseBody?.error?.message ?? `HTTP ${status}`;
}
