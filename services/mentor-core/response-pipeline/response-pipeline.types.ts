import type { LlmProviderName } from "@/services/llm/llm.types";
import type { GoalDto } from "@/services/goal/goal.types";
import type { MentorUnderstandingDto } from "@/services/memory/memory.types";
import type { MessageDto } from "@/services/message/message.types";
import type { MentorResponseContext } from "@/services/mentor-core/context-builder/context-builder.types";
import type { PromptPackage } from "@/services/mentor-core/prompt-composer/prompt-composer.types";
import type { ReflectionDto } from "@/services/reflection/reflection.types";

export interface MentorResponsePipelineInput {
  conversationId: string;
  message: string;
  model?: string;
  provider?: LlmProviderName;
  userId: string;
}

export interface MentorResponsePipelineAuthContext {
  authUserId: string | null;
}

export interface MentorResponsePipelineResult {
  contextUsed: MentorResponseContext;
  createdAt: string;
  createdReflection: ReflectionDto | null;
  createdGoals: GoalDto[];
  extractedMemories: MentorUnderstandingDto[];
  mentorMessage: MessageDto;
  model: string;
  promptPackage: PromptPackage;
  provider: LlmProviderName;
  selectedProvider: LlmProviderName;
  skippedDuplicateGoals: GoalDto[];
  skippedDuplicateMemories: MentorUnderstandingDto[];
  updatedGoals: GoalDto[];
  updatedMemories: MentorUnderstandingDto[];
  userMessage: MessageDto;
}

export interface MentorResponsePipelineValidationResult<TInput> {
  errors: Record<string, string>;
  input?: TInput;
  isValid: boolean;
}
