import { MemoryRepository } from "@/services/memory/memory.repository";
import type {
  CreateMemoryInput,
  MemoryAuthContext,
  MemoryDedupeResult,
  MemoryFilters,
  MentorUnderstandingDto,
  UpdateMemoryInput,
} from "@/services/memory/memory.types";
import { UserService } from "@/services/user/user.service";

export class MemoryServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "MemoryServiceError";
  }
}

export class MemoryService {
  constructor(private readonly repository = new MemoryRepository()) {}

  async listMentorUnderstandings(
    authContext: MemoryAuthContext,
    filters: MemoryFilters,
  ): Promise<MentorUnderstandingDto[]> {
    const user = await this.ensureUser(authContext);
    const memories = await this.repository.findMemoriesForUser(
      user.id,
      filters,
    );

    return memories.map(toMentorUnderstandingDto);
  }

  async listRelevantMentorUnderstandingsForUserId(
    userId: string,
    filters: MemoryFilters,
    limit: number,
  ): Promise<MentorUnderstandingDto[]> {
    await this.ensureUserById(userId);

    const memories = await this.repository.findMemoriesForUser(
      userId,
      filters,
      limit,
    );

    return memories.map(toMentorUnderstandingDto);
  }

  async countRelevantMentorUnderstandingsForUserId(
    userId: string,
    filters: MemoryFilters,
  ): Promise<number> {
    await this.ensureUserById(userId);

    return this.repository.countMemoriesForUser(userId, filters);
  }

  async createMentorUnderstanding(
    authContext: MemoryAuthContext,
    input: CreateMemoryInput,
  ): Promise<MentorUnderstandingDto> {
    const user = await this.ensureUser(authContext);
    const result = await this.createUniqueMentorUnderstandingForUserId(
      user.id,
      input,
    );

    return result.memory;
  }

  async createUniqueMentorUnderstandingForUserId(
    userId: string,
    input: CreateMemoryInput,
  ): Promise<MemoryDedupeResult> {
    await this.ensureUserById(userId);

    if (input.sourceConversationId) {
      await this.ensureSourceConversationBelongsToUser(
        input.sourceConversationId,
        userId,
      );
    }

    const existingMemories = await this.repository.findMemoriesForUser(
      userId,
      {},
    );
    const duplicateMemory = findDuplicateMemory(input, existingMemories);

    if (duplicateMemory) {
      if (shouldUpdateDuplicateMemory(input, duplicateMemory)) {
        const updatedMemoryInput = buildDuplicateMemoryUpdate(
          input,
          duplicateMemory,
        );
        const updatedMemories = await this.repository.updateMemoryForUser(
          duplicateMemory.id,
          userId,
          updatedMemoryInput,
        );
        const updatedMemory = updatedMemories[0] ?? duplicateMemory;

        return {
          memory: toMentorUnderstandingDto(updatedMemory),
          status: "updated",
        };
      }

      return {
        memory: toMentorUnderstandingDto(duplicateMemory),
        status: "skipped_duplicate",
      };
    }

    const memory = await this.repository.createMemoryForUser(userId, input);

    return {
      memory: toMentorUnderstandingDto(memory),
      status: "created",
    };
  }

  async getMentorUnderstanding(
    authContext: MemoryAuthContext,
    memoryId: string,
  ): Promise<MentorUnderstandingDto> {
    const user = await this.ensureUser(authContext);
    const memory = await this.repository.findMemoryForUser(memoryId, user.id);

    if (!memory) {
      throw new MemoryServiceError("Memory was not found.", 404);
    }

    return toMentorUnderstandingDto(memory);
  }

  async updateMentorUnderstanding(
    authContext: MemoryAuthContext,
    memoryId: string,
    input: UpdateMemoryInput,
  ): Promise<MentorUnderstandingDto> {
    const user = await this.ensureUser(authContext);
    const memories = await this.repository.updateMemoryForUser(
      memoryId,
      user.id,
      input,
    );
    const memory = memories[0];

    if (!memory) {
      throw new MemoryServiceError("Memory was not found.", 404);
    }

    return toMentorUnderstandingDto(memory);
  }

  async deleteMentorUnderstanding(
    authContext: MemoryAuthContext,
    memoryId: string,
  ): Promise<void> {
    const user = await this.ensureUser(authContext);
    const result = await this.repository.deleteMemoryForUser(memoryId, user.id);

    if (result.count === 0) {
      throw new MemoryServiceError("Memory was not found.", 404);
    }
  }

  private async ensureUser(authContext: MemoryAuthContext) {
    const existingUser = await this.repository.findUserByAuthUserId(
      authContext.authUserId,
    );

    if (existingUser) {
      return existingUser;
    }

    return this.repository.createUserForAuthUser(authContext.authUserId);
  }

  private async ensureUserById(userId: string) {
    const existingUser = await this.repository.findUserById(userId);

    if (!existingUser) {
      throw new MemoryServiceError("User was not found.", 404);
    }

    return existingUser;
  }

  private async ensureSourceConversationBelongsToUser(
    sourceConversationId: string,
    userId: string,
  ) {
    const sourceConversation =
      await this.repository.findSourceConversationForUser(
        sourceConversationId,
        userId,
      );

    if (!sourceConversation) {
      throw new MemoryServiceError(
        "Source conversation was not found.",
        404,
      );
    }
  }
}

export async function getMemoryAuthContext(): Promise<MemoryAuthContext> {
  const user = await new UserService().resolveCurrentUser();

  return {
    authUserId: user.authUserId,
  };
}

type MemoryRecord = {
  category: string;
  confidence: number;
  content: string;
  createdAt: Date;
  id: string;
  importance: number;
  sourceConversationId: string | null;
  title: string;
  updatedAt: Date;
};

