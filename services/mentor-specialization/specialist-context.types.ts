export interface SelectMentorSpecialistContextInput {
  currentGoalContext?: string[];
  latestUserMessage: string;
  mentorSlug: string;
  recentConversationSummary?: string[];
  userMemorySnippets?: string[];
}

export interface SelectedSpecialistTechnique {
  mentorWording: string;
  slug: string;
  steps: string[];
  summary: string;
  title: string;
}

export interface SelectedSpecialistKnowledgeCard {
  body: string;
  slug: string;
  summary: string;
  title: string;
}

export interface SelectedSpecialistSafetyRule {
  requiredResponseBehavior: string;
  rule: string;
  severity: "CRISIS" | "HIGH" | "NORMAL";
  slug: string;
  title: string;
}

export interface MentorSpecialistContext {
  displayName: string;
  estimatedTokens: number;
  knowledgeCards: SelectedSpecialistKnowledgeCard[];
  packSlug: string;
  safetyRules: SelectedSpecialistSafetyRule[];
  sourceHints: Array<{ publisher: string; title: string }>;
  techniques: SelectedSpecialistTechnique[];
  version: string;
}
