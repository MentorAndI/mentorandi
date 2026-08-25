import type { UpdateMentorNoteInput } from "@/services/mentor-notes/mentor-note.types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateMentorNoteId(value: string) {
  const noteId = value.trim();

  return uuidPattern.test(noteId)
    ? { errors: {}, input: { noteId }, isValid: true as const }
    : {
        errors: { noteId: "Mentor note ID must be a valid UUID." },
        isValid: false as const,
      };
}

export function validateUpdateMentorNoteInput(body: unknown): {
  errors: Record<string, string>;
  input?: UpdateMentorNoteInput;
  isValid: boolean;
} {
  if (!body || typeof body !== "object") {
    return {
      errors: { body: "Request body must be a JSON object." },
      isValid: false,
    };
  }

  const input: UpdateMentorNoteInput = {};
  const errors: Record<string, string> = {};

  if ("pinned" in body) {
    if (typeof body.pinned !== "boolean") {
      errors.pinned = "Pinned must be true or false.";
    } else {
      input.pinned = body.pinned;
    }
  }

  if ("archived" in body) {
    if (typeof body.archived !== "boolean") {
      errors.archived = "Archived must be true or false.";
    } else {
      input.archived = body.archived;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { errors, isValid: false };
  }

  if (input.pinned === undefined && input.archived === undefined) {
    return {
      errors: { body: "Provide pinned or archived." },
      isValid: false,
    };
  }

  return { errors: {}, input, isValid: true };
}
