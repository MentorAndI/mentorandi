import type { MentorResponseContext } from "@/services/mentor-core/context-builder/context-builder.types";
import type { PromptPackage } from "@/services/mentor-core/prompt-composer/prompt-composer.types";

export type LlmProviderName = "mock" | "openai" | "anthropic";

export interface LlmCompletionRequest {
  context: MentorResponseContext;
  model?: string;
  provider?: LlmProviderName;
  promptPackage?: PromptPackage;
  systemPrompt: string;
  temperature?: number;
  userMessage: string;
}

export interface LlmCompletionResponse {
  content: string;
  createdAt?: string;
  metadata: {
    inputTokens?: number;
    latencyMs?: number;
    model: string;
    outputTokens?: number;
    provider: LlmProviderName;
    selectedProvider?: LlmProviderName;
    totalTokens?: number;
  };
  raw?: unknown;
}

export interface LlmValidationResult<TInput> {
  errors: Record<string, string>;
  input?: TInput;
  isValid: boolean;
}
