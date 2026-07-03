import { NextResponse } from "next/server";

import { createSafeErrorResponse } from "@/lib/api/safe-error-response";
import {
  MentorSessionService,
  MentorSessionServiceError,
} from "@/services/mentor-session/mentor-session.service";
import { UserServiceError } from "@/services/user/user.service";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const service = new MentorSessionService();
    const session = await service.createNewMarcusSession();

    return NextResponse.json(
      { conversationId: session.conversation.id },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof MentorSessionServiceError) {
      return createSafeErrorResponse({
        context: "api/mentor-session/new:session",
        error,
        fallbackMessage: "Unable to start a new conversation.",
        statusCode: error.statusCode,
      });
    }

    if (error instanceof UserServiceError) {
      return createSafeErrorResponse({
        context: "api/mentor-session/new:user",
        error,
        fallbackMessage: "Unable to start a new conversation.",
        statusCode: error.statusCode,
      });
    }

    return createSafeErrorResponse({
      context: "api/mentor-session/new:unexpected",
      error,
      fallbackMessage: "Unable to start a new conversation.",
    });
  }
}
