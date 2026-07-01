import { AnthropicLlmProvider } from "@/services/llm/providers/anthropic.provider";
import { MockLlmProvider } from "@/services/llm/providers/mock.provider";
import { OpenAiLlmProvider } from "@/services/llm/providers/openai.provider";
import type { LlmProvider } from "@/services/llm/providers/provider.interface";
import type {
  LlmCompletionRequest,
  LlmCompletionResponse,
  LlmProviderName,
} from "@/services/llm/llm.types";
import { validateLlmCompletionRequest } from "@/services/llm/llm.validators";

export class LlmServiceError extends Error {
  constructor(message: string) {
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
      );
    }

    const provider = this.providers[validation.input.provider];

    if (!provider) {
      throw new LlmServiceError(
        `LLM provider "${validation.input.provider}" is not configured.`,
      );
    }

    return provider.complete(validation.input);
  }
}
