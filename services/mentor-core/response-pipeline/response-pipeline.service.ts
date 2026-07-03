import { MessageRole } from "@/lib/generated/prisma/client";
import {
  GoalService,
  GoalServiceError,
} from "@/services/goal/goal.service";
import type { CreateGoalInput } from "@/services/goal/goal.types";
import { LlmService } from "@/services/llm/llm.service";
import {
  MemoryService,
  MemoryServiceError,
} from "@/services/memory/memory.service";
import type { CreateMemoryInput } from "@/services/memory/memory.types";
import {
  MessageService,
  MessageServiceError,
} from "@/services/message/message.service";
import {
  ContextBuilderService,
  ContextBuilderServiceError,
} from "@/services/mentor-core/context-builder/context-builder.service";
import {
  GoalExtractorService,
  GoalExtractorServiceError,
} from "@/services/mentor-core/goal-extractor/goal-extractor.service";
import type { GoalCandidate } from "@/services/mentor-core/goal-extractor/goal-extractor.types";
import {
  MemoryExtractorService,
  MemoryExtractorServiceError,
} from "@/services/mentor-core/memory-extractor/memory-extractor.service";
import type { MemoryCandidate } from "@/services/mentor-core/memory-extractor/memory-extractor.types";
import { PromptComposerService } from "@/services/mentor-core/prompt-composer/prompt-composer.service";
import type {
  MentorResponsePipelineAuthContext,
  MentorResponsePipelineInput,
  MentorResponsePipelineResult,
} from "@/services/mentor-core/response-pipeline/response-pipeline.types";
import {
  UserService,
  UserServiceError,
} from "@/services/user/user.service";

const mockProviderModel = "mock-deterministic-v1";
const minimumMemoryConfidence = 0.6;
const minimumMemoryImportance = 3;

export class MentorResponsePipelineServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "MentorResponsePipelineServiceError";
  }
}

export class MentorResponsePipelineService {
  constructor(
    private readonly contextBuilder = new ContextBuilderService(),
    private readonly promptComposer = new PromptComposerService(),
    private readonly llmService = new LlmService(),
    private readonly messageService = new MessageService(),
    private readonly goalExtractor = new GoalExtractorService(),
    private readonly goalService = new GoalService(),
    private readonly memoryExtractor = new MemoryExtractorService(),
    private readonly memoryService = new MemoryService(),
    private readonly userService = new UserService(),
  ) {}

  async run(
    input: MentorResponsePipelineInput,
    authContext: MentorResponsePipelineAuthContext,
  ): Promise<MentorResponsePipelineResult> {
    try {
      await this.assertCanRunForUser(input.userId, authContext);

      const userMessage = await this.messageService.createMessage(
        input.conversationId,
        {
          content: input.message,
          role: MessageRole.USER,
        },
        authContext,
      );
      const createdGoals = await this.extractAndStoreGoals(input);

      const context = await this.contextBuilder.buildMentorContext(
        {
          conversationId: input.conversationId,
          currentMessage: input.message,
          userId: input.userId,
        },
        authContext,
      );

      const promptPackage = this.promptComposer.compose({
        context,
        currentUserMessage: input.message,
      });
      const provider = input.provider ?? "mock";
      const model =
        input.model?.trim() ||
        (provider === "mock" ? mockProviderModel : undefined);

      const llmResponse = await this.llmService.complete({
        context,
        model,
        provider,
        systemPrompt: promptPackage.systemPrompt,
        userMessage: promptPackage.userPrompt,
      });

      const mentorMessage = await this.messageService.createMessage(
        input.conversationId,
        {
          content: llmResponse.content,
          role: MessageRole.MENTOR,
        },
        authContext,
      );
      const extractedMemories = await this.extractAndStoreMemories(input);

      return {
        contextUsed: context,
        createdAt: new Date().toISOString(),
        createdGoals,
        extractedMemories,
        mentorMessage,
        model: llmResponse.metadata.model,
        promptPackage,
        provider: llmResponse.metadata.provider,
        userMessage,
      };
    } catch (error) {
      if (error instanceof MentorResponsePipelineServiceError) {
        throw error;
      }

      if (error instanceof ContextBuilderServiceError) {
        throw new MentorResponsePipelineServiceError(
          error.message,
          error.statusCode,
        );
      }

      if (error instanceof MessageServiceError) {
        throw new MentorResponsePipelineServiceError(
          error.message,
          error.statusCode,
        );
      }

      if (error instanceof GoalServiceError) {
        throw new MentorResponsePipelineServiceError(
          error.message,
          error.statusCode,
        );
      }

      if (error instanceof GoalExtractorServiceError) {
        throw new MentorResponsePipelineServiceError(error.message, 400);
      }

      if (error instanceof MemoryServiceError) {
        throw new MentorResponsePipelineServiceError(
          error.message,
          error.statusCode,
        );
      }

      if (error instanceof MemoryExtractorServiceError) {
        throw new MentorResponsePipelineServiceError(error.message, 400);
      }

      if (error instanceof UserServiceError) {
        throw new MentorResponsePipelineServiceError(
          error.message,
          error.statusCode,
        );
      }

      if (error instanceof Error) {
        throw new MentorResponsePipelineServiceError(error.message, 500);
      }

      throw new MentorResponsePipelineServiceError(
        "Unable to run mentor response pipeline.",
        500,
      );
    }
  }

