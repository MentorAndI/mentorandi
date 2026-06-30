"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { AuthStatusMessage } from "@/components/auth/AuthStatusMessage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signUpWithEmailPassword } from "@/services/auth/client";
import { validateSignupForm } from "@/services/auth/validation";

interface SignupFormValues {
  email: string;
  password: string;
  passwordConfirmation: string;
}

interface SignupFormErrors {
  email?: string;
  form?: string;
  password?: string;
  passwordConfirmation?: string;
}

export interface SignupFormProps {
  successMessage?: string;
}

export function SignupForm({
  successMessage = "Check your email to confirm your account.",
}: SignupFormProps) {
  const [values, setValues] = useState<SignupFormValues>({
    email: "",
    password: "",
    passwordConfirmation: "",
  });
  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setSuccess(null);

    const validation = validateSignupForm(
      values.email,
      values.password,
      values.passwordConfirmation,
    );

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await signUpWithEmailPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        setErrors({ form: error.message });
        return;
      }

      setSuccess(successMessage);
    } catch {
      setErrors({
        form: "Unable to create an account right now. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit}>
      {errors.form ? (
        <AuthStatusMessage id="signup-form-error" variant="error">
          {errors.form}
        </AuthStatusMessage>
      ) : null}
      {success ? (
        <AuthStatusMessage variant="success">{success}</AuthStatusMessage>
      ) : null}

      <Input
        autoComplete="email"
        error={errors.email}
        id="signup-email"
        inputMode="email"
        label="Email"
        onChange={(event) =>
          setValues((current) => ({ ...current, email: event.target.value }))
        }
        type="email"
        value={values.email}
      />

      <Input
        autoComplete="new-password"
        error={errors.password}
        hint="Use at least 8 characters."
        id="signup-password"
        label="Password"
        onChange={(event) =>
          setValues((current) => ({
            ...current,
            password: event.target.value,
          }))
        }
        type="password"
        value={values.password}
      />

      <Input
        autoComplete="new-password"
        error={errors.passwordConfirmation}
        id="signup-password-confirmation"
        label="Confirm password"
        onChange={(event) =>
          setValues((current) => ({
            ...current,
            passwordConfirmation: event.target.value,
          }))
        }
        type="password"
        value={values.passwordConfirmation}
      />

      <Button
        aria-describedby={errors.form ? "signup-form-error" : undefined}
        className="w-full"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
