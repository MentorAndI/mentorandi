import type {
  ExtractMemoryCandidatesInput,
  MemoryExtractorValidationResult,
} from "@/services/mentor-core/memory-extractor/memory-extractor.types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const maxUserMessageLength = 10000;

export function validateExtractMemoryCandidatesInput(
  body: unknown,
): MemoryExtractorValidationResult<ExtractMemoryCandidatesInput> {
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

  validateUuidField(errors, "userId", userId, "User ID");
  validateUuidField(
    errors,
    "conversationId",
    conversationId,
    "Conversation ID",
  );

  if (!userMessage) {
    errors.userMessage = "User message is required.";
  } else if (userMessage.length > maxUserMessageLength) {
    errors.userMessage = `User message must be ${maxUserMessageLength} characters or fewer.`;
  }

  if (Object.keys(errors).length > 0) {
    return { errors, isValid: false };
  }

  return {
    errors,
    input: {
      conversationId,
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
