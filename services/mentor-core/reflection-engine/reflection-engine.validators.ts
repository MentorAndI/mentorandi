import type {
  BuildReflectionCandidateInput,
  ReflectionEngineValidationResult,
} from "@/services/mentor-core/reflection-engine/reflection-engine.types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const maxMessageLength = 10000;

export function validateBuildReflectionCandidateInput(
  body: unknown,
): ReflectionEngineValidationResult<BuildReflectionCandidateInput> {
  const errors: Record<string, string> = {};

  if (!body || typeof body !== "object") {
    return {
      errors: { body: "Request body must be a JSON object." },
      isValid: false,
    };
  }

  const userId = readStringField(body, "userId");
  const conversationId = readStringField(body, "conversationId");
  const userMessage = readStringField(body, "userMessage");
  const mentorMessage = readStringField(body, "mentorMessage");

  validateUuidField(errors, "userId", userId, "User ID");
  validateUuidField(
    errors,
    "conversationId",
    conversationId,
    "Conversation ID",
  );
  validateMessageField(errors, "userMessage", userMessage, "User message");
  validateMessageField(
    errors,
    "mentorMessage",
    mentorMessage,
    "Mentor message",
  );

  if (Object.keys(errors).length > 0) {
    return { errors, isValid: false };
  }

  return {
    errors,
    input: {
      conversationId,
      mentorMessage,
      userId,
      userMessage,
    },
    isValid: true,
  };
}

function readStringField(body: object, field: string) {
  return field in body && typeof body[field as keyof typeof body] === "string"
    ? String(body[field as keyof typeof body]).trim()
    : "";
}

function validateUuidField(
  errors: Record<string, string>,
  field: string,
  value: string,
  label: string,
) {
  if (!value) {
    errors[field] = `${label} is required.`;
  } else if (!uuidPattern.test(value)) {
    errors[field] = `${label} must be a valid UUID.`;
  }
}

function validateMessageField(
  errors: Record<string, string>,
  field: string,
  value: string,
  label: string,
) {
  if (!value) {
    errors[field] = `${label} is required.`;
  } else if (value.length > maxMessageLength) {
    errors[field] = `${label} must be ${maxMessageLength} characters or fewer.`;
  }
}
