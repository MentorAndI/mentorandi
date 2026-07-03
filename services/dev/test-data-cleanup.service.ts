import { developmentTestMessageSearchTerms } from "@/services/mentor-core/test-message-detector";
import { TestDataCleanupRepository } from "@/services/dev/test-data-cleanup.repository";
import type { TestDataCleanupResult } from "@/services/dev/test-data-cleanup.types";

export class TestDataCleanupServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "TestDataCleanupServiceError";
  }
}

export class TestDataCleanupService {
  constructor(
    private readonly repository = new TestDataCleanupRepository(),
  ) {}

  async cleanupForUser(userId: string): Promise<TestDataCleanupResult> {
    if (process.env.NODE_ENV === "production") {
      throw new TestDataCleanupServiceError(
        "Test data cleanup is disabled in production.",
        403,
      );
    }

    const [
      deletedMessages,
      deletedMemories,
      deletedGoals,
      deletedReflections,
    ] = await Promise.all([
      this.repository.deleteMatchingMessagesForUser(
        userId,
        developmentTestMessageSearchTerms,
      ),
      this.repository.deleteMatchingMemoriesForUser(
        userId,
        developmentTestMessageSearchTerms,
      ),
      this.repository.deleteMatchingGoalsForUser(
        userId,
        developmentTestMessageSearchTerms,
      ),
      this.repository.deleteMatchingReflectionsForUser(
        userId,
        developmentTestMessageSearchTerms,
      ),
    ]);

    return {
      deletedGoals: deletedGoals.count,
      deletedMemories: deletedMemories.count,
      deletedMessages: deletedMessages.count,
      deletedReflections: deletedReflections.count,
    };
  }
}
