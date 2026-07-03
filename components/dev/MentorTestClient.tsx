"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

type MentorTestProvider = "mock" | "openai";

interface MentorTestFormState {
  conversationId: string;
  mentorId: string;
  message: string;
  model: string;
  provider: MentorTestProvider;
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

interface MentorTestMemory {
  category: string;
  confidence: number;
  content: string;
  id: string;
  importance: number;
  title: string;
}

interface MentorTestReflection {
  createdAt: string;
  summary: string;
}

interface MentorTestMemoriesResponse {
  understandings: MentorTestMemory[];
}

interface MentorTestReflectionsResponse {
  reflections: MentorTestReflection[];
}

interface MentorTestCleanupResponse {
  deletedGoals: number;
  deletedMemories: number;
  deletedMessages: number;
  deletedReflections: number;
}

interface MentorTestMessagesResponse {
  messages: MentorTestMessage[];
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
  model: "",
  provider: "mock",
  userId: "",
};

export function MentorTestClient() {
  const [formState, setFormState] =
    useState<MentorTestFormState>(initialFormState);
  const [errorMessage, setErrorMessage] = useState("");
  const [historyErrorMessage, setHistoryErrorMessage] = useState("");
  const [cleanupMessage, setCleanupMessage] = useState("");
  const [cleanupErrorMessage, setCleanupErrorMessage] = useState("");
  const [isLoadingMemories, setIsLoadingMemories] = useState(false);
  const [isLoadingReflections, setIsLoadingReflections] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingSeedData, setIsLoadingSeedData] = useState(true);
  const [isCleaningTestData, setIsCleaningTestData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memories, setMemories] = useState<MentorTestMemory[]>([]);
  const [memoriesErrorMessage, setMemoriesErrorMessage] = useState("");
  const [messages, setMessages] = useState<MentorTestMessage[]>([]);
  const [reflections, setReflections] = useState<MentorTestReflection[]>([]);
  const [reflectionsErrorMessage, setReflectionsErrorMessage] = useState("");
  const [result, setResult] = useState<MentorTestResponse | null>(null);
  const [seedDataMessage, setSeedDataMessage] = useState("");

  const loadConversationHistory = useCallback(async (conversationId: string) => {
    setHistoryErrorMessage("");
    setIsLoadingHistory(true);

    try {
      const response = await fetch(
        `/api/conversations/${encodeURIComponent(conversationId)}/messages`,
      );
      const responseBody = (await response.json()) as
        | MentorTestMessagesResponse
        | MentorTestErrorResponse;

      if (!response.ok) {
        setHistoryErrorMessage(
          formatErrorResponse(responseBody as MentorTestErrorResponse),
        );
        return;
      }

      setMessages((responseBody as MentorTestMessagesResponse).messages);
    } catch {
      setHistoryErrorMessage("Unable to load conversation history.");
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const loadStoredMemories = useCallback(async () => {
    setMemoriesErrorMessage("");
    setIsLoadingMemories(true);

    try {
      const response = await fetch("/api/memories");
      const responseBody = (await response.json()) as
        | MentorTestMemoriesResponse
        | MentorTestErrorResponse;

      if (!response.ok) {
        setMemoriesErrorMessage(
          formatErrorResponse(responseBody as MentorTestErrorResponse),
        );
        return;
      }

      setMemories((responseBody as MentorTestMemoriesResponse).understandings);
    } catch {
      setMemoriesErrorMessage("Unable to load stored memories.");
    } finally {
      setIsLoadingMemories(false);
    }
  }, []);

  const loadRecentReflections = useCallback(async (userId: string) => {
    setReflectionsErrorMessage("");
    setIsLoadingReflections(true);

    const query = userId
      ? `?${new URLSearchParams({ userId }).toString()}`
      : "";

    try {
      const response = await fetch(`/api/dev/reflections${query}`);
      const responseBody = (await response.json()) as
        | MentorTestReflectionsResponse
        | MentorTestErrorResponse;

      if (!response.ok) {
        setReflectionsErrorMessage(
          formatErrorResponse(responseBody as MentorTestErrorResponse),
        );
        return;
      }

      setReflections(
        (responseBody as MentorTestReflectionsResponse).reflections,
      );
    } catch {
      setReflectionsErrorMessage("Unable to load recent reflections.");
    } finally {
      setIsLoadingReflections(false);
    }
  }, []);

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
          const conversationId = seedData.conversationId ?? "";

          setFormState((currentState) => ({
            ...currentState,
            conversationId,
            mentorId: seedData.mentorId,
            userId: seedData.userId,
          }));
          setSeedDataMessage(
            seedData.conversationId
              ? "Seeded development data loaded."
              : "Seeded user and mentor loaded. A conversation will be created.",
          );

          if (conversationId) {
            await loadConversationHistory(conversationId);
          }

          await Promise.all([
            loadStoredMemories(),
            loadRecentReflections(seedData.userId),
          ]);
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
  }, [loadConversationHistory, loadRecentReflections, loadStoredMemories]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setIsSubmitting(true);
    setResult(null);

    const payload = {
      mentorId: formState.mentorId.trim(),
      message: formState.message.trim(),
      provider: formState.provider,
      userId: formState.userId.trim(),
      ...(formState.conversationId.trim()
        ? { conversationId: formState.conversationId.trim() }
        : {}),
      ...(formState.model.trim() ? { model: formState.model.trim() } : {}),
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
      const conversationId = mentorTestResponse.conversation.id;

      setResult(mentorTestResponse);
      setFormState((currentState) => ({
        ...currentState,
        conversationId,
      }));
      await Promise.all([
        loadConversationHistory(conversationId),
        loadRecentReflections(payload.userId),
        loadStoredMemories(),
      ]);
    } catch {
      setErrorMessage("Unable to send the test message.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField<K extends keyof MentorTestFormState>(
    field: K,
    value: MentorTestFormState[K],
  ) {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }));
  }

