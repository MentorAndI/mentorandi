import { NextResponse } from "next/server";

import {
  ConversationService,
  ConversationServiceError,
} from "@/services/conversation/conversation.service";
import {
  MentorResponsePipelineService,
  MentorResponsePipelineServiceError,
} from "@/services/mentor-core/response-pipeline/response-pipeline.service";
import type { MentorResponsePipelineAuthContext } from "@/services/mentor-core/response-pipeline/response-pipeline.types";

export const dynamic = "force-dynamic";

interface DevMentorResponseInput {
  conversationId?: string;
  mentorId: string;
  message: string;
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
        userId: validation.input.userId,
      },
      getDevMentorResponseAuthContext(),
    );

    return NextResponse.json(
      {
        conversation,
        mentorMessage: response.mentorMessage,
        model: response.model,
        provider: response.provider,
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
  const conversationId = readOptionalStringField(body, "conversationId");
  const message = readStringField(body, "message");

  validateUuidField(errors, "userId", userId, "User ID");
  validateUuidField(errors, "mentorId", mentorId, "Mentor ID");

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

  if (Object.keys(errors).length > 0) {
    return { errors, isValid: false };
  }

  return {
    errors,
    input: {
      conversationId,
      mentorId,
      message,
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

function readOptionalStringField(body: object, field: string) {
  if (!(field in body) || body[field as keyof typeof body] === null) {
    return undefined;
  }

  return typeof body[field as keyof typeof body] === "string"
    ? String(body[field as keyof typeof body]).trim()
    : "";
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
