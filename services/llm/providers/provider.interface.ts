import type {
  LlmCompletionRequest,
  LlmCompletionResponse,
  LlmProviderName,
} from "@/services/llm/llm.types";

export interface LlmProvider {
  readonly name: LlmProviderName;
  complete(request: LlmCompletionRequest): Promise<LlmCompletionResponse>;
}
