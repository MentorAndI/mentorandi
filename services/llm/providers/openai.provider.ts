import type { LlmProvider } from "@/services/llm/providers/provider.interface";
import type { LlmCompletionResponse } from "@/services/llm/llm.types";

export class OpenAiLlmProvider implements LlmProvider {
  readonly name = "openai";

  async complete(): Promise<LlmCompletionResponse> {
    throw new Error(
      "OpenAI provider is not implemented yet. No network calls are configured.",
    );
  }
}
