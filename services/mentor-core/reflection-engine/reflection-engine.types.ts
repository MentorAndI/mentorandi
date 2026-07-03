export interface BuildReflectionCandidateInput {
  conversationId: string;
  mentorMessage: string;
  userId: string;
  userMessage: string;
}

export interface ReflectionCandidate {
  summary: string;
}

export interface ReflectionEngineResult {
  reflectionCandidate: ReflectionCandidate | null;
}

export interface ReflectionEngineValidationResult<TInput> {
  errors: Record<string, string>;
  input?: TInput;
  isValid: boolean;
}
