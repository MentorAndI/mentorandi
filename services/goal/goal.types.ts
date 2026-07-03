import type { GoalStatus } from "@/lib/generated/prisma/client";

export interface CreateGoalInput {
  description?: string;
  status?: GoalStatus;
  targetDate?: Date | null;
  title: string;
}

export interface UpdateGoalInput {
  description?: string | null;
  targetDate?: Date | null;
  title?: string;
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

export type GoalDedupeStatus = "created" | "skipped_duplicate" | "updated";

export interface GoalDedupeResult {
  goal: GoalDto;
  status: GoalDedupeStatus;
}

export interface GoalValidationResult<TInput> {
  errors: Record<string, string>;
  input?: TInput;
  isValid: boolean;
}
