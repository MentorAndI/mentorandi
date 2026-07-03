import { NextResponse } from "next/server";

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

export const dynamic = "force-dynamic";

type DevMentorResponseProvider = "mock" | "openai";

interface DevMentorResponseInput {
  conversationId?: string;
  mentorId: string;
  message: string;
  model?: string;
  provider: DevMentorResponseProvider;
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
const supportedDevProviders: DevMentorResponseProvider[] = ["mock", "openai"];

function getDevMentorResponseAuthContext(): MentorResponsePipelineAuthContext {
  return {
    authUserId: null,
  };
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This development test endpoint is disabled in production." },
      { status: 403 },
    );
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
    const response = await pipeline.run(
      {
        conversationId: conversation.id,
        message: validation.input.message,
        model: validation.input.model,
        provider: validation.input.provider,
        userId: validation.input.userId,
      },
      getDevMentorResponseAuthContext(),
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
    providerErrorState: null,
    provider: response.provider,
    providerUsed: response.provider,
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
    provider: error.selectedProvider ?? selectedProvider ?? "unknown",
    providerErrorState: error.providerErrorState ?? "pipeline_error",
    providerUsed: null,
    selectedProvider: error.selectedProvider ?? selectedProvider ?? "unknown",
    skippedDuplicateGoals: [],
    skippedDuplicateMemories: [],
    updatedGoals: [],
    updatedMemories: [],
  };
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
  const provider = readOptionalTrimmedStringField(body, "provider") ?? "mock";

  validateUuidField(errors, "userId", userId, "User ID");
  validateUuidField(errors, "mentorId", mentorId, "Mentor ID");
  validateProviderField(errors, provider);

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

  if (Object.keys(errors).length > 0) {
    return { errors, isValid: false };
  }

  return {
    errors,
    input: {
      conversationId,
      mentorId,
      message,
      model,
      provider: provider as DevMentorResponseProvider,
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
    errors.provider = "Provider must be mock or openai.";
  }
}
