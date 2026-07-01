import type { MentorResponseContext } from "@/services/mentor-core/context-builder/context-builder.types";

export type LlmProviderName = "mock" | "openai" | "anthropic";

export interface LlmCompletionRequest {
  context: MentorResponseContext;
  model?: string;
  provider: LlmProviderName;
  systemPrompt: string;
  temperature?: number;
  userMessage: string;
}

export interface LlmCompletionResponse {
  content: string;
  metadata: {
    model: string;
    provider: LlmProviderName;
  };
}

export interface LlmValidationResult<TInput> {
  errors: Record<string, string>;
  input?: TInput;
  isValid: boolean;
}
