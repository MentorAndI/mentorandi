import type {
  AuthUserIdInput,
  UserValidationResult,
} from "@/services/user/user.types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateAuthUserId(
  authUserId: unknown,
): UserValidationResult<AuthUserIdInput> {
  const errors: Record<string, string> = {};
  const normalizedAuthUserId =
    typeof authUserId === "string" ? authUserId.trim() : "";

  if (!normalizedAuthUserId) {
    errors.authUserId = "Auth user ID is required.";
  } else if (!uuidPattern.test(normalizedAuthUserId)) {
    errors.authUserId = "Auth user ID must be a valid UUID.";
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
      authUserId: normalizedAuthUserId,
    },
    isValid: true,
  };
}
