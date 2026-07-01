"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

interface MentorTestFormState {
  conversationId: string;
  mentorId: string;
  message: string;
  userId: string;
}

interface MentorTestMessage {
  content: string;
  conversationId: string;
  createdAt: string;
  id: string;
  role: string;
}

interface MentorTestConversation {
  id: string;
}

interface MentorTestResponse {
  conversation: MentorTestConversation;
  mentorMessage: MentorTestMessage;
  model: string;
  provider: string;
  userMessage: MentorTestMessage;
}

interface MentorTestSeedDataResponse {
  conversationId: string | null;
  mentorId: string;
  userId: string;
}

interface MentorTestErrorResponse {
  error?: string;
  errors?: Record<string, string>;
}

const initialFormState: MentorTestFormState = {
  conversationId: "",
  mentorId: "",
  message: "",
  userId: "",
};

export function MentorTestClient() {
  const [formState, setFormState] =
    useState<MentorTestFormState>(initialFormState);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingSeedData, setIsLoadingSeedData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<MentorTestResponse | null>(null);
  const [seedDataMessage, setSeedDataMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    async function loadSeedData() {
      try {
        const response = await fetch("/api/dev/seed-data", {
          signal: controller.signal,
        });
        const responseBody = (await response.json()) as
          | MentorTestSeedDataResponse
          | MentorTestErrorResponse;

        if (!response.ok) {
          if (isActive) {
            setSeedDataMessage(
              formatErrorResponse(responseBody as MentorTestErrorResponse),
            );
          }
          return;
        }

        const seedData = responseBody as MentorTestSeedDataResponse;

        if (isActive) {
          setFormState((currentState) => ({
            ...currentState,
            conversationId: seedData.conversationId ?? "",
            mentorId: seedData.mentorId,
            userId: seedData.userId,
          }));
          setSeedDataMessage(
            seedData.conversationId
              ? "Seeded development data loaded."
              : "Seeded user and mentor loaded. A conversation will be created.",
          );
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        if (isActive) {
          setSeedDataMessage("Unable to load seeded development data.");
        }
      } finally {
        if (isActive) {
          setIsLoadingSeedData(false);
        }
      }
    }

    void loadSeedData();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setIsSubmitting(true);
    setResult(null);

    const payload = {
      mentorId: formState.mentorId.trim(),
      message: formState.message.trim(),
      userId: formState.userId.trim(),
      ...(formState.conversationId.trim()
        ? { conversationId: formState.conversationId.trim() }
        : {}),
    };

    try {
      const response = await fetch("/api/dev/test-mentor-response", {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const responseBody = (await response.json()) as
        | MentorTestResponse
        | MentorTestErrorResponse;

      if (!response.ok) {
        setErrorMessage(
          formatErrorResponse(responseBody as MentorTestErrorResponse),
        );
        return;
      }

      const mentorTestResponse = responseBody as MentorTestResponse;

      setResult(mentorTestResponse);
      setFormState((currentState) => ({
        ...currentState,
        conversationId: mentorTestResponse.conversation.id,
      }));
    } catch {
      setErrorMessage("Unable to send the test message.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField(field: keyof MentorTestFormState, value: string) {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <Card className="space-y-6" variant="bordered">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
            {isLoadingSeedData
              ? "Loading seeded development data..."
              : seedDataMessage}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              autoComplete="off"
              id="mentor-test-user-id"
              label="User ID"
              onChange={(event) => updateField("userId", event.target.value)}
              placeholder="User UUID"
              required
              value={formState.userId}
            />
            <Input
              autoComplete="off"
              id="mentor-test-mentor-id"
              label="Mentor ID"
              onChange={(event) => updateField("mentorId", event.target.value)}
              placeholder="Mentor UUID"
              required
              value={formState.mentorId}
            />
          </div>

          <Input
            autoComplete="off"
            hint="Leave blank to create a new conversation."
            id="mentor-test-conversation-id"
            label="Conversation ID"
            onChange={(event) =>
              updateField("conversationId", event.target.value)
            }
            placeholder="Optional conversation UUID"
            value={formState.conversationId}
          />

          <Textarea
            id="mentor-test-message"
            label="Message"
            onChange={(event) => updateField("message", event.target.value)}
            placeholder="Write a test message for Marcus."
            required
            rows={8}
            value={formState.message}
          />

          {errorMessage ? (
            <p className="text-sm text-red-600" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Sending..." : "Send test message"}
          </Button>
        </form>
      </Card>

      <Card
        aria-live="polite"
        className="space-y-5 self-start"
        variant="bordered"
      >
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">Result</h2>
          <p className="mt-1 text-sm text-zinc-500">
            The latest persisted pipeline response appears here.
          </p>
        </div>

        {result ? (
          <div className="space-y-5">
            <ResultField
              label="Created conversation id"
              value={result.conversation.id}
            />
            <ResultField label="Provider" value={result.provider} />
            <ResultField label="Model" value={result.model} />
            <ResultField
              label="User message"
              value={result.userMessage.content}
            />
            <ResultField
              label="Mentor message"
              value={result.mentorMessage.content}
            />
          </div>
        ) : (
          <p className="text-sm leading-6 text-zinc-500">
            No response has been generated yet.
          </p>
        )}
      </Card>
    </div>
  );
}

interface ResultFieldProps {
  label: string;
  value: string;
}

function ResultField({ label, value }: ResultFieldProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase text-zinc-500">{label}</p>
      <p className="break-words rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm leading-6 text-zinc-800">
        {value}
      </p>
    </div>
  );
}

function formatErrorResponse(responseBody: MentorTestErrorResponse) {
  if (responseBody.error) {
    return responseBody.error;
  }

  if (responseBody.errors) {
    return Object.values(responseBody.errors).join(" ");
  }

  return "Unable to send the test message.";
}
