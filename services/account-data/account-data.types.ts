export const accountDataDeleteConfirmation = "DELETE_MY_MENTOR_DATA";

export interface AccountDataDeleteInput {
  confirmation: string;
}

export interface AccountDataDeleteCounts {
  clearedSelectedMentor: boolean;
  deletedConversations: number;
  deletedFeedback: number;
  deletedGoals: number;
  deletedJournalEntries: number;
  deletedMemories: number;
  deletedMessages: number;
  deletedReflections: number;
  deletedUsageEvents: number;
}

export interface AccountDataValidationResult<TInput> {
  errors: Record<string, string>;
  input?: TInput;
  isValid: boolean;
}
