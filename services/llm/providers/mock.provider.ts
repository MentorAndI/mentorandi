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

    if (request.context.goals.length > 0) {
      return {
        content: buildGoalAwareMockResponse(request.context.goals[0]),
        metadata: {
          model: request.model ?? defaultMockModel,
          provider: this.name,
        },
      };
    }

    if (memories.length > 0) {
      return {
        content: buildMemoryAwareMockResponse(memories),
        metadata: {
          model: request.model ?? defaultMockModel,
          provider: this.name,
        },
      };
    }

    return {
      content: `Mock response from ${mentorName}. Focus: ${focus}.`,
      metadata: {
        model: request.model ?? defaultMockModel,
        provider: this.name,
      },
    };
  }
}

function buildGoalAwareMockResponse(goal: MentorContextGoal) {
  return [
    `I remember that you're working toward ${formatGoalReference(goal.title)}.`,
    "Let's keep today's step small and concrete.",
  ].join(" ");
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

function buildMemoryAwareMockResponse(memories: MentorContextMemory[]) {
  const memorySummaries = memories
    .slice(0, 3)
    .map((memory) => formatMemoryReference(memory));

  return [
    `I remember that ${joinMemorySummaries(memorySummaries)}.`,
    "Let's start with one small step today.",
  ].join(" ");
}

function formatMemoryReference(memory: MentorContextMemory) {
  const content = normalizeMemoryContent(memory.content);

  switch (memory.category) {
    case "CHALLENGE":
      return `${content} has been difficult for you`;
    case "GOAL":
      return `you want ${normalizeGoalContent(content)}`;
    case "INTEREST":
      return `you are interested in ${content}`;
    case "PREFERENCE":
      return `you prefer ${content}`;
    case "VALUE":
      return `you value ${content}`;
    default:
      return `you've told me ${content}`;
  }
}

function joinMemorySummaries(memorySummaries: string[]) {
  if (memorySummaries.length === 1) {
    return memorySummaries[0];
  }

  if (memorySummaries.length === 2) {
    return `${memorySummaries[0]} and that ${memorySummaries[1]}`;
  }

  return `${memorySummaries[0]}, that ${memorySummaries[1]}, and that ${memorySummaries[2]}`;
}

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
  return content
    .replace(/^help\s+/i, "to ")
    .replace(/^to\s+to\s+/i, "to ");
}

function trimTrailingPunctuation(value: string) {
  return value.replace(/[.!?]+$/g, "");
}
