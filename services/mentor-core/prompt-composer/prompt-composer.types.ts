import type { MentorResponseContext } from "@/services/mentor-core/context-builder/context-builder.types";
import type { ActiveMentorProfile } from "@/services/mentor-catalog/mentor-catalog.types";

export type MentorToneOption = "calm" | "direct" | "warm" | "challenging";
export type MentorResponseMode = "reflective" | "practical" | "accountability";

export interface ComposePromptInput {
  context: MentorResponseContext;
  currentUserMessage: string;
  responseMode?: MentorResponseMode;
  specialization?: ActiveMentorProfile;
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

export interface PromptEnvironmentContext {
  currentDate: string;
  currentDateTimeIso: string;
  currentTime: string;
  timezone: string;
}

export interface PromptReflectionContextItem {
  createdAt: string;
  summary: string;
}

export interface PromptMentorMethodContextItem {
  domain: string;
  exampleQuestion: string;
  mentorInstruction: string;
  shortDescription: string;
  title: string;
}

export interface PromptMentorExpertiseContextItem {
  coreSkills: string[];
  description: string;
  mentorDomain: string;
  recommendedTone: string;
  riskNotes: string[];
  title: string;
}

export interface PromptMentorSourceContextItem {
  domain: string;
  keyPrinciples: string[];
  reliabilityNote: string;
  sourceType: string;
  summary: string;
  tags: string[];
  title: string;
}

export interface PromptPackage {
  constraints: string[];
  conversationContext: PromptConversationContextItem[];
  conversationRules: string[];
  developerInstructions: string[];
  environmentContext: PromptEnvironmentContext;
  goalContext: PromptGoalContextItem[];
  mentorExpertiseContext: PromptMentorExpertiseContextItem[];
  mentorIdentity: string[];
  mentorMethodContext: PromptMentorMethodContextItem[];
  memoryContext: PromptMemoryContextItem[];
  reflectionContext: PromptReflectionContextItem[];
  responseInstructions: string[];
  sourceContext: PromptMentorSourceContextItem[];
  systemPrompt: string;
  userPrompt: string;
}
