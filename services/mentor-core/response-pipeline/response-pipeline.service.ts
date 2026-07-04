import { MessageRole } from "@/lib/generated/prisma/client";
import {
  GoalService,
  GoalServiceError,
} from "@/services/goal/goal.service";
import type { CreateGoalInput } from "@/services/goal/goal.types";
import {
  LlmService,
  LlmServiceError,
} from "@/services/llm/llm.service";
import {
  MemoryService,
  MemoryServiceError,
} from "@/services/memory/memory.service";
import type {
  CreateMemoryInput,
  MentorUnderstandingDto,
} from "@/services/memory/memory.types";
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
import {
  ReflectionEngineService,
  ReflectionEngineServiceError,
} from "@/services/mentor-core/reflection-engine/reflection-engine.service";
import type {
  MentorResponsePipelineAuthContext,
  MentorResponsePipelineInput,
  MentorResponsePipelineResult,
} from "@/services/mentor-core/response-pipeline/response-pipeline.types";
import {
  ReflectionService,
  ReflectionServiceError,
} from "@/services/reflection/reflection.service";
import {
  UserService,
  UserServiceError,
} from "@/services/user/user.service";

const minimumMemoryConfidence = 0.6;
const minimumMemoryImportance = 3;

export class MentorResponsePipelineServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly selectedProvider?: string,
    public readonly providerErrorState?: string,
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
    private readonly reflectionEngine = new ReflectionEngineService(),
    private readonly reflectionService = new ReflectionService(),
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
      const goalStorageResult = await this.extractAndStoreGoals(input);

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
      const model = input.model?.trim() || undefined;

      const llmResponse = await this.llmService.complete({
        context,
        model,
        provider: input.provider,
        promptPackage,
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
      const memoryStorageResult = await this.extractAndStoreMemories(input);
      const createdReflection = await this.createReflectionForMoment(
        input,
        mentorMessage.content,
      );

      return {
        contextUsed: context,
        createdAt: new Date().toISOString(),
        createdReflection,
        createdGoals: goalStorageResult.createdGoals,
        extractedMemories: memoryStorageResult.createdMemories,
        llmUsage: {
          ...(llmResponse.metadata.inputTokens !== undefined
            ? { inputTokens: llmResponse.metadata.inputTokens }
            : {}),
          ...(llmResponse.metadata.latencyMs !== undefined
            ? { latencyMs: llmResponse.metadata.latencyMs }
            : {}),
          ...(llmResponse.metadata.maxOutputTokens !== undefined
            ? { maxOutputTokens: llmResponse.metadata.maxOutputTokens }
            : {}),
          model: llmResponse.metadata.model,
          ...(llmResponse.metadata.modelRouting !== undefined
            ? { modelRouting: llmResponse.metadata.modelRouting }
            : {}),
          ...(llmResponse.metadata.outputTokens !== undefined
            ? { outputTokens: llmResponse.metadata.outputTokens }
            : {}),
          provider: llmResponse.metadata.provider,
          ...(llmResponse.metadata.totalTokens !== undefined
            ? { totalTokens: llmResponse.metadata.totalTokens }
            : {}),
        },
        mentorMessage,
        model: llmResponse.metadata.model,
        promptPackage,
        provider: llmResponse.metadata.provider,
        selectedProvider:
          llmResponse.metadata.selectedProvider ??
          llmResponse.metadata.provider,
        skippedDuplicateGoals: goalStorageResult.skippedDuplicateGoals,
        skippedDuplicateMemories:
          memoryStorageResult.skippedDuplicateMemories,
        updatedGoals: goalStorageResult.updatedGoals,
        updatedMemories: memoryStorageResult.updatedMemories,
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

      if (error instanceof ReflectionServiceError) {
        throw new MentorResponsePipelineServiceError(
          error.message,
          error.statusCode,
        );
      }

      if (error instanceof ReflectionEngineServiceError) {
        throw new MentorResponsePipelineServiceError(error.message, 400);
      }

      if (error instanceof LlmServiceError) {
        throw new MentorResponsePipelineServiceError(
          error.message,
          error.statusCode,
          error.selectedProvider,
          error.providerErrorState,
        );
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
    const skippedDuplicateGoals = [];
    const updatedGoals = [];

    for (const candidate of extractionResult.goalCandidates) {
      const result = await this.goalService.createUniqueActiveGoalForUserId(
        input.userId,
        toCreateGoalInput(candidate),
      );

      if (result.status === "created") {
        createdGoals.push(result.goal);
      } else if (result.status === "updated") {
        updatedGoals.push(result.goal);
      } else {
        skippedDuplicateGoals.push(result.goal);
      }
    }

    return {
      createdGoals,
      skippedDuplicateGoals,
      updatedGoals,
    };
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
    const createdMemories: MentorUnderstandingDto[] = [];
    const skippedDuplicateMemories: MentorUnderstandingDto[] = [];
    const updatedMemories: MentorUnderstandingDto[] = [];

    for (const candidate of usefulCandidates) {
      const result =
        await this.memoryService.createUniqueMentorUnderstandingForUserId(
          input.userId,
          toCreateMemoryInput(candidate),
        );

      if (result.status === "created") {
        createdMemories.push(result.memory);
      } else if (result.status === "updated") {
        updatedMemories.push(result.memory);
      } else {
        skippedDuplicateMemories.push(result.memory);
      }
    }

    return {
      createdMemories,
      skippedDuplicateMemories,
      updatedMemories,
    };
  }

  private async createReflectionForMoment(
    input: MentorResponsePipelineInput,
    mentorMessage: string,
  ) {
    const reflectionResult = this.reflectionEngine.buildReflectionCandidate({
      conversationId: input.conversationId,
      mentorMessage,
      userId: input.userId,
      userMessage: input.message,
    });

    if (!reflectionResult.reflectionCandidate) {
      return null;
    }

    return this.reflectionService.createReflectionForUserId(input.userId, {
      summary: reflectionResult.reflectionCandidate.summary,
    });
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
