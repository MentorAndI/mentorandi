import {
  accountDataDeleteConfirmation,
  type AccountDataDeleteInput,
  type AccountDataValidationResult,
} from "@/services/account-data/account-data.types";

export function validateAccountDataDeleteInput(
  body: unknown,
): AccountDataValidationResult<AccountDataDeleteInput> {
  const errors: Record<string, string> = {};

  if (!body || typeof body !== "object") {
    return {
      errors: { body: "Request body must be a JSON object." },
      isValid: false,
    };
  }

  const confirmation =
    "confirmation" in body && typeof body.confirmation === "string"
      ? body.confirmation.trim()
      : "";

  if (confirmation !== accountDataDeleteConfirmation) {
    errors.confirmation = "Confirmation text is incorrect.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      isValid: false,
    };
  }

  return {
    errors,
    input: {
      confirmation,
    },
    isValid: true,
  };
}
