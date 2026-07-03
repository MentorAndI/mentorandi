import type { LlmProviderName } from "@/services/llm/llm.types";

export type ConfiguredLlmProviderName = Extract<
  LlmProviderName,
  "anthropic" | "mock" | "openai"
>;

const configuredProviders: ConfiguredLlmProviderName[] = [
  "anthropic",
  "mock",
  "openai",
];

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
    const configuredProvider = process.env.LLM_PROVIDER?.trim().toLowerCase();

    if (process.env.NODE_ENV === "production") {
      if (configuredProvider) {
        return validateProviderConfiguration(
          validateConfiguredProvider(configuredProvider),
        );
      }

      throw new LlmProviderSelectionServiceError(
        "LLM_PROVIDER must be configured in production.",
      );
    }

    if (requestedProvider) {
      return validateProviderConfiguration(
        validateConfiguredProvider(requestedProvider),
      );
    }

    if (configuredProvider) {
      return validateProviderConfiguration(
        validateConfiguredProvider(configuredProvider),
      );
    }

    return validateProviderConfiguration("mock");
  }
}

function validateConfiguredProvider(provider: string): ConfiguredLlmProviderName {
  if (configuredProviders.includes(provider as ConfiguredLlmProviderName)) {
    return provider as ConfiguredLlmProviderName;
  }

  throw new LlmProviderSelectionServiceError(
    "LLM_PROVIDER must be anthropic, mock or openai.",
  );
}

function validateProviderConfiguration(
  provider: ConfiguredLlmProviderName,
): ConfiguredLlmProviderName {
  if (provider === "openai") {
    assertEnvironmentValue("OPENAI_API_KEY");
    assertEnvironmentValue("OPENAI_MODEL");
  }

  if (provider === "anthropic") {
    assertEnvironmentValue("ANTHROPIC_API_KEY");
    assertEnvironmentValue("ANTHROPIC_MODEL");
  }

  return provider;
}

function assertEnvironmentValue(name: string) {
  if (!process.env[name]?.trim()) {
    throw new LlmProviderSelectionServiceError(
      `Missing LLM provider configuration: ${name} is required.`,
    );
  }
}
