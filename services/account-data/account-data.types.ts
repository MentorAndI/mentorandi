export const accountDataDeleteConfirmation = "DELETE_MY_MENTOR_DATA";

export interface AccountDataDeleteInput {
  confirmation: string;
}

export interface AccountDataDeleteCounts {
  deletedConversations: number;
  deletedGoals: number;
  deletedMemories: number;
  deletedMessages: number;
  deletedReflections: number;
}

export interface AccountDataValidationResult<TInput> {
  errors: Record<string, string>;
  input?: TInput;
  isValid: boolean;
}
