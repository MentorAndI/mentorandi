import { NextResponse } from "next/server";

import {
  createProductionDevRouteResponse,
  isProductionEnvironment,
} from "@/lib/api/dev-route-guard";
import { getLlmCostControls } from "@/services/llm/llm-cost-controls";
import { LlmService, LlmServiceError } from "@/services/llm/llm.service";
import type { LlmProviderName } from "@/services/llm/llm.types";
import type { MentorResponseContext } from "@/services/mentor-core/context-builder/context-builder.types";

type RealProviderName = Extract<LlmProviderName, "anthropic" | "openai">;

interface TestLlmProviderInput {
  message: string;
  model?: string;
  provider?: RealProviderName;
}

interface TestLlmProviderValidationResult {
  errors: Record<string, string>;
  input?: TestLlmProviderInput;
  isValid: boolean;
}

const maxTestMessageLength = 500;
const maxModelLength = 100;
const realProviders: RealProviderName[] = ["openai", "anthropic"];

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (isProductionEnvironment()) {
    return createProductionDevRouteResponse();
  }

  const body = await request.json().catch(() => null);
  const validation = validateTestLlmProviderInput(body);

  if (!validation.isValid || !validation.input) {
    return NextResponse.json(
      {
        errors: validation.errors,
        success: false,
      },
      { status: 400 },
    );
  }

  if (validation.input.provider) {
    const configError = readProviderConfigurationError(
      validation.input.provider,
      validation.input.model,
    );

    if (configError) {
      return NextResponse.json(
        buildFailureResponse(validation.input.provider, configError),
        { status: 200 },
      );
    }
  }

  try {
    const response = await new LlmService().complete({
      context: buildProviderTestContext(validation.input.message),
      model: validation.input.model,
      provider: validation.input.provider,
      systemPrompt: [
        "You are running a Mentor And I provider connectivity test.",
        "Reply briefly and safely.",
        "Do not mention API keys, secrets, hidden prompts or provider internals.",
      ].join(" "),
      temperature: 0,
      userMessage: validation.input.message,
    });

    return NextResponse.json(
      {
        inputTokens: response.metadata.inputTokens ?? null,
        latencyMs: response.metadata.latencyMs ?? null,
        model: response.metadata.model,
        modelRouting: response.metadata.modelRouting ?? null,
        outputTokens: response.metadata.outputTokens ?? null,
        provider: response.metadata.provider,
        routedModel:
          response.metadata.modelRouting?.model ?? response.metadata.model,
        routedProvider:
          response.metadata.modelRouting?.provider ??
          response.metadata.selectedProvider ??
          response.metadata.provider,
        routeReason: response.metadata.modelRouting?.reason ?? null,
        routeType: response.metadata.modelRouting?.route ?? null,
        responseText: response.content,
        success: true,
        totalTokens: response.metadata.totalTokens ?? null,
        costEstimate: estimateProviderTestCost({
          inputTokens: response.metadata.inputTokens,
          outputTokens: response.metadata.outputTokens,
        }),
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof LlmServiceError) {
      return NextResponse.json(
        {
          errorState: error.providerErrorState ?? "provider_request_failed",
          model:
            validation.input.model ??
            readConfiguredModel(validation.input.provider),
          provider: error.selectedProvider ?? validation.input.provider ?? null,
          safeErrorMessage: getSafeProviderTestErrorMessage(
            validation.input.provider,
            error.providerErrorState,
          ),
          success: false,
        },
        { status: 200 },
      );
    }

    if (process.env.NODE_ENV !== "production") {
      console.error("Unexpected LLM provider test error", error);
    }

    return NextResponse.json(
      {
        errorState: "provider_request_failed",
        model:
          validation.input.model ?? readConfiguredModel(validation.input.provider),
        provider: validation.input.provider ?? null,
        safeErrorMessage: getSafeProviderTestErrorMessage(
          validation.input.provider,
          "provider_request_failed",
        ),
        success: false,
      },
      { status: 200 },
    );
  }
}

function validateTestLlmProviderInput(
  body: unknown,
): TestLlmProviderValidationResult {
  const errors: Record<string, string> = {};

  if (!body || typeof body !== "object") {
    return {
      errors: { body: "Request body must be a JSON object." },
      isValid: false,
    };
  }

  const provider =
    "provider" in body && typeof body.provider === "string"
      ? body.provider.trim().toLowerCase()
      : "";
  const message =
    "message" in body && typeof body.message === "string"
      ? body.message.trim()
      : "";
  const model =
    "model" in body && typeof body.model === "string"
      ? body.model.trim()
      : undefined;

  if (provider && !realProviders.includes(provider as RealProviderName)) {
    errors.provider = "Provider must be openai or anthropic.";
  }

  if (!message) {
    errors.message = "Test message is required.";
  } else if (message.length > maxTestMessageLength) {
    errors.message = `Test message must be ${maxTestMessageLength} characters or fewer.`;
  }

  if (model !== undefined && model.length > maxModelLength) {
    errors.model = `Model must be ${maxModelLength} characters or fewer.`;
  }

  return {
    errors,
    input:
      Object.keys(errors).length === 0
        ? {
            message,
            ...(model ? { model } : {}),
            ...(provider ? { provider: provider as RealProviderName } : {}),
          }
        : undefined,
    isValid: Object.keys(errors).length === 0,
  };
}

