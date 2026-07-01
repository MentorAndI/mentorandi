import type {
  LlmCompletionRequest,
  LlmProviderName,
  LlmValidationResult,
} from "@/services/llm/llm.types";

const supportedProviders: LlmProviderName[] = ["mock", "openai", "anthropic"];
const maxPromptLength = 20000;
const maxUserMessageLength = 10000;

export function validateLlmCompletionRequest(
  request: LlmCompletionRequest,
): LlmValidationResult<LlmCompletionRequest> {
  const errors: Record<string, string> = {};

  if (!supportedProviders.includes(request.provider)) {
    errors.provider = "Provider must be mock, openai, or anthropic.";
  }

  if (!request.systemPrompt.trim()) {
    errors.systemPrompt = "System prompt is required.";
  } else if (request.systemPrompt.length > maxPromptLength) {
    errors.systemPrompt = `System prompt must be ${maxPromptLength} characters or fewer.`;
  }

  if (!request.userMessage.trim()) {
    errors.userMessage = "User message is required.";
  } else if (request.userMessage.length > maxUserMessageLength) {
    errors.userMessage = `User message must be ${maxUserMessageLength} characters or fewer.`;
  }

  if (!request.context) {
    errors.context = "Structured mentor context is required.";
  }

  if (
    request.temperature !== undefined &&
    (request.temperature < 0 || request.temperature > 2)
  ) {
    errors.temperature = "Temperature must be between 0 and 2.";
  }

  return {
    errors,
    input: Object.keys(errors).length === 0 ? request : undefined,
    isValid: Object.keys(errors).length === 0,
  };
}
