import type { GoalStatus } from "@/lib/generated/prisma/client";

export interface ExtractGoalCandidatesInput {
  conversationId: string;
  userId: string;
  userMessage: string;
}

export interface GoalCandidate {
  description: string;
  sourceConversationId: string;
  status: GoalStatus;
  title: string;
}

export interface GoalExtractionResult {
  goalCandidates: GoalCandidate[];
}

export interface GoalExtractorValidationResult<TInput> {
  errors: Record<string, string>;
  input?: TInput;
  isValid: boolean;
}
