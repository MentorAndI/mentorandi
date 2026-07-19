import type {
  MentorResponsePipelineInput,
  MentorResponsePipelineValidationResult,
} from "@/services/mentor-core/response-pipeline/response-pipeline.types";
import { isActiveMentorSlug } from "@/services/mentor-catalog/mentor-catalog";
import type { ActiveMentorSlug } from "@/services/mentor-catalog/mentor-catalog.types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const maxMessageLength = 10000;

export function validateMentorResponsePipelineInput(
  body: unknown,
): MentorResponsePipelineValidationResult<MentorResponsePipelineInput> {
  const errors: Record<string, string> = {};

  if (!body || typeof body !== "object") {
    return {
      errors: { body: "Request body must be a JSON object." },
      isValid: false,
    };
  }

  const userId = readStringField(body, "userId");
  const conversationId = readStringField(body, "conversationId");
  const message = readStringField(body, "message");
  const mentorSpecialty = readStringField(body, "mentorSpecialty");

  validateUuidField(errors, "userId", userId, "User ID");
  validateUuidField(
    errors,
    "conversationId",
    conversationId,
    "Conversation ID",
  );

  if (!message) {
    errors.message = "Message is required.";
  } else if (message.length > maxMessageLength) {
    errors.message = `Message must be ${maxMessageLength} characters or fewer.`;
  }

  if (mentorSpecialty && !isActiveMentorSlug(mentorSpecialty)) {
    errors.mentorSpecialty = "Mentor specialization is not active.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors, isValid: false };
  }

  return {
    errors,
    input: {
      conversationId,
      message,
      mentorSpecialty: mentorSpecialty
        ? (mentorSpecialty as ActiveMentorSlug)
        : undefined,
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
