"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

type MentorTestProvider = "anthropic" | "mock" | "openai";
type RealProviderTestProvider = "anthropic" | "openai";

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
  diagnostics?: MentorCoreDiagnostics;
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

interface MentorCoreDiagnostics {
  contextCounts: MentorCoreContextCounts;
  contextTrimming: MentorCoreContextTrimmingDiagnostic;
  createdGoals: MentorCoreGoalDiagnostic[];
  createdMemories: MentorCoreMemoryDiagnostic[];
  createdReflection: MentorCoreReflectionDiagnostic | null;
  currentUserMessage: string;
  llmUsage: MentorCoreLlmUsageDiagnostic;
  matchedExpertise: MentorCoreMatchedExpertiseDiagnostic;
  matchedMethods: MentorCoreMatchedMethodsDiagnostic;
  matchedSources: MentorCoreMatchedSourcesDiagnostic;
  provider: string;
  providerErrorState: string | null;
  providerUsed: string | null;
  selectedProvider: string;
  skippedDuplicateGoals: MentorCoreGoalDiagnostic[];
  skippedDuplicateMemories: MentorCoreMemoryDiagnostic[];
  updatedGoals: MentorCoreGoalDiagnostic[];
  updatedMemories: MentorCoreMemoryDiagnostic[];
}

interface MentorCoreContextCounts {
  activeGoals: number;
  memories: number;
  recentMessages: number;
  reflections: number;
}

interface MentorCoreMatchedMethodsDiagnostic {
  count: number;
  domains: string[];
  titles: string[];
}

interface MentorCoreMatchedExpertiseDiagnostic {
  count: number;
  domains: string[];
  titles: string[];
}

interface MentorCoreMatchedSourcesDiagnostic {
  count: number;
  domains: string[];
  titles: string[];
}

interface MentorCoreCostEstimateDiagnostic {
  estimatedCostUsd: number | null;
  isConfigured: boolean;
  message: string | null;
}

interface MentorCoreContextSourceDiagnostic {
  available: number;
  included: number;
  limit: number;
}

interface MentorCoreContextTrimmingDiagnostic {
  contextBudgetTokens: number | null;
  expertise: MentorCoreContextSourceDiagnostic;
  goals: MentorCoreContextSourceDiagnostic;
  maxOutputTokens: number | null;
  memories: MentorCoreContextSourceDiagnostic;
  methods: MentorCoreContextSourceDiagnostic;
  recentMessages: MentorCoreContextSourceDiagnostic;
  reflections: MentorCoreContextSourceDiagnostic;
  sources: MentorCoreContextSourceDiagnostic;
  wasTrimmed: boolean;
}

interface MentorCoreLlmUsageDiagnostic {
  costEstimate: MentorCoreCostEstimateDiagnostic;
  inputTokens: number | null;
  latencyMs: number | null;
  maxOutputTokens: number | null;
  model: string;
  modelRouting: MentorCoreModelRoutingDiagnostic | null;
  outputTokens: number | null;
  provider: string;
  totalTokens: number | null;
}

interface MentorCoreModelRoutingDiagnostic {
  model?: string;
  provider?: string;
  reason: string;
  route: string;
  signals: string[];
  wasExplicitModel: boolean;
  wasExplicitProvider: boolean;
}

interface MentorCoreGoalDiagnostic {
  description: string | null;
  status: string;
  title: string;
}

interface MentorCoreMemoryDiagnostic {
  category: string;
  confidence: number;
  content: string;
  importance: number;
  title: string;
}

interface MentorCoreReflectionDiagnostic {
  createdAt: string;
  summary: string;
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
  diagnostics?: MentorCoreDiagnostics;
  error?: string;
  errors?: Record<string, string>;
}

interface RealProviderTestResult {
  errorState?: string;
  inputTokens?: number | null;
  latencyMs?: number | null;
  model: string | null;
  outputTokens?: number | null;
  provider: RealProviderTestProvider;
  responseText?: string;
  safeErrorMessage?: string;
  success: boolean;
  totalTokens?: number | null;
}

