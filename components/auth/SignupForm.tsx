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
}

export function SignupForm({
  redirectPath = "/start",
}: SignupFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<SignupFormValues>({
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
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800"
              href="/login"
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
