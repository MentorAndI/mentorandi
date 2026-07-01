import type {
  BuildMentorContextInput,
  ContextBuilderValidationResult,
} from "@/services/mentor-core/context-builder/context-builder.types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const maxCurrentMessageLength = 10000;

export function validateBuildMentorContextInput(
  body: unknown,
): ContextBuilderValidationResult<BuildMentorContextInput> {
  const errors: Record<string, string> = {};

  if (!body || typeof body !== "object") {
    return {
      errors: { body: "Request body must be a JSON object." },
      isValid: false,
    };
  }

  const userId = readStringField(body, "userId");
  const conversationId = readStringField(body, "conversationId");
  const currentMessage = readOptionalStringField(body, "currentMessage");

  validateUuidField(errors, "userId", userId, "User ID");
  validateUuidField(
    errors,
    "conversationId",
    conversationId,
    "Conversation ID",
  );

  if (
    currentMessage !== undefined &&
    currentMessage.length > maxCurrentMessageLength
  ) {
    errors.currentMessage = `Current message must be ${maxCurrentMessageLength} characters or fewer.`;
  }

  if (Object.keys(errors).length > 0) {
    return { errors, isValid: false };
  }

  return {
    errors,
    input: {
      conversationId,
      currentMessage,
      userId,
    },
    isValid: true,
  };
}

function readStringField(body: object, field: string) {
  return field in body && typeof body[field as keyof typeof body] === "string"
    ? String(body[field as keyof typeof body]).trim()
    : "";
}

function readOptionalStringField(body: object, field: string) {
  if (!(field in body) || body[field as keyof typeof body] === null) {
    return undefined;
  }

  return typeof body[field as keyof typeof body] === "string"
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
