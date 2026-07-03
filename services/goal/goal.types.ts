import type { GoalStatus } from "@/lib/generated/prisma/client";

export interface CreateGoalInput {
  description?: string;
  status?: GoalStatus;
  targetDate?: Date | null;
  title: string;
}

export interface GoalDto {
  createdAt: string;
  description: string | null;
  id: string;
  status: GoalStatus;
  targetDate: string | null;
  title: string;
  updatedAt: string;
}

export interface GoalValidationResult<TInput> {
  errors: Record<string, string>;
  input?: TInput;
  isValid: boolean;
}
