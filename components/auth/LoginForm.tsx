"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

import { AuthStatusMessage } from "@/components/auth/AuthStatusMessage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  signInWithEmailPassword,
  syncCurrentUser,
  type EmailPasswordCredentials,
} from "@/services/auth/client";
import { validateLoginForm } from "@/services/auth/validation";

interface LoginFormErrors {
  email?: string;
  form?: string;
  password?: string;
}

export interface LoginFormProps {
  redirectPath?: string;
}

export function LoginForm({ redirectPath = "/" }: LoginFormProps) {
  const router = useRouter();
  const [credentials, setCredentials] = useState<EmailPasswordCredentials>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const validation = validateLoginForm(
      credentials.email,
      credentials.password,
    );

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await signInWithEmailPassword(credentials);

      if (error) {
        setErrors({ form: error.message });
        return;
      }

      await syncCurrentUser();
      router.replace(redirectPath);
      router.refresh();
    } catch {
      setErrors({
        form: "Unable to sign in right now. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit}>
      {errors.form ? (
        <AuthStatusMessage id="login-form-error" variant="error">
          {errors.form}
        </AuthStatusMessage>
      ) : null}

      <Input
        autoComplete="email"
        error={errors.email}
        id="login-email"
        inputMode="email"
        label="Email"
        onChange={(event) =>
          setCredentials((current) => ({
            ...current,
            email: event.target.value,
          }))
        }
        type="email"
        value={credentials.email}
      />

      <Input
        autoComplete="current-password"
        error={errors.password}
        id="login-password"
        label="Password"
        onChange={(event) =>
          setCredentials((current) => ({
            ...current,
            password: event.target.value,
          }))
        }
        type="password"
        value={credentials.password}
      />

      <div className="flex justify-end">
        <Link
          className="text-sm font-medium text-zinc-700 underline underline-offset-4"
          href="/forgot-password"
        >
          Forgot password?
        </Link>
      </div>

      <Button
        aria-describedby={errors.form ? "login-form-error" : undefined}
        className="w-full"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
