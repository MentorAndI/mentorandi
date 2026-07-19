import { NextResponse } from "next/server";

import {
  createProductionDevRouteResponse,
  isProductionEnvironment,
} from "@/lib/api/dev-route-guard";
import {
  ConversationService,
  ConversationServiceError,
} from "@/services/conversation/conversation.service";
import {
  MentorResponsePipelineService,
  MentorResponsePipelineServiceError,
} from "@/services/mentor-core/response-pipeline/response-pipeline.service";
import type {
  MentorResponsePipelineAuthContext,
  MentorResponsePipelineResult,
} from "@/services/mentor-core/response-pipeline/response-pipeline.types";
import {
  UserService,
  UserServiceError,
} from "@/services/user/user.service";
import { isActiveMentorSlug } from "@/services/mentor-catalog/mentor-catalog";
import type { ActiveMentorSlug } from "@/services/mentor-catalog/mentor-catalog.types";

export const dynamic = "force-dynamic";

type DevMentorResponseProvider = "anthropic" | "mock" | "openai";

interface DevMentorResponseInput {
  conversationId?: string;
  mentorId: string;
  message: string;
  mentorSpecialty?: ActiveMentorSlug;
  model?: string;
  provider?: DevMentorResponseProvider;
  userId: string;
}

interface DevMentorResponseValidationResult {
  errors: Record<string, string>;
  input?: DevMentorResponseInput;
  isValid: boolean;
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const maxMessageLength = 10000;
const maxModelLength = 100;
const supportedDevProviders: DevMentorResponseProvider[] = [
  "anthropic",
  "mock",
  "openai",
];

async function getDevMentorResponseAuthContext(
  userId: string,
): Promise<MentorResponsePipelineAuthContext> {
  const user = await new UserService().getUserById(userId);

  if (!user) {
    throw new UserServiceError("User was not found.", 404);
  }

  return {
    authUserId: user.authUserId,
  };
}

export async function POST(request: Request) {
  if (isProductionEnvironment()) {
    return createProductionDevRouteResponse();
  }

  const body = await request.json().catch(() => null);
  const validation = validateDevMentorResponseInput(body);

  if (!validation.isValid || !validation.input) {
    return NextResponse.json(
      { errors: validation.errors },
      { status: 400 },
    );
  }

  try {
    const conversationService = new ConversationService();
    const conversation = validation.input.conversationId
      ? await conversationService.getConversationForUserId(
          validation.input.userId,
          validation.input.conversationId,
        )
      : await conversationService.createConversationForUserId(
          validation.input.userId,
          { mentorId: validation.input.mentorId },
        );

    const pipeline = new MentorResponsePipelineService();
    const authContext = await getDevMentorResponseAuthContext(
      validation.input.userId,
    );
    const response = await pipeline.run(
      {
        conversationId: conversation.id,
        message: validation.input.message,
        mentorSpecialty: validation.input.mentorSpecialty,
        model: validation.input.model,
        provider: validation.input.provider,
        userId: validation.input.userId,
      },
      authContext,
    );

    return NextResponse.json(
      {
        conversation,
        createdGoals: response.createdGoals,
        createdReflection: response.createdReflection,
        extractedMemories: response.extractedMemories,
        mentorMessage: response.mentorMessage,
        model: response.model,
        provider: response.provider,
        skippedDuplicateGoals: response.skippedDuplicateGoals,
        skippedDuplicateMemories: response.skippedDuplicateMemories,
        updatedGoals: response.updatedGoals,
        updatedMemories: response.updatedMemories,
        diagnostics: buildMentorCoreDiagnostics(response),
        userMessage: response.userMessage,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof ConversationServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    if (error instanceof MentorResponsePipelineServiceError) {
      return NextResponse.json(
        {
          error: error.message,
          diagnostics: buildMentorCoreErrorDiagnostics(
            validation.input.provider,
            error,
          ),
        },
        { status: error.statusCode },
      );
    }

    if (error instanceof UserServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "Unable to test mentor response pipeline." },
      { status: 500 },
    );
  }
}

function buildMentorCoreDiagnostics(response: MentorResponsePipelineResult) {
  return {
    contextCounts: {
      activeGoals: response.contextUsed.userGoals.length,
      memories: response.contextUsed.relevantMemories.length,
      recentMessages: response.contextUsed.recentMessages.length,
      reflections: response.contextUsed.recentReflections.length,
    },
    createdGoals: response.createdGoals.map(toGoalDiagnostic),
    createdMemories: response.extractedMemories.map(toMemoryDiagnostic),
    createdReflection: response.createdReflection
      ? {
          createdAt: response.createdReflection.createdAt,
          summary: response.createdReflection.summary,
        }
      : null,
    currentUserMessage: response.userMessage.content,
    contextTrimming: {
      contextBudgetTokens: response.contextUsed.diagnostics.contextBudgetTokens,
      expertise: response.contextUsed.diagnostics.expertise,
      goals: response.contextUsed.diagnostics.goals,
      maxOutputTokens: response.contextUsed.diagnostics.maxOutputTokens,
      memories: response.contextUsed.diagnostics.memories,
      methods: response.contextUsed.diagnostics.methods,
      recentMessages: response.contextUsed.diagnostics.recentMessages,
      reflections: response.contextUsed.diagnostics.reflections,
      sources: response.contextUsed.diagnostics.sources,
      reusableKnowledgeWasTrimmed:
        response.contextUsed.diagnostics.reusableKnowledgeWasTrimmed,
      wasTrimmed: response.contextUsed.diagnostics.wasTrimmed,
    },
    llmUsage: {
      costEstimate: estimateLlmCost(response.llmUsage),
      inputTokens: response.llmUsage.inputTokens ?? null,
      latencyMs: response.llmUsage.latencyMs ?? null,
      maxOutputTokens:
        response.llmUsage.maxOutputTokens ??
        response.contextUsed.diagnostics.maxOutputTokens,
      model: response.llmUsage.model,
      modelRouting: response.llmUsage.modelRouting ?? null,
      outputTokens: response.llmUsage.outputTokens ?? null,
      provider: response.llmUsage.provider,
      totalTokens: response.llmUsage.totalTokens ?? null,
    },
    providerErrorState: null,
    provider: response.provider,
    providerUsed: response.provider,
    reusableKnowledge: {
      expertiseAvailable: response.contextUsed.diagnostics.expertise.available,
      expertiseIncluded: response.contextUsed.diagnostics.expertise.included,
      methodsAvailable: response.contextUsed.diagnostics.methods.available,
      methodsIncluded: response.contextUsed.diagnostics.methods.included,
      sourcesAvailable: response.contextUsed.diagnostics.sources.available,
      sourcesIncluded: response.contextUsed.diagnostics.sources.included,
      wasTrimmed:
        response.contextUsed.diagnostics.reusableKnowledgeWasTrimmed,
    },
    matchedExpertise: {
      count: response.contextUsed.relevantExpertise.length,
      domains: response.contextUsed.relevantExpertise.map(
        (expertise) => expertise.mentorDomain,
      ),
      titles: response.contextUsed.relevantExpertise.map(
        (expertise) => expertise.title,
      ),
    },
    matchedMethods: {
      count: response.contextUsed.relevantMethods.length,
      domains: response.contextUsed.relevantMethods.map((method) => method.domain),
      titles: response.contextUsed.relevantMethods.map((method) => method.title),
    },
    matchedSources: {
      count: response.contextUsed.relevantSourceCards.length,
      domains: response.contextUsed.relevantSourceCards.map(
        (sourceCard) => sourceCard.domain,
      ),
      titles: response.contextUsed.relevantSourceCards.map(
        (sourceCard) => sourceCard.title,
      ),
    },
    selectedProvider: response.selectedProvider,
    skippedDuplicateGoals:
      response.skippedDuplicateGoals.map(toGoalDiagnostic),
    skippedDuplicateMemories:
      response.skippedDuplicateMemories.map(toMemoryDiagnostic),
    updatedGoals: response.updatedGoals.map(toGoalDiagnostic),
    updatedMemories: response.updatedMemories.map(toMemoryDiagnostic),
  };
}

function buildMentorCoreErrorDiagnostics(
  selectedProvider: string | undefined,
  error: MentorResponsePipelineServiceError,
) {
  return {
    contextCounts: {
      activeGoals: 0,
      memories: 0,
      recentMessages: 0,
      reflections: 0,
    },
    createdGoals: [],
    createdMemories: [],
    createdReflection: null,
    currentUserMessage: "",
    contextTrimming: {
      contextBudgetTokens: null,
      expertise: {
        available: 0,
        included: 0,
        limit: 2,
      },
      goals: {
        available: 0,
        included: 0,
        limit: 0,
      },
      maxOutputTokens: null,
      memories: {
        available: 0,
        included: 0,
        limit: 0,
      },
      methods: {
        available: 0,
        included: 0,
        limit: 2,
      },
      recentMessages: {
        available: 0,
        included: 0,
        limit: 0,
      },
      reflections: {
        available: 0,
        included: 0,
        limit: 0,
      },
      sources: {
        available: 0,
        included: 0,
        limit: 2,
      },
      reusableKnowledgeWasTrimmed: false,
      wasTrimmed: false,
    },
    llmUsage: {
      costEstimate: {
        estimatedCostUsd: null,
        isConfigured: false,
        message: "Cost estimate not configured",
      },
      inputTokens: null,
      latencyMs: null,
      maxOutputTokens: null,
      model: "unknown",
      modelRouting: null,
      outputTokens: null,
      provider: error.selectedProvider ?? selectedProvider ?? "unknown",
      totalTokens: null,
    },
    provider: error.selectedProvider ?? selectedProvider ?? "unknown",
    providerErrorState: error.providerErrorState ?? "pipeline_error",
    providerUsed: null,
    reusableKnowledge: {
      expertiseAvailable: 0,
      expertiseIncluded: 0,
      methodsAvailable: 0,
      methodsIncluded: 0,
      sourcesAvailable: 0,
      sourcesIncluded: 0,
      wasTrimmed: false,
    },
    matchedExpertise: {
      count: 0,
      domains: [],
      titles: [],
    },
    matchedMethods: {
      count: 0,
      domains: [],
      titles: [],
    },
    matchedSources: {
      count: 0,
      domains: [],
      titles: [],
    },
    selectedProvider: error.selectedProvider ?? selectedProvider ?? "unknown",
    skippedDuplicateGoals: [],
    skippedDuplicateMemories: [],
    updatedGoals: [],
    updatedMemories: [],
  };
}

function estimateLlmCost(
  usage: MentorResponsePipelineResult["llmUsage"],
) {
  const inputCostPer1m = readOptionalCost("LLM_INPUT_COST_PER_1M");
  const outputCostPer1m = readOptionalCost("LLM_OUTPUT_COST_PER_1M");

  if (inputCostPer1m === null || outputCostPer1m === null) {
    return {
      estimatedCostUsd: null,
      isConfigured: false,
      message: "Cost estimate not configured",
    };
  }

  if (
    usage.inputTokens === undefined ||
    usage.outputTokens === undefined
  ) {
    return {
      estimatedCostUsd: null,
      isConfigured: true,
      message: "Token usage not available",
    };
  }

  const estimatedCostUsd =
    (usage.inputTokens / 1_000_000) * inputCostPer1m +
    (usage.outputTokens / 1_000_000) * outputCostPer1m;

  return {
    estimatedCostUsd,
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

function toGoalDiagnostic(goal: MentorResponsePipelineResult["createdGoals"][number]) {
  return {
    description: goal.description,
    status: goal.status,
    title: goal.title,
  };
}

function toMemoryDiagnostic(
  memory: MentorResponsePipelineResult["extractedMemories"][number],
) {
  return {
    category: memory.category,
    confidence: memory.confidence,
    content: memory.content,
    importance: memory.importance,
    title: memory.title,
  };
}

function validateDevMentorResponseInput(
  body: unknown,
): DevMentorResponseValidationResult {
  const errors: Record<string, string> = {};

  if (!body || typeof body !== "object") {
    return {
      errors: { body: "Request body must be a JSON object." },
      isValid: false,
    };
  }

  const userId = readStringField(body, "userId");
  const mentorId = readStringField(body, "mentorId");
  const conversationId = readOptionalTrimmedStringField(body, "conversationId");
  const message = readStringField(body, "message");
  const model = readOptionalTrimmedStringField(body, "model");
  const mentorSpecialty = readOptionalTrimmedStringField(
    body,
    "mentorSpecialty",
  );
  const provider = readOptionalTrimmedStringField(body, "provider");

  validateUuidField(errors, "userId", userId, "User ID");
  validateUuidField(errors, "mentorId", mentorId, "Mentor ID");
  if (provider !== undefined) {
    validateProviderField(errors, provider);
  }

  if (conversationId !== undefined) {
    validateUuidField(
      errors,
      "conversationId",
      conversationId,
      "Conversation ID",
    );
  }

  if (!message) {
    errors.message = "Message is required.";
  } else if (message.length > maxMessageLength) {
    errors.message = `Message must be ${maxMessageLength} characters or fewer.`;
  }

  if (model !== undefined && model.length > maxModelLength) {
    errors.model = `Model must be ${maxModelLength} characters or fewer.`;
  }

  if (mentorSpecialty && !isActiveMentorSlug(mentorSpecialty)) {
    errors.mentorSpecialty = "Mentor specialization is not active.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors, isValid: false };
  }

  return {
    errors,
    input: {
      conversationId,
      mentorId,
      message,
      ...(mentorSpecialty
        ? { mentorSpecialty: mentorSpecialty as ActiveMentorSlug }
        : {}),
      model,
      ...(provider ? { provider: provider as DevMentorResponseProvider } : {}),
      userId,
    },
    isValid: true,
  };
}

function readStringField(body: object, field: string) {
  return field in body && typeof body[field as keyof typeof body] === "string"
    ? String(body[field as keyof typeof body]).trim()
    : "";
}

function readOptionalTrimmedStringField(body: object, field: string) {
  if (!(field in body) || body[field as keyof typeof body] === null) {
    return undefined;
  }

  if (typeof body[field as keyof typeof body] !== "string") {
    return undefined;
  }

  const value = String(body[field as keyof typeof body]).trim();

  return value || undefined;
}

function validateUuidField(
  errors: Record<string, string>,
  field: string,
  value: string,
  label: string,
) {
  if (!value) {
    errors[field] = `${label} is required.`;
  } else if (!uuidPattern.test(value)) {
    errors[field] = `${label} must be a valid UUID.`;
  }
}

function validateProviderField(
  errors: Record<string, string>,
  provider: string,
) {
  if (!supportedDevProviders.includes(provider as DevMentorResponseProvider)) {
    errors.provider = "Provider must be anthropic, mock or openai.";
  }
}
