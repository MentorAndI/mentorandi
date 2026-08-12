import { NextResponse } from "next/server";

import { createSafeErrorResponse } from "@/lib/api/safe-error-response";
import {
  MentorSessionService,
  MentorSessionServiceError,
} from "@/services/mentor-session/mentor-session.service";
import { UserServiceError } from "@/services/user/user.service";
import { isActiveMentorSlug } from "@/services/mentor-catalog/mentor-catalog";
import type { ActiveMentorSlug } from "@/services/mentor-catalog/mentor-catalog.types";
import { MentorAccessServiceError } from "@/services/mentor-access/mentor-access.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const mentorSlug = readMentorSlug(body);

  if (!mentorSlug) {
    return NextResponse.json(
      { errors: { mentor: "Mentor is not active." } },
      { status: 400 },
    );
  }

  try {
    const service = new MentorSessionService();
    const session = await service.createNewMentorSession(mentorSlug);

    return NextResponse.json(
      { conversationId: session.conversation.id },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof MentorAccessServiceError) {
      return NextResponse.json(
        {
          error: error.message,
          ...(error.upgradeMessage
            ? { upgradeMessage: error.upgradeMessage }
            : {}),
        },
        { status: error.statusCode },
      );
    }

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

function readMentorSlug(body: unknown): ActiveMentorSlug | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const value =
    "mentor" in body && typeof body.mentor === "string"
      ? body.mentor.trim()
      : "life";

  return isActiveMentorSlug(value) ? value : null;
}
