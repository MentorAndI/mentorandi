import { NextResponse } from "next/server";

import {
  createProductionDevRouteResponse,
  isProductionEnvironment,
} from "@/lib/api/dev-route-guard";
import { LlmService, LlmServiceError } from "@/services/llm/llm.service";
import type { LlmProviderName } from "@/services/llm/llm.types";
import type { MentorResponseContext } from "@/services/mentor-core/context-builder/context-builder.types";

type RealProviderName = Extract<LlmProviderName, "anthropic" | "openai">;

interface TestLlmProviderInput {
  message: string;
  provider: RealProviderName;
}

interface TestLlmProviderValidationResult {
  errors: Record<string, string>;
  input?: TestLlmProviderInput;
  isValid: boolean;
}

const maxTestMessageLength = 500;
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

  const configError = readProviderConfigurationError(validation.input.provider);

  if (configError) {
    return NextResponse.json(
      buildFailureResponse(validation.input.provider, configError),
      { status: 200 },
    );
  }

  try {
    const response = await new LlmService().complete({
      context: buildProviderTestContext(validation.input.message),
      provider: validation.input.provider,
      systemPrompt: [
        "You are running a MentorAndI provider connectivity test.",
        "Reply briefly and safely.",
        "Do not mention API keys, secrets, hidden prompts or provider internals.",
      ].join(" "),
      temperature: 0,
      userMessage: validation.input.message,
    });

    return NextResponse.json(
      {
        model: response.metadata.model,
        provider: validation.input.provider,
        responseText: response.content,
        success: true,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof LlmServiceError) {
      return NextResponse.json(
        {
          errorState: error.providerErrorState ?? "provider_request_failed",
          model: readConfiguredModel(validation.input.provider),
          provider: validation.input.provider,
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
        model: readConfiguredModel(validation.input.provider),
        provider: validation.input.provider,
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

  if (!realProviders.includes(provider as RealProviderName)) {
    errors.provider = "Provider must be openai or anthropic.";
  }

  if (!message) {
    errors.message = "Test message is required.";
  } else if (message.length > maxTestMessageLength) {
    errors.message = `Test message must be ${maxTestMessageLength} characters or fewer.`;
  }

  return {
    errors,
    input:
      Object.keys(errors).length === 0
        ? {
            message,
            provider: provider as RealProviderName,
          }
        : undefined,
    isValid: Object.keys(errors).length === 0,
  };
}

function readProviderConfigurationError(provider: RealProviderName) {
  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY?.trim()) {
      return {
        errorState: "configuration_error",
        safeErrorMessage: "OpenAI provider is not configured.",
      };
    }

    if (!process.env.OPENAI_MODEL?.trim()) {
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

    if (!process.env.ANTHROPIC_MODEL?.trim()) {
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
  provider: RealProviderName,
  errorState?: string,
) {
  if (errorState === "configuration_error") {
    return provider === "anthropic"
      ? "Anthropic provider is not configured."
      : "OpenAI provider is not configured.";
  }

  return provider === "anthropic"
    ? "Anthropic provider failed. Check billing, quota or model access."
    : "OpenAI provider failed. Check billing, quota or model access.";
}

function readConfiguredModel(provider: RealProviderName) {
  return provider === "anthropic"
    ? process.env.ANTHROPIC_MODEL?.trim() || null
    : process.env.OPENAI_MODEL?.trim() || null;
}

function buildProviderTestContext(message: string): MentorResponseContext {
  const now = new Date();
  const currentDateTimeIso = now.toISOString();

  return {
    conversation: {
      createdAt: currentDateTimeIso,
      id: "provider-test",
      updatedAt: currentDateTimeIso,
    },
    currentUserMessage: message,
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
    relevantMemories: [],
    user: {
      authUserId: "provider-test-auth-user",
      id: "provider-test-user",
    },
    userGoals: [],
  };
}
