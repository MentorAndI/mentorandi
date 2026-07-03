import { GoalRepository } from "@/services/goal/goal.repository";
import type {
  CreateGoalInput,
  GoalDedupeResult,
  GoalDto,
  UpdateGoalInput,
} from "@/services/goal/goal.types";
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

  async listActiveGoalsForUserId(
    userId: string,
    limit?: number,
  ): Promise<GoalDto[]> {
    await this.ensureUserById(userId);

    const goals = await this.repository.findActiveGoalsForUser(userId, limit);

    return goals.map(toGoalDto);
  }

  async createUniqueActiveGoalForUserId(
    userId: string,
    input: CreateGoalInput,
  ): Promise<GoalDedupeResult> {
    const validation = validateCreateGoalInput(input);

    if (!validation.isValid || !validation.input) {
      throw new GoalServiceError(
        `Invalid goal input: ${Object.values(validation.errors).join(" ")}`,
        400,
      );
    }

    const validatedInput = validation.input;

    await this.ensureUserById(userId);

    const activeGoals = await this.repository.findActiveGoalsForUser(userId);
    const duplicateGoal = activeGoals.find((goal) =>
      areSimilarGoalTitles(goal.title, validatedInput.title),
    );

    if (duplicateGoal) {
      if (shouldUpdateDuplicateGoal(validatedInput, duplicateGoal)) {
        const updatedGoalInput = buildDuplicateGoalUpdate(
          validatedInput,
          duplicateGoal,
        );
        const updatedGoals = await this.repository.updateActiveGoalForUser(
          duplicateGoal.id,
          userId,
          updatedGoalInput,
        );
        const updatedGoal = updatedGoals[0] ?? duplicateGoal;

        return {
          goal: toGoalDto(updatedGoal),
          status: "updated",
        };
      }

      return {
        goal: toGoalDto(duplicateGoal),
        status: "skipped_duplicate",
      };
    }

    const goal = await this.repository.createGoalForUser(
      userId,
      validatedInput,
    );

    return {
      goal: toGoalDto(goal),
      status: "created",
    };
  }

  private async ensureUserById(userId: string) {
    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw new GoalServiceError("User was not found.", 404);
    }

    return user;
  }
}

type GoalRecord = {
  createdAt: Date;
  description: string | null;
  id: string;
  status: GoalDto["status"];
  targetDate: Date | null;
  title: string;
  updatedAt: Date;
};

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

  const firstTokens = toGoalTokenSet(first);
  const secondTokens = toGoalTokenSet(second);

  if (firstTokens.size === 0 || secondTokens.size === 0) {
    return false;
  }

  const sharedTokenCount = Array.from(firstTokens).filter((token) =>
    secondTokens.has(token),
  ).length;
  const smallerSetSize = Math.min(firstTokens.size, secondTokens.size);
  const unionSetSize = new Set([...firstTokens, ...secondTokens]).size;
  const sharedHighSignalToken = Array.from(firstTokens).some(
    (token) => secondTokens.has(token) && highSignalGoalTokens.has(token),
  );

  if (
    sharedTokenCount === smallerSetSize &&
    smallerSetSize <= 2 &&
    sharedHighSignalToken
  ) {
    return true;
  }

  return (
    sharedTokenCount / smallerSetSize >= 0.9 &&
    sharedTokenCount / unionSetSize >= 0.6
  );
}

function normalizeGoalTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/mentor\s+and\s+i/g, "mentorandi")
    .replace(/\bstop\s+overthinking\b/g, "reduce overthinking")
    .replace(/\bstop\s+worrying\b/g, "reduce worrying")
    .replace(/\bstop\s+procrastinating\b/g, "reduce procrastination")
    .replace(/\bbecoming\b/g, "become")
    .replace(/\bfocused\b/g, "focus")
    .replace(/\bget\s+better\s+at\b/g, " ")
    .replace(/\bwork(?:ing)?\s+on\b/g, " ")
    .replace(/\bhelp\s+with\b/g, " ")
    .replace(/\btrying\s+to\b/g, " ")
    .replace(/\btry\s+to\b/g, " ")
    .replace(/\bimprove\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toGoalTokenSet(normalizedTitle: string) {
  return new Set(
    normalizedTitle
      .split(" ")
      .map((token) => token.trim())
      .filter((token) => token && !duplicateComparisonStopWords.has(token)),
  );
}

function shouldUpdateDuplicateGoal(
  input: CreateGoalInput,
  existingGoal: GoalRecord,
) {
  return scoreGoalSpecificity(input) > scoreGoalSpecificity(existingGoal) + 1;
}

function buildDuplicateGoalUpdate(
  input: CreateGoalInput,
  existingGoal: GoalRecord,
): UpdateGoalInput {
  const inputScore = scoreGoalSpecificity(input);
  const existingScore = scoreGoalSpecificity(existingGoal);
  const shouldUseInputText = inputScore > existingScore;

  return {
    description:
      shouldUseInputText && input.description
        ? input.description
        : existingGoal.description,
    targetDate: input.targetDate ?? existingGoal.targetDate,
    title: shouldUseInputText ? input.title : existingGoal.title,
  };
}

function scoreGoalSpecificity(goal: {
  description?: string | null;
  targetDate?: Date | null;
  title: string;
}) {
  const normalizedTitle = normalizeGoalTitle(goal.title);
  const titleTokenCount = toGoalTokenSet(normalizedTitle).size;
  const titleLengthScore = Math.min(goal.title.length / 35, 4);
  const descriptionScore = goal.description
    ? Math.min(goal.description.length / 80, 2)
    : 0;
  const targetDateScore = goal.targetDate ? 1 : 0;

  return (
    titleTokenCount + titleLengthScore + descriptionScore + targetDateScore
  );
}

const duplicateComparisonStopWords = new Set([
  "a",
  "an",
  "and",
  "be",
  "become",
  "better",
  "get",
  "goal",
  "help",
  "i",
  "improve",
  "is",
  "more",
  "my",
  "on",
  "the",
  "to",
  "try",
  "trying",
  "user",
  "with",
  "work",
  "working",
]);

const highSignalGoalTokens = new Set([
  "build",
  "confidence",
  "focus",
  "focused",
  "mentorandi",
  "overthinking",
  "project",
]);

function toGoalDto(goal: GoalRecord): GoalDto {
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
