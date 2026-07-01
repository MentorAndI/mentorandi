import { MessageRole } from "@/lib/generated/prisma/client";
import { LlmService } from "@/services/llm/llm.service";
import {
  MessageService,
  MessageServiceError,
} from "@/services/message/message.service";
import {
  ContextBuilderService,
  ContextBuilderServiceError,
} from "@/services/mentor-core/context-builder/context-builder.service";
import { PromptComposerService } from "@/services/mentor-core/prompt-composer/prompt-composer.service";
import type {
  MentorResponsePipelineAuthContext,
  MentorResponsePipelineInput,
  MentorResponsePipelineResult,
} from "@/services/mentor-core/response-pipeline/response-pipeline.types";

const mockProviderModel = "mock-deterministic-v1";

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
  ) {}

  async run(
    input: MentorResponsePipelineInput,
    authContext: MentorResponsePipelineAuthContext,
  ): Promise<MentorResponsePipelineResult> {
    try {
      const userMessage = await this.messageService.createMessage(
        input.conversationId,
        {
          content: input.message,
          role: MessageRole.USER,
        },
        authContext,
      );

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

      return {
        contextUsed: context,
        createdAt: new Date().toISOString(),
        mentorMessage,
        model: llmResponse.metadata.model,
        promptPackage,
        provider: llmResponse.metadata.provider,
        userMessage,
      };
    } catch (error) {
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

      if (error instanceof Error) {
        throw new MentorResponsePipelineServiceError(error.message, 500);
      }

      throw new MentorResponsePipelineServiceError(
        "Unable to run mentor response pipeline.",
        500,
      );
    }
  }
}
