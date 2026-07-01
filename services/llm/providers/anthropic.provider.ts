import type { LlmProvider } from "@/services/llm/providers/provider.interface";
import type { LlmCompletionResponse } from "@/services/llm/llm.types";

export class AnthropicLlmProvider implements LlmProvider {
  readonly name = "anthropic";

  async complete(): Promise<LlmCompletionResponse> {
    throw new Error(
      "Anthropic provider is not implemented yet. No network calls are configured.",
    );
  }
}
