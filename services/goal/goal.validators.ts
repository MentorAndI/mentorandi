import type {
  CreateGoalInput,
  GoalValidationResult,
} from "@/services/goal/goal.types";

const maxGoalDescriptionLength = 500;
const maxGoalTitleLength = 140;

export function validateCreateGoalInput(
  body: unknown,
): GoalValidationResult<CreateGoalInput> {
  const errors: Record<string, string> = {};

  if (!body || typeof body !== "object") {
    return {
      errors: { body: "Request body must be a JSON object." },
      isValid: false,
    };
  }

  const title = readStringField(body, "title");
  const description = readOptionalStringField(body, "description");

  if (!title) {
    errors.title = "Goal title is required.";
  } else if (title.length > maxGoalTitleLength) {
    errors.title = `Goal title must be ${maxGoalTitleLength} characters or fewer.`;
  }

  if (
    description !== undefined &&
    description.length > maxGoalDescriptionLength
  ) {
    errors.description = `Goal description must be ${maxGoalDescriptionLength} characters or fewer.`;
  }

  if (Object.keys(errors).length > 0) {
    return { errors, isValid: false };
  }

  return {
    errors,
    input: {
      description,
      title,
    },
    isValid: true,
  };
}

function readStringField(body: object, field: string) {
  return field in body && typeof body[field as keyof typeof body] === "string"
    ? String(body[field as keyof typeof body]).trim()
    : "";
}

function readOptionalStringField(body: object, field: string) {
  if (!(field in body) || body[field as keyof typeof body] === null) {
    return undefined;
  }

  return typeof body[field as keyof typeof body] === "string"
    ? String(body[field as keyof typeof body]).trim() || undefined
    : undefined;
}
