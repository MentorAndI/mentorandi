import { GoalRepository } from "@/services/goal/goal.repository";
import type { CreateGoalInput, GoalDto } from "@/services/goal/goal.types";
import { validateCreateGoalInput } from "@/services/goal/goal.validators";

export class GoalServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "GoalServiceError";
  }
}

export class GoalService {
  constructor(private readonly repository = new GoalRepository()) {}

  async createUniqueActiveGoalForUserId(
    userId: string,
    input: CreateGoalInput,
  ): Promise<GoalDto | null> {
    const validation = validateCreateGoalInput(input);

    if (!validation.isValid || !validation.input) {
      throw new GoalServiceError(
        `Invalid goal input: ${Object.values(validation.errors).join(" ")}`,
        400,
      );
    }

    await this.ensureUserById(userId);

    const activeGoals = await this.repository.findActiveGoalsForUser(userId);
    const hasDuplicate = activeGoals.some((goal) =>
      areSimilarGoalTitles(goal.title, validation.input?.title ?? ""),
    );

    if (hasDuplicate) {
      return null;
    }

    const goal = await this.repository.createGoalForUser(
      userId,
      validation.input,
    );

    return toGoalDto(goal);
  }

  private async ensureUserById(userId: string) {
    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw new GoalServiceError("User was not found.", 404);
    }

    return user;
  }
}

function areSimilarGoalTitles(firstTitle: string, secondTitle: string) {
  const first = normalizeGoalTitle(firstTitle);
  const second = normalizeGoalTitle(secondTitle);

  if (!first || !second) {
    return false;
  }

  if (first === second) {
    return true;
  }

  if (
    first.length >= 18 &&
    second.length >= 18 &&
    (first.includes(second) || second.includes(first))
  ) {
    return true;
  }

  const firstTokens = new Set(first.split(" ").filter(Boolean));
  const secondTokens = new Set(second.split(" ").filter(Boolean));
  const sharedTokenCount = Array.from(firstTokens).filter((token) =>
    secondTokens.has(token),
  ).length;
  const unionTokenCount = new Set([...firstTokens, ...secondTokens]).size;

  return unionTokenCount > 0 && sharedTokenCount / unionTokenCount >= 0.8;
}

function normalizeGoalTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((token) => token && !duplicateComparisonStopWords.has(token))
    .join(" ")
    .trim();
}

const duplicateComparisonStopWords = new Set([
  "a",
  "an",
  "and",
  "be",
  "become",
  "get",
  "more",
  "the",
  "to",
]);

function toGoalDto(goal: {
  createdAt: Date;
  description: string | null;
  id: string;
  status: GoalDto["status"];
  targetDate: Date | null;
  title: string;
  updatedAt: Date;
}): GoalDto {
  return {
    createdAt: goal.createdAt.toISOString(),
    description: goal.description,
    id: goal.id,
    status: goal.status,
    targetDate: goal.targetDate?.toISOString() ?? null,
    title: goal.title,
    updatedAt: goal.updatedAt.toISOString(),
  };
}
