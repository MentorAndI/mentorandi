"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { MentorConversationHistory } from "@/components/mentor/MentorConversationHistory";
import { MentorConversationList } from "@/components/mentor/MentorConversationList";
import { MentorGoalPanel } from "@/components/mentor/MentorGoalPanel";
import { MentorHeader } from "@/components/mentor/MentorHeader";
import { MentorMessageForm } from "@/components/mentor/MentorMessageForm";
import type {
  MentorApiError,
  MentorConversationMessage,
  MentorConversationSummary,
  MentorGoal,
  MentorSession,
} from "@/components/mentor/mentor-conversation.types";
import { Card } from "@/components/ui/Card";

interface MentorMessagesResponse {
  messages: MentorConversationMessage[];
}

interface MentorNewConversationResponse {
  conversationId: string;
}

interface CreditBalanceResponse {
  balance: number;
  planBalance: number;
  topUpBalance: number;
}

interface MentorResponsePayload {
  conversation: {
    id: string;
  };
  creditsRemaining: number;
  mentorMessage: MentorConversationMessage;
  userMessage: MentorConversationMessage;
}

const defaultMentor = {
  name: "Marcus",
  portraitSrc: null,
  role: "Life Mentor",
  slug: "life",
  tagline: "Personal clarity, honest reflection, and sustainable change.",
};

interface SelectedMentorPreview {
  name: string;
  portraitSrc: string | null;
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
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isStartingNewConversation, setIsStartingNewConversation] =
    useState(false);
  const [goals, setGoals] = useState<MentorGoal[]>([]);
  const [messages, setMessages] = useState<MentorConversationMessage[]>([]);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState("");
  const [mentor, setMentor] = useState(selectedMentor ?? defaultMentor);
  const [recentConversations, setRecentConversations] = useState<
    MentorConversationSummary[]
  >([]);

  const fetchMentorSession = useCallback(async (signal?: AbortSignal) => {
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
      const apiError = responseBody as MentorApiError;
      throw new MentorRequestError(
        formatErrorResponse(apiError),
        apiError.upgradeMessage,
      );
    }

    return responseBody as MentorSession;
  }, [selectedMentor?.slug]);

  async function refreshMentorSessionList() {
    const session = await fetchMentorSession();

    setGoals(session.activeGoals);
    setMentor({
      ...session.mentor,
      portraitSrc: selectedMentor?.portraitSrc ?? defaultMentor.portraitSrc,
    });
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

  async function loadCredits(signal?: AbortSignal) {
    try {
      const response = await fetch("/api/credits", { signal });
      const responseBody = (await response.json()) as
        | CreditBalanceResponse
        | MentorApiError;

      if (response.ok) {
        setCreditsRemaining((responseBody as CreditBalanceResponse).balance);
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setCreditsRemaining(null);
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    async function loadMentorSession() {
      try {
        const session = await fetchMentorSession(controller.signal);
        const nextConversationId = session.conversation.id;

        if (isActive) {
          setConversationId(nextConversationId);
          setGoals(session.activeGoals);
          setRecentConversations(session.conversations);
          setMentor({
            ...session.mentor,
            portraitSrc:
              selectedMentor?.portraitSrc ?? defaultMentor.portraitSrc,
          });

          await Promise.all([
            loadConversationHistory(nextConversationId, {
              signal: controller.signal,
              shouldCommit: () => isActive,
            }),
            loadCredits(controller.signal),
          ]);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        if (isActive) {
          setUpgradeMessage(
            error instanceof MentorRequestError
              ? (error.upgradeMessage ?? "")
              : "",
          );
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
  }, [fetchMentorSession, selectedMentor]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      setMessageError("Write a message before sending.");
      return;
    }

    setErrorMessage("");
    setUpgradeMessage("");
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
        const apiError = responseBody as MentorApiError;
        setErrorMessage(formatErrorResponse(apiError));
        setUpgradeMessage(apiError.upgradeMessage ?? "");
        return;
      }

      const mentorResponse = responseBody as MentorResponsePayload;
      const nextConversationId = mentorResponse.conversation.id;

      setConversationId(nextConversationId);
      setCreditsRemaining(mentorResponse.creditsRemaining);
      setMessage("");

      await Promise.all([
        loadConversationHistory(nextConversationId),
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
    setUpgradeMessage("");
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
        const apiError = responseBody as MentorApiError;
        setErrorMessage(formatErrorResponse(apiError));
        setUpgradeMessage(apiError.upgradeMessage ?? "");
        return;
      }

      const nextConversationId = (
        responseBody as MentorNewConversationResponse
      ).conversationId;

      setConversationId(nextConversationId);
      setMessage("");
      setMessages([]);

      await refreshMentorSessionList();
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
          portraitSrc={mentor.portraitSrc}
          tagline={mentor.tagline}
        />

        {errorMessage ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <p>{errorMessage}</p>
            {upgradeMessage ? (
              <Link
                className="mt-2 inline-flex font-semibold text-sky-950 underline decoration-sky-300 underline-offset-4 hover:text-sky-700"
                href="/pricing"
              >
                {upgradeMessage}
              </Link>
            ) : null}
          </div>
        ) : null}

        <MentorConversationHistory
          isLoading={isLoadingSession || isLoadingHistory}
          messages={messages}
          mentorName={mentor.name}
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
          <p className="text-sm font-semibold text-zinc-900">Mentor credits</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
            {creditsRemaining === null
              ? "—"
              : formatCredits(creditsRemaining)}
          </p>
          <p className="mt-1 text-sm text-zinc-500">credits remaining</p>
          <Link
            className="mt-4 inline-flex rounded-lg bg-sky-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-900"
            href="/credits"
          >
            Buy more credits
          </Link>
        </Card>

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
      </div>
    </div>
  );
}

function formatCredits(value: number) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
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

class MentorRequestError extends Error {
  constructor(
    message: string,
    public readonly upgradeMessage?: string,
  ) {
    super(message);
    this.name = "MentorRequestError";
  }
}
