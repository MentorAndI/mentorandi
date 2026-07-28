import { NextResponse } from "next/server";

import { createSafeErrorResponse } from "@/lib/api/safe-error-response";
import {
  MentorSessionService,
  MentorSessionServiceError,
} from "@/services/mentor-session/mentor-session.service";
import {
  MentorResponsePipelineService,
  MentorResponsePipelineServiceError,
} from "@/services/mentor-core/response-pipeline/response-pipeline.service";
import {
  MentorUsageLimitService,
  MentorUsageMonitoringError,
} from "@/services/usage-limits/mentor-usage-limits.service";
import { UserServiceError } from "@/services/user/user.service";
import {
  isActiveMentorSlug,
} from "@/services/mentor-catalog/mentor-catalog";
import type { ActiveMentorSlug } from "@/services/mentor-catalog/mentor-catalog.types";

export const dynamic = "force-dynamic";

interface MentorRespondInput {
  conversationId?: string;
  message: string;
  mentorSpecialty?: ActiveMentorSlug;
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const maxMessageLength = 10000;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const validation = validateMentorRespondInput(body);

  if (!validation.isValid || !validation.input) {
    return NextResponse.json(
      { errors: validation.errors },
      { status: 400 },
    );
  }

  try {
    const mentorSlug = validation.input.mentorSpecialty ?? "life";
    const sessionService = new MentorSessionService();
    const session = validation.input.conversationId
      ? await sessionService.getResolvedMentorSessionForConversation(
          validation.input.conversationId,
          mentorSlug,
        )
      : await sessionService.getResolvedMentorSession(mentorSlug);
    const usageLimitService = new MentorUsageLimitService();
    const usageContext = {
      authUserId: session.authUserId,
      conversationId: session.conversation.id,
      message: validation.input.message,
      mentorId: session.mentorId,
      userId: session.userId,
    };
    const usageDecision =
      await usageLimitService.checkBeforeMentorResponse(usageContext);

    if (usageDecision.message) {
      return createUsageLimitResponse(usageDecision.message);
    }

    const pipeline = new MentorResponsePipelineService();
    let response;

    try {
      response = await pipeline.run(
        {
          conversationId: session.conversation.id,
          message: validation.input.message,
          mentorSpecialty: mentorSlug,
          userId: session.userId,
        },
        {
          authUserId: session.authUserId,
        },
      );
    } catch (error) {
      await usageLimitService.recordFailedMentorResponse({
        ...usageContext,
        errorCode:
          error instanceof MentorResponsePipelineServiceError
            ? (error.providerErrorState ?? "pipeline_error")
            : "pipeline_error",
        modelRouting: usageDecision.modelRouting,
      });
      throw error;
    }

    await usageLimitService.recordSuccessfulMentorResponse({
      ...usageContext,
      llmUsage: response.llmUsage,
      specialistContext: response.promptPackage.specialistContext,
    });

    return NextResponse.json(
      {
        conversation: session.conversation,
        mentorMessage: response.mentorMessage,
        userMessage: response.userMessage,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof MentorUsageMonitoringError) {
      return createSafeErrorResponse({
        context: "api/mentor/respond:usage",
        error,
        fallbackMessage: error.message,
        statusCode: error.statusCode,
      });
    }

    if (error instanceof MentorSessionServiceError) {
      return createSafeErrorResponse({
        context: "api/mentor/respond:session",
        error,
        fallbackMessage: "Unable to send your message.",
        statusCode: error.statusCode,
      });
    }

    if (error instanceof UserServiceError) {
      return createSafeErrorResponse({
        context: "api/mentor/respond:user",
        error,
        fallbackMessage: "Unable to send your message.",
        statusCode: error.statusCode,
      });
    }

    if (error instanceof MentorResponsePipelineServiceError) {
      return createSafeErrorResponse({
        context: "api/mentor/respond:pipeline",
        error,
        fallbackMessage: "Unable to send your message.",
        statusCode: error.statusCode,
      });
    }

    return createSafeErrorResponse({
      context: "api/mentor/respond:unexpected",
      error,
      fallbackMessage: "Unable to send your message.",
    });
  }
}

function createUsageLimitResponse(message: string) {
  return NextResponse.json(
    {
      error: message,
    },
    { status: 429 },
  );
}

function validateMentorRespondInput(
  body: unknown,
): {
  errors: Record<string, string>;
  input?: MentorRespondInput;
  isValid: boolean;
} {
  const errors: Record<string, string> = {};

  if (!body || typeof body !== "object") {
    return {
      errors: { body: "Request body must be a JSON object." },
      isValid: false,
    };
  }

  const message =
    "message" in body && typeof body.message === "string"
      ? body.message.trim()
      : "";
  const conversationId =
    "conversationId" in body && typeof body.conversationId === "string"
      ? body.conversationId.trim()
      : "";
  const mentorSpecialty =
    "mentorSpecialty" in body && typeof body.mentorSpecialty === "string"
      ? body.mentorSpecialty.trim()
      : "";

  if (!message) {
    errors.message = "Message is required.";
  } else if (message.length > maxMessageLength) {
    errors.message = `Message must be ${maxMessageLength} characters or fewer.`;
  }

  if (conversationId && !uuidPattern.test(conversationId)) {
    errors.conversationId = "Conversation ID must be a valid UUID.";
  }

  if (mentorSpecialty && !isActiveMentorSlug(mentorSpecialty)) {
    errors.mentorSpecialty = "Mentor specialization is not active.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      isValid: false,
    };
  }

  return {
    errors,
    input: {
      conversationId: conversationId || undefined,
      message,
      mentorSpecialty: mentorSpecialty
        ? (mentorSpecialty as ActiveMentorSlug)
        : undefined,
    },
    isValid: true,
  };
}
