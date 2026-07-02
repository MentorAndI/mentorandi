import type { LlmProvider } from "@/services/llm/providers/provider.interface";
import type {
  LlmCompletionRequest,
  LlmCompletionResponse,
} from "@/services/llm/llm.types";
import type { MentorContextMemory } from "@/services/mentor-core/context-builder/context-builder.types";

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

function buildMemoryAwareMockResponse(memories: MentorContextMemory[]) {
  const memorySummaries = memories
    .slice(0, 2)
    .map((memory) => formatMemoryReference(memory));

  return [
    `I remember that ${joinMemorySummaries(memorySummaries)}.`,
    "Let's start with one small step today.",
  ].join(" ");
}

function formatMemoryReference(memory: MentorContextMemory) {
  switch (memory.category) {
    case "CHALLENGE":
      return `${memory.content} has been difficult for you`;
    case "GOAL":
      return `you want ${memory.content}`;
    case "INTEREST":
      return `you are interested in ${memory.content}`;
    case "PREFERENCE":
      return `you prefer ${memory.content}`;
    case "VALUE":
      return `you value ${memory.content}`;
    default:
      return memory.content;
  }
}

function joinMemorySummaries(memorySummaries: string[]) {
  if (memorySummaries.length === 1) {
    return memorySummaries[0];
  }

  return `${memorySummaries[0]} and that ${memorySummaries[1]}`;
}
