import { MemoryRepository } from "@/services/memory/memory.repository";
import type {
  CreateMemoryInput,
  MemoryAuthContext,
  MemoryFilters,
  MentorUnderstandingDto,
  UpdateMemoryInput,
} from "@/services/memory/memory.types";

const developmentAuthUserId = "00000000-0000-4000-8000-000000000001";

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

  async createMentorUnderstanding(
    authContext: MemoryAuthContext,
    input: CreateMemoryInput,
  ): Promise<MentorUnderstandingDto> {
    const user = await this.ensureUser(authContext);

    if (input.sourceConversationId) {
      await this.ensureSourceConversationBelongsToUser(
        input.sourceConversationId,
        user.id,
      );
    }

    const memory = await this.repository.createMemoryForUser(user.id, input);

    return toMentorUnderstandingDto(memory);
  }

  async createUniqueMentorUnderstandingForUserId(
    userId: string,
    input: CreateMemoryInput,
  ): Promise<MentorUnderstandingDto | null> {
    await this.ensureUserById(userId);

    if (input.sourceConversationId) {
      await this.ensureSourceConversationBelongsToUser(
        input.sourceConversationId,
        userId,
      );
    }

    const existingMemory =
      await this.repository.findMemoryForUserByTitleAndCategory(
        userId,
        input.title,
        input.category,
      );

    if (existingMemory) {
      return null;
    }

    const memory = await this.repository.createMemoryForUser(userId, input);

    return toMentorUnderstandingDto(memory);
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

export function getMemoryAuthContext(): MemoryAuthContext {
  return {
    authUserId: developmentAuthUserId,
  };
}

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