  async function handleRefreshHistory() {
    const conversationId = formState.conversationId.trim();

    if (!conversationId) {
      setHistoryErrorMessage("Enter a conversation ID to load history.");
      return;
    }

    await loadConversationHistory(conversationId);
  }

  async function handleRefreshMemories() {
    await loadStoredMemories();
  }

  async function handleRefreshReflections() {
    await loadRecentReflections(formState.userId.trim());
  }

  async function handleCleanupTestData() {
    setCleanupMessage("");
    setCleanupErrorMessage("");
    setIsCleaningTestData(true);

    try {
      const response = await fetch("/api/dev/cleanup-test-data", {
        method: "POST",
      });
      const responseBody = (await response.json()) as
        | MentorTestCleanupResponse
        | MentorTestErrorResponse;

      if (!response.ok) {
        setCleanupErrorMessage(
          formatErrorResponse(responseBody as MentorTestErrorResponse),
        );
        return;
      }

      const result = responseBody as MentorTestCleanupResponse;
      setCleanupMessage(formatCleanupResult(result));

      await Promise.all([
        formState.conversationId.trim()
          ? loadConversationHistory(formState.conversationId.trim())
          : Promise.resolve(),
        loadRecentReflections(formState.userId.trim()),
        loadStoredMemories(),
      ]);
    } catch {
      setCleanupErrorMessage("Unable to clean test data.");
    } finally {
      setIsCleaningTestData(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <div className="space-y-6">
        <Card className="space-y-5" variant="bordered">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-950">
                Conversation history
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Persisted messages for the active conversation.
              </p>
            </div>

            <Button
              disabled={isLoadingHistory || !formState.conversationId.trim()}
              onClick={handleRefreshHistory}
              type="button"
              variant="secondary"
            >
              {isLoadingHistory ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          {historyErrorMessage ? (
            <p className="text-sm text-red-600" role="alert">
              {historyErrorMessage}
            </p>
          ) : null}

          <ConversationHistory
            isLoading={isLoadingHistory}
            messages={messages}
          />
        </Card>

        <Card className="space-y-6" variant="bordered">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
              {isLoadingSeedData
                ? "Loading seeded development data..."
                : seedDataMessage}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  className="block text-sm font-medium text-zinc-900"
                  htmlFor="mentor-test-provider"
                >
                  Provider
                </label>
                <select
                  className="block h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
                  id="mentor-test-provider"
                  onChange={(event) =>
                    updateField(
                      "provider",
                      event.target.value === "openai" ? "openai" : "mock",
                    )
                  }
                  value={formState.provider}
                >
                  <option value="mock">mock</option>
                  <option value="openai">openai</option>
                </select>
              </div>

              <Input
                autoComplete="off"
                hint={
                  formState.provider === "openai"
                    ? "Leave blank to use OPENAI_MODEL."
                    : "Optional for local mock labeling."
                }
                id="mentor-test-model"
                label="Model"
                onChange={(event) => updateField("model", event.target.value)}
                placeholder={
                  formState.provider === "openai"
                    ? "Uses OPENAI_MODEL if empty"
                    : "mock-deterministic-v1"
                }
                value={formState.model}
              />
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
                onChange={(event) =>
                  updateField("mentorId", event.target.value)
                }
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
      </div>

      <div className="space-y-6">
        <Card className="space-y-4 self-start" variant="bordered">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">
              Development cleanup
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Remove local smoke-test messages and matching extracted data.
            </p>
          </div>

          {cleanupErrorMessage ? (
            <p className="text-sm text-red-600" role="alert">
              {cleanupErrorMessage}
            </p>
          ) : null}

          {cleanupMessage ? (
            <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-600">
              {cleanupMessage}
            </p>
          ) : null}

          <Button
            disabled={isCleaningTestData}
            onClick={handleCleanupTestData}
            type="button"
            variant="secondary"
          >
            {isCleaningTestData ? "Cleaning..." : "Clean test data"}
          </Button>
        </Card>

        <Card
          aria-live="polite"
          className="space-y-5 self-start"
          variant="bordered"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-950">
                Stored Memories
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Current mentor understanding stored for the resolved user.
              </p>
            </div>

            <Button
              disabled={isLoadingMemories}
              onClick={handleRefreshMemories}
              type="button"
              variant="secondary"
            >
              {isLoadingMemories ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          {memoriesErrorMessage ? (
            <p className="text-sm text-red-600" role="alert">
              {memoriesErrorMessage}
            </p>
          ) : null}

          <StoredMemories
            isLoading={isLoadingMemories}
            memories={memories}
          />
        </Card>

        <Card
          aria-live="polite"
          className="space-y-5 self-start"
          variant="bordered"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-950">
                Recent reflections
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Recent Reflection Engine summaries for the selected user.
              </p>
            </div>

            <Button
              disabled={isLoadingReflections}
              onClick={handleRefreshReflections}
              type="button"
              variant="secondary"
            >
              {isLoadingReflections ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          {reflectionsErrorMessage ? (
            <p className="text-sm text-red-600" role="alert">
              {reflectionsErrorMessage}
            </p>
          ) : null}

          <RecentReflections
            isLoading={isLoadingReflections}
            reflections={reflections}
          />
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
    </div>
  );
}

interface ConversationHistoryProps {
  isLoading: boolean;
  messages: MentorTestMessage[];
}

function ConversationHistory({
  isLoading,
  messages,
}: ConversationHistoryProps) {
  if (isLoading && messages.length === 0) {
    return (
      <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-4 text-sm text-zinc-500">
        Loading conversation history...
      </p>
    );
  }

  if (messages.length === 0) {
    return (
      <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-4 text-sm text-zinc-500">
        No persisted messages for this conversation yet.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {messages.map((message) => (
        <li key={message.id}>
          <ConversationMessage message={message} />
        </li>
      ))}
    </ol>
  );
}

interface ConversationMessageProps {
  message: MentorTestMessage;
}

function ConversationMessage({ message }: ConversationMessageProps) {
  const isUser = message.role === "USER";

  return (
    <article
      className={`rounded-md border px-4 py-3 ${
        isUser
          ? "border-zinc-300 bg-white"
          : "border-zinc-200 bg-zinc-50"
      }`}
    >
      <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold uppercase text-zinc-600">
          {isUser ? "USER" : "MENTOR"}
        </p>
        <time className="text-xs text-zinc-500" dateTime={message.createdAt}>
          {formatMessageTimestamp(message.createdAt)}
        </time>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-800">
        {message.content}
      </p>
    </article>
  );
}

interface RecentReflectionsProps {
  isLoading: boolean;
  reflections: MentorTestReflection[];
}

function RecentReflections({
  isLoading,
  reflections,
}: RecentReflectionsProps) {
  if (isLoading && reflections.length === 0) {
    return (
      <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-4 text-sm text-zinc-500">
        Loading recent reflections...
      </p>
    );
  }

  if (reflections.length === 0) {
    return (
      <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-4 text-sm text-zinc-500">
        No reflections have been created yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {reflections.map((reflection) => (
        <RecentReflection
          key={`${reflection.createdAt}-${reflection.summary}`}
          reflection={reflection}
        />
      ))}
    </div>
  );
}

interface RecentReflectionProps {
  reflection: MentorTestReflection;
}

function RecentReflection({ reflection }: RecentReflectionProps) {
  return (
    <article className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3">
      <time
        className="block text-xs text-zinc-500"
        dateTime={reflection.createdAt}
      >
        {formatMessageTimestamp(reflection.createdAt)}
      </time>
      <p className="text-sm leading-6 text-zinc-700">
        {reflection.summary}
      </p>
    </article>
  );
}

interface StoredMemoriesProps {
  isLoading: boolean;
  memories: MentorTestMemory[];
}

function StoredMemories({ isLoading, memories }: StoredMemoriesProps) {
  if (isLoading && memories.length === 0) {
    return (
      <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-4 text-sm text-zinc-500">
        Loading stored memories...
      </p>
    );
  }

  if (memories.length === 0) {
    return (
      <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-4 text-sm text-zinc-500">
        No stored memories yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {memories.map((memory) => (
        <StoredMemory key={memory.id} memory={memory} />
      ))}
    </div>
  );
}

interface StoredMemoryProps {
  memory: MentorTestMemory;
}

function StoredMemory({ memory }: StoredMemoryProps) {
  return (
    <article className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">
            {memory.category}
          </p>
          <h3 className="text-sm font-medium leading-6 text-zinc-950">
            {memory.title}
          </h3>
        </div>
        <p className="text-xs text-zinc-500">
          importance {memory.importance} / confidence{" "}
          {formatConfidence(memory.confidence)}
        </p>
      </div>
      <p className="text-sm leading-6 text-zinc-700">{memory.content}</p>
    </article>
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

function formatCleanupResult(result: MentorTestCleanupResponse) {
  return [
    `${result.deletedMessages} messages`,
    `${result.deletedMemories} memories`,
    `${result.deletedGoals} goals`,
    `${result.deletedReflections} reflections`,
  ].join(", ");
}

function formatMessageTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatConfidence(value: number) {
  return value.toFixed(2);
}
