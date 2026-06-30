import type {
  ConversationValidationResult,
  CreateConversationInput,
} from "@/services/conversation/conversation.types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateCreateConversationInput(
  body: unknown,
): ConversationValidationResult<CreateConversationInput> {
  const errors: Record<string, string> = {};

  if (!body || typeof body !== "object") {
    return {
      errors: { body: "Request body must be a JSON object." },
      isValid: false,
    };
  }

  const mentorId =
    "mentorId" in body && typeof body.mentorId === "string"
      ? body.mentorId.trim()
      : "";

  if (!mentorId) {
    errors.mentorId = "Mentor ID is required.";
  } else if (!uuidPattern.test(mentorId)) {
    errors.mentorId = "Mentor ID must be a valid UUID.";
  }

  return {
    errors,
    input: errors.mentorId ? undefined : { mentorId },
    isValid: Object.keys(errors).length === 0,
  };
}
