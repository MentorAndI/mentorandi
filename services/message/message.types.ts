import type { MessageRole } from "@/lib/generated/prisma/client";

export interface MessageAuthContext {
  authUserId: string | null;
}

export interface CreateMessageInput {
  content: string;
  role: MessageRole;
}

export interface MessageDto {
  content: string;
  conversationId: string;
  createdAt: string;
  id: string;
  role: MessageRole;
}

export interface MessageValidationResult<TInput> {
  errors: Record<string, string>;
  input?: TInput;
  isValid: boolean;
}
