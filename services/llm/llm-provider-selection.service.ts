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
    requestedModel?: string,
  ): ConfiguredLlmProviderName {
    const configuredProvider = process.env.LLM_PROVIDER?.trim().toLowerCase();

    if (requestedProvider) {
      return validateProviderConfiguration(
        validateConfiguredProvider(requestedProvider),
        requestedModel,
      );
    }

    if (process.env.NODE_ENV === "production") {
      if (configuredProvider) {
        return validateProviderConfiguration(
          validateConfiguredProvider(configuredProvider),
          requestedModel,
        );
      }

      throw new LlmProviderSelectionServiceError(
        "LLM_PROVIDER must be configured in production.",
      );
    }

    if (configuredProvider) {
      return validateProviderConfiguration(
        validateConfiguredProvider(configuredProvider),
        requestedModel,
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
  requestedModel?: string,
): ConfiguredLlmProviderName {
  if (provider === "openai") {
    assertEnvironmentValue("OPENAI_API_KEY");
    assertModelConfiguration("OPENAI_MODEL", requestedModel);
  }

  if (provider === "anthropic") {
    assertEnvironmentValue("ANTHROPIC_API_KEY");
    assertModelConfiguration("ANTHROPIC_MODEL", requestedModel);
  }

  return provider;
}

function assertModelConfiguration(name: string, requestedModel?: string) {
  if (requestedModel?.trim()) {
    return;
  }

  assertEnvironmentValue(name);
}

function assertEnvironmentValue(name: string) {
  if (!process.env[name]?.trim()) {
    throw new LlmProviderSelectionServiceError(
      `Missing LLM provider configuration: ${name} is required.`,
    );
  }
}
