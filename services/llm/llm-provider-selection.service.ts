import type { LlmProviderName } from "@/services/llm/llm.types";

export type ConfiguredLlmProviderName = Extract<
  LlmProviderName,
  "mock" | "openai"
>;

const configuredProviders: ConfiguredLlmProviderName[] = ["mock", "openai"];

export class LlmProviderSelectionServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LlmProviderSelectionServiceError";
  }
}

export class LlmProviderSelectionService {
  resolveProvider(
    requestedProvider?: LlmProviderName,
  ): ConfiguredLlmProviderName {
    if (requestedProvider) {
      return validateConfiguredProvider(requestedProvider);
    }

    const configuredProvider = process.env.LLM_PROVIDER?.trim().toLowerCase();

    if (configuredProvider) {
      return validateConfiguredProvider(configuredProvider);
    }

    if (process.env.NODE_ENV === "production") {
      throw new LlmProviderSelectionServiceError(
        "LLM_PROVIDER must be configured in production.",
      );
    }

    return "mock";
  }
}

function validateConfiguredProvider(provider: string): ConfiguredLlmProviderName {
  if (configuredProviders.includes(provider as ConfiguredLlmProviderName)) {
    return provider as ConfiguredLlmProviderName;
  }

  throw new LlmProviderSelectionServiceError(
    "LLM_PROVIDER must be either mock or openai.",
  );
}