interface RealProviderTestState {
  message: string;
  provider: RealProviderTestProvider;
}

const initialFormState: MentorTestFormState = {
  conversationId: "",
  mentorId: "",
  message: "",
  model: "",
  provider: "mock",
  userId: "",
};

const initialRealProviderTestState: RealProviderTestState = {
  message: "Reply with a short provider connectivity confirmation.",
  provider: "openai",
};

export function MentorTestClient() {
  const [formState, setFormState] =
    useState<MentorTestFormState>(initialFormState);
  const [errorMessage, setErrorMessage] = useState("");
  const [historyErrorMessage, setHistoryErrorMessage] = useState("");
  const [cleanupMessage, setCleanupMessage] = useState("");
  const [cleanupErrorMessage, setCleanupErrorMessage] = useState("");
  const [diagnostics, setDiagnostics] =
    useState<MentorCoreDiagnostics | null>(null);
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
  const [realProviderTest, setRealProviderTest] =
    useState<RealProviderTestState>(initialRealProviderTestState);
  const [realProviderTestErrorMessage, setRealProviderTestErrorMessage] =
    useState("");
  const [realProviderTestResult, setRealProviderTestResult] =
    useState<RealProviderTestResult | null>(null);
  const [result, setResult] = useState<MentorTestResponse | null>(null);
  const [seedDataMessage, setSeedDataMessage] = useState("");
  const [isTestingRealProvider, setIsTestingRealProvider] = useState(false);

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
    setDiagnostics(null);
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
        setDiagnostics(
          (responseBody as MentorTestErrorResponse).diagnostics ?? null,
        );
        setErrorMessage(
          formatErrorResponse(responseBody as MentorTestErrorResponse),
        );
        return;
      }

      const mentorTestResponse = responseBody as MentorTestResponse;
      const conversationId = mentorTestResponse.conversation.id;

      setDiagnostics(mentorTestResponse.diagnostics ?? null);
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

  async function handleRealProviderTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = realProviderTest.message.trim();

    setRealProviderTestErrorMessage("");
    setRealProviderTestResult(null);

    if (!message) {
      setRealProviderTestErrorMessage("Write a short test message first.");
      return;
    }

    setIsTestingRealProvider(true);

    try {
      const response = await fetch("/api/dev/test-llm-provider", {
        body: JSON.stringify({
          message,
          provider: realProviderTest.provider,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const responseBody = (await response.json()) as
        | RealProviderTestResult
        | MentorTestErrorResponse;

      if (!response.ok) {
        setRealProviderTestErrorMessage(
          formatErrorResponse(responseBody as MentorTestErrorResponse),
        );
        return;
      }

      setRealProviderTestResult(responseBody as RealProviderTestResult);
    } catch {
      setRealProviderTestErrorMessage("Unable to test the provider.");
    } finally {
      setIsTestingRealProvider(false);
    }
  }

  function updateRealProviderTestField<K extends keyof RealProviderTestState>(
    field: K,
    value: RealProviderTestState[K],
  ) {
    setRealProviderTest((currentState) => ({
      ...currentState,
      [field]: value,
    }));
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
                    updateField("provider", readProviderValue(event.target.value))
                  }
                  value={formState.provider}
                >
                  <option value="mock">mock</option>
                  <option value="openai">openai</option>
                  <option value="anthropic">anthropic</option>
                </select>
              </div>

              <Input
                autoComplete="off"
                hint={
                  formState.provider === "mock"
                    ? "Optional for local mock labeling."
                    : "Leave blank to use the provider environment model."
                }
                id="mentor-test-model"
                label="Model"
                onChange={(event) => updateField("model", event.target.value)}
                placeholder={
                  formState.provider === "mock"
                    ? "mock-deterministic-v1"
                    : "Uses configured model if empty"
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
        <Card className="space-y-5 self-start" variant="bordered">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">
              Real provider test
            </h2>
            <p className="mt-1 text-sm leading-6 text-zinc-500">
              Test OpenAI or Anthropic connectivity without running the mentor
              pipeline.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleRealProviderTest}>
            <div className="space-y-2">
              <label
                className="block text-sm font-medium text-zinc-900"
                htmlFor="real-provider-test-provider"
              >
                Provider
              </label>
              <select
                className="block h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-950 focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
                id="real-provider-test-provider"
                onChange={(event) =>
                  updateRealProviderTestField(
                    "provider",
                    readRealProviderTestValue(event.target.value),
                  )
                }
                value={realProviderTest.provider}
              >
                <option value="openai">openai</option>
                <option value="anthropic">anthropic</option>
              </select>
            </div>

            <Input
              autoComplete="off"
              id="real-provider-test-message"
              label="Test message"
              maxLength={500}
              onChange={(event) =>
                updateRealProviderTestField("message", event.target.value)
              }
              placeholder="Short provider test message"
              required
              value={realProviderTest.message}
            />

            {realProviderTestErrorMessage ? (
              <p className="text-sm text-red-600" role="alert">
                {realProviderTestErrorMessage}
              </p>
            ) : null}

            <Button disabled={isTestingRealProvider} type="submit">
              {isTestingRealProvider ? "Testing..." : "Test provider"}
            </Button>
          </form>

          <RealProviderTestResultPanel result={realProviderTestResult} />
        </Card>

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

        <Card
          aria-live="polite"
          className="space-y-5 self-start"
          variant="bordered"
        >
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">
              Mentor Core Diagnostics
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Latest development-only pipeline summary.
            </p>
          </div>

          <MentorCoreDiagnosticsPanel
            diagnostics={diagnostics}
            result={result}
          />
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

interface MentorCoreDiagnosticsPanelProps {
  diagnostics: MentorCoreDiagnostics | null;
  result: MentorTestResponse | null;
}

function MentorCoreDiagnosticsPanel({
  diagnostics,
  result,
}: MentorCoreDiagnosticsPanelProps) {
  const latestDiagnostics = diagnostics ?? result?.diagnostics ?? null;

  if (!latestDiagnostics) {
    return (
      <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-4 text-sm text-zinc-500">
        Send a test message to see diagnostics.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <DiagnosticStat
          label="Selected provider"
          value={latestDiagnostics.selectedProvider}
        />
        <DiagnosticStat
          label="Provider used"
          value={latestDiagnostics.providerUsed ?? "None"}
        />
        <DiagnosticStat
          label="Provider error state"
          value={latestDiagnostics.providerErrorState ?? "None"}
        />
        <DiagnosticStat
          label="Current user message"
          value={
            latestDiagnostics.currentUserMessage ||
            result?.userMessage.content ||
            "None"
          }
        />
      </div>

      <LlmUsageDiagnosticsPanel usage={latestDiagnostics.llmUsage} />

      <ContextTrimmingDiagnosticsPanel
        diagnostics={latestDiagnostics.contextTrimming}
      />

      <MentorExpertiseDiagnosticsPanel
        matchedExpertise={latestDiagnostics.matchedExpertise}
      />

      <MentorSourceDiagnosticsPanel
        matchedSources={latestDiagnostics.matchedSources}
      />

      <MentorMethodDiagnosticsPanel
        matchedMethods={latestDiagnostics.matchedMethods}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <DiagnosticStat
          label="Memories in context"
          value={String(latestDiagnostics.contextCounts.memories)}
        />
        <DiagnosticStat
          label="Active goals in context"
          value={String(latestDiagnostics.contextCounts.activeGoals)}
        />
        <DiagnosticStat
          label="Reflections in context"
          value={String(latestDiagnostics.contextCounts.reflections)}
        />
        <DiagnosticStat
          label="Recent messages in context"
          value={String(latestDiagnostics.contextCounts.recentMessages)}
        />
      </div>

      <DiagnosticMemoryList
        items={latestDiagnostics.createdMemories}
        title="Created memories"
      />
      <DiagnosticMemoryList
        items={latestDiagnostics.skippedDuplicateMemories}
        title="Skipped duplicate memories"
      />
      <DiagnosticMemoryList
        items={latestDiagnostics.updatedMemories}
        title="Updated memories"
      />
      <DiagnosticGoalList
        items={latestDiagnostics.createdGoals}
        title="Created goals"
      />
      <DiagnosticGoalList
        items={latestDiagnostics.updatedGoals}
        title="Updated goals"
      />
      <DiagnosticGoalList
        items={latestDiagnostics.skippedDuplicateGoals}
        title="Skipped duplicate goals"
      />
      <DiagnosticReflection reflection={latestDiagnostics.createdReflection} />
    </div>
  );
}

interface MentorSourceDiagnosticsPanelProps {
  matchedSources: MentorCoreMatchedSourcesDiagnostic;
}

function MentorSourceDiagnosticsPanel({
  matchedSources,
}: MentorSourceDiagnosticsPanelProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-950">
        Mentor Source Matches
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <DiagnosticStat
          label="Matched source count"
          value={String(matchedSources.count)}
        />
        <DiagnosticStat
          label="Matched source domains"
          value={formatListDiagnosticValue(matchedSources.domains)}
        />
      </div>
      <DiagnosticStringList
        items={matchedSources.titles}
        title="Matched source titles"
      />
    </section>
  );
}

interface MentorExpertiseDiagnosticsPanelProps {
  matchedExpertise: MentorCoreMatchedExpertiseDiagnostic;
}

function MentorExpertiseDiagnosticsPanel({
  matchedExpertise,
}: MentorExpertiseDiagnosticsPanelProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-950">
        Mentor Expertise Matches
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <DiagnosticStat
          label="Matched expertise count"
          value={String(matchedExpertise.count)}
        />
        <DiagnosticStat
          label="Matched expertise domains"
          value={formatListDiagnosticValue(matchedExpertise.domains)}
        />
      </div>
      <DiagnosticStringList
        items={matchedExpertise.titles}
        title="Matched expertise titles"
      />
    </section>
  );
}

interface MentorMethodDiagnosticsPanelProps {
  matchedMethods: MentorCoreMatchedMethodsDiagnostic;
}

function MentorMethodDiagnosticsPanel({
  matchedMethods,
}: MentorMethodDiagnosticsPanelProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-950">
        Mentor Method Matches
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <DiagnosticStat
          label="Matched method count"
          value={String(matchedMethods.count)}
        />
        <DiagnosticStat
          label="Matched method domains"
          value={formatListDiagnosticValue(matchedMethods.domains)}
        />
      </div>
      <DiagnosticStringList
        items={matchedMethods.titles}
        title="Matched method titles"
      />
    </section>
  );
}

interface LlmUsageDiagnosticsPanelProps {
  usage: MentorCoreLlmUsageDiagnostic;
}

function LlmUsageDiagnosticsPanel({ usage }: LlmUsageDiagnosticsPanelProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-950">LLM Usage</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <DiagnosticStat label="Provider" value={usage.provider} />
        <DiagnosticStat label="Model" value={usage.model} />
        <DiagnosticStat
          label="Model route"
          value={formatModelRoute(usage.modelRouting)}
        />
        <DiagnosticStat
          label="Routed provider"
          value={usage.modelRouting?.provider ?? usage.provider}
        />
        <DiagnosticStat
          label="Routed model"
          value={usage.modelRouting?.model ?? usage.model}
        />
        <DiagnosticStat
          label="Model routing reason"
          value={usage.modelRouting?.reason ?? "Not available"}
        />
        <DiagnosticStat
          label="Latency"
          value={
            usage.latencyMs === null ? "Not available" : `${usage.latencyMs} ms`
          }
        />
        <DiagnosticStat
          label="Max output tokens"
          value={formatNullableNumber(usage.maxOutputTokens)}
        />
        <DiagnosticStat
          label="Input tokens"
          value={formatNullableNumber(usage.inputTokens)}
        />
        <DiagnosticStat
          label="Output tokens"
          value={formatNullableNumber(usage.outputTokens)}
        />
        <DiagnosticStat
          label="Total tokens"
          value={formatNullableNumber(usage.totalTokens)}
        />
        <DiagnosticStat
          label="Estimated cost"
          value={formatCostEstimate(usage.costEstimate)}
        />
      </div>
    </section>
  );
}

