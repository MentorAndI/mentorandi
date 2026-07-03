import { NextResponse } from "next/server";

import { createSafeErrorResponse } from "@/lib/api/safe-error-response";
import {
  MentorSessionService,
  MentorSessionServiceError,
} from "@/services/mentor-session/mentor-session.service";
import { UserServiceError } from "@/services/user/user.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const service = new MentorSessionService();
    const overview = await service.getResolvedMarcusSessionOverview();

    return NextResponse.json(
      {
        activeGoals: overview.activeGoals,
        conversation: overview.session.conversation,
        conversations: overview.conversations,
        mentor: overview.session.mentor,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof MentorSessionServiceError) {
      return createSafeErrorResponse({
        context: "api/mentor/session:session",
        error,
        fallbackMessage: "Unable to load mentor session.",
        statusCode: error.statusCode,
      });
    }

    if (error instanceof UserServiceError) {
      return createSafeErrorResponse({
        context: "api/mentor/session:user",
        error,
        fallbackMessage: "Unable to load mentor session.",
        statusCode: error.statusCode,
      });
    }

    return createSafeErrorResponse({
      context: "api/mentor/session:unexpected",
      error,
      fallbackMessage: "Unable to load mentor session.",
    });
  }
}