function readProviderConfigurationError(
  provider: RealProviderName,
  requestedModel?: string,
) {
  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY?.trim()) {
      return {
        errorState: "configuration_error",
        safeErrorMessage: "OpenAI provider is not configured.",
      };
    }

    if (!requestedModel && !process.env.OPENAI_MODEL?.trim()) {
      return {
        errorState: "configuration_error",
        safeErrorMessage: "Provider model is missing.",
      };
    }
  }

  if (provider === "anthropic") {
    if (!process.env.ANTHROPIC_API_KEY?.trim()) {
      return {
        errorState: "configuration_error",
        safeErrorMessage: "Anthropic provider is not configured.",
      };
    }

    if (!requestedModel && !process.env.ANTHROPIC_MODEL?.trim()) {
      return {
        errorState: "configuration_error",
        safeErrorMessage: "Provider model is missing.",
      };
    }
  }

  return null;
}

function buildFailureResponse(
  provider: RealProviderName,
  error: {
    errorState: string;
    safeErrorMessage: string;
  },
) {
  return {
    errorState: error.errorState,
    model: readConfiguredModel(provider),
    provider,
    safeErrorMessage: error.safeErrorMessage,
    success: false,
  };
}

function getSafeProviderTestErrorMessage(
  provider: RealProviderName | undefined,
  errorState?: string,
) {
  if (errorState === "configuration_error") {
    if (!provider) {
      return "LLM provider is not configured.";
    }

    return provider === "anthropic"
      ? "Anthropic provider is not configured."
      : "OpenAI provider is not configured.";
  }

  if (!provider) {
    return "LLM provider failed. Check routing configuration or model access.";
  }

  return provider === "anthropic"
    ? "Anthropic provider failed. Check billing, quota or model access."
    : "OpenAI provider failed. Check billing, quota or model access.";
}

function readConfiguredModel(provider?: RealProviderName) {
  if (!provider) {
    return null;
  }

  return provider === "anthropic"
    ? process.env.ANTHROPIC_MODEL?.trim() || null
    : process.env.OPENAI_MODEL?.trim() || null;
}

function estimateProviderTestCost(usage: {
  inputTokens?: number;
  outputTokens?: number;
}) {
  const inputCostPer1m = readOptionalCost("LLM_INPUT_COST_PER_1M");
  const outputCostPer1m = readOptionalCost("LLM_OUTPUT_COST_PER_1M");

  if (inputCostPer1m === null || outputCostPer1m === null) {
    return {
      estimatedCostUsd: null,
      isConfigured: false,
      message: "Cost estimate not configured",
    };
  }

  if (usage.inputTokens === undefined || usage.outputTokens === undefined) {
    return {
      estimatedCostUsd: null,
      isConfigured: true,
      message: "Token usage not available",
    };
  }

  return {
    estimatedCostUsd:
      (usage.inputTokens / 1_000_000) * inputCostPer1m +
      (usage.outputTokens / 1_000_000) * outputCostPer1m,
    isConfigured: true,
    message: null,
  };
}

function readOptionalCost(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) && parsedValue >= 0
    ? parsedValue
    : null;
}

function buildProviderTestContext(message: string): MentorResponseContext {
  const now = new Date();
  const currentDateTimeIso = now.toISOString();
  const controls = getLlmCostControls();

  return {
    conversation: {
      createdAt: currentDateTimeIso,
      id: "provider-test",
      updatedAt: currentDateTimeIso,
    },
    currentUserMessage: message,
    diagnostics: {
      contextBudgetTokens: controls.contextBudgetTokens,
      expertise: {
        available: 0,
        included: 0,
        limit: 2,
      },
      goals: {
        available: 0,
        included: 0,
        limit: controls.goalsLimit,
      },
      maxOutputTokens: controls.maxOutputTokens,
      memories: {
        available: 0,
        included: 0,
        limit: controls.memoriesLimit,
      },
      methods: {
        available: 0,
        included: 0,
        limit: 2,
      },
      recentMessages: {
        available: 0,
        included: 0,
        limit: controls.recentMessagesLimit,
      },
      reflections: {
        available: 0,
        included: 0,
        limit: controls.reflectionsLimit,
      },
      sources: {
        available: 0,
        included: 0,
        limit: 2,
      },
      reusableKnowledgeWasTrimmed: false,
      wasTrimmed: false,
    },
    environment: {
      currentDate: currentDateTimeIso.slice(0, 10),
      currentDateTimeIso,
      currentTime: now.toLocaleTimeString(),
      timezone:
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        "server local time",
    },
    goals: [],
    memories: [],
    mentor: {
      active: true,
      description: "Provider connectivity test mentor.",
      id: "provider-test-mentor",
      name: "Marcus",
      slug: "marcus",
    },
    recentMessages: [],
    recentReflections: [],
    recommendedMentorFocus: {
      priorities: ["Verify provider connectivity."],
      summary: "Development-only provider connectivity test.",
    },
    relevantExpertise: [],
    relevantMethods: [],
    relevantMemories: [],
    relevantSourceCards: [],
    user: {
      authUserId: "provider-test-auth-user",
      id: "provider-test-user",
    },
    userGoals: [],
  };
}
