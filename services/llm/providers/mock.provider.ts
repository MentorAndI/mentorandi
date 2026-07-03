import type { LlmProvider } from "@/services/llm/providers/provider.interface";
import type {
  LlmCompletionRequest,
  LlmCompletionResponse,
} from "@/services/llm/llm.types";
import type {
  MentorContextGoal,
  MentorContextMemory,
} from "@/services/mentor-core/context-builder/context-builder.types";

const defaultMockModel = "mock-deterministic-v1";

export class MockLlmProvider implements LlmProvider {
  readonly name = "mock";

  async complete(
    request: LlmCompletionRequest,
  ): Promise<LlmCompletionResponse> {
    const mentorName = request.context.mentor.name;
    const focus = request.context.recommendedMentorFocus.priorities.join(", ");
    const memories =
      request.context.memories.length > 0
        ? request.context.memories
        : request.context.relevantMemories;
    const relevantMemory = findRelevantMemory(request.userMessage, memories);
    const relevantGoal = findRelevantGoal(
      request.userMessage,
      request.context.goals,
    );

    return {
      content: buildCurrentMessageResponse({
        currentMessage: request.userMessage,
        focus,
        mentorName,
        relevantGoal,
        relevantMemory,
      }),
      metadata: {
        model: request.model ?? defaultMockModel,
        provider: this.name,
      },
    };
  }
}

interface CurrentMessageResponseInput {
  currentMessage: string;
  focus: string;
  mentorName: string;
  relevantGoal?: MentorContextGoal;
  relevantMemory?: MentorContextMemory;
}

type CurrentMessageKind =
  | "challenge"
  | "decision"
  | "intention"
  | "project-update"
  | "reflection";

function buildCurrentMessageResponse({
  currentMessage,
  focus,
  mentorName,
  relevantGoal,
  relevantMemory,
}: CurrentMessageResponseInput) {
  const messageKind = classifyCurrentMessage(currentMessage);
  const responseParts = [
    buildCurrentMessageAcknowledgement(messageKind),
    buildRelevantContextLine(relevantGoal, relevantMemory),
    buildNextStepQuestion(messageKind, relevantGoal, relevantMemory),
  ].filter(Boolean);

  if (responseParts.length > 0) {
    return responseParts.join(" ");
  }

  return `I'm here with you. ${mentorName} is focused on ${focus || "helping you find the next clear step"}. What would be useful to look at first?`;
}

function classifyCurrentMessage(message: string): CurrentMessageKind {
  const normalizedMessage = normalizeForMatching(message);

  if (
    /\b(mentorandi|mentor and i|project|design|prototype|product)\b/.test(
      normalizedMessage,
    ) &&
    /\b(finishing|working|building|designing|creating|developing|shipping|launched|launching|revising|improving)\b/.test(
      normalizedMessage,
    )
  ) {
    return "project-update";
  }

  if (
    /\b(struggle|struggling|stuck|hard|difficult|overwhelmed|confused|worried)\b/.test(
      normalizedMessage,
    )
  ) {
    return "challenge";
  }

  if (/\b(decide|decision|choose|whether|should i)\b/.test(normalizedMessage)) {
    return "decision";
  }

  if (/\b(i want|i need|trying to|my goal is)\b/.test(normalizedMessage)) {
    return "intention";
  }

  return "reflection";
}

function buildCurrentMessageAcknowledgement(kind: CurrentMessageKind) {
  switch (kind) {
    case "challenge":
      return "That sounds like something worth slowing down around.";
    case "decision":
      return "That sounds like a decision that deserves a clear frame.";
    case "intention":
      return "Good. Naming that clearly gives us something concrete to work with.";
    case "project-update":
      return "That sounds like progress.";
    case "reflection":
      return "I hear you.";
  }
}

function buildRelevantContextLine(
  relevantGoal?: MentorContextGoal,
  relevantMemory?: MentorContextMemory,
) {
  if (relevantMemory) {
    return formatSubtleMemoryLine(relevantMemory);
  }

  if (relevantGoal) {
    return `It also connects with your goal of ${formatGoalReference(relevantGoal.title)}.`;
  }

  return "";
}

function buildNextStepQuestion(
  kind: CurrentMessageKind,
  relevantGoal?: MentorContextGoal,
  relevantMemory?: MentorContextMemory,
) {
  if (kind === "project-update") {
    if (relevantGoal || relevantMemory) {
      return "What is the one thing this next pass still needs to communicate more clearly?";
    }

    return "Before you move on, take a moment to ask: does it make the work feel more human, clear and personal?";
  }

  if (kind === "challenge") {
    return "What is the smallest part of it that we can name honestly right now?";
  }

  if (kind === "decision") {
    return "What would make this choice feel clearer rather than just more urgent?";
  }

  if (kind === "intention") {
    return "What is one small step that would make this real today?";
  }

  return "What feels like the most useful place to begin?";
}

