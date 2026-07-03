import { NextResponse } from "next/server";

import { createSafeErrorResponse } from "@/lib/api/safe-error-response";
import {
  ConversationService,
  ConversationServiceError,
} from "@/services/conversation/conversation.service";
import { validateCreateConversationInput } from "@/services/conversation/conversation.validators";
import {
  UserService,
  UserServiceError,
} from "@/services/user/user.service";

export const dynamic = "force-dynamic";

async function getAuthenticatedUser() {
  const user = await new UserService().resolveCurrentUser();

  return { authUserId: user.authUserId };
}

export async function GET() {
  try {
    const authenticatedUser = await getAuthenticatedUser();
    const service = new ConversationService();
    const conversations =
      await service.getConversationsForUser(authenticatedUser);

    return NextResponse.json({ conversations }, { status: 200 });
  } catch (error) {
    if (error instanceof UserServiceError) {
      return createSafeErrorResponse({
        context: "api/conversations:get:user",
        error,
        fallbackMessage: "Unable to load conversations.",
        statusCode: error.statusCode,
      });
    }

    return createSafeErrorResponse({
      context: "api/conversations:get:unexpected",
      error,
      fallbackMessage: "Unable to load conversations.",
    });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const validation = validateCreateConversationInput(body);

  if (!validation.isValid || !validation.input) {
    return NextResponse.json(
      { errors: validation.errors },
      { status: 400 },
    );
  }

  try {
    const authenticatedUser = await getAuthenticatedUser();
    const service = new ConversationService();
    const conversation = await service.createConversation(
      authenticatedUser,
      validation.input,
    );

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    if (error instanceof ConversationServiceError) {
      return createSafeErrorResponse({
        context: "api/conversations:post:conversation",
        error,
        fallbackMessage: "Unable to create conversation.",
        statusCode: error.statusCode,
      });
    }

    if (error instanceof UserServiceError) {
      return createSafeErrorResponse({
        context: "api/conversations:post:user",
        error,
        fallbackMessage: "Unable to create conversation.",
        statusCode: error.statusCode,
      });
    }

    return createSafeErrorResponse({
      context: "api/conversations:post:unexpected",
      error,
      fallbackMessage: "Unable to create conversation.",
    });
  }
}
