import type { LlmProvider } from "@/services/llm/providers/provider.interface";
import type {
  LlmCompletionRequest,
  LlmCompletionResponse,
} from "@/services/llm/llm.types";

export class MockLlmProvider implements LlmProvider {
  readonly name = "mock";

  async complete(
    request: LlmCompletionRequest,
  ): Promise<LlmCompletionResponse> {
    const mentorName = request.context.mentor.name;
    const focus = request.context.recommendedMentorFocus.priorities.join(", ");

    return {
      content: `Mock response from ${mentorName}. Focus: ${focus}.`,
      metadata: {
        model: request.model ?? "mock-deterministic-v1",
        provider: this.name,
      },
    };
  }
}
