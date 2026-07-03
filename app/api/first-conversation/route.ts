import { NextResponse } from "next/server";

import { ConversationServiceError } from "@/services/conversation/conversation.service";
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

interface FirstConversationInput {
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
    const session = await sessionService.getResolvedMarcusSession();
    const pipeline = new MentorResponsePipelineService();
    const response = await pipeline.run(
      {
        conversationId: session.conversation.id,
        message: validation.input.text,
        provider: "mock",
        userId: session.userId,
      },
      {
        authUserId: session.authUserId,
      },
    );

    return NextResponse.json(
      {
        conversationId: session.conversation.id,
        mentorMessage: response.mentorMessage,
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
      { error: "Unable to start the mentor conversation." },
      { status: 500 },
    );
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
      text,
    },
    isValid: true,
  };
}
