import { NextResponse } from "next/server";

import {
  MentorSessionService,
  MentorSessionServiceError,
} from "@/services/mentor/mentor-session.service";
import {
  MentorResponsePipelineService,
  MentorResponsePipelineServiceError,
} from "@/services/mentor-core/response-pipeline/response-pipeline.service";
import { UserServiceError } from "@/services/user/user.service";

export const dynamic = "force-dynamic";

interface MentorRespondInput {
  message: string;
}

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
    const sessionService = new MentorSessionService();
    const session = await sessionService.getResolvedMarcusSession();
    const pipeline = new MentorResponsePipelineService();
    const response = await pipeline.run(
      {
        conversationId: session.conversation.id,
        message: validation.input.message,
        provider: "mock",
        userId: session.userId,
      },
      {
        authUserId: session.authUserId,
      },
    );

    return NextResponse.json(
      {
        conversation: session.conversation,
        mentorMessage: response.mentorMessage,
        userMessage: response.userMessage,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof MentorSessionServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    if (error instanceof UserServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    if (error instanceof MentorResponsePipelineServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "Unable to send your message." },
      { status: 500 },
    );
  }
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

  if (!message) {
    errors.message = "Message is required.";
  } else if (message.length > maxMessageLength) {
    errors.message = `Message must be ${maxMessageLength} characters or fewer.`;
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
      message,
    },
    isValid: true,
  };
}
