export interface AuthValidationResult {
  errors: Record<string, string>;
  isValid: boolean;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!email.trim()) {
    return "Email is required.";
  }

  if (!emailPattern.test(email)) {
    return "Enter a valid email address.";
  }

  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return "Password is required.";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  return null;
}

export function validatePasswordConfirmation(
  password: string,
  passwordConfirmation: string,
): string | null {
  if (!passwordConfirmation) {
    return "Please confirm your password.";
  }

  if (password !== passwordConfirmation) {
    return "Passwords do not match.";
  }

  return null;
}

export function validateAgeConfirmation(ageConfirmed: boolean): string | null {
  return ageConfirmed
    ? null
    : "You must confirm that you are 18 years of age or older.";
}

export function validateLoginForm(
  email: string,
  password: string,
): AuthValidationResult {
  const errors: Record<string, string> = {};
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);

  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;

  return { errors, isValid: Object.keys(errors).length === 0 };
}

export function validateSignupForm(
  email: string,
  password: string,
  passwordConfirmation: string,
  ageConfirmed = false,
): AuthValidationResult {
  const errors: Record<string, string> = {};
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  const confirmationError = validatePasswordConfirmation(
    password,
    passwordConfirmation,
  );
  const ageConfirmationError = validateAgeConfirmation(ageConfirmed);

  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;
  if (confirmationError) errors.passwordConfirmation = confirmationError;
  if (ageConfirmationError) errors.ageConfirmation = ageConfirmationError;

  return { errors, isValid: Object.keys(errors).length === 0 };
}

export function validateForgotPasswordForm(email: string): AuthValidationResult {
  const errors: Record<string, string> = {};
  const emailError = validateEmail(email);

  if (emailError) errors.email = emailError;

  return { errors, isValid: Object.keys(errors).length === 0 };
}
