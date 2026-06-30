export interface MemoryAuthContext {
  authUserId: string;
}

export interface MemoryFilters {
  category?: string;
  minimumConfidence?: number;
  minimumImportance?: number;
}

export interface CreateMemoryInput {
  category: string;
  confidence: number;
  content: string;
  importance: number;
  sourceConversationId?: string;
  title: string;
}

export type UpdateMemoryInput = Partial<
  Pick<
    CreateMemoryInput,
    "category" | "confidence" | "content" | "importance" | "title"
  >
>;

export interface MentorUnderstandingDto {
  category: string;
  confidence: number;
  content: string;
  createdAt: string;
  id: string;
  importance: number;
  sourceConversationId: string | null;
  title: string;
  updatedAt: string;
}

export interface MemoryValidationResult<TInput> {
  errors: Record<string, string>;
  input?: TInput;
  isValid: boolean;
}
