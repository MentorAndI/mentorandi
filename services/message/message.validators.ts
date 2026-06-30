import { MessageRole } from "@/lib/generated/prisma/client";
import type {
  CreateMessageInput,
  MessageValidationResult,
} from "@/services/message/message.types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const messageRoles = Object.values(MessageRole);
const maxMessageLength = 10000;

export function validateConversationId(
  conversationId: string,
): MessageValidationResult<{ conversationId: string }> {
  const normalizedConversationId = conversationId.trim();

  if (!normalizedConversationId) {
    return {
      errors: { conversationId: "Conversation ID is required." },
      isValid: false,
    };
  }

  if (!uuidPattern.test(normalizedConversationId)) {
    return {
      errors: { conversationId: "Conversation ID must be a valid UUID." },
      isValid: false,
    };
  }

  return {
    errors: {},
    input: { conversationId: normalizedConversationId },
    isValid: true,
  };
}

export function validateCreateMessageInput(
  body: unknown,
): MessageValidationResult<CreateMessageInput> {
  const errors: Record<string, string> = {};

  if (!body || typeof body !== "object") {
    return {
      errors: { body: "Request body must be a JSON object." },
      isValid: false,
    };
  }

  const role =
    "role" in body && typeof body.role === "string" ? body.role : "";
  const content =
    "content" in body && typeof body.content === "string"
      ? body.content.trim()
      : "";

  if (!role) {
    errors.role = "Message role is required.";
  } else if (!messageRoles.includes(role as MessageRole)) {
    errors.role = "Message role must be USER, MENTOR, or SYSTEM.";
  }

  if (!content) {
    errors.content = "Message content is required.";
  } else if (content.length > maxMessageLength) {
    errors.content = `Message content must be ${maxMessageLength} characters or fewer.`;
  }

  if (Object.keys(errors).length > 0) {
    return { errors, isValid: false };
  }

  return {
    errors,
    input: {
      content,
      role: role as MessageRole,
    },
    isValid: true,
  };
}
