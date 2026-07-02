"use client";

import { FormEvent, useEffect, useState } from "react";

import { MentorConversationHistory } from "@/components/mentor/MentorConversationHistory";
import { MentorMemoryPanel } from "@/components/mentor/MentorMemoryPanel";
import type {
  MentorApiError,
  MentorConversationMessage,
  MentorMemory,
  MentorSeedData,
} from "@/components/mentor/mentor-conversation.types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";

interface MentorMessagesResponse {
  messages: MentorConversationMessage[];
}

interface MentorMemoriesResponse {
  understandings: MentorMemory[];
}

interface MentorResponsePayload {
  conversation: {
    id: string;
  };
  mentorMessage: MentorConversationMessage;
  userMessage: MentorConversationMessage;
}

export function MentorConversationClient() {
  const [conversationId, setConversationId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingMemories, setIsLoadingMemories] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [memories, setMemories] = useState<MentorMemory[]>([]);
  const [messages, setMessages] = useState<MentorConversationMessage[]>([]);
  const [mentorId, setMentorId] = useState("");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");

  async function loadConversationHistory(nextConversationId: string) {
    setIsLoadingHistory(true);

    try {
      const response = await fetch(
        `/api/conversations/${encodeURIComponent(nextConversationId)}/messages`,
      );
      const responseBody = (await response.json()) as
        | MentorMessagesResponse
        | MentorApiError;

      if (!response.ok) {
        setErrorMessage(formatErrorResponse(responseBody as MentorApiError));
        return;
      }

      setMessages((responseBody as MentorMessagesResponse).messages);
    } catch {
      setErrorMessage("Unable to load the conversation.");
    } finally {
      setIsLoadingHistory(false);
    }
  }

  async function loadMemories() {
    setIsLoadingMemories(true);

    try {
      const response = await fetch("/api/memories");
      const responseBody = (await response.json()) as
        | MentorMemoriesResponse
        | MentorApiError;

      if (!response.ok) {
        setErrorMessage(formatErrorResponse(responseBody as MentorApiError));
        return;
      }

      setMemories((responseBody as MentorMemoriesResponse).understandings);
    } catch {
      setErrorMessage("Unable to load memories.");
    } finally {
      setIsLoadingMemories(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    async function loadSeededSession() {
      try {
        const response = await fetch("/api/dev/seed-data", {
          signal: controller.signal,
        });
        const responseBody = (await response.json()) as
          | MentorSeedData
          | MentorApiError;

        if (!response.ok) {
          if (isActive) {
            setErrorMessage(formatErrorResponse(responseBody as MentorApiError));
          }
          return;
        }

        const seedData = responseBody as MentorSeedData;
        const nextConversationId = seedData.conversationId ?? "";

        if (isActive) {
          setConversationId(nextConversationId);
          setMentorId(seedData.mentorId);
          setUserId(seedData.userId);

          await Promise.all([
            nextConversationId
              ? loadConversationHistory(nextConversationId)
              : Promise.resolve(),
            loadMemories(),
          ]);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        if (isActive) {
          setErrorMessage("Unable to load your mentor conversation.");
        }
      } finally {
        if (isActive) {
          setIsLoadingSession(false);
        }
      }
    }

    void loadSeededSession();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    setErrorMessage("");
    setIsSending(true);

    try {
      const response = await fetch("/api/dev/test-mentor-response", {
        body: JSON.stringify({
          mentorId,
          message: trimmedMessage,
          provider: "mock",
          userId,
          ...(conversationId ? { conversationId } : {}),
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const responseBody = (await response.json()) as
        | MentorResponsePayload
        | MentorApiError;

      if (!response.ok) {
        setErrorMessage(formatErrorResponse(responseBody as MentorApiError));
        return;
      }

      const mentorResponse = responseBody as MentorResponsePayload;
      const nextConversationId = mentorResponse.conversation.id;

      setConversationId(nextConversationId);
      setMessage("");

      await Promise.all([
        loadConversationHistory(nextConversationId),
        loadMemories(),
      ]);
    } catch {
      setErrorMessage("Unable to send your message.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="space-y-6" variant="bordered">
        <div className="border-b border-zinc-100 pb-5">
          <p className="text-sm font-medium text-zinc-500">Marcus</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
            What would be useful to think through today?
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600">
            This is a calm space for reflection, decisions and accountability.
          </p>
        </div>

        {errorMessage ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <MentorConversationHistory
          isLoading={isLoadingSession || isLoadingHistory}
          messages={messages}
        />

        <form className="space-y-3 border-t border-zinc-100 pt-5" onSubmit={handleSubmit}>
          <Textarea
            id="mentor-message"
            label="Message"
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Tell Marcus what is on your mind."
            rows={5}
            value={message}
          />

          <div className="flex justify-end">
            <Button
              disabled={
                isSending || isLoadingSession || !message.trim() || !userId || !mentorId
              }
              type="submit"
            >
              {isSending ? "Sending..." : "Send to Marcus"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="self-start" variant="bordered">
        <MentorMemoryPanel
          isLoading={isLoadingMemories}
          memories={memories}
        />
      </Card>
    </div>
  );
}

function formatErrorResponse(responseBody: MentorApiError) {
  if (responseBody.error) {
    return responseBody.error;
  }

  if (responseBody.errors) {
    return Object.values(responseBody.errors).join(" ");
  }

  return "Something went wrong.";
}
