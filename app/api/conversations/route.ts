import { NextResponse } from "next/server";

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
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "Unable to load conversations." },
      { status: 500 },
    );
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

    return NextResponse.json(
      { error: "Unable to create conversation." },
      { status: 500 },
    );
  }
}
