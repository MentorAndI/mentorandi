import { AnthropicLlmProvider } from "@/services/llm/providers/anthropic.provider";
import {
  LlmProviderSelectionService,
  LlmProviderSelectionServiceError,
} from "@/services/llm/llm-provider-selection.service";
import { MockLlmProvider } from "@/services/llm/providers/mock.provider";
import { OpenAiLlmProvider } from "@/services/llm/providers/openai.provider";
import { getLlmCostControls } from "@/services/llm/llm-cost-controls";
import { resolveLlmModelRoute } from "@/services/llm/llm-model-router";
import type { LlmProvider } from "@/services/llm/providers/provider.interface";
import type {
  LlmCompletionRequest,
  LlmCompletionResponse,
  LlmProviderName,
} from "@/services/llm/llm.types";
import { validateLlmCompletionRequest } from "@/services/llm/llm.validators";

export type LlmProviderErrorState =
  | "configuration_error"
  | "provider_request_failed";

export class LlmServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 500,
    public readonly selectedProvider?: LlmProviderName,
    public readonly providerErrorState?: LlmProviderErrorState,
  ) {
    super(message);
    this.name = "LlmServiceError";
  }
}

export class LlmService {
  private readonly providers: Record<LlmProviderName, LlmProvider>;

  constructor(
    providers: Record<LlmProviderName, LlmProvider> = {
      anthropic: new AnthropicLlmProvider(),
      mock: new MockLlmProvider(),
      openai: new OpenAiLlmProvider(),
    },
    private readonly providerSelection = new LlmProviderSelectionService(),
  ) {
    this.providers = providers;
  }

  async complete(
    request: LlmCompletionRequest,
  ): Promise<LlmCompletionResponse> {
    const validation = validateLlmCompletionRequest(request);

    if (!validation.isValid || !validation.input) {
      throw new LlmServiceError(
        `Invalid LLM request: ${Object.values(validation.errors).join(" ")}`,
        400,
      );
    }

    const selectedProvider = this.resolveProvider(validation.input.provider);
    const provider = this.providers[selectedProvider];
    const modelRouting = resolveLlmModelRoute({
      context: validation.input.context,
      provider: selectedProvider,
      requestedModel: validation.input.model,
    });

    if (!provider) {
      throw new LlmServiceError(
        `LLM provider "${selectedProvider}" is not configured.`,
        500,
        selectedProvider,
        "configuration_error",
      );
    }

    try {
      const response = await provider.complete({
        ...validation.input,
        ...(modelRouting.model ? { model: modelRouting.model } : {}),
        provider: selectedProvider,
      });

      return {
        ...response,
        metadata: {
          maxOutputTokens: getLlmCostControls().maxOutputTokens,
          modelRouting,
          ...response.metadata,
          selectedProvider,
        },
      };
    } catch (error) {
      const providerErrorState = classifyProviderError(error);

      logProviderError(selectedProvider, error, providerErrorState);

      throw new LlmServiceError(
        getSafeProviderErrorMessage(providerErrorState),
        500,
        selectedProvider,
        providerErrorState,
      );
    }
  }

  private resolveProvider(requestedProvider?: LlmProviderName) {
    try {
      return this.providerSelection.resolveProvider(requestedProvider);
    } catch (error) {
      if (error instanceof LlmProviderSelectionServiceError) {
        logProviderError(
          requestedProvider ?? "unknown",
          error,
          "configuration_error",
        );

        throw new LlmServiceError(
          "LLM provider is not configured correctly.",
          500,
          requestedProvider,
          "configuration_error",
        );
      }

      throw error;
    }
  }
}

function classifyProviderError(error: unknown): LlmProviderErrorState {
  if (
    error instanceof Error &&
    error.message.toLowerCase().includes("configuration")
  ) {
    return "configuration_error";
  }

  return "provider_request_failed";
}

function getSafeProviderErrorMessage(errorState: LlmProviderErrorState) {
  if (errorState === "configuration_error") {
    return "LLM provider is not configured correctly.";
  }

  return "LLM provider request failed.";
}

function logProviderError(
  provider: LlmProviderName | "unknown",
  error: unknown,
  errorState: LlmProviderErrorState,
) {
  console.error("[llm] Provider error", {
    error: error instanceof Error ? error.message : "Unknown provider error.",
    errorState,
    provider,
  });
}
