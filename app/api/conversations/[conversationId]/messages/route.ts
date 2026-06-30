import { NextResponse } from "next/server";

import {
  MessageService,
  MessageServiceError,
} from "@/services/message/message.service";
import type { MessageAuthContext } from "@/services/message/message.types";
import {
  validateConversationId,
  validateCreateMessageInput,
} from "@/services/message/message.validators";

export const dynamic = "force-dynamic";

interface MessageRouteContext {
  params: Promise<{
    conversationId: string;
  }>;
}

function getMessageAuthContext(): MessageAuthContext {
  return {
    authUserId: null,
  };
}

export async function GET(_request: Request, context: MessageRouteContext) {
  const { conversationId } = await context.params;
  const conversationIdValidation = validateConversationId(conversationId);

  if (!conversationIdValidation.isValid || !conversationIdValidation.input) {
    return NextResponse.json(
      { errors: conversationIdValidation.errors },
      { status: 400 },
    );
  }

  try {
    const service = new MessageService();
    const messages = await service.getMessagesForConversation(
      conversationIdValidation.input.conversationId,
      getMessageAuthContext(),
    );

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    if (error instanceof MessageServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "Unable to load messages." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: MessageRouteContext) {
  const { conversationId } = await context.params;
  const conversationIdValidation = validateConversationId(conversationId);

  if (!conversationIdValidation.isValid || !conversationIdValidation.input) {
    return NextResponse.json(
      { errors: conversationIdValidation.errors },
      { status: 400 },
    );
  }

  const body = await request.json().catch(() => null);
  const messageValidation = validateCreateMessageInput(body);

  if (!messageValidation.isValid || !messageValidation.input) {
    return NextResponse.json(
      { errors: messageValidation.errors },
      { status: 400 },
    );
  }

  try {
    const service = new MessageService();
    const message = await service.createMessage(
      conversationIdValidation.input.conversationId,
      messageValidation.input,
      getMessageAuthContext(),
    );

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof MessageServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "Unable to create message." },
      { status: 500 },
    );
  }
}
