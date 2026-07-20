"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { MentorConversationHistory } from "@/components/mentor/MentorConversationHistory";
import { MentorConversationList } from "@/components/mentor/MentorConversationList";
import { MentorGoalPanel } from "@/components/mentor/MentorGoalPanel";
import { MentorHeader } from "@/components/mentor/MentorHeader";
import { MentorMessageForm } from "@/components/mentor/MentorMessageForm";
import { MentorMemoryPanel } from "@/components/mentor/MentorMemoryPanel";
import type {
  MentorApiError,
  MentorConversationMessage,
  MentorConversationSummary,
  MentorGoal,
  MentorMemory,
  MentorSession,
} from "@/components/mentor/mentor-conversation.types";
import { Card } from "@/components/ui/Card";

interface MentorMessagesResponse {
  messages: MentorConversationMessage[];
}

interface MentorMemoriesResponse {
  understandings: MentorMemory[];
}

interface MentorNewConversationResponse {
  conversationId: string;
}

interface MentorResponsePayload {
  conversation: {
    id: string;
  };
  mentorMessage: MentorConversationMessage;
  userMessage: MentorConversationMessage;
}

const defaultMentor = {
  name: "Marcus",
  role: "Life Mentor",
  slug: "life",
  tagline: "Personal clarity, honest reflection, and sustainable change.",
};

interface SelectedMentorPreview {
  name: string;
  role: string;
  slug: string;
  tagline: string;
}

