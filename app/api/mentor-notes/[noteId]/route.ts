import { NextResponse } from "next/server";

import { createSafeErrorResponse } from "@/lib/api/safe-error-response";
import {
  getMentorNoteAuthContext,
  MentorNoteService,
  MentorNoteServiceError,
} from "@/services/mentor-notes/mentor-note.service";
import {
  validateMentorNoteId,
  validateUpdateMentorNoteInput,
} from "@/services/mentor-notes/mentor-note.validators";
import { UserServiceError } from "@/services/user/user.service";

export const dynamic = "force-dynamic";

interface MentorNoteRouteContext {
  params: Promise<{
    noteId: string;
  }>;
}

export async function PATCH(request: Request, context: MentorNoteRouteContext) {
  const { noteId } = await context.params;
  const idValidation = validateMentorNoteId(noteId);

  if (!idValidation.isValid || !idValidation.input) {
    return NextResponse.json({ errors: idValidation.errors }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const updateValidation = validateUpdateMentorNoteInput(body);

  if (!updateValidation.isValid || !updateValidation.input) {
    return NextResponse.json(
      { errors: updateValidation.errors },
      { status: 400 },
    );
  }

  try {
    const note = await new MentorNoteService().update(
      await getMentorNoteAuthContext(),
      idValidation.input.noteId,
      updateValidation.input,
    );

    return NextResponse.json({ note }, { status: 200 });
  } catch (error) {
    return handleMentorNoteError(error, "Unable to update mentor note.");
  }
}

export async function DELETE(
  _request: Request,
  context: MentorNoteRouteContext,
) {
  const { noteId } = await context.params;
  const idValidation = validateMentorNoteId(noteId);

  if (!idValidation.isValid || !idValidation.input) {
    return NextResponse.json({ errors: idValidation.errors }, { status: 400 });
  }

  try {
    await new MentorNoteService().delete(
      await getMentorNoteAuthContext(),
      idValidation.input.noteId,
    );

    return new Response(null, { status: 204 });
  } catch (error) {
    return handleMentorNoteError(error, "Unable to delete mentor note.");
  }
}

function handleMentorNoteError(error: unknown, fallbackMessage: string) {
  if (error instanceof MentorNoteServiceError) {
    return createSafeErrorResponse({
      context: "api/mentor-notes/[noteId]:notes",
      error,
      fallbackMessage,
      statusCode: error.statusCode,
    });
  }

  if (error instanceof UserServiceError) {
    return createSafeErrorResponse({
      context: "api/mentor-notes/[noteId]:user",
      error,
      fallbackMessage,
      statusCode: error.statusCode,
    });
  }

  return createSafeErrorResponse({
    context: "api/mentor-notes/[noteId]:unexpected",
    error,
    fallbackMessage,
  });
}