interface ContextTrimmingDiagnosticsPanelProps {
  diagnostics: MentorCoreContextTrimmingDiagnostic;
}

function ContextTrimmingDiagnosticsPanel({
  diagnostics,
}: ContextTrimmingDiagnosticsPanelProps) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-950">
          Context Controls
        </h3>
        {diagnostics.wasTrimmed ? (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
            Context was trimmed
          </span>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <DiagnosticStat
          label="Context budget"
          value={formatNullableNumber(diagnostics.contextBudgetTokens)}
        />
        <DiagnosticStat
          label="Max output tokens"
          value={formatNullableNumber(diagnostics.maxOutputTokens)}
        />
        <ContextSourceDiagnosticStat
          label="Recent messages"
          source={diagnostics.recentMessages}
        />
        <ContextSourceDiagnosticStat
          label="Memories"
          source={diagnostics.memories}
        />
        <ContextSourceDiagnosticStat
          label="Expertise"
          source={diagnostics.expertise}
        />
        <ContextSourceDiagnosticStat
          label="Sources"
          source={diagnostics.sources}
        />
        <ContextSourceDiagnosticStat
          label="Methods"
          source={diagnostics.methods}
        />
        <ContextSourceDiagnosticStat label="Goals" source={diagnostics.goals} />
        <ContextSourceDiagnosticStat
          label="Reflections"
          source={diagnostics.reflections}
        />
      </div>
    </section>
  );
}

