"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { AuthStatusMessage } from "@/components/auth/AuthStatusMessage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { requestPasswordReset } from "@/services/auth/client";
import { validateForgotPasswordForm } from "@/services/auth/validation";

interface ForgotPasswordFormErrors {
  email?: string;
  form?: string;
}

export interface ForgotPasswordFormProps {
  successMessage?: string;
}

export function ForgotPasswordForm({
  successMessage = "If an account exists for that email, a reset link has been sent.",
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<ForgotPasswordFormErrors>({});
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setSuccess(null);

    const validation = validateForgotPasswordForm(email);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const redirectTo = `${window.location.origin}/login`;
      const { error } = await requestPasswordReset(email, redirectTo);

      if (error) {
        setErrors({ form: error.message });
        return;
      }

      setSuccess(successMessage);
    } catch {
      setErrors({
        form: "Unable to send a reset link right now. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit}>
      {errors.form ? (
        <AuthStatusMessage id="forgot-password-form-error" variant="error">
          {errors.form}
        </AuthStatusMessage>
      ) : null}
      {success ? (
        <AuthStatusMessage variant="success">{success}</AuthStatusMessage>
      ) : null}

      <Input
        autoComplete="email"
        error={errors.email}
        id="forgot-password-email"
        inputMode="email"
        label="Email"
        onChange={(event) => setEmail(event.target.value)}
        type="email"
        value={email}
      />

      <Button
        aria-describedby={
          errors.form ? "forgot-password-form-error" : undefined
        }
        className="w-full"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Sending reset link..." : "Send reset link"}
      </Button>
    </form>
  );
}
