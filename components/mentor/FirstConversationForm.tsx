"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";

import { CharacterCounter } from "@/components/mentor/CharacterCounter";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { getActiveMentorProfile } from "@/services/mentor-catalog/mentor-catalog";

export interface FirstConversationFormProps {
  characterLimit?: number;
  isAuthenticated?: boolean;
  mentorSlug?: string;
}

export function FirstConversationForm({
  characterLimit = 1200,
  isAuthenticated = false,
  mentorSlug = "life",
}: FirstConversationFormProps) {
  const router = useRouter();
  const textareaId = useId();
  const errorId = `${textareaId}-error`;
  const authPromptId = `${textareaId}-auth-prompt`;
  const [errorMessage, setErrorMessage] = useState("");
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);
  const [reflection, setReflection] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const startPath = `/start?mentor=${encodeURIComponent(mentorSlug)}`;
  const mentorName =
    getActiveMentorProfile(mentorSlug)?.personaName ?? "your mentor";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedReflection = reflection.trim();

    setErrorMessage("");
    setRequiresAuth(false);
    setRequiresUpgrade(false);

    if (!trimmedReflection) {
      setErrorMessage("Please write a few words before continuing.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/first-conversation", {
        body: JSON.stringify({
          mentor: mentorSlug,
          text: trimmedReflection,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const responseBody = (await response.json()) as {
        error?: string;
        errors?: Record<string, string>;
        upgradeMessage?: string;
      };

      if (!response.ok) {
        if (response.status === 401) {
          setRequiresAuth(true);
          setErrorMessage(
            isAuthenticated
              ? "Your session has expired. Please log in again."
              : "Create an account to save your first mentor conversation.",
          );
          return;
        }

        if (response.status === 403 && responseBody.upgradeMessage) {
          setRequiresUpgrade(true);
        }

        setErrorMessage(
          formatFirstConversationError(response.status, responseBody),
        );
        return;
      }

      router.push(`/mentor?mentor=${encodeURIComponent(mentorSlug)}`);
    } catch {
      setErrorMessage("We had trouble starting the conversation. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      aria-busy={isSubmitting}
      className="mt-10 space-y-5"
      onSubmit={handleSubmit}
    >
      {!isAuthenticated ? (
        <div
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-700"
          id={authPromptId}
        >
          Create an account to save your first mentor conversation. You can write
          your answer here first, then log in or sign up before saving it.
        </div>
      ) : null}

      <Textarea
        error={errorMessage}
        hint="A few honest sentences are enough. You can keep it simple."
        id={textareaId}
        label="What brought you here today?"
        maxLength={characterLimit}
        onChange={(event) => {
          setReflection(event.target.value);

          if (errorMessage) {
            setErrorMessage("");
          }

          if (requiresAuth) {
            setRequiresAuth(false);
          }

          if (requiresUpgrade) {
            setRequiresUpgrade(false);
          }
        }}
        placeholder="Write whatever feels true right now."
        textareaClassName="min-h-48 resize-y rounded-xl border-zinc-300 px-4 py-4 text-base leading-7"
        value={reflection}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <CharacterCounter current={reflection.length} max={characterLimit} />
          {isSubmitting ? (
            <p className="text-sm text-zinc-500" role="status">
              Starting your conversation with {mentorName}...
            </p>
          ) : null}
          {requiresAuth ? (
            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              {!isAuthenticated ? (
                <Button
                  href={`/signup?next=${encodeURIComponent(startPath)}`}
                  size="sm"
                >
                  Create account
                </Button>
              ) : null}
              <Button
                href={`/login?next=${encodeURIComponent(startPath)}`}
                size="sm"
                variant="secondary"
              >
                Login
              </Button>
            </div>
          ) : null}
          {requiresUpgrade ? (
            <div className="pt-2">
              <Button href="/pricing" size="sm">
                View plans
              </Button>
            </div>
          ) : null}
        </div>
        <Button
          aria-describedby={
            errorMessage ? errorId : requiresAuth ? authPromptId : undefined
          }
          className="sm:min-w-36"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Starting..." : "Continue"}
        </Button>
      </div>
    </form>
  );
}

function formatFirstConversationError(
  status: number,
  responseBody: {
    error?: string;
    errors?: Record<string, string>;
    upgradeMessage?: string;
  },
) {
  if (responseBody.errors) {
    return Object.values(responseBody.errors).join(" ");
  }

  if (status === 401) {
    return "Please log in before continuing.";
  }

  if (status === 403 && responseBody.upgradeMessage) {
    return [responseBody.error, responseBody.upgradeMessage]
      .filter(Boolean)
      .join(" ");
  }

  if (responseBody.error) {
    return responseBody.error;
  }

  return "We had trouble starting the conversation. Try again.";
}
