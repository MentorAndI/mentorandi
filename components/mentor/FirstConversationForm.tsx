"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";

import { CharacterCounter } from "@/components/mentor/CharacterCounter";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

export interface FirstConversationFormProps {
  characterLimit?: number;
}

export function FirstConversationForm({
  characterLimit = 1200,
}: FirstConversationFormProps) {
  const router = useRouter();
  const textareaId = useId();
  const errorId = `${textareaId}-error`;
  const [errorMessage, setErrorMessage] = useState("");
  const [reflection, setReflection] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedReflection = reflection.trim();

    setErrorMessage("");

    if (!trimmedReflection) {
      setErrorMessage("Please write a few words before continuing.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/first-conversation", {
        body: JSON.stringify({
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
      };

      if (!response.ok) {
        setErrorMessage(formatFirstConversationError(responseBody));
        return;
      }

      router.push("/mentor");
    } catch {
      setErrorMessage("Unable to start the conversation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
      <Textarea
        error={errorMessage}
        id={textareaId}
        label="What brought you here today?"
        maxLength={characterLimit}
        onChange={(event) => {
          setReflection(event.target.value);

          if (errorMessage) {
            setErrorMessage("");
          }
        }}
        placeholder="Write whatever feels true right now."
        textareaClassName="min-h-48 resize-y rounded-xl border-zinc-300 px-4 py-4 text-base leading-7"
        value={reflection}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CharacterCounter current={reflection.length} max={characterLimit} />
        <Button
          aria-describedby={errorMessage ? errorId : undefined}
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

function formatFirstConversationError(responseBody: {
  error?: string;
  errors?: Record<string, string>;
}) {
  if (responseBody.error) {
    return responseBody.error;
  }

  if (responseBody.errors) {
    return Object.values(responseBody.errors).join(" ");
  }

  return "Unable to start the conversation. Please try again.";
}
