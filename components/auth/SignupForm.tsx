"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

import { AuthStatusMessage } from "@/components/auth/AuthStatusMessage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  signUpWithEmailPassword,
  syncCurrentUser,
} from "@/services/auth/client";
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
  redirectPath?: string;
  successMessage?: string;
}

export function SignupForm({
  redirectPath = "/start",
  successMessage = "Account created. Taking you to your first conversation...",
}: SignupFormProps) {
  const router = useRouter();
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
      const { data, error } = await signUpWithEmailPassword({
        email: values.email,
        emailRedirectTo:
          typeof window === "undefined"
            ? undefined
            : `${window.location.origin}${redirectPath}`,
        password: values.password,
      });

      if (error) {
        setErrors({
          form: "Unable to create an account with those details. Please check your information and try again.",
        });
        return;
      }

      if (data.session) {
        await syncCurrentUser();
      }

      setSuccess(successMessage);
      router.replace(redirectPath);
      router.refresh();
    } catch {
      setErrors({
        form: "Unable to create an account right now. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      aria-busy={isSubmitting}
      className="space-y-5"
      noValidate
      onSubmit={handleSubmit}
    >
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
