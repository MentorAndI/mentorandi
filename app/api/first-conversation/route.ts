import { NextResponse } from "next/server";

import { createSafeErrorResponse } from "@/lib/api/safe-error-response";
import { ConversationServiceError } from "@/services/conversation/conversation.service";
import {
  MentorSessionService,
  MentorSessionServiceError,
} from "@/services/mentor-session/mentor-session.service";
import {
  MentorResponsePipelineService,
  MentorResponsePipelineServiceError,
} from "@/services/mentor-core/response-pipeline/response-pipeline.service";
import { UserServiceError } from "@/services/user/user.service";
import { isActiveMentorSlug } from "@/services/mentor-catalog/mentor-catalog";
import type { ActiveMentorSlug } from "@/services/mentor-catalog/mentor-catalog.types";
import {
  MentorUsageLimitService,
  MentorUsageMonitoringError,
} from "@/services/usage-limits/mentor-usage-limits.service";

export const dynamic = "force-dynamic";

interface FirstConversationInput {
  mentor: ActiveMentorSlug;
  text: string;
}

const maxFirstConversationLength = 1200;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const validation = validateFirstConversationInput(body);

  if (!validation.isValid || !validation.input) {
    return NextResponse.json(
      { errors: validation.errors },
      { status: 400 },
    );
  }

  try {
    const sessionService = new MentorSessionService();
    const session = await sessionService.getResolvedMentorSession(
      validation.input.mentor,
    );
    const pipeline = new MentorResponsePipelineService();
    const response = await pipeline.run(
      {
        conversationId: session.conversation.id,
        message: validation.input.text,
        mentorSpecialty: validation.input.mentor,
        userId: session.userId,
      },
      {
        authUserId: session.authUserId,
      },
    );
    await new MentorUsageLimitService().recordSuccessfulMentorResponse({
      authUserId: session.authUserId,
      conversationId: session.conversation.id,
      llmUsage: response.llmUsage,
      mentorId: session.mentorId,
      specialistContext: response.promptPackage.specialistContext,
      userId: session.userId,
    });

    return NextResponse.json(
      {
        conversationId: session.conversation.id,
        mentorMessage: response.mentorMessage,
        userMessage: response.userMessage,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof MentorUsageMonitoringError) {
      return createSafeErrorResponse({
        context: "api/first-conversation:usage",
        error,
        fallbackMessage: error.message,
        statusCode: error.statusCode,
      });
    }

    if (error instanceof ConversationServiceError) {
      return createSafeErrorResponse({
        context: "api/first-conversation:conversation",
        error,
        fallbackMessage: "Unable to start the mentor conversation.",
        statusCode: error.statusCode,
      });
    }

    if (error instanceof MentorSessionServiceError) {
      return createSafeErrorResponse({
        context: "api/first-conversation:session",
        error,
        fallbackMessage: "Unable to start the mentor conversation.",
        statusCode: error.statusCode,
      });
    }

    if (error instanceof UserServiceError) {
      return createSafeErrorResponse({
        context: "api/first-conversation:user",
        error,
        fallbackMessage: "Unable to start the mentor conversation.",
        statusCode: error.statusCode,
      });
    }

    if (error instanceof MentorResponsePipelineServiceError) {
      return createSafeErrorResponse({
        context: "api/first-conversation:pipeline",
        error,
        fallbackMessage: "Unable to start the mentor conversation.",
        statusCode: error.statusCode,
      });
    }

    return createSafeErrorResponse({
      context: "api/first-conversation:unexpected",
      error,
      fallbackMessage: "Unable to start the mentor conversation.",
    });
  }
}

function validateFirstConversationInput(
  body: unknown,
): {
  errors: Record<string, string>;
  input?: FirstConversationInput;
  isValid: boolean;
} {
  const errors: Record<string, string> = {};

  if (!body || typeof body !== "object") {
    return {
      errors: { body: "Request body must be a JSON object." },
      isValid: false,
    };
  }

  const text =
    "text" in body && typeof body.text === "string" ? body.text.trim() : "";
  const mentor =
    "mentor" in body && typeof body.mentor === "string"
      ? body.mentor.trim()
      : "life";

  if (!isActiveMentorSlug(mentor)) {
    errors.mentor = "Mentor is not active.";
  }

  if (!text) {
    errors.text = "Please write a few words before continuing.";
  } else if (text.length > maxFirstConversationLength) {
    errors.text = `Please keep your answer under ${maxFirstConversationLength} characters.`;
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
      mentor: mentor as ActiveMentorSlug,
      text,
    },
    isValid: true,
  };
}