function formatSubtleMemoryLine(memory: MentorContextMemory) {
  const content = normalizeMemoryContent(memory.content);

  switch (memory.category) {
    case "CHALLENGE":
      return `It may also touch the challenge you've named around ${content}.`;
    case "GOAL":
    case "PROJECT":
      return `That connects with the work you've been moving toward: ${normalizeGoalContent(content)}.`;
    case "PREFERENCE":
      return `That fits with your preference for ${content}.`;
    case "VALUE":
      return `That fits with how much you value ${content}.`;
    default:
      return "";
  }
}

function formatGoalReference(title: string) {
  const normalizedTitle = trimTrailingPunctuation(title)
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/^to\s+/i, "");

  return gerundifyLeadingVerb(normalizedTitle);
}

function gerundifyLeadingVerb(phrase: string) {
  if (!phrase) {
    return phrase;
  }

  const [firstWord = "", ...remainingWords] = phrase.split(" ");

  if (firstWord.endsWith("ing")) {
    return phrase;
  }

  const gerund = leadingGoalVerbGerunds[firstWord];

  if (!gerund) {
    return phrase;
  }

  return [gerund, ...remainingWords].join(" ");
}

const leadingGoalVerbGerunds: Record<string, string> = {
  achieve: "achieving",
  be: "being",
  become: "becoming",
  build: "building",
  create: "creating",
  develop: "developing",
  feel: "feeling",
  find: "finding",
  get: "getting",
  grow: "growing",
  improve: "improving",
  learn: "learning",
  live: "living",
  make: "making",
  manage: "managing",
  organize: "organizing",
  practice: "practicing",
  pursue: "pursuing",
  reduce: "reducing",
  start: "starting",
  stay: "staying",
  stop: "stopping",
  strengthen: "strengthening",
  think: "thinking",
  understand: "understanding",
};

function normalizeMemoryContent(content: string) {
  return trimTrailingPunctuation(content)
    .replace(/^user\s+wants\s+/i, "")
    .replace(/^user\s+needs\s+/i, "")
    .replace(/^user\s+is\s+trying\s+to\s+/i, "")
    .replace(/^user\s+values\s+/i, "")
    .replace(/^user\s+prefers\s+/i, "")
    .replace(/^user\s+likes\s+/i, "")
    .replace(/^user\s+doesn't\s+like\s+/i, "")
    .replace(/^user\s+struggles\s+with\s+/i, "")
    .replace(/^user\s+struggles\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeGoalContent(content: string) {
  const normalizedContent = content.trim();

  if (/^help\s+\w+ing\b/i.test(normalizedContent)) {
    return `getting ${normalizedContent}`;
  }

  return normalizedContent
    .replace(/^help\s+/i, "getting help with ")
    .replace(/^to\s+to\s+/i, "to ");
}

function trimTrailingPunctuation(value: string) {
  return value.replace(/[.!?]+$/g, "");
}

function findRelevantGoal(
  currentMessage: string,
  goals: MentorContextGoal[],
) {
  const currentTerms = getSignalTerms(currentMessage);

  return goals.find((goal) =>
    hasRelevantOverlap(currentTerms, `${goal.title} ${goal.description ?? ""}`),
  );
}

function findRelevantMemory(
  currentMessage: string,
  memories: MentorContextMemory[],
) {
  const currentTerms = getSignalTerms(currentMessage);

  return memories.find((memory) =>
    isMemoryCategoryWorthReferencing(memory.category) &&
    hasRelevantOverlap(currentTerms, `${memory.title} ${memory.content}`),
  );
}

function isMemoryCategoryWorthReferencing(category: string) {
  return ["CHALLENGE", "GOAL", "PREFERENCE", "PROJECT", "VALUE"].includes(
    category,
  );
}

function hasRelevantOverlap(currentTerms: Set<string>, context: string) {
  if (currentTerms.size === 0) {
    return false;
  }

  const contextTerms = getSignalTerms(context);

  return Array.from(currentTerms).some((term) => contextTerms.has(term));
}

function getSignalTerms(value: string) {
  return new Set(
    normalizeForMatching(value)
      .split(" ")
      .map((term) => term.trim())
      .filter((term) => term.length >= 5 && !genericSignalTerms.has(term)),
  );
}

function normalizeForMatching(value: string) {
  return value
    .toLowerCase()
    .replace(/mentor\s+and\s+i/g, "mentorandi")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const genericSignalTerms = new Set([
  "about",
  "again",
  "clear",
  "going",
  "maybe",
  "really",
  "right",
  "something",
  "still",
  "thing",
  "think",
  "today",
  "would",
]);
