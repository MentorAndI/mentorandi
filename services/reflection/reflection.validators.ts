import type {
  CreateReflectionInput,
  ReflectionValidationResult,
} from "@/services/reflection/reflection.types";

const maxReflectionSummaryLength = 500;

export function validateCreateReflectionInput(
  body: unknown,
): ReflectionValidationResult<CreateReflectionInput> {
  const errors: Record<string, string> = {};

  if (!body || typeof body !== "object") {
    return {
      errors: { body: "Request body must be a JSON object." },
      isValid: false,
    };
  }

  const summary =
    "summary" in body && typeof body.summary === "string"
      ? body.summary.trim()
      : "";

  if (!summary) {
    errors.summary = "Reflection summary is required.";
  } else if (summary.length > maxReflectionSummaryLength) {
    errors.summary = `Reflection summary must be ${maxReflectionSummaryLength} characters or fewer.`;
  }

  if (Object.keys(errors).length > 0) {
    return { errors, isValid: false };
  }

  return {
    errors,
    input: {
      summary,
    },
    isValid: true,
  };
}
