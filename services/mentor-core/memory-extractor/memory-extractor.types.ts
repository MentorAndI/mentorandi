export type MemoryCandidateCategory =
  | "GOAL"
  | "CHALLENGE"
  | "PREFERENCE"
  | "VALUE"
  | "IDENTITY"
  | "INTEREST"
  | "GENERAL";

export interface ExtractMemoryCandidatesInput {
  conversationId: string;
  userId: string;
  userMessage: string;
}

export interface MemoryCandidate {
  category: MemoryCandidateCategory;
  confidence: number;
  content: string;
  importance: number;
  sourceConversationId: string;
  title: string;
}

export interface MemoryExtractionResult {
  memoryCandidates: MemoryCandidate[];
}

export interface MemoryExtractorValidationResult<TInput> {
  errors: Record<string, string>;
  input?: TInput;
  isValid: boolean;
}