interface ContextSourceDiagnosticStatProps {
  label: string;
  source: MentorCoreContextSourceDiagnostic;
}

function ContextSourceDiagnosticStat({
  label,
  source,
}: ContextSourceDiagnosticStatProps) {
  return (
    <DiagnosticStat
      label={label}
      value={`${source.included} included / ${source.available} available (limit ${source.limit})`}
    />
  );
}

interface DiagnosticStatProps {
  label: string;
  value: string;
}

function DiagnosticStat({ label, value }: DiagnosticStatProps) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3">
      <p className="text-xs font-medium uppercase text-zinc-500">{label}</p>
      <p className="mt-1 break-words text-sm leading-6 text-zinc-800">
        {value || "None"}
      </p>
    </div>
  );
}

interface DiagnosticStringListProps {
  items: string[];
  title: string;
}

function DiagnosticStringList({ items, title }: DiagnosticStringListProps) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
      {items.length === 0 ? (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-500">
          None.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <p
              className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm leading-6 text-zinc-800"
              key={`${title}-${item}`}
            >
              {item}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}

interface DiagnosticMemoryListProps {
  items: MentorCoreMemoryDiagnostic[];
  title: string;
}

function DiagnosticMemoryList({
  items,
  title,
}: DiagnosticMemoryListProps) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
      {items.length === 0 ? (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-500">
          None.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <article
              className="space-y-1 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3"
              key={`${title}-${item.category}-${item.title}-${item.content}`}
            >
              <p className="text-xs font-semibold uppercase text-zinc-500">
                {item.category}
              </p>
              <h4 className="text-sm font-medium leading-6 text-zinc-950">
                {item.title}
              </h4>
              <p className="text-sm leading-6 text-zinc-700">
                {item.content}
              </p>
              <p className="text-xs text-zinc-500">
                importance {item.importance} / confidence{" "}
                {formatConfidence(item.confidence)}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

interface DiagnosticGoalListProps {
  items: MentorCoreGoalDiagnostic[];
  title: string;
}

function DiagnosticGoalList({ items, title }: DiagnosticGoalListProps) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
      {items.length === 0 ? (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-500">
          None.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <article
              className="space-y-1 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3"
              key={`${title}-${item.status}-${item.title}`}
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <h4 className="text-sm font-medium leading-6 text-zinc-950">
                  {item.title}
                </h4>
                <p className="text-xs font-semibold uppercase text-zinc-500">
                  {item.status}
                </p>
              </div>
              {item.description ? (
                <p className="text-sm leading-6 text-zinc-700">
                  {item.description}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

interface DiagnosticReflectionProps {
  reflection: MentorCoreReflectionDiagnostic | null;
}

function DiagnosticReflection({ reflection }: DiagnosticReflectionProps) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-zinc-950">
        Created reflection
      </h3>
      {reflection ? (
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
      ) : (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-500">
          None.
        </p>
      )}
    </section>
  );
}

interface ResultFieldProps {
  label: string;
  value: string;
}

interface RealProviderTestResultPanelProps {
  result: RealProviderTestResult | null;
}

function RealProviderTestResultPanel({
  result,
}: RealProviderTestResultPanelProps) {
  if (!result) {
    return (
      <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-500">
        No real provider test has been run yet.
      </p>
    );
  }

  return (
    <div
      className={`space-y-3 rounded-md border px-3 py-3 ${
        result.success
          ? "border-emerald-200 bg-emerald-50"
          : "border-red-200 bg-red-50"
      }`}
    >
      <p
        className={`text-sm font-semibold ${
          result.success ? "text-emerald-800" : "text-red-700"
        }`}
      >
        {result.success ? "Provider test succeeded." : "Provider test failed."}
      </p>
      <ResultField label="Provider" value={result.provider} />
      <ResultField label="Model" value={result.model ?? "None"} />
      {result.success ? (
        <>
          <ResultField
            label="Latency"
            value={
              result.latencyMs === undefined || result.latencyMs === null
                ? "Not available"
                : `${result.latencyMs} ms`
            }
          />
          <ResultField
            label="Tokens"
            value={[
              `input ${formatNullableNumber(result.inputTokens ?? null)}`,
              `output ${formatNullableNumber(result.outputTokens ?? null)}`,
              `total ${formatNullableNumber(result.totalTokens ?? null)}`,
            ].join(" / ")}
          />
          <ResultField
            label="Response"
            value={result.responseText ?? "No response text returned."}
          />
        </>
      ) : (
        <>
          <ResultField
            label="Error state"
            value={result.errorState ?? "provider_request_failed"}
          />
          <ResultField
            label="Safe error"
            value={result.safeErrorMessage ?? "Provider test failed."}
          />
        </>
      )}
    </div>
  );
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

function readProviderValue(value: string): MentorTestProvider {
  if (value === "anthropic" || value === "openai") {
    return value;
  }

  return "mock";
}

function readRealProviderTestValue(value: string): RealProviderTestProvider {
  return value === "anthropic" ? "anthropic" : "openai";
}

function formatCleanupResult(result: MentorTestCleanupResponse) {
  return [
    `${result.deletedMessages} messages`,
    `${result.deletedMemories} memories`,
    `${result.deletedGoals} goals`,
    `${result.deletedReflections} reflections`,
  ].join(", ");
}

function formatNullableNumber(value: number | null) {
  return value === null ? "Not available" : value.toLocaleString();
}

function formatListDiagnosticValue(items: string[]) {
  return items.length === 0 ? "None" : Array.from(new Set(items)).join(", ");
}

function formatCostEstimate(costEstimate: MentorCoreCostEstimateDiagnostic) {
  if (!costEstimate.isConfigured) {
    return "Cost estimate not configured";
  }

  if (costEstimate.estimatedCostUsd === null) {
    return costEstimate.message ?? "Not available";
  }

  return `$${costEstimate.estimatedCostUsd.toFixed(6)}`;
}

function formatModelRoute(routing: MentorCoreModelRoutingDiagnostic | null) {
  if (!routing) {
    return "Not available";
  }

  return routing.wasExplicitModel
    ? `${routing.route} (${routing.signals.join(", ")})`
    : routing.route;
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