export function MentorConversationClient({
  selectedMentor,
}: {
  selectedMentor?: SelectedMentorPreview;
}) {
  const router = useRouter();
  const [conversationId, setConversationId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingMemories, setIsLoadingMemories] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isStartingNewConversation, setIsStartingNewConversation] =
    useState(false);
  const [goals, setGoals] = useState<MentorGoal[]>([]);
  const [memories, setMemories] = useState<MentorMemory[]>([]);
  const [messages, setMessages] = useState<MentorConversationMessage[]>([]);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState("");
  const [mentor, setMentor] = useState(selectedMentor ?? defaultMentor);
  const [recentConversations, setRecentConversations] = useState<
    MentorConversationSummary[]
  >([]);

  async function fetchMentorSession(signal?: AbortSignal) {
    const mentorSlug = selectedMentor?.slug ?? "life";
    const response = await fetch(
      `/api/mentor/session?mentor=${encodeURIComponent(mentorSlug)}`,
      {
        signal,
      },
    );
    const responseBody = (await response.json()) as
      | MentorSession
      | MentorApiError;

    if (!response.ok) {
      throw new Error(formatErrorResponse(responseBody as MentorApiError));
    }

    return responseBody as MentorSession;
  }

  async function refreshMentorSessionList() {
    const session = await fetchMentorSession();

    setGoals(session.activeGoals);
    setMentor(selectedMentor ?? session.mentor);
    setRecentConversations(session.conversations);

    return session;
  }

  async function loadConversationHistory(
    nextConversationId: string,
    options?: {
      signal?: AbortSignal;
      shouldCommit?: () => boolean;
    },
  ) {
    setIsLoadingHistory(true);

    try {
      const response = await fetch(
        `/api/conversations/${encodeURIComponent(nextConversationId)}/messages`,
        { signal: options?.signal },
      );
      const responseBody = (await response.json()) as
        | MentorMessagesResponse
        | MentorApiError;

      if (!response.ok && options?.shouldCommit?.() !== false) {
        setErrorMessage(formatErrorResponse(responseBody as MentorApiError));
        return;
      }

      if (options?.shouldCommit?.() !== false) {
        setMessages((responseBody as MentorMessagesResponse).messages);
      }
    } catch (error) {
      if (
        !(error instanceof DOMException && error.name === "AbortError") &&
        options?.shouldCommit?.() !== false
      ) {
        setErrorMessage("Unable to load the conversation.");
      }
    } finally {
      if (options?.shouldCommit?.() !== false) {
        setIsLoadingHistory(false);
      }
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

    setConversationId("");
    setErrorMessage("");
    setIsLoadingSession(true);
    setMessage("");
    setMessages([]);
    setMentor(selectedMentor ?? defaultMentor);

    async function loadMentorSession() {
      try {
        const session = await fetchMentorSession(controller.signal);
        const nextConversationId = session.conversation.id;

        if (isActive) {
          setConversationId(nextConversationId);
          setGoals(session.activeGoals);
          setRecentConversations(session.conversations);
          setMentor(selectedMentor ?? session.mentor);

          await Promise.all([
            loadConversationHistory(nextConversationId, {
              signal: controller.signal,
              shouldCommit: () => isActive,
            }),
            loadMemories(),
          ]);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        if (isActive) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load your mentor conversation.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoadingSession(false);
        }
      }
    }

    void loadMentorSession();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [selectedMentor]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      setMessageError("Write a message before sending.");
      return;
    }

    setErrorMessage("");
    setMessageError("");
    setIsSending(true);

    try {
      const response = await fetch("/api/mentor/respond", {
        body: JSON.stringify({
          conversationId,
          message: trimmedMessage,
          mentorSpecialty: mentor.slug,
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
        refreshMentorSessionList(),
      ]);
    } catch {
      setErrorMessage(`${mentor.name} had trouble responding. Try again.`);
    } finally {
      setIsSending(false);
    }
  }

  async function handleStartNewConversation() {
    setErrorMessage("");
    setMessageError("");
    setIsStartingNewConversation(true);

    try {
      const response = await fetch("/api/mentor-session/new", {
        body: JSON.stringify({ mentor: mentor.slug }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const responseBody = (await response.json()) as
        | MentorNewConversationResponse
        | MentorApiError;

      if (!response.ok) {
        setErrorMessage(formatErrorResponse(responseBody as MentorApiError));
        return;
      }

      const nextConversationId = (
        responseBody as MentorNewConversationResponse
      ).conversationId;

      setConversationId(nextConversationId);
      setMessage("");
      setMessages([]);

      await Promise.all([loadMemories(), refreshMentorSessionList()]);
    } catch {
      setErrorMessage("Unable to start a new conversation.");
    } finally {
      setIsStartingNewConversation(false);
    }
  }

  async function handleSelectConversation(
    conversation: MentorConversationSummary,
  ) {
    if (conversation.id === conversationId) {
      return;
    }

    if (conversation.mentor.slug !== mentor.slug) {
      router.push(
        `/mentor?mentor=${encodeURIComponent(conversation.mentor.slug)}`,
      );
      return;
    }

    setErrorMessage("");
    setMessageError("");
    setConversationId(conversation.id);
    setMessage("");
    setMessages([]);

    await loadConversationHistory(conversation.id);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <Card className="space-y-7 p-5 sm:p-7" variant="bordered">
        <MentorHeader
          isStartingNewConversation={isStartingNewConversation}
          name={mentor.name}
          onNewConversation={
            isLoadingSession ? undefined : handleStartNewConversation
          }
          role={mentor.role}
          tagline={mentor.tagline}
        />

        {errorMessage ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <MentorConversationHistory
          isLoading={isLoadingSession || isLoadingHistory}
          messages={messages}
        />

        <MentorMessageForm
          disabled={
            isLoadingSession || isStartingNewConversation || !conversationId
          }
          error={messageError}
          isSending={isSending}
          message={message}
          mentorName={mentor.name}
          onMessageChange={(nextMessage) => {
            setMessage(nextMessage);

            if (messageError) {
              setMessageError("");
            }
          }}
          onSubmit={handleSubmit}
        />
      </Card>

      <div className="space-y-4 self-start">
        <Card className="p-5 sm:p-6" variant="bordered">
          <MentorConversationList
            activeConversationId={conversationId}
            conversations={recentConversations}
            isLoading={isLoadingSession || isStartingNewConversation}
            onSelectConversation={handleSelectConversation}
          />
        </Card>

        <Card className="p-5 sm:p-6" variant="bordered">
          <MentorGoalPanel
            goals={goals}
            isLoading={isLoadingSession || isSending}
          />
        </Card>

        <Card className="p-5 sm:p-6" variant="bordered">
          <MentorMemoryPanel
            isLoading={isLoadingMemories}
            memories={memories}
          />
        </Card>
      </div>
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
