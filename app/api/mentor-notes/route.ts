import { NextResponse } from "next/server";

import { createSafeErrorResponse } from "@/lib/api/safe-error-response";
import {
  getMentorNoteAuthContext,
  MentorNoteService,
  MentorNoteServiceError,
} from "@/services/mentor-notes/mentor-note.service";
import { UserServiceError } from "@/services/user/user.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const includeArchived = searchParams.get("archived") === "true";

  try {
    const notes = await new MentorNoteService().list(
      await getMentorNoteAuthContext(),
      { includeArchived },
    );

    return NextResponse.json({ notes }, { status: 200 });
  } catch (error) {
    if (error instanceof MentorNoteServiceError) {
      return createSafeErrorResponse({
        context: "api/mentor-notes:get:notes",
        error,
        fallbackMessage: "Unable to load mentor notes.",
        statusCode: error.statusCode,
      });
    }

    if (error instanceof UserServiceError) {
      return createSafeErrorResponse({
        context: "api/mentor-notes:get:user",
        error,
        fallbackMessage: "Unable to load mentor notes.",
        statusCode: error.statusCode,
      });
    }

    return createSafeErrorResponse({
      context: "api/mentor-notes:get:unexpected",
      error,
      fallbackMessage: "Unable to load mentor notes.",
    });
  }
}