  private async extractAndStoreGoals(input: MentorResponsePipelineInput) {
    const extractionResult = this.goalExtractor.extract({
      conversationId: input.conversationId,
      userId: input.userId,
      userMessage: input.message,
    });
    const createdGoals = [];

    for (const candidate of extractionResult.goalCandidates) {
      const createdGoal = await this.goalService.createUniqueActiveGoalForUserId(
        input.userId,
        toCreateGoalInput(candidate),
      );

      if (createdGoal) {
        createdGoals.push(createdGoal);
      }
    }

    return createdGoals;
  }

  private async extractAndStoreMemories(input: MentorResponsePipelineInput) {
    const extractionResult = this.memoryExtractor.extract({
      conversationId: input.conversationId,
      userId: input.userId,
      userMessage: input.message,
    });
    const usefulCandidates = extractionResult.memoryCandidates.filter(
      isUsefulMemoryCandidate,
    );
    const storedMemories = [];

    for (const candidate of usefulCandidates) {
      const storedMemory =
        await this.memoryService.createUniqueMentorUnderstandingForUserId(
          input.userId,
          toCreateMemoryInput(candidate),
        );

      if (storedMemory) {
        storedMemories.push(storedMemory);
      }
    }

    return storedMemories;
  }

  private async assertCanRunForUser(
    userId: string,
    authContext: MentorResponsePipelineAuthContext,
  ) {
    if (!authContext.authUserId) {
      return;
    }

    const user = await this.userService.getUserByAuthUserId(
      authContext.authUserId,
    );

    if (!user) {
      throw new MentorResponsePipelineServiceError("Unauthorized.", 401);
    }

    if (user.id !== userId) {
      throw new MentorResponsePipelineServiceError("Forbidden.", 403);
    }
  }
}

function toCreateGoalInput(candidate: GoalCandidate): CreateGoalInput {
  return {
    description: candidate.description,
    status: candidate.status,
    title: candidate.title,
  };
}

function isUsefulMemoryCandidate(candidate: MemoryCandidate) {
  return (
    candidate.confidence >= minimumMemoryConfidence &&
    candidate.importance >= minimumMemoryImportance
  );
}

function toCreateMemoryInput(candidate: MemoryCandidate): CreateMemoryInput {
  return {
    category: candidate.category,
    confidence: candidate.confidence,
    content: candidate.content,
    importance: candidate.importance,
    sourceConversationId: candidate.sourceConversationId,
    title: candidate.title,
  };
}