function findDuplicateMemory(
  input: CreateMemoryInput,
  existingMemories: MemoryRecord[],
) {
  return existingMemories.find(
    (memory) =>
      areComparableMemoryCategories(input.category, memory.category) &&
      areSimilarMemoryContents(input.content, memory.content),
  );
}

function areComparableMemoryCategories(
  newCategory: string,
  existingCategory: string,
) {
  if (newCategory === existingCategory) {
    return true;
  }

  const goalLikeCategories = new Set(["CHALLENGE", "GENERAL", "GOAL"]);

  return (
    goalLikeCategories.has(newCategory) &&
    goalLikeCategories.has(existingCategory)
  );
}

function areSimilarMemoryContents(firstContent: string, secondContent: string) {
  const first = normalizeMemoryForComparison(firstContent);
  const second = normalizeMemoryForComparison(secondContent);

  if (!first || !second) {
    return false;
  }

  if (first === second) {
    return true;
  }

  if (
    first.length >= 12 &&
    second.length >= 12 &&
    (first.includes(second) || second.includes(first))
  ) {
    return true;
  }

  const firstTokens = toMemoryTokenSet(first);
  const secondTokens = toMemoryTokenSet(second);

  if (firstTokens.size === 0 || secondTokens.size === 0) {
    return false;
  }

  const sharedTokenCount = Array.from(firstTokens).filter((token) =>
    secondTokens.has(token),
  ).length;
  const smallerSetSize = Math.min(firstTokens.size, secondTokens.size);
  const unionSetSize = new Set([...firstTokens, ...secondTokens]).size;
  const sharedHighSignalToken = Array.from(firstTokens).some(
    (token) => secondTokens.has(token) && highSignalMemoryTokens.has(token),
  );

  if (
    sharedTokenCount === smallerSetSize &&
    smallerSetSize <= 2 &&
    sharedHighSignalToken
  ) {
    return true;
  }

  return (
    sharedTokenCount / smallerSetSize >= 0.9 &&
    sharedTokenCount / unionSetSize >= 0.6
  );
}

function shouldUpdateDuplicateMemory(
  input: CreateMemoryInput,
  existingMemory: MemoryRecord,
) {
  return (
    scoreMemorySpecificity(input) >
    scoreMemorySpecificity(existingMemory) + 1
  );
}

function buildDuplicateMemoryUpdate(
  input: CreateMemoryInput,
  existingMemory: MemoryRecord,
): UpdateMemoryInput {
  const inputScore = scoreMemorySpecificity(input);
  const existingScore = scoreMemorySpecificity(existingMemory);
  const shouldUseInputText = inputScore > existingScore;

  return {
    category:
      existingMemory.category === "GENERAL"
        ? input.category
        : existingMemory.category,
    confidence: Math.max(existingMemory.confidence, input.confidence),
    content: shouldUseInputText ? input.content : existingMemory.content,
    importance: Math.max(existingMemory.importance, input.importance),
    title: shouldUseInputText ? input.title : existingMemory.title,
  };
}

function scoreMemorySpecificity(memory: {
  confidence: number;
  content: string;
  importance: number;
}) {
  const normalizedContent = normalizeMemoryForComparison(memory.content);
  const tokenCount = toMemoryTokenSet(normalizedContent).size;
  const lengthScore = Math.min(memory.content.length / 40, 4);

  return tokenCount + lengthScore + memory.importance + memory.confidence;
}

function normalizeMemoryForComparison(content: string) {
  return content
    .toLowerCase()
    .replace(/mentor\s+and\s+i/g, "mentorandi")
    .replace(/\bstop\s+overthinking\b/g, "reduce overthinking")
    .replace(/\bstop\s+worrying\b/g, "reduce worrying")
    .replace(/\bstop\s+procrastinating\b/g, "reduce procrastination")
    .replace(/\bbecoming\b/g, "become")
    .replace(/\breducing\b/g, "reduce")
    .replace(/\bfocused\b/g, "focus")
    .replace(/\buser\s+(wants|needs|values|prefers|likes)\s+(to\s+)?/g, "")
    .replace(/\buser\s+is\s+trying\s+to\s+/g, "")
    .replace(/\buser\s+is\s+working\s+on\s+/g, "")
    .replace(/\buser\s+needs\s+help\s+(with\s+)?/g, "")
    .replace(/\bhelp\s+(with\s+)?/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toMemoryTokenSet(normalizedContent: string) {
  return new Set(
    normalizedContent
      .split(" ")
      .map((token) => token.trim())
      .filter((token) => token && !memoryComparisonStopWords.has(token)),
  );
}

const memoryComparisonStopWords = new Set([
  "a",
  "about",
  "an",
  "and",
  "be",
  "become",
  "get",
  "i",
  "is",
  "more",
  "my",
  "on",
  "the",
  "to",
  "user",
  "with",
]);

const highSignalMemoryTokens = new Set([
  "accountable",
  "confidence",
  "feedback",
  "focus",
  "mentorandi",
  "overthinking",
]);

// A memory is the mentor's developing understanding of the user, not a raw fact log.
function toMentorUnderstandingDto(memory: {
  category: string;
  confidence: number;
  content: string;
  createdAt: Date;
  id: string;
  importance: number;
  sourceConversationId: string | null;
  title: string;
  updatedAt: Date;
}): MentorUnderstandingDto {
  return {
    category: memory.category,
    confidence: memory.confidence,
    content: memory.content,
    createdAt: memory.createdAt.toISOString(),
    id: memory.id,
    importance: memory.importance,
    sourceConversationId: memory.sourceConversationId,
    title: memory.title,
    updatedAt: memory.updatedAt.toISOString(),
  };
}
