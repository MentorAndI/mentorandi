export interface AuthenticatedConversationUser {
  authUserId: string;
}

export interface CreateConversationInput {
  mentorId: string;
}

export interface ConversationMentorDto {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface ConversationDto {
  createdAt: string;
  id: string;
  mentor: ConversationMentorDto;
  updatedAt: string;
}

export interface ConversationSummaryDto extends ConversationDto {
  latestMessageAt: string | null;
  latestMessagePreview: string | null;
}

export interface ConversationValidationResult<TInput> {
  errors: Record<string, string>;
  input?: TInput;
  isValid: boolean;
}
