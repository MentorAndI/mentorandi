import type { MentorResponseContext } from "@/services/mentor-core/context-builder/context-builder.types";

export type MentorToneOption = "calm" | "direct" | "warm" | "challenging";
export type MentorResponseMode = "reflective" | "practical" | "accountability";

export interface ComposePromptInput {
  context: MentorResponseContext;
  currentUserMessage: string;
  responseMode?: MentorResponseMode;
  tone?: MentorToneOption;
}

export interface PromptComposerValidationResult<TInput> {
  errors: Record<string, string>;
  input?: TInput;
  isValid: boolean;
}

export interface PromptMemoryContextItem {
  category: string;
  confidence: number;
  content: string;
  importance: number;
  title: string;
}

export interface PromptGoalContextItem {
  description: string | null;
  status: string;
  targetDate: string | null;
  title: string;
}

export interface PromptConversationContextItem {
  content: string;
  createdAt: string;
  role: string;
}

export interface PromptPackage {
  constraints: string[];
  conversationContext: PromptConversationContextItem[];
  developerInstructions: string[];
  goalContext: PromptGoalContextItem[];
  memoryContext: PromptMemoryContextItem[];
  systemPrompt: string;
  userPrompt: string;
}
