"use client";

import Link from "next/link";
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
import { buildLoginPath } from "@/services/auth/redirects";
import { validateSignupForm } from "@/services/auth/validation";

interface SignupFormValues {
  ageConfirmed: boolean;
  email: string;
  password: string;
  passwordConfirmation: string;
}

interface SignupFormErrors {
  ageConfirmation?: string;
  email?: string;
  form?: string;
  password?: string;
  passwordConfirmation?: string;
}

export interface SignupFormProps {
  redirectPath?: string;
}

export function SignupForm({
  redirectPath = "/onboarding",
}: SignupFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<SignupFormValues>({
    ageConfirmed: false,
    email: "",
    password: "",
    passwordConfirmation: "",
  });
  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setConfirmationEmail(null);

    const validation = validateSignupForm(
      values.email,
      values.password,
      values.passwordConfirmation,
      values.ageConfirmed,
    );

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await signUpWithEmailPassword({
        ageConfirmed: values.ageConfirmed,
        email: values.email,
        nextPath: redirectPath,
        password: values.password,
      });

      if (error) {
        setErrors({
          form: formatSignupAuthError(error.message),
        });
        return;
      }

      if (data.session) {
        await syncCurrentUser();
        router.replace(redirectPath);
        router.refresh();
        return;
      }

      setConfirmationEmail(values.email.trim());
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
      {confirmationEmail ? (
        <div className="space-y-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <div className="space-y-2">
            <p className="font-medium">
              Check your email to confirm your account before logging in.
            </p>
            <p>
              We sent the confirmation email to{" "}
              <span className="font-medium">{confirmationEmail}</span>. It may
              take a minute to arrive.
            </p>
            <p>
              Clicking the confirmation link will log you in and take you to
              your onboarding.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800"
              href={buildLoginPath(redirectPath)}
            >
              Login
            </Link>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md border border-emerald-300 bg-white px-4 text-sm font-medium text-emerald-950 hover:bg-emerald-100"
              href="/"
            >
              Back home
            </Link>
          </div>
        </div>
      ) : null}

      {errors.form ? (
        <AuthStatusMessage id="signup-form-error" variant="error">
          {errors.form}
        </AuthStatusMessage>
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

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-[var(--ink-muted)]" htmlFor="signup-age-confirmation">
          <input
            aria-describedby={errors.ageConfirmation ? "signup-age-confirmation-error" : undefined}
            checked={values.ageConfirmed}
            className="mt-1 h-4 w-4 shrink-0 accent-[var(--terra-hover)]"
            id="signup-age-confirmation"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                ageConfirmed: event.target.checked,
              }))
            }
            type="checkbox"
          />
          <span>I confirm that I am 18 years of age or older.</span>
        </label>
        {errors.ageConfirmation ? (
          <p
            className="mt-2 text-sm text-[var(--danger)]"
            id="signup-age-confirmation-error"
            role="alert"
          >
            {errors.ageConfirmation}
          </p>
        ) : null}
      </div>

      <Button
        aria-describedby={errors.form ? "signup-form-error" : undefined}
        className="w-full"
        disabled={isSubmitting || Boolean(confirmationEmail)}
        type="submit"
      >
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}

function formatSignupAuthError(message?: string) {
  const safeMessage = sanitizeAuthErrorMessage(message);

  if (!safeMessage) {
    return "Signup failed. Please check your information and try again.";
  }

  return `Signup failed: ${safeMessage}`;
}

function sanitizeAuthErrorMessage(message?: string) {
  return (message ?? "")
    .replace(/\b(access_token|refresh_token|token|code)=([^&\s]+)/gi, "$1=[redacted]")
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[redacted]")
    .replace(/\b[A-Za-z0-9_-]{48,}\b/g, "[redacted]")
    .trim()
    .slice(0, 500);
}