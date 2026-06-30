import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ConversationService,
  ConversationServiceError,
} from "@/services/conversation/conversation.service";
import { validateCreateConversationInput } from "@/services/conversation/conversation.validators";

export const dynamic = "force-dynamic";

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return { authUserId: user.id };
}

export async function GET() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const service = new ConversationService();
    const conversations =
      await service.getConversationsForUser(authenticatedUser);

    return NextResponse.json({ conversations }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Unable to load conversations." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const validation = validateCreateConversationInput(body);

  if (!validation.isValid || !validation.input) {
    return NextResponse.json(
      { errors: validation.errors },
      { status: 400 },
    );
  }

  try {
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

    return NextResponse.json(
      { error: "Unable to create conversation." },
      { status: 500 },
    );
  }
}
