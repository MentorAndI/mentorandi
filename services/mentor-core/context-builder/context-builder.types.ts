import type { GoalStatus, MessageRole } from "@/lib/generated/prisma/client";

export interface BuildMentorContextInput {
  conversationId: string;
  currentMessage?: string;
  userId: string;
}

export interface BuildMentorContextAuthContext {
  authUserId: string | null;
}

export interface ContextBuilderValidationResult<TInput> {
  errors: Record<string, string>;
  input?: TInput;
  isValid: boolean;
}

export interface MentorContextUserIdentity {
  id: string;
  authUserId: string;
}

export interface MentorContextMentor {
  active: boolean;
  description: string;
  id: string;
  name: string;
  slug: string;
}

export interface MentorContextConversation {
  createdAt: string;
  id: string;
  updatedAt: string;
}

export interface MentorContextEnvironment {
  currentDate: string;
  currentDateTimeIso: string;
  currentTime: string;
  timezone: string;
}

export interface MentorContextMessage {
  content: string;
  createdAt: string;
  role: MessageRole;
}

export interface MentorContextMemory {
  category: string;
  confidence: number;
  content: string;
  id: string;
  importance: number;
  sourceConversationId: string | null;
  title: string;
  updatedAt: string;
}

export interface MentorContextGoal {
  description: string | null;
  id: string;
  status: GoalStatus;
  targetDate: string | null;
  title: string;
}

export interface MentorContextReflection {
  createdAt: string;
  id: string;
  summary: string;
}

export interface MentorContextMethod {
  domain: string;
  exampleQuestion: string;
  id: string;
  mentorInstruction: string;
  shortDescription: string;
  tags: string[];
  title: string;
  whenToUse: string;
}

export interface MentorContextExpertiseSourceNote {
  lastReviewed: string;
  reliabilityNote: string;
  sourceType: string;
  summary: string;
  tags: string[];
  title: string;
  url: string;
}

export interface MentorContextExpertise {
  commonUserProblems: string[];
  coreSkills: string[];
  description: string;
  id: string;
  mentorDomain: string;
  recommendedTone: string;
  relevantMethods: string[];
  riskNotes: string[];
  sourceNotes: MentorContextExpertiseSourceNote[];
  title: string;
}

export interface MentorContextSourceCard {
  domain: string;
  keyPrinciples: string[];
  lastReviewed: string;
  reliabilityNote: string;
  sourceType: string;
  summary: string;
  tags: string[];
  title: string;
  url: string;
  whenRelevant: string;
}

export interface RecommendedMentorFocus {
  priorities: string[];
  summary: string;
}

export interface MentorContextSourceDiagnostics {
  available: number;
  included: number;
  limit: number;
}

export interface MentorContextDiagnostics {
  contextBudgetTokens: number;
  expertise: MentorContextSourceDiagnostics;
  goals: MentorContextSourceDiagnostics;
  maxOutputTokens: number;
  memories: MentorContextSourceDiagnostics;
  methods: MentorContextSourceDiagnostics;
  recentMessages: MentorContextSourceDiagnostics;
  reflections: MentorContextSourceDiagnostics;
  sources: MentorContextSourceDiagnostics;
  reusableKnowledgeWasTrimmed: boolean;
  wasTrimmed: boolean;
}

export interface MentorResponseContext {
  conversation: MentorContextConversation;
  currentUserMessage: string | null;
  diagnostics: MentorContextDiagnostics;
  environment: MentorContextEnvironment;
  goals: MentorContextGoal[];
  memories: MentorContextMemory[];
  mentor: MentorContextMentor;
  recentMessages: MentorContextMessage[];
  recentReflections: MentorContextReflection[];
  recommendedMentorFocus: RecommendedMentorFocus;
  relevantExpertise: MentorContextExpertise[];
  relevantMethods: MentorContextMethod[];
  relevantMemories: MentorContextMemory[];
  relevantSourceCards: MentorContextSourceCard[];
  user: MentorContextUserIdentity;
  userGoals: MentorContextGoal[];
}
